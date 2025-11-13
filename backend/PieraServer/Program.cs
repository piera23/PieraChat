using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseCors();

// Enhanced connection storage with public keys
var connections = new ConcurrentDictionary<string, ConnectionInfo>();

// Rate limiting storage
var rateLimits = new ConcurrentDictionary<string, RateLimitInfo>();

app.UseWebSockets(new WebSocketOptions
{
    KeepAliveInterval = TimeSpan.FromSeconds(30)
});

app.Map("/ws", async context =>
{
    if (!context.WebSockets.IsWebSocketRequest)
    {
        context.Response.StatusCode = 400;
        return;
    }

    var clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

    // Rate limiting check
    if (!CheckRateLimit(clientIp))
    {
        context.Response.StatusCode = 429; // Too Many Requests
        return;
    }

    var webSocket = await context.WebSockets.AcceptWebSocketAsync();
    var connectionId = Guid.NewGuid().ToString();
    var connectionInfo = new ConnectionInfo { Socket = webSocket };

    try
    {
        var buffer = new byte[1024 * 8]; // Increased buffer for encrypted messages

        while (webSocket.State == WebSocketState.Open)
        {
            var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

            if (result.MessageType == WebSocketMessageType.Close)
            {
                await HandleDisconnect(connectionId, connectionInfo);
                break;
            }

            if (result.MessageType == WebSocketMessageType.Text)
            {
                var message = Encoding.UTF8.GetString(buffer, 0, result.Count);

                // Validate message size (max 10KB)
                if (message.Length > 10240)
                {
                    await SendError(webSocket, "Message too large");
                    continue;
                }

                try
                {
                    var data = JsonSerializer.Deserialize<JsonElement>(message);
                    var type = data.GetProperty("type").GetString();

                    switch (type)
                    {
                        case "join":
                            var username = data.GetProperty("username").GetString();
                            var publicKey = data.TryGetProperty("publicKey", out var pubKey)
                                ? pubKey.GetString()
                                : null;

                            if (!ValidateUsername(username))
                            {
                                await SendError(webSocket, "Invalid username");
                                break;
                            }

                            // Check if username is already taken
                            if (connections.Values.Any(c => c.Username == username && c.Socket.State == WebSocketState.Open))
                            {
                                await SendError(webSocket, "Username already taken");
                                break;
                            }

                            connectionInfo.Username = username;
                            connectionInfo.PublicKey = publicKey;
                            connectionInfo.JoinedAt = DateTime.UtcNow;
                            connections[connectionId] = connectionInfo;

                            // Send user list with public keys to the new user
                            var userListWithKeys = connections.Values
                                .Where(c => c.Socket.State == WebSocketState.Open && !string.IsNullOrEmpty(c.Username))
                                .Select(c => new { username = c.Username, publicKey = c.PublicKey })
                                .ToList();

                            await SendMessage(webSocket, new
                            {
                                type = "users",
                                users = userListWithKeys
                            });

                            // Broadcast join message with public key
                            await BroadcastMessage(new
                            {
                                type = "join",
                                username,
                                publicKey,
                                users = userListWithKeys,
                                timestamp = DateTime.UtcNow.ToString("o")
                            }, connectionId);

                            LogInfo($"[JOIN] {username} connected from {clientIp}. Total users: {connections.Count}");
                            break;

                        case "message":
                            if (string.IsNullOrEmpty(connectionInfo.Username))
                            {
                                await SendError(webSocket, "Not authenticated");
                                break;
                            }

                            // Messages are now encrypted client-side, just relay them
                            var encryptedMsg = data.GetProperty("encryptedMessage").GetString();
                            var recipients = data.TryGetProperty("recipients", out var recip)
                                ? JsonSerializer.Deserialize<string[]>(recip.GetRawText())
                                : null;

                            // Validate message
                            if (string.IsNullOrEmpty(encryptedMsg) || encryptedMsg.Length > 8192)
                            {
                                await SendError(webSocket, "Invalid message");
                                break;
                            }

                            var messageData = new
                            {
                                type = "message",
                                username = connectionInfo.Username,
                                encryptedMessage = encryptedMsg,
                                timestamp = DateTime.UtcNow.ToString("o"),
                                messageId = Guid.NewGuid().ToString()
                            };

                            if (recipients != null && recipients.Length > 0)
                            {
                                // Send to specific recipients (private message)
                                await SendToUsers(messageData, recipients, connectionId);
                            }
                            else
                            {
                                // Broadcast to all
                                await BroadcastMessage(messageData);
                            }

                            LogInfo($"[MESSAGE] {connectionInfo.Username} sent encrypted message");
                            break;

                        case "typing":
                            if (!string.IsNullOrEmpty(connectionInfo.Username))
                            {
                                await BroadcastMessage(new
                                {
                                    type = "typing",
                                    username = connectionInfo.Username,
                                    timestamp = DateTime.UtcNow.ToString("o")
                                }, connectionId);
                            }
                            break;

                        case "stopTyping":
                            if (!string.IsNullOrEmpty(connectionInfo.Username))
                            {
                                await BroadcastMessage(new
                                {
                                    type = "stopTyping",
                                    username = connectionInfo.Username,
                                    timestamp = DateTime.UtcNow.ToString("o")
                                }, connectionId);
                            }
                            break;

                        case "ping":
                            await SendMessage(webSocket, new
                            {
                                type = "pong",
                                timestamp = DateTime.UtcNow.ToString("o")
                            });
                            break;

                        default:
                            LogWarning($"[WARNING] Unknown message type: {type}");
                            break;
                    }
                }
                catch (JsonException ex)
                {
                    LogError($"[ERROR] JSON parsing error: {ex.Message}");
                    await SendError(webSocket, "Invalid message format");
                }
            }
        }
    }
    catch (WebSocketException ex)
    {
        LogError($"[ERROR] WebSocket error for connection {connectionId}: {ex.Message}");
    }
    catch (Exception ex)
    {
        LogError($"[ERROR] Unexpected error for connection {connectionId}: {ex.Message}");
    }
    finally
    {
        await HandleDisconnect(connectionId, connectionInfo);
    }
});

app.MapGet("/", () => Results.Json(new
{
    service = "PieraChat Secure WebSocket Server",
    version = "2.0.0",
    status = "running",
    endpoint = "/ws",
    features = new[]
    {
        "End-to-End Encryption",
        "Rate Limiting",
        "Public Key Exchange",
        "Username Validation"
    },
    activeConnections = connections.Count,
    uptime = DateTime.UtcNow.ToString("o")
}));

app.MapGet("/health", () =>
{
    var healthStatus = new
    {
        status = "healthy",
        timestamp = DateTime.UtcNow,
        connections = connections.Count,
        activeUsers = connections.Values.Count(c => !string.IsNullOrEmpty(c.Username)),
        memoryUsageMB = GC.GetTotalMemory(false) / 1024 / 1024
    };

    return Results.Ok(healthStatus);
});

app.MapGet("/stats", () => Results.Json(new
{
    totalConnections = connections.Count,
    activeUsers = connections.Values
        .Where(c => !string.IsNullOrEmpty(c.Username))
        .Select(c => new { c.Username, c.JoinedAt })
        .ToList(),
    serverTime = DateTime.UtcNow.ToString("o")
}));

// Cleanup task for stale connections
var cleanupTimer = new System.Threading.Timer(_ =>
{
    var staleConnections = connections
        .Where(kvp => kvp.Value.Socket.State != WebSocketState.Open)
        .Select(kvp => kvp.Key)
        .ToList();

    foreach (var connId in staleConnections)
    {
        connections.TryRemove(connId, out _);
    }

    if (staleConnections.Count > 0)
    {
        LogInfo($"[CLEANUP] Removed {staleConnections.Count} stale connections");
    }
}, null, TimeSpan.FromMinutes(5), TimeSpan.FromMinutes(5));

LogInfo("🚀 PieraChat Secure Server started successfully!");

await app.RunAsync();

// Helper methods
bool ValidateUsername(string? username)
{
    if (string.IsNullOrWhiteSpace(username)) return false;
    if (username.Length < 2 || username.Length > 20) return false;

    // Allow only alphanumeric, spaces, and some special characters
    return username.All(c => char.IsLetterOrDigit(c) || c == ' ' || c == '_' || c == '-');
}

bool CheckRateLimit(string clientIp)
{
    var now = DateTime.UtcNow;

    if (!rateLimits.TryGetValue(clientIp, out var limitInfo))
    {
        rateLimits[clientIp] = new RateLimitInfo
        {
            Count = 1,
            FirstRequest = now
        };
        return true;
    }

    // Allow 10 connections per minute
    if ((now - limitInfo.FirstRequest).TotalMinutes < 1)
    {
        if (limitInfo.Count >= 10)
        {
            LogWarning($"[RATE LIMIT] Blocked connection from {clientIp}");
            return false;
        }
        limitInfo.Count++;
    }
    else
    {
        limitInfo.Count = 1;
        limitInfo.FirstRequest = now;
    }

    return true;
}

async Task SendMessage(WebSocket socket, object data)
{
    if (socket.State == WebSocketState.Open)
    {
        try
        {
            var json = JsonSerializer.Serialize(data);
            var bytes = Encoding.UTF8.GetBytes(json);
            await socket.SendAsync(
                new ArraySegment<byte>(bytes),
                WebSocketMessageType.Text,
                true,
                CancellationToken.None
            );
        }
        catch (Exception ex)
        {
            LogError($"[ERROR] Failed to send message: {ex.Message}");
        }
    }
}

async Task SendError(WebSocket socket, string errorMessage)
{
    await SendMessage(socket, new
    {
        type = "error",
        message = errorMessage,
        timestamp = DateTime.UtcNow.ToString("o")
    });
}

async Task BroadcastMessage(object data, string? excludeConnectionId = null)
{
    var json = JsonSerializer.Serialize(data);
    var bytes = Encoding.UTF8.GetBytes(json);

    var tasks = connections
        .Where(kvp => kvp.Key != excludeConnectionId && kvp.Value.Socket.State == WebSocketState.Open)
        .Select(kvp => SendMessageBytes(kvp.Value.Socket, bytes));

    await Task.WhenAll(tasks);
}

async Task SendToUsers(object data, string[] usernames, string? excludeConnectionId = null)
{
    var json = JsonSerializer.Serialize(data);
    var bytes = Encoding.UTF8.GetBytes(json);

    var tasks = connections
        .Where(kvp =>
            kvp.Key != excludeConnectionId &&
            kvp.Value.Socket.State == WebSocketState.Open &&
            usernames.Contains(kvp.Value.Username))
        .Select(kvp => SendMessageBytes(kvp.Value.Socket, bytes));

    await Task.WhenAll(tasks);
}

async Task SendMessageBytes(WebSocket socket, byte[] bytes)
{
    if (socket.State == WebSocketState.Open)
    {
        try
        {
            await socket.SendAsync(
                new ArraySegment<byte>(bytes),
                WebSocketMessageType.Text,
                true,
                CancellationToken.None
            );
        }
        catch (Exception ex)
        {
            LogError($"[ERROR] Failed to send bytes: {ex.Message}");
        }
    }
}

async Task HandleDisconnect(string connectionId, ConnectionInfo connectionInfo)
{
    if (connections.TryRemove(connectionId, out _))
    {
        if (!string.IsNullOrEmpty(connectionInfo.Username))
        {
            var userListWithKeys = connections.Values
                .Where(c => c.Socket.State == WebSocketState.Open && !string.IsNullOrEmpty(c.Username))
                .Select(c => new { username = c.Username, publicKey = c.PublicKey })
                .ToList();

            await BroadcastMessage(new
            {
                type = "leave",
                username = connectionInfo.Username,
                users = userListWithKeys,
                timestamp = DateTime.UtcNow.ToString("o")
            });

            LogInfo($"[LEAVE] {connectionInfo.Username} disconnected. Remaining: {connections.Count}");
        }
    }

    if (connectionInfo.Socket.State != WebSocketState.Closed)
    {
        try
        {
            await connectionInfo.Socket.CloseAsync(
                WebSocketCloseStatus.NormalClosure,
                "Connection closed",
                CancellationToken.None
            );
        }
        catch { }
    }

    connectionInfo.Socket.Dispose();
}

void LogInfo(string message)
{
    Console.ForegroundColor = ConsoleColor.Green;
    Console.WriteLine($"[{DateTime.UtcNow:HH:mm:ss}] {message}");
    Console.ResetColor();
}

void LogWarning(string message)
{
    Console.ForegroundColor = ConsoleColor.Yellow;
    Console.WriteLine($"[{DateTime.UtcNow:HH:mm:ss}] {message}");
    Console.ResetColor();
}

void LogError(string message)
{
    Console.ForegroundColor = ConsoleColor.Red;
    Console.WriteLine($"[{DateTime.UtcNow:HH:mm:ss}] {message}");
    Console.ResetColor();
}

// Data models
class ConnectionInfo
{
    public WebSocket Socket { get; set; } = null!;
    public string? Username { get; set; }
    public string? PublicKey { get; set; }
    public DateTime JoinedAt { get; set; }
}

class RateLimitInfo
{
    public int Count { get; set; }
    public DateTime FirstRequest { get; set; }
}

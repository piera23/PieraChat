using System.Collections.Concurrent;
using System.Net.WebSockets;
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

// WebSocket storage
var connections = new ConcurrentDictionary<string, (WebSocket socket, string username)>();

app.UseWebSockets();

app.Map("/ws", async context =>
{
    if (!context.WebSockets.IsWebSocketRequest)
    {
        context.Response.StatusCode = 400;
        return;
    }

    var webSocket = await context.WebSockets.AcceptWebSocketAsync();
    var connectionId = Guid.NewGuid().ToString();
    string? username = null;

    try
    {
        var buffer = new byte[1024 * 4];

        while (webSocket.State == WebSocketState.Open)
        {
            var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

            if (result.MessageType == WebSocketMessageType.Close)
            {
                await HandleDisconnect(connectionId, username, webSocket);
                break;
            }

            if (result.MessageType == WebSocketMessageType.Text)
            {
                var message = Encoding.UTF8.GetString(buffer, 0, result.Count);
                var data = JsonSerializer.Deserialize<JsonElement>(message);

                var type = data.GetProperty("type").GetString();

                switch (type)
                {
                    case "join":
                        username = data.GetProperty("username").GetString();
                        if (!string.IsNullOrEmpty(username))
                        {
                            connections[connectionId] = (webSocket, username);

                            // Send user list to the new user
                            var userList = connections.Values.Select(v => v.username).Distinct().ToList();
                            await SendMessage(webSocket, new
                            {
                                type = "users",
                                users = userList
                            });

                            // Broadcast join message to all users
                            await BroadcastMessage(new
                            {
                                type = "join",
                                username,
                                users = userList
                            }, connectionId);

                            Console.WriteLine($"[JOIN] {username} connected. Total users: {connections.Count}");
                        }
                        break;

                    case "message":
                        if (!string.IsNullOrEmpty(username))
                        {
                            var msg = data.GetProperty("message").GetString();
                            await BroadcastMessage(new
                            {
                                type = "message",
                                username,
                                message = msg,
                                timestamp = DateTime.UtcNow.ToString("o")
                            });
                            Console.WriteLine($"[MESSAGE] {username}: {msg}");
                        }
                        break;

                    case "typing":
                        if (!string.IsNullOrEmpty(username))
                        {
                            await BroadcastMessage(new
                            {
                                type = "typing",
                                username
                            }, connectionId);
                        }
                        break;

                    case "stopTyping":
                        if (!string.IsNullOrEmpty(username))
                        {
                            await BroadcastMessage(new
                            {
                                type = "stopTyping",
                                username
                            }, connectionId);
                        }
                        break;

                    case "ping":
                        await SendMessage(webSocket, new { type = "pong" });
                        break;
                }
            }
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[ERROR] Connection {connectionId}: {ex.Message}");
    }
    finally
    {
        await HandleDisconnect(connectionId, username, webSocket);
    }
});

app.MapGet("/", () => Results.Json(new
{
    service = "PieraChat WebSocket Server",
    version = "1.0.0",
    status = "running",
    endpoint = "/ws",
    activeConnections = connections.Count
}));

app.MapGet("/health", () => Results.Ok(new
{
    status = "healthy",
    timestamp = DateTime.UtcNow,
    connections = connections.Count
}));

await app.RunAsync();

// Helper methods
async Task SendMessage(WebSocket socket, object data)
{
    if (socket.State == WebSocketState.Open)
    {
        var json = JsonSerializer.Serialize(data);
        var bytes = Encoding.UTF8.GetBytes(json);
        await socket.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);
    }
}

async Task BroadcastMessage(object data, string? excludeConnectionId = null)
{
    var json = JsonSerializer.Serialize(data);
    var bytes = Encoding.UTF8.GetBytes(json);

    var tasks = connections
        .Where(kvp => kvp.Key != excludeConnectionId && kvp.Value.socket.State == WebSocketState.Open)
        .Select(kvp => kvp.Value.socket.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None));

    await Task.WhenAll(tasks);
}

async Task HandleDisconnect(string connectionId, string? username, WebSocket webSocket)
{
    if (connections.TryRemove(connectionId, out _))
    {
        if (!string.IsNullOrEmpty(username))
        {
            var userList = connections.Values.Select(v => v.username).Distinct().ToList();
            await BroadcastMessage(new
            {
                type = "leave",
                username,
                users = userList
            });
            Console.WriteLine($"[LEAVE] {username} disconnected. Remaining users: {connections.Count}");
        }
    }

    if (webSocket.State != WebSocketState.Closed)
    {
        try
        {
            await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Connection closed", CancellationToken.None);
        }
        catch { }
    }

    webSocket.Dispose();
}

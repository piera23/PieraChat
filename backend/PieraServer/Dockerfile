# PieraChat Backend Dockerfile
# Multi-stage build for optimized production image

# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies (cached layer)
COPY ["PieraServer.csproj", "./"]
RUN dotnet restore "PieraServer.csproj"

# Copy source code and build
COPY . .
RUN dotnet build "PieraServer.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "PieraServer.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Create non-root user
RUN useradd -m -s /bin/bash pierachat && \
    mkdir -p /app/uploads && \
    chown -R pierachat:pierachat /app

# Copy published app
COPY --from=publish /app/publish .

# Set ownership
RUN chown -R pierachat:pierachat /app

# Switch to non-root user
USER pierachat

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Environment variables
ENV ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_URLS=http://+:8080 \
    DOTNET_PRINT_TELEMETRY_MESSAGE=false

# Run application
ENTRYPOINT ["dotnet", "PieraServer.dll"]

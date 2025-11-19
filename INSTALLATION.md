# 📦 Guida Installazione PieraChat v2.0

**Guida completa per installare PieraChat su Windows, macOS, Linux, Android e iOS**

---

## Indice

- [Prerequisiti](#prerequisiti)
- [Installazione Backend](#installazione-backend)
  - [Windows](#backend-windows)
  - [macOS](#backend-macos)
  - [Linux](#backend-linux)
- [Installazione Frontend Web](#installazione-frontend-web)
- [Installazione Mobile](#installazione-mobile)
  - [Android](#android)
  - [iOS](#ios)
- [Verifica Installazione](#verifica-installazione)
- [Configurazione](#configurazione)
- [Troubleshooting](#troubleshooting)

---

## Prerequisiti

### Backend (.NET 8)

**Windows:**
1. Scarica [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) per Windows
2. Esegui l'installer `dotnet-sdk-8.0.xxx-win-x64.exe`
3. Verifica: `dotnet --version` (deve mostrare 8.0.x)

**macOS:**
```bash
# Con Homebrew
brew install dotnet@8

# Oppure scarica da https://dotnet.microsoft.com/download/dotnet/8.0
```

**Linux (Ubuntu/Debian):**
```bash
# Aggiungi repository Microsoft
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
rm packages-microsoft-prod.deb

# Installa .NET SDK
sudo apt-get update
sudo apt-get install -y dotnet-sdk-8.0

# Verifica
dotnet --version
```

**Linux (Fedora/RHEL/CentOS):**
```bash
sudo dnf install dotnet-sdk-8.0
```

**Linux (Arch Linux):**
```bash
sudo pacman -S dotnet-sdk
```

### Frontend Web (Node.js)

**Tutti i sistemi operativi:**

1. Scarica [Node.js 18+](https://nodejs.org/) LTS
2. Verifica installazione:
```bash
node --version  # v18.x.x o superiore
npm --version   # 9.x.x o superiore
```

**Alternativa - Usa nvm (consigliato):**

**Windows:**
- Scarica [nvm-windows](https://github.com/coreybutler/nvm-windows/releases)

**macOS/Linux:**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### Mobile (Expo)

**Prerequisiti:**
- Node.js 18+ installato (vedi sopra)
- Account Expo gratuito: https://expo.dev/signup

**Installa Expo CLI:**
```bash
npm install -g expo-cli eas-cli
```

**Per iOS (solo su macOS):**
- Xcode 14+ da App Store
- iOS Simulator (incluso in Xcode)
- Apple Developer Account ($99/anno per pubblicare su App Store)

**Per Android:**
- [Android Studio](https://developer.android.com/studio)
- Android SDK Platform Tools
- Device fisico o Emulator

---

## Installazione Backend

### Backend Windows

**Metodo 1: Eseguibile precompilato**

1. Scarica `PieraChat-Backend-Windows-x64.zip` da [Releases](https://github.com/piera23/PieraChat/releases)

2. Estrai in una cartella (es. `C:\PieraChat\`)

3. Avvia il server:
```powershell
cd C:\PieraChat\backend
.\PieraServer.exe
```

4. Il server sarà disponibile su `http://localhost:8080`

**Metodo 2: Da sorgente**

```powershell
# Clone repository
git clone https://github.com/piera23/PieraChat.git
cd PieraChat

# Build e avvia
cd backend\PieraServer
dotnet restore
dotnet build
dotnet run

# Il server è su http://localhost:8080
```

**Avvio automatico (Windows Service):**

```powershell
# Apri PowerShell come Amministratore
cd C:\PieraChat\backend

# Crea servizio Windows
sc.exe create PieraChat binPath= "C:\PieraChat\backend\PieraServer.exe" start= auto
sc.exe description PieraChat "PieraChat WebSocket Server"

# Avvia servizio
sc.exe start PieraChat

# Verifica stato
sc.exe query PieraChat
```

### Backend macOS

**Da sorgente:**

```bash
# Clone repository
git clone https://github.com/piera23/PieraChat.git
cd PieraChat

# Build e avvia
cd backend/PieraServer
dotnet restore
dotnet build
dotnet run

# Server su http://localhost:8080
```

**Avvio automatico (launchd):**

```bash
# Crea file plist
sudo nano /Library/LaunchDaemons/com.pierachat.server.plist
```

Contenuto:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.pierachat.server</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/share/dotnet/dotnet</string>
        <string>/Users/YOUR_USERNAME/PieraChat/backend/PieraServer/bin/Debug/net8.0/PieraServer.dll</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/pierachat.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/pierachat.error.log</string>
</dict>
</plist>
```

```bash
# Carica e avvia
sudo launchctl load /Library/LaunchDaemons/com.pierachat.server.plist
sudo launchctl start com.pierachat.server

# Verifica
ps aux | grep PieraServer
```

### Backend Linux

**Ubuntu/Debian:**

```bash
# Clone repository
git clone https://github.com/piera23/PieraChat.git
cd PieraChat

# Build
cd backend/PieraServer
dotnet restore
dotnet build
dotnet run

# Server su http://localhost:8080
```

**Avvio automatico (systemd):**

```bash
# Crea file service
sudo nano /etc/systemd/system/pierachat.service
```

Contenuto:
```ini
[Unit]
Description=PieraChat WebSocket Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/pierachat/backend/PieraServer
ExecStart=/usr/bin/dotnet /opt/pierachat/backend/PieraServer/bin/Release/net8.0/PieraServer.dll
Restart=always
RestartSec=10
SyslogIdentifier=pierachat
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://0.0.0.0:8080

[Install]
WantedBy=multi-user.target
```

```bash
# Abilita e avvia servizio
sudo systemctl daemon-reload
sudo systemctl enable pierachat
sudo systemctl start pierachat

# Verifica stato
sudo systemctl status pierachat

# Logs
sudo journalctl -u pierachat -f
```

**Docker (tutti i sistemi Linux):**

```bash
# Crea Dockerfile nel backend/PieraServer
cat > backend/PieraServer/Dockerfile << 'EOF'
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore
RUN dotnet publish -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .
EXPOSE 8080
ENTRYPOINT ["dotnet", "PieraServer.dll"]
EOF

# Build e avvia
cd backend/PieraServer
docker build -t pierachat-backend .
docker run -d -p 8080:8080 --name pierachat --restart always pierachat-backend

# Verifica
docker ps
docker logs pierachat
```

---

## Installazione Frontend Web

### Sviluppo Locale

```bash
# Clone repository (se non già fatto)
cd PieraChat/frontend

# Installa dipendenze
npm install

# Avvia dev server
npm run dev

# App disponibile su http://localhost:3000
```

### Build per Produzione

```bash
cd frontend
npm run build

# Output in dist/
# Dimensione: ~220KB (67KB gzipped)
```

### Deploy su Vercel

```bash
# Installa Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel

# Segui il wizard, poi:
# Production URL: https://pierachat.vercel.app
```

### Deploy su Netlify

```bash
# Installa Netlify CLI
npm install -g netlify-cli

# Deploy
cd frontend
npm run build
netlify deploy --prod --dir=dist

# Oppure trascina cartella dist/ su https://app.netlify.com/drop
```

### Deploy su Server Linux (Nginx)

```bash
# Build
cd frontend
npm run build

# Copia su server
scp -r dist/* user@your-server.com:/var/www/pierachat/

# Configura Nginx
sudo nano /etc/nginx/sites-available/pierachat
```

Configurazione Nginx:
```nginx
server {
    listen 80;
    server_name chat.example.com;
    root /var/www/pierachat;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Abilita gzip
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1000;

    # Cache assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Attiva configurazione
sudo ln -s /etc/nginx/sites-available/pierachat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Installazione Mobile

### Android

**Metodo 1: APK precompilato (più semplice)**

1. Scarica `PieraChat-v2.0.0.apk` da [Releases](https://github.com/piera23/PieraChat/releases)

2. Sul tuo Android:
   - Vai su **Impostazioni** → **Sicurezza** → Abilita **Origini sconosciute**
   - Apri il file APK scaricato
   - Tocca **Installa**

3. Apri PieraChat

**Metodo 2: Build da sorgente (Expo)**

```bash
# Clone repository
cd PieraChat/mobile

# Installa dipendenze
npm install

# Login Expo (crea account gratuito su expo.dev)
npx expo login

# Configura EAS (prima volta)
eas build:configure

# Build APK
eas build --platform android --profile preview

# Attendi 10-15 minuti, poi scarica APK dal link fornito
```

**Metodo 3: Sviluppo con Expo Go**

```bash
cd mobile
npm install
npx expo start

# Scansiona QR code con app Expo Go
# Download: https://play.google.com/store/apps/details?id=host.exp.exponent
```

### iOS

**Prerequisiti:**
- Mac con macOS 12+
- Xcode 14+ installato
- Apple Developer Account ($99/anno)

**Build con EAS:**

```bash
cd mobile

# Login Expo
npx expo login

# Build IPA
eas build --platform ios

# Attendi 15-20 minuti
# Scarica IPA e installa con TestFlight
```

**Sviluppo con Simulator:**

```bash
cd mobile
npm install
npx expo start

# Premi 'i' per aprire in iOS Simulator
```

**TestFlight (beta testing):**

```bash
# Build e submit automaticamente
eas build --platform ios --auto-submit

# Gestisci su App Store Connect
# https://appstoreconnect.apple.com
```

---

## Verifica Installazione

### 1. Verifica Backend

```bash
# Test HTTP
curl http://localhost:8080

# Deve rispondere con 404 o Bad Request (è normale, il server risponde solo a WebSocket /ws)

# Test WebSocket (con wscat)
npm install -g wscat
wscat -c ws://localhost:8080/ws

# Invia messaggio di join:
{"type":"join","username":"TestUser"}

# Dovresti ricevere risposta con tipo "system"
```

### 2. Verifica Frontend Web

1. Apri browser su `http://localhost:3000` (dev) o tuo dominio
2. Inserisci username
3. Clicca "Join Chat"
4. Se vedi "Connesso" in alto a destra → ✅ Funziona!

### 3. Verifica Mobile

1. Apri app PieraChat
2. Inserisci username
3. Tocca "Join Chat"
4. Se vedi indicatore verde "Connesso" → ✅ Funziona!

**Troubleshooting Mobile:**
- Su device fisico, usa IP del computer invece di localhost
- Modifica `mobile/src/config/constants.js`:
  ```javascript
  export const WEBSOCKET_URL = 'ws://192.168.1.XXX:8080/ws';
  export const SERVER_URL = 'http://192.168.1.XXX:8080';
  ```
- Trova il tuo IP:
  - Windows: `ipconfig`
  - macOS/Linux: `ifconfig` o `ip addr`

---

## Configurazione

### Backend - Porta e Bind

**appsettings.json:**
```json
{
  "Kestrel": {
    "Endpoints": {
      "Http": {
        "Url": "http://0.0.0.0:8080"
      }
    }
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

### Frontend Web - WebSocket URL

**Crea file `.env` nella cartella `frontend/`:**

```env
# Sviluppo locale
VITE_WEBSOCKET_URL=ws://localhost:8080/ws
VITE_SERVER_URL=http://localhost:8080

# Produzione
# VITE_WEBSOCKET_URL=wss://chat.example.com/ws
# VITE_SERVER_URL=https://chat.example.com
```

**Aggiorna `frontend/src/hooks/useSecurePieraServer.js`:**
```javascript
const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8080/ws';
```

### Mobile - Server URL

**Modifica `mobile/src/config/constants.js`:**

```javascript
// SVILUPPO LOCALE - Emulator
export const WEBSOCKET_URL = 'ws://localhost:8080/ws';
export const SERVER_URL = 'http://localhost:8080';

// SVILUPPO - Device Fisico (sostituisci con tuo IP)
// export const WEBSOCKET_URL = 'ws://192.168.1.100:8080/ws';
// export const SERVER_URL = 'http://192.168.1.100:8080';

// PRODUZIONE
// export const WEBSOCKET_URL = 'wss://chat.example.com/ws';
// export const SERVER_URL = 'https://chat.example.com';
```

---

## Troubleshooting

### Backend non si avvia

**Problema: "Address already in use"**
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :8080
kill -9 <PID>
```

**Problema: "dotnet command not found"**
- Reinstalla .NET SDK
- Aggiungi al PATH:
  - Windows: `C:\Program Files\dotnet`
  - macOS/Linux: `/usr/local/share/dotnet`

### Frontend non si connette

**Problema: "WebSocket connection failed"**

1. Verifica backend running: `curl http://localhost:8080`
2. Controlla URL WebSocket in `.env` o constants.js
3. Disabilita antivirus/firewall temporaneamente
4. Controlla console browser (F12) per errori

**Problema: "net::ERR_CONNECTION_REFUSED"**

- Backend non è in esecuzione
- Porta 8080 bloccata da firewall
- URL errato in configurazione

### Mobile non si connette

**Problema: "Network request failed"**

1. **Su Emulator:** Usa `localhost` o `10.0.2.2` (Android)
2. **Su Device Fisico:** Usa IP del computer (192.168.x.x)
3. **Verifica firewall:** Consenti porta 8080
4. **Stesso network WiFi:** Device e computer sulla stessa rete

**Trova IP del computer:**
```bash
# Windows
ipconfig
# Cerca "IPv4 Address" (es. 192.168.1.100)

# macOS/Linux
ifconfig | grep "inet "
# Cerca IP locale (es. 192.168.1.100)
```

**Problema: "Permission denied" su Android**

- Verifica `mobile/app.json` abbia tutti i permessi:
  ```json
  "permissions": [
    "INTERNET",
    "CAMERA",
    "RECORD_AUDIO",
    ...
  ]
  ```
- Reinstalla app dopo modifiche a permessi

### Build mobile fallisce

**Problema: "Could not find Expo project"**
```bash
cd mobile
expo init . --template blank
# Rispondi "yes" per reinstallare dipendenze
```

**Problema: "EAS Build failed"**
```bash
# Pulisci cache
expo start -c

# Reinstalla node_modules
rm -rf node_modules package-lock.json
npm install

# Verifica configurazione
eas build:configure
```

**Problema: "Java/Android SDK not found" (Android)**

1. Installa [Android Studio](https://developer.android.com/studio)
2. Apri Android Studio → **SDK Manager**
3. Installa:
   - Android SDK Platform-Tools
   - Android SDK Build-Tools
   - Android 13 (API 33)

3. Aggiungi al PATH:
   ```bash
   # macOS/Linux (~/.bashrc o ~/.zshrc)
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

**Problema: "Xcode not found" (iOS)**

1. Installa Xcode da Mac App Store
2. Accetta licenza:
   ```bash
   sudo xcodebuild -license accept
   ```
3. Installa Command Line Tools:
   ```bash
   xcode-select --install
   ```

---

## Riepilogo Comandi Rapidi

### Avvio Completo Locale

**Linux/macOS:**
```bash
# Terminal 1 - Backend
cd backend/PieraServer && dotnet run

# Terminal 2 - Frontend Web
cd frontend && npm run dev

# Terminal 3 - Mobile (opzionale)
cd mobile && npm start
```

**Windows:**
```powershell
# Terminal 1 - Backend
cd backend\PieraServer
dotnet run

# Terminal 2 - Frontend Web
cd frontend
npm run dev

# Terminal 3 - Mobile (opzionale)
cd mobile
npm start
```

### Build per Produzione

```bash
# Backend
cd backend/PieraServer
dotnet publish -c Release -o ./publish

# Frontend Web
cd frontend
npm run build

# Mobile Android
cd mobile
eas build --platform android --profile preview

# Mobile iOS
cd mobile
eas build --platform ios
```

---

## Prossimi Passi

- ✅ Installazione completata
- 📖 Leggi [DEPLOYMENT.md](DEPLOYMENT.md) per deploy in produzione
- 🔐 Configura HTTPS/WSS (vedi [DEPLOYMENT.md](DEPLOYMENT.md))
- 📱 Pubblica app su Google Play / App Store
- 🎨 Personalizza UI e branding
- 🛠️ Contribuisci al progetto!

---

## Supporto

- 📖 **Documentazione**: [docs/](docs/)
- 🐛 **Issue**: https://github.com/piera23/PieraChat/issues
- 💬 **Discord**: [PieraChat Community](https://discord.gg/pierachat)
- 📧 **Email**: support@pierachat.example.com

---

Made with ❤️ by PieraChat Team

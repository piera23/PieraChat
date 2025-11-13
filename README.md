# 🔐 PieraChat v2.0 - Secure Real-Time Chat

<div align="center">

![PieraChat Logo](docs/images/logo.png)

**Chat crittografata end-to-end multi-piattaforma con WebSocket**

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/piera23/PieraChat)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![.NET](https://img.shields.io/badge/.NET-8.0-purple.svg)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-18.2-61dafb.svg)](https://reactjs.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.73-blue.svg)](https://reactnative.dev/)

[Demo](#-demo) •
[Features](#-caratteristiche) •
[Installazione](#-installazione-rapida) •
[Docs](#-documentazione) •
[Security](#-sicurezza)

</div>

---

## 🌟 Caratteristiche Principali

### 🔐 Sicurezza Avanzata
- **End-to-End Encryption (E2EE)** con RSA-2048 + AES-256-GCM
- **Perfect Forward Secrecy** con chiavi di sessione per messaggio
- **Transport Layer Security** (TLS 1.2+, WSS)
- **Rate Limiting** e protezione DDoS
- **Input Validation** e sanitizzazione

### 📱 Multi-Piattaforma
- **Web App** (React + Vite + Tailwind CSS)
- **Mobile App** (React Native + Expo)
  - Android (APK/AAB)
  - iOS (IPA)
  - PWA (Progressive Web App)

### ⚡ Real-Time
- **WebSocket** per comunicazione bidirezionale
- **Auto-reconnect** con exponential backoff
- **Typing indicators** in tempo reale
- **Online users** list dinamica

### 🎨 UI/UX Moderna
- **Design responsive** per tutti i dispositivi
- **Dark/Light mode** support (futuro)
- **Animazioni fluide** e transizioni
- **Gradients** e Material Design

## 🖼️ Screenshot

<div align="center">

### Web Application
![Web Chat](docs/images/web-chat.png)

### Mobile Application
<img src="docs/images/mobile-login.png" width="250"> <img src="docs/images/mobile-chat.png" width="250"> <img src="docs/images/mobile-users.png" width="250">

</div>

## 🚀 Installazione Rapida

### Prerequisiti

- **Backend**: [.NET 8 SDK](https://dotnet.microsoft.com/download)
- **Frontend Web**: [Node.js](https://nodejs.org/) 18+
- **Mobile**: [Expo CLI](https://docs.expo.dev/get-started/installation/)

### Quick Start (5 minuti)

```bash
# 1. Clone repository
git clone https://github.com/piera23/PieraChat.git
cd PieraChat

# 2. Avvia Backend (Terminal 1)
cd backend/PieraServer
dotnet run
# Server running on http://localhost:8080

# 3. Avvia Frontend Web (Terminal 2)
cd frontend
npm install
npm run dev
# Web app on http://localhost:3000

# 4. Avvia Mobile App (Terminal 3 - Opzionale)
cd mobile
npm install
npm start
# Scansiona QR code con Expo Go
```

**🎉 Fatto!** Apri `http://localhost:3000` e inizia a chattare!

## 📁 Struttura Progetto

```
PieraChat/
├── 📂 backend/              # Backend .NET 8
│   └── PieraServer/
│       ├── Program.cs       # WebSocket server con E2EE
│       └── appsettings.json # Configurazione
│
├── 📂 frontend/             # Frontend Web React
│   ├── src/
│   │   ├── components/      # Componenti UI
│   │   ├── hooks/           # Custom hooks
│   │   │   ├── usePieraServer.js        # WebSocket base
│   │   │   └── useSecurePieraServer.js  # WebSocket + E2EE
│   │   └── utils/
│   │       ├── constants.js
│   │       └── encryption.js # Modulo crittografia E2EE
│   ├── package.json
│   └── vite.config.js
│
├── 📂 mobile/               # Mobile App React Native + Expo
│   ├── App.js
│   ├── src/
│   │   ├── screens/         # Login, Chat
│   │   ├── components/      # MessageItem, TypingIndicator
│   │   ├── hooks/           # useMobilePieraServer
│   │   ├── utils/           # Mobile encryption
│   │   └── config/          # Constants, theme
│   ├── app.json             # Expo config
│   ├── eas.json             # Build config
│   └── README.md            # Mobile-specific guide
│
└── 📂 docs/                 # Documentazione completa
    ├── ARCHITECTURE.md      # Architettura sistema
    ├── SECURITY.md          # Sicurezza e crittografia
    └── images/              # Screenshot e diagrammi
```

## 🔐 Sicurezza

### Come Funziona la Crittografia

```
┌─────────┐                  ┌─────────┐                  ┌─────────┐
│  Alice  │                  │  Server │                  │   Bob   │
└────┬────┘                  └────┬────┘                  └────┬────┘
     │                            │                            │
     │ 1. Generate RSA keys       │                            │
     │    (Public + Private)      │                            │
     │                            │                            │
     │ 2. Send public key         │                            │
     ├───────────────────────────>│                            │
     │                            │                            │
     │                            │ 3. Relay public key        │
     │                            ├───────────────────────────>│
     │                            │                            │
     │ 4. Write: "Hello!"         │                            │
     │                            │                            │
     │ 5. Generate AES session key│                            │
     │    (256-bit random)        │                            │
     │                            │                            │
     │ 6. Encrypt message         │                            │
     │    with AES-GCM            │                            │
     │                            │                            │
     │ 7. Encrypt AES key         │                            │
     │    with Bob's RSA public   │                            │
     │                            │                            │
     │ 8. Send encrypted package  │                            │
     ├───────────────────────────>│                            │
     │                            │                            │
     │                            │ 9. Relay (can't decrypt!)  │
     │                            ├───────────────────────────>│
     │                            │                            │
     │                            │             10. Decrypt AES key
     │                            │                 with private RSA
     │                            │                            │
     │                            │             11. Decrypt message
     │                            │                 with AES key
     │                            │                            │
     │                            │             12. Read: "Hello!"
```

**🔒 Il server NON può mai leggere i tuoi messaggi!**

Vedi [docs/SECURITY.md](docs/SECURITY.md) per dettagli completi.

## 🏗️ Architettura

### Stack Tecnologico

| Layer | Tecnologia |
|-------|-----------|
| **Backend** | .NET 8, ASP.NET Core, WebSocket |
| **Frontend Web** | React 18, Vite 5, Tailwind CSS |
| **Mobile** | React Native 0.73, Expo 50, React Native Paper |
| **Crittografia** | Web Crypto API (RSA-OAEP, AES-GCM) |
| **Transport** | WebSocket, TLS 1.2+ |

### Diagramma Sistema

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  Web Client  │      │Mobile Client │      │  iOS Client  │
│   (React)    │      │(React Native)│      │(React Native)│
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                      │
       │          WebSocket (wss://)                │
       └─────────────────────┼──────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │  .NET Backend    │
                    │  - WebSocket     │
                    │  - E2EE Relay    │
                    │  - Rate Limiting │
                    └──────────────────┘
```

Vedi [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) per dettagli completi.

## 📱 App Mobile

### Installazione Rapida

```bash
cd mobile
npm install
npm start
```

### Build APK Android

```bash
# Installa EAS CLI
npm install -g eas-cli

# Login Expo
eas login

# Build APK
eas build --platform android --profile preview

# Scarica APK e installa su Android
```

### Build iOS

```bash
# Richiede Apple Developer Account ($99/anno)
eas build --platform ios
```

### Build per Web (PWA)

```bash
npm run web
```

Guida completa: [mobile/README.md](mobile/README.md)

## 📚 Documentazione

### Guide Complete

- 📖 [**README.md**](README.md) - Questo file
- 🏗️ [**ARCHITECTURE.md**](docs/ARCHITECTURE.md) - Architettura dettagliata
- 🔐 [**SECURITY.md**](docs/SECURITY.md) - Sicurezza e crittografia
- 📱 [**Mobile README**](mobile/README.md) - Guida app mobile

### Quick Links

- [Installazione](#-installazione-rapida)
- [Configurazione](#️-configurazione)
- [Build Production](#-build-per-produzione)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)

## ⚙️ Configurazione

### Backend (appsettings.json)

```json
{
  "Kestrel": {
    "Endpoints": {
      "Http": {
        "Url": "http://localhost:8080"
      }
    }
  }
}
```

### Frontend Web (.env)

```env
VITE_WEBSOCKET_URL=ws://localhost:8080/ws
```

### Mobile (src/config/constants.js)

```javascript
// Sviluppo locale
export const WEBSOCKET_URL = 'ws://192.168.1.XXX:8080/ws';

// Produzione
export const WEBSOCKET_URL = 'wss://your-domain.com/ws';
```

## 🏭 Build per Produzione

### Backend

```bash
cd backend/PieraServer
dotnet publish -c Release -o ./publish

# Esegui
./publish/PieraServer
```

### Frontend Web

```bash
cd frontend
npm run build

# Deploy cartella dist/ su:
# - Vercel
# - Netlify
# - Firebase Hosting
# - Cloudflare Pages
# - AWS S3 + CloudFront
```

### Mobile

Vedi [mobile/README.md](mobile/README.md) per istruzioni dettagliate build APK/IPA.

## 🚢 Deployment

### Backend su VPS/Cloud

```bash
# Con systemd (Linux)
sudo nano /etc/systemd/system/pierachat.service

[Unit]
Description=PieraChat Backend

[Service]
WorkingDirectory=/opt/pierachat
ExecStart=/opt/pierachat/PieraServer
Restart=always

[Install]
WantedBy=multi-user.target

# Avvia servizio
sudo systemctl enable pierachat
sudo systemctl start pierachat
```

### Con Docker (futuro)

```bash
docker-compose up -d
```

### HTTPS con Nginx + Let's Encrypt

```nginx
server {
    listen 443 ssl http2;
    server_name chat.example.com;

    ssl_certificate /etc/letsencrypt/live/chat.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chat.example.com/privkey.pem;

    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 🧪 Testing

### Backend

```bash
cd backend/PieraServer
dotnet test
```

### Frontend

```bash
cd frontend
npm run test
npm run lint
```

### E2E Testing (futuro)

```bash
npm run test:e2e
```

## 🐛 Troubleshooting

### "Cannot connect to server"

1. **Verifica backend running**: `curl http://localhost:8080`
2. **Controlla URL WebSocket** in `.env` o `constants.js`
3. **Firewall**: Abilita porta 8080
4. **Su mobile**: Usa IP computer, non localhost

### "Encryption failed"

1. Browser moderno? Chrome 90+, Firefox 88+, Safari 14+
2. HTTPS richiesto in produzione (non http://)
3. Controlla console browser per errori

### Build mobile fallisce

```bash
# Pulisci cache
expo start -c

# Reinstalla
rm -rf node_modules
npm install

# Aggiorna Expo
expo upgrade
```

Più info: [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) (futuro)

## 🗺️ Roadmap

### v2.1 (Q1 2024)
- [ ] Messaggi privati 1-to-1
- [ ] Persistenza messaggi (MongoDB)
- [ ] Autenticazione OAuth
- [ ] Notifiche push

### v2.2 (Q2 2024)
- [ ] Stanze/canali multipli
- [ ] Upload file/immagini
- [ ] Emoji picker
- [ ] Voice messages

### v3.0 (Q3 2024)
- [ ] Videochiamate WebRTC
- [ ] Screen sharing
- [ ] Desktop app (Electron)
- [ ] Admin dashboard

## 🤝 Contributi

Contributi benvenuti!

1. Fork il progetto
2. Crea feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Apri Pull Request

Vedi [CONTRIBUTING.md](CONTRIBUTING.md) per dettagli.

## 🔒 Security

Vulnerabilità trovate? **Non** aprire issue pubblici!

- Email: security@pierachat.example.com
- Vedi [SECURITY.md](docs/SECURITY.md)

## 📄 Licenza

MIT License - vedi [LICENSE](LICENSE) per dettagli.

Copyright (c) 2024 PieraChat Team

## 👥 Autori

- **PieraChat Team** - *Initial work*

Vedi [CONTRIBUTORS.md](CONTRIBUTORS.md) per lista completa.

## 🙏 Ringraziamenti

- [React](https://reactjs.org/) - UI Framework
- [.NET](https://dotnet.microsoft.com/) - Backend Framework
- [Expo](https://expo.dev/) - React Native Toolchain
- [Tailwind CSS](https://tailwindcss.com/) - CSS Framework
- [React Native Paper](https://callstack.github.io/react-native-paper/) - Material Design
- [Lucide](https://lucide.dev/) - Icons

## 📧 Contatti

- Website: https://pierachat.example.com
- Email: info@pierachat.example.com
- Twitter: [@pierachat](https://twitter.com/pierachat)
- Discord: [PieraChat Community](https://discord.gg/pierachat)

---

<div align="center">

**⭐ Se ti piace PieraChat, lascia una stella su GitHub! ⭐**

Made with ❤️ by PieraChat Team

</div>

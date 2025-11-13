# 🚀 Quick Start Guide - PieraChat v2.0

## In 5 Minuti alla Tua Prima Chat Crittografata!

### 📋 Prerequisiti Check

```bash
# Verifica Node.js (≥18)
node --version  # Deve mostrare v18.x.x o superiore

# Verifica .NET SDK (≥8.0)
dotnet --version  # Deve mostrare 8.0.x o superiore

# Se mancano, installali:
# Node.js: https://nodejs.org/
# .NET 8: https://dotnet.microsoft.com/download
```

---

## 🎯 Scenario 1: Solo Web App

### Step 1: Clone e Setup (2 min)

```bash
git clone https://github.com/piera23/PieraChat.git
cd PieraChat
```

### Step 2: Backend (1 min)

**Terminal 1:**
```bash
cd backend/PieraServer
dotnet run
```

Vedrai:
```
🚀 PieraChat Secure Server started successfully!
[14:30:00] Now listening on: http://localhost:8080
```

### Step 3: Frontend (1 min)

**Terminal 2:**
```bash
cd frontend
npm install    # Prima volta: ~30s
npm run dev
```

Vedrai:
```
  VITE v5.0.8  ready in 234 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### Step 4: Apri e Testa! (1 min)

1. **Apri browser**: `http://localhost:3000`
2. **Inserisci username**: "Alice"
3. **Click "Entra nella Chat"**
4. **Apri tab incognito**: Entra come "Bob"
5. **Scrivi messaggi**: Vedi la crittografia in azione! 🔐

```
┌─────────────────────────────────────────┐
│  🔐 Alice è entrato nella chat          │
├─────────────────────────────────────────┤
│                                         │
│  Bob                             ┌────┐ │
│  Ciao Alice!                     │You │ │
│  14:30                           └────┘ │
│                                         │
│         ┌────────────────────────┐      │
│    ┌───┤ Ciao Bob! Come va? 🔐 │      │
│    │You└────────────────────────┘      │
│    └─── 14:31                           │
└─────────────────────────────────────────┘
```

**✅ Fatto!** Hai una chat crittografata E2E funzionante!

---

## 📱 Scenario 2: Web + Mobile

### Dopo aver completato Scenario 1...

**Terminal 3:**
```bash
cd mobile
npm install    # Prima volta: ~45s
npm start      # Avvia Expo
```

Vedrai un **QR Code** nel terminal:

```
█████████████████████████████████████
█████████████████████████████████████
████ ▄▄▄▄▄ █▀█ █▄▀▄ ▄ ▄█ ▄▄▄▄▄ ████
████ █   █ █▀▀▀█ ▀█▄▄▀▀█ █   █ ████
████ █▄▄▄█ █▀ █▀▀▄█▀ ▀ █ █▄▄▄█ ████
...
```

### Su Smartphone:

#### iOS:
1. Installa **Expo Go** da App Store
2. Apri **Fotocamera nativa**
3. Scansiona QR code
4. App si apre automaticamente

#### Android:
1. Installa **Expo Go** da Google Play
2. Apri **Expo Go app**
3. Tap "Scan QR Code"
4. Scansiona e app si carica

#### Configurazione IP:

**⚠️ IMPORTANTE**: Su dispositivo fisico, devi usare l'IP del computer!

```bash
# 1. Trova il tuo IP locale
# Windows:
ipconfig
# Cerca: IPv4 Address. . . . . . : 192.168.1.105

# Mac/Linux:
ifconfig | grep inet
# Cerca: inet 192.168.1.105

# 2. Modifica mobile/src/config/constants.js
export const WEBSOCKET_URL = 'ws://192.168.1.105:8080/ws';
//                                 ^^^^^^^^^^^^^^
//                                 TUO IP QUI

# 3. Riavvia Expo
```

**✅ App Mobile Pronta!** Chatta dal telefono! 📱🔐

---

## 🖼️ Screenshots con Annotazioni

### Web Login Screen

![Web Login](images/annotated-web-login.png)

```
┌────────────────────────────────────────┐
│                                        │
│         🔐 PieraChat v2.0             │ ← Logo + Versione
│    Chat crittografata end-to-end       │
│                                        │
│    ┌────────────────────────────┐     │
│    │ 👤 Nome utente             │     │ ← Input validato
│    └────────────────────────────┘     │   (2-20 caratteri)
│                                        │
│    ┌────────────────────────────┐     │
│    │   🚀 Entra nella Chat      │     │ ← Click per entrare
│    └────────────────────────────┘     │
│                                        │
│    🔒 E2EE   ⚡ Real-time  🛡️ Secure │ ← Features
└────────────────────────────────────────┘
```

### Web Chat Screen

![Web Chat](images/annotated-web-chat.png)

```
┌────────────────────────────────────────────────┐
│ PieraChat        Alice         📶 Connesso  3↓ │ ← Header
├────────────────────────────────────────────────┤
│                                                │
│ 📢 Bob è entrato nella chat (encrypted)        │ ← System msg
│                                                │
│  Bob                                  ┌──────┐ │
│  Ehi Alice, prova la crittografia!   │ You  │ │ ← Other user
│  🕐 14:30                             └──────┘ │   message
│                                                │
│         ┌────────────────────────────────┐     │
│    ┌───┤ Wow! I messaggi sono crittati │     │ ← Your message
│    │You│ 🔐 Sicuro al 100%!             │     │   (gradient)
│    └───└────────────────────────────────┘     │
│        🕐 14:31                                │
│                                                │
│ 💬 Bob sta scrivendo...                        │ ← Typing indicator
│                                                │
├────────────────────────────────────────────────┤
│ 📝 Scrivi un messaggio...              [📤]  │ ← Input area
└────────────────────────────────────────────────┘
```

### Mobile Login

![Mobile Login](images/annotated-mobile-login.png)

```
    📱 MOBILE VIEW
   ┌─────────────┐
   │   9:41 AM   │
   ├─────────────┤
   │             │
   │    ┌───┐    │
   │    │💬 │    │ ← Icon gradient
   │    └───┘    │
   │             │
   │  PieraChat  │ ← Title
   │             │
   │ Crittografia│
   │    E2E      │
   │             │
   │┌───────────┐│
   ││👤 Nome    ││ ← Input
   │└───────────┘│
   │             │
   │┌───────────┐│
   ││  ENTRA    ││ ← Button
   │└───────────┘│
   │             │
   │🔐 ⚡ 🛡️    │ ← Features
   └─────────────┘
```

### Mobile Chat

![Mobile Chat](images/annotated-mobile-chat.png)

```
    📱 MOBILE VIEW
   ┌─────────────┐
   │ ← PieraChat │ ← Navigation
   │    Alice    │   header
   │      📶 🔔 │
   ├─────────────┤
   │             │
   │ Bob entered │ ← System
   │             │
   │  Bob        │
   │  Ciao!      │ ← Message
   │  14:30      │   bubble
   │             │
   │        Ciao!│
   │   🔐 Alice │ ← Your msg
   │       14:31 │   encrypted
   │             │
   │💬 typing... │ ← Indicator
   ├─────────────┤
   │📝 Message  📤│ ← Input
   └─────────────┘
      [Home] [≡]
```

---

## 🔐 Come Vedere la Crittografia in Azione

### 1. Apri Developer Console (F12)

```javascript
// Nel browser, vai alla tab "Network"
// Filtra per "WS" (WebSocket)
// Click sulla connessione WebSocket
// Vai su "Messages"
```

### 2. Guarda i Messaggi Raw

**Messaggio NON crittografato (vecchia versione):**
```json
{
  "type": "message",
  "username": "Alice",
  "message": "Ciao Bob!"  ← LEGGIBILE!
}
```

**Messaggio CRITTOGRAFATO (v2.0):**
```json
{
  "type": "message",
  "username": "Alice",
  "encryptedMessage": {
    "encryptedMessage": "dGhpcyBpcyBlbmNyeXB0ZWQ=",  ← Base64
    "iv": "cmFuZG9tSVY=",
    "encryptedKeys": {
      "Bob": "ZW5jcnlwdGVkQUVTS2V5Rk9yQm9i",
      "Alice": "ZW5jcnlwdGVkQUVTS2V5Rm9yQWxpY2U="
    }
  }
}
```

**🔒 Il server riceve solo dati crittografati!**

### 3. Verifica Backend Logs

Nel terminal del backend vedrai:

```
[14:30:15] [INFO] User Alice connected from 127.0.0.1
[14:30:16] [MESSAGE] Alice sent encrypted message  ← Non vede il contenuto!
[14:30:17] [MESSAGE] Bob sent encrypted message
```

**✅ Zero-Knowledge Server!**

---

## 🎨 Personalizzazione Rapida

### Cambia Colori (Frontend Web)

`frontend/tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: '#7c3aed',      // ← Cambia questo (viola)
      secondary: '#3b82f6',    // ← E questo (blu)
    }
  }
}
```

### Cambia Porta Backend

`backend/PieraServer/appsettings.json`:

```json
{
  "Kestrel": {
    "Endpoints": {
      "Http": {
        "Url": "http://localhost:9000"  ← Cambia porta
      }
    }
  }
}
```

Non dimenticare di aggiornare `.env` frontend!

### Tema Mobile

`mobile/src/config/theme.js`:

```javascript
export const theme = {
  colors: {
    primary: '#7c3aed',     // ← Cambia colore primario
    secondary: '#3b82f6',   // ← Colore secondario
  }
};
```

---

## 🐛 Troubleshooting Veloce

### ❌ "Cannot connect to server"

```bash
# 1. Backend sta girando?
curl http://localhost:8080
# Dovresti vedere: {"service":"PieraChat Secure WebSocket Server"...}

# 2. Porta corretta?
grep VITE_WEBSOCKET_URL frontend/.env
# Deve essere: VITE_WEBSOCKET_URL=ws://localhost:8080/ws

# 3. Firewall?
# Windows: Firewall → Consenti app → Aggiungi dotnet.exe
# Mac: System Preferences → Security → Firewall → Allow dotnet
# Linux: sudo ufw allow 8080
```

### ❌ "Mobile app can't connect"

```bash
# 1. Stesso WiFi?
# Computer e smartphone DEVONO essere sulla stessa rete WiFi!

# 2. IP corretto?
# mobile/src/config/constants.js deve avere IP del computer, NON localhost!

# Android emulator:
export const WEBSOCKET_URL = 'ws://10.0.2.2:8080/ws';

# Dispositivo fisico (trova con ipconfig/ifconfig):
export const WEBSOCKET_URL = 'ws://192.168.1.XXX:8080/ws';

# 3. Backend raggiungibile?
# Dal telefono, apri browser e vai su http://192.168.1.XXX:8080
# Dovresti vedere la risposta JSON del server
```

### ❌ "Encryption not working"

```bash
# 1. Browser moderno?
# Chrome 90+, Firefox 88+, Safari 14+
# Web Crypto API non disponibile su browser vecchi!

# 2. HTTPS in produzione
# Web Crypto richiede HTTPS in produzione (ok http:// in localhost)

# 3. Check console errors
# F12 → Console → Cerca errori tipo "SubtleCrypto"
```

### ❌ NPM install fails

```bash
# Pulisci e reinstalla
rm -rf node_modules package-lock.json
npm install

# Se persiste, usa npm legacy peer deps:
npm install --legacy-peer-deps
```

---

## 📊 Architettura Visuale

### Flusso Completo di un Messaggio

```
┌─────────┐                    ┌─────────┐                    ┌─────────┐
│ Alice   │                    │ Server  │                    │  Bob    │
│ (Web)   │                    │ (.NET)  │                    │ (Mobile)│
└────┬────┘                    └────┬────┘                    └────┬────┘
     │                              │                              │
     │ 1. Alice scrive              │                              │
     │    "Ciao Bob!"               │                              │
     │                              │                              │
     │ 2. Genera chiave AES random  │                              │
     │    (256-bit)                 │                              │
     │                              │                              │
     │ 3. Cripta "Ciao Bob!"        │                              │
     │    con AES-GCM               │                              │
     │    → blob crittografato      │                              │
     │                              │                              │
     │ 4. Cripta chiave AES con     │                              │
     │    RSA pubblica di Bob       │                              │
     │    → chiave crittata         │                              │
     │                              │                              │
     │ 5. Invia pacchetto:          │                              │
     ├──────────────────────────────>│                              │
     │    {                         │                              │
     │      encryptedMessage,       │                              │
     │      iv,                     │                              │
     │      encryptedKeys: {        │                              │
     │        Bob: "xxx",           │                              │
     │        Alice: "yyy"          │                              │
     │      }                       │                              │
     │    }                         │                              │
     │                              │                              │
     │                              │ 6. Server RELAY (non legge!) │
     │                              ├──────────────────────────────>│
     │                              │                              │
     │                              │            7. Bob riceve     │
     │                              │               pacchetto      │
     │                              │                              │
     │                              │            8. Estrae chiave  │
     │                              │               encryptedKeys.Bob
     │                              │                              │
     │                              │            9. Decripta AES   │
     │                              │               con RSA privata │
     │                              │                              │
     │                              │            10. Decripta msg  │
     │                              │                con AES + IV  │
     │                              │                              │
     │                              │            11. Legge: "Ciao Bob!"
     │                              │                              │
```

**🔐 Il server NON può mai leggere "Ciao Bob!" - Solo Alice e Bob possono!**

---

## 🚀 Build per Produzione - 3 Comandi

### Backend

```bash
cd backend/PieraServer
dotnet publish -c Release -o ./publish
./publish/PieraServer
```

### Frontend Web

```bash
cd frontend
npm run build
# Deploy cartella dist/ su Vercel/Netlify/Firebase
```

### Mobile Android APK

```bash
cd mobile
npm install -g eas-cli
eas build --platform android --profile preview
# Download APK dal link fornito
```

**🎉 Production Ready!**

---

## 📚 Prossimi Passi

Dopo il Quick Start:

1. **Leggi la documentazione completa**:
   - [README.md](../README.md) - Overview generale
   - [ARCHITECTURE.md](ARCHITECTURE.md) - Architettura dettagliata
   - [SECURITY.md](SECURITY.md) - Sicurezza e crittografia

2. **Esplora il codice**:
   - `frontend/src/utils/encryption.js` - Come funziona E2EE
   - `backend/PieraServer/Program.cs` - Server WebSocket
   - `mobile/src/screens/ChatScreen.js` - UI mobile

3. **Contribuisci**:
   - Apri issue per bug/feature requests
   - Migliora la documentazione
   - Aggiungi nuove funzionalità

4. **Deployment**:
   - Setup HTTPS con Let's Encrypt
   - Deploy su VPS (DigitalOcean, AWS, Azure)
   - Pubblica app su Play Store / App Store

---

## 🆘 Aiuto

- **Issues**: https://github.com/piera23/PieraChat/issues
- **Discussions**: https://github.com/piera23/PieraChat/discussions
- **Email**: support@pierachat.example.com

---

<div align="center">

**✅ Tutto Chiaro?**

Se hai seguito questa guida, dovresti ora avere:
- ✅ Backend WebSocket running
- ✅ Frontend web funzionante
- ✅ App mobile (opzionale)
- ✅ Messaggi crittografati E2E

**Happy Chatting! 🔐💬**

</div>

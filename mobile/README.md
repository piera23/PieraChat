# 📱 PieraChat Mobile

App mobile React Native con Expo per chat crittografata end-to-end.

## 🚀 Caratteristiche

- ✅ **Cross-platform**: Android, iOS e Web da un unico codebase
- 🔐 **Crittografia E2E**: Messaggi crittografati end-to-end
- 📱 **UI Nativa**: React Native Paper per design Material
- 🔄 **Real-time**: WebSocket per comunicazione istantanea
- 🎨 **Design moderno**: Gradient, animazioni e UX curata
- 📦 **Build facile**: Expo per build semplificati

## 📋 Prerequisiti

- [Node.js](https://nodejs.org/) >= 18
- [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo-cli`
- [EAS CLI](https://docs.expo.dev/build/setup/) per build production: `npm install -g eas-cli`

### Per sviluppo mobile:
- **Android**: [Android Studio](https://developer.android.com/studio) o dispositivo fisico con [Expo Go](https://expo.dev/client)
- **iOS**: [Xcode](https://developer.apple.com/xcode/) (solo macOS) o dispositivo con Expo Go

## 🛠️ Installazione

```bash
cd mobile
npm install
```

## 🏃 Avvio in Sviluppo

### Avvio generale (mostra QR code per tutte le piattaforme)
```bash
npm start
```

### Avvio specifico per piattaforma
```bash
# Android
npm run android

# iOS (richiede macOS)
npm run ios

# Web
npm run web
```

### 📱 Test su dispositivo fisico

1. Installa [Expo Go](https://expo.dev/client) sul tuo smartphone
2. Esegui `npm start`
3. Scansiona il QR code con:
   - **iOS**: Fotocamera nativa
   - **Android**: App Expo Go

### ⚙️ Configurazione Server

Modifica l'URL del server in `src/config/constants.js`:

```javascript
// Per emulatore Android
export const WEBSOCKET_URL = 'ws://10.0.2.2:8080/ws';

// Per dispositivo fisico (usa l'IP del tuo computer)
export const WEBSOCKET_URL = 'ws://192.168.1.XXX:8080/ws';

// Per produzione
export const WEBSOCKET_URL = 'wss://your-domain.com/ws';
```

**Come trovare il tuo IP locale:**
- **Windows**: `ipconfig` → cerca "IPv4 Address"
- **Mac/Linux**: `ifconfig` o `ip addr` → cerca inet

## 📦 Build per Produzione

### Setup iniziale EAS

```bash
# Login a Expo
eas login

# Configura progetto
eas build:configure
```

### Build Android (APK)

```bash
# Build APK per test
npm run preview:android

# Build production
npm run build:android
```

Il file APK sarà scaricabile dal link fornito da EAS.

### Build iOS (IPA)

```bash
# Build iOS (richiede account Apple Developer)
npm run build:ios
```

### Build per Web (PWA)

```bash
# Build ottimizzato per web
npm run web

# Build production
expo build:web
```

I file saranno in `web-build/` e possono essere deployati su qualsiasi hosting statico.

## 📤 Distribuzione

### Android (Google Play Store)

1. Build production APK/AAB
2. Crea account [Google Play Developer](https://play.google.com/console)
3. Upload tramite console o EAS:
```bash
npm run submit:android
```

### iOS (App Store)

1. Iscrizione [Apple Developer Program](https://developer.apple.com/programs/) ($99/anno)
2. Build production IPA
3. Upload:
```bash
npm run submit:ios
```

### Web (Hosting statico)

Deploy su Vercel, Netlify, Firebase Hosting, ecc:

```bash
expo build:web
# Upload cartella web-build/
```

## 🎨 Struttura Progetto

```
mobile/
├── App.js                      # Entry point
├── src/
│   ├── screens/                # Schermate
│   │   ├── LoginScreen.js      # Login
│   │   └── ChatScreen.js       # Chat principale
│   ├── components/             # Componenti riutilizzabili
│   │   ├── MessageItem.js      # Singolo messaggio
│   │   └── TypingIndicator.js  # Indicatore digitazione
│   ├── hooks/                  # Custom hooks
│   │   └── useMobilePieraServer.js  # WebSocket hook
│   ├── utils/                  # Utilities
│   │   └── encryption.js       # Crittografia mobile
│   └── config/                 # Configurazione
│       ├── constants.js        # Costanti
│       └── theme.js            # Tema app
├── assets/                     # Immagini, icone
├── app.json                    # Config Expo
├── eas.json                    # Config EAS Build
└── package.json
```

## 🔧 Troubleshooting

### L'app non si connette al server

1. **Verifica che il backend sia avviato**:
   ```bash
   cd ../backend/PieraServer
   dotnet run
   ```

2. **Controlla l'URL WebSocket** in `src/config/constants.js`

3. **Su emulatore Android**, usa `10.0.2.2` invece di `localhost`

4. **Su dispositivo fisico**, usa l'IP locale del computer (stesso WiFi!)

### Errori di build

```bash
# Pulisci cache
expo start -c

# Reinstalla dipendenze
rm -rf node_modules
npm install
```

### Problemi con Expo Go

- Assicurati di usare la stessa versione SDK di Expo
- Aggiorna Expo Go app all'ultima versione
- Verifica che smartphone e computer siano sulla stessa rete WiFi

## 📱 Screenshot e Demo

### Android APK
Scarica l'APK direttamente dopo il build con:
```bash
npm run preview:android
```

### iOS TestFlight
Per distribuzione beta iOS via TestFlight, usa:
```bash
eas build --platform ios --profile preview
eas submit --platform ios
```

## 🆘 Supporto

- [Documentazione Expo](https://docs.expo.dev/)
- [React Native Paper Docs](https://callstack.github.io/react-native-paper/)
- [EAS Build Docs](https://docs.expo.dev/build/introduction/)

## 📄 Licenza

MIT © PieraChat Team

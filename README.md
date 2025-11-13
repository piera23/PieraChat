# PieraChat - WebSocket Chat Application

Una moderna applicazione di chat in tempo reale costruita con React (frontend) e .NET 8 (backend) utilizzando WebSocket per la comunicazione real-time.

## 🚀 Caratteristiche

- **Chat in tempo reale** con WebSocket
- **Indicatore di digitazione** per vedere quando altri utenti stanno scrivendo
- **Lista utenti online** con aggiornamenti live
- **Riconnessione automatica** con exponential backoff
- **UI responsive** con design moderno (Tailwind CSS)
- **Notifiche di sistema** per entrate/uscite degli utenti
- **Validazione input** lato client e server
- **Gestione errori robusta**

## 📋 Prerequisiti

### Backend
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) o superiore

### Frontend
- [Node.js](https://nodejs.org/) (versione 18 o superiore)
- npm o yarn

## 🛠️ Installazione

### 1. Clona il repository
```bash
git clone <url-repository>
cd PieraChat
```

### 2. Setup Backend

```bash
cd backend/PieraServer
dotnet restore
dotnet build
```

### 3. Setup Frontend

```bash
cd frontend
npm install
```

## 🏃 Avvio dell'applicazione

### Avvio rapido (due terminali)

**Terminal 1 - Backend:**
```bash
cd backend/PieraServer
dotnet run
```
Il server sarà disponibile su `http://localhost:8080`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
L'applicazione sarà disponibile su `http://localhost:3000`

### Script automatici

**Windows (PowerShell):**
```powershell
# Consulta scriptWindows.txt per lo script completo
```

**Mac/Linux (Bash):**
```bash
# Consulta scriptMAC_Linux.txt per lo script completo
```

## 📁 Struttura del Progetto

```
PieraChat/
├── backend/
│   └── PieraServer/
│       ├── Program.cs              # WebSocket server principale
│       ├── PieraServer.csproj      # Configurazione progetto .NET
│       ├── appsettings.json        # Configurazione applicazione
│       └── Properties/
│           └── launchSettings.json
├── frontend/
│   ├── src/
│   │   ├── components/             # Componenti React
│   │   │   ├── ChatRoom.jsx        # Container principale
│   │   │   ├── LoginScreen.jsx     # Schermata di login
│   │   │   ├── MessageInput.jsx    # Input messaggi
│   │   │   ├── MessageList.jsx     # Lista messaggi
│   │   │   └── UserList.jsx        # Lista utenti online
│   │   ├── hooks/
│   │   │   └── usePieraServer.js   # Hook WebSocket personalizzato
│   │   ├── utils/
│   │   │   └── constants.js        # Costanti applicazione
│   │   ├── App.js                  # Componente root
│   │   ├── index.js                # Entry point
│   │   ├── App.css                 # Stili animazioni
│   │   └── index.css               # Stili Tailwind
│   ├── public/
│   │   ├── index.html              # HTML template
│   │   └── manifest.json           # PWA manifest
│   ├── package.json
│   ├── vite.config.js              # Configurazione Vite
│   ├── tailwind.config.js          # Configurazione Tailwind
│   └── .env                        # Variabili ambiente (dev)
└── README.md
```

## 🔧 Configurazione

### Variabili d'ambiente Frontend

Crea un file `.env` nella cartella `frontend`:

```env
VITE_WEBSOCKET_URL=ws://localhost:8080/ws
```

Per produzione, crea `.env.production`:

```env
VITE_WEBSOCKET_URL=wss://your-domain.com/ws
```

### Configurazione Backend

Il file `appsettings.json` contiene la configurazione del server:

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

## 🏗️ Build per Produzione

### Frontend
```bash
cd frontend
npm run build
```
I file di produzione saranno nella cartella `frontend/dist`

### Backend
```bash
cd backend/PieraServer
dotnet publish -c Release -o ./publish
```
I file di produzione saranno in `backend/PieraServer/publish`

## 🧪 Testing

### Health Check
Il backend espone un endpoint di health check:
```
GET http://localhost:8080/health
```

### Informazioni Server
```
GET http://localhost:8080/
```

## 📡 Protocollo WebSocket

### Messaggi Client → Server

**Join:**
```json
{
  "type": "join",
  "username": "Mario"
}
```

**Message:**
```json
{
  "type": "message",
  "message": "Ciao a tutti!"
}
```

**Typing:**
```json
{
  "type": "typing"
}
```

**Stop Typing:**
```json
{
  "type": "stopTyping"
}
```

### Messaggi Server → Client

**Users List:**
```json
{
  "type": "users",
  "users": ["Mario", "Luigi", "Peach"]
}
```

**Message:**
```json
{
  "type": "message",
  "username": "Mario",
  "message": "Ciao!",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**Join/Leave:**
```json
{
  "type": "join",
  "username": "Mario",
  "users": ["Mario", "Luigi"]
}
```

## 🔒 Sicurezza

- Validazione input lato client e server
- Sanitizzazione messaggi
- Limite lunghezza messaggi (1000 caratteri)
- CORS configurabile
- Rate limiting (da implementare in produzione)

## 🐛 Risoluzione Problemi

### Il frontend non si connette al backend
- Verifica che il backend sia in esecuzione su `localhost:8080`
- Controlla il file `.env` con l'URL WebSocket corretto
- Verifica che non ci siano firewall che bloccano la porta 8080

### Errori di build del backend
- Assicurati di avere .NET 8 SDK installato: `dotnet --version`
- Esegui `dotnet clean` seguito da `dotnet restore`

### Errori di build del frontend
- Elimina `node_modules` e `package-lock.json`, poi esegui `npm install`
- Verifica la versione di Node.js: `node --version` (richiesto >= 18)

## 📝 TODO / Miglioramenti Futuri

- [ ] Autenticazione utenti
- [ ] Persistenza messaggi (database)
- [ ] Stanze/Canali multipli
- [ ] Invio file/immagini
- [ ] Emoji picker
- [ ] Notifiche push
- [ ] Messaggi privati
- [ ] Rate limiting
- [ ] Cifratura end-to-end

## 🤝 Contributi

Le pull request sono benvenute! Per modifiche importanti, apri prima una issue per discutere cosa vorresti cambiare.

## 📄 Licenza

[MIT](https://choosealicense.com/licenses/mit/)

## 👥 Autori

- PieraChat Team

## 🙏 Ringraziamenti

- React e il team di React
- Il team di .NET
- Lucide React per le icone
- Tailwind CSS per il framework CSS

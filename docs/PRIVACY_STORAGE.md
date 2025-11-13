# 💾 Privacy-First Local Storage - PieraChat

## Panoramica

PieraChat v2.0 implementa un sistema di storage **completamente locale** dove tutti i messaggi vengono salvati esclusivamente sul dispositivo dell'utente. Il server funge **solo da relay** per la comunicazione in tempo reale e **non memorizza mai** alcun messaggio.

```
┌─────────────────────────────────────────────────────────┐
│              PRIVACY-FIRST ARCHITECTURE                  │
└─────────────────────────────────────────────────────────┘

┌──────────────┐                              ┌──────────────┐
│   Client A   │                              │   Client B   │
│              │                              │              │
│ ┌──────────┐ │                              │ ┌──────────┐ │
│ │ Messages │ │                              │ │ Messages │ │
│ │  Local   │ │         ┌──────────┐         │ │  Local   │ │
│ │ Storage  │ │◄───────►│  Server  │◄───────►│ │ Storage  │ │
│ │ (Device) │ │         │  (Relay  │         │ │ (Device) │ │
│ └──────────┘ │         │   Only)  │         │ └──────────┘ │
│              │         └──────────┘         │              │
│  💾 Saved    │                              │  💾 Saved    │
│  Locally     │         NO STORAGE           │  Locally     │
└──────────────┘                              └──────────────┘
```

## Principi di Design

### 1. **Zero Server Storage**
- Il server **NON** ha database
- Il server **NON** salva messaggi su disco
- Il server **NON** mantiene cronologia
- Il server relay solo messaggi in real-time

### 2. **Device-Only Storage**
- Ogni utente ha i propri messaggi sul proprio dispositivo
- I messaggi non lasciano mai il dispositivo (tranne export volontario)
- Controllo completo dell'utente sui propri dati

### 3. **Privacy by Design**
- Nessun backup cloud automatico
- Nessun tracking o analytics
- Nessun metadata permanente sul server
- Crittografia E2E + storage locale = massima privacy

## Implementazioni

### 🌐 Web App - IndexedDB

#### Tecnologia
- **API**: IndexedDB (browser native)
- **Libreria**: Native browser API (no dependencies)
- **Database**: `PieraChatDB` v2
- **Stores**: `messages`, `users`, `settings`

#### Schema Database

```javascript
Database: PieraChatDB (version 2)

Store: messages
  - keyPath: 'id'
  - indexes:
    • username (non-unique)
    • timestamp (non-unique)

Store: users
  - keyPath: 'username'
  - indexes:
    • lastSeen (non-unique)

Store: settings
  - keyPath: 'key'
```

#### Storage Manager

```javascript
// frontend/src/utils/localStorage.js

class LocalStorageManager {
  // Inizializza IndexedDB
  async init() {
    // Crea database e stores
  }

  // Salva messaggio
  async saveMessage(message) {
    // Aggiunge/aggiorna messaggio in IndexedDB
    // Ritorna messageData salvato
  }

  // Carica messaggi
  async loadMessages(limit = 100) {
    // Carica gli ultimi N messaggi
    // Ordinati per timestamp (più recenti prima)
  }

  // Esporta JSON
  async exportMessages() {
    return {
      version: '2.0',
      platform: 'web',
      exportDate: new Date().toISOString(),
      messageCount: messages.length,
      messages: messages
    };
  }

  // Download file JSON
  async downloadExport() {
    // Crea Blob e download automatico
  }

  // Download file TXT
  async downloadTextExport() {
    // Formatta come testo leggibile
  }

  // Cancella cronologia
  async clearMessages() {
    // Rimuove tutti i messaggi
  }

  // Statistiche storage
  async getStats() {
    // Ritorna messageCount, storageUsedMB
  }
}
```

#### Integrazione Hook

```javascript
// frontend/src/hooks/useSecurePieraServer.js

export const useSecurePieraServer = (username) => {
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const localStorage = useRef(null);

  // 1. INIT: Carica cronologia all'avvio
  useEffect(() => {
    const initStorage = async () => {
      localStorage.current = getLocalStorage();
      await localStorage.current.init();

      const savedMessages = await localStorage.current.loadMessages();
      if (savedMessages.length > 0) {
        setMessages(savedMessages);
        setHistoryLoaded(true);
      }
    };
    initStorage();
  }, []);

  // 2. SAVE: Salva ogni nuovo messaggio
  const handleMessage = useCallback(async (data) => {
    // ... processa messaggio ...

    if (localStorage.current) {
      await localStorage.current.saveMessage(newMessage);
      console.log('💾 Message saved locally on your device');
    }
  }, []);

  // 3. EXPORT/CLEAR: Funzioni esposte
  return {
    messages,
    historyLoaded,
    clearHistory: async () => {
      await localStorage.current.clearMessages();
    },
    exportChat: async () => {
      await localStorage.current.downloadExport();
    }
  };
};
```

### 📱 Mobile App - AsyncStorage

#### Tecnologia
- **API**: AsyncStorage (React Native)
- **Libreria**: `@react-native-async-storage/async-storage`
- **Export**: Expo FileSystem + Sharing
- **Storage**: Native device storage (iOS Keychain / Android SharedPreferences)

#### Keys

```javascript
const MESSAGES_KEY = '@PieraChat:messages';
const USERS_KEY = '@PieraChat:users';
const SETTINGS_KEY = '@PieraChat:settings';
```

#### Storage Manager

```javascript
// mobile/src/utils/mobileStorage.js

class MobileStorageManager {
  // Inizializza storage (sempre pronto)
  async init() {
    this.isReady = true;
  }

  // Salva messaggio
  async saveMessage(message) {
    const messages = await this.loadMessages();
    messages.push(messageData);
    await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  }

  // Carica messaggi
  async loadMessages(limit = 1000) {
    const data = await AsyncStorage.getItem(MESSAGES_KEY);
    if (!data) return [];
    return JSON.parse(data);
  }

  // Esporta JSON con condivisione
  async exportToFile() {
    const data = await this.exportMessages();
    const fileUri = FileSystem.documentDirectory + filename;

    await FileSystem.writeAsStringAsync(
      fileUri,
      JSON.stringify(data, null, 2)
    );

    // Condividi file tramite OS
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: 'Esporta Cronologia PieraChat'
    });
  }

  // Esporta TXT con condivisione
  async exportToTextFile() {
    // Formatta come testo e condividi
  }

  // Cancella cronologia
  async clearMessages() {
    await AsyncStorage.removeItem(MESSAGES_KEY);
  }

  // Statistiche storage
  async getStats() {
    return {
      messageCount: messages.length,
      storageUsedKB: (storageSize / 1024).toFixed(2)
    };
  }
}
```

#### Integrazione Hook

```javascript
// mobile/src/hooks/useMobilePieraServer.js

export const useMobilePieraServer = (username) => {
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const localStorage = useRef(null);

  // 1. INIT: Carica cronologia
  useEffect(() => {
    const initStorage = async () => {
      localStorage.current = getMobileStorage();
      await localStorage.current.init();

      const savedMessages = await localStorage.current.loadMessages();
      if (savedMessages.length > 0) {
        setMessages(savedMessages);
        setHistoryLoaded(true);
      }
    };
    initStorage();
  }, []);

  // 2. SAVE: Auto-save messaggi
  const handleMessage = useCallback(async (data) => {
    // ... processa messaggio ...

    if (localStorage.current) {
      await localStorage.current.saveMessage(newMessage);
      console.log('💾 Message saved locally on your device');
    }
  }, []);

  // 3. EXPORT/CLEAR: Funzioni esposte
  return {
    messages,
    historyLoaded,
    clearHistory,
    exportChat,
    exportChatText,
    getStorageStats
  };
};
```

## UI Components

### 🌐 Web - HistoryMenu.jsx

```javascript
// frontend/src/components/HistoryMenu.jsx

export default function HistoryMenu({
  onExportJSON,
  onExportText,
  onClearHistory,
  messageCount
}) {
  return (
    <div className="history-menu">
      <h3>📱 Cronologia Locale</h3>

      {/* Privacy Banner */}
      <div className="privacy-banner">
        💾 Privacy-First: {messageCount} messaggi salvati solo sul tuo
        dispositivo. Il server non memorizza nulla!
      </div>

      {/* Export Buttons */}
      <button onClick={onExportJSON}>
        📄 Esporta JSON
      </button>
      <button onClick={onExportText}>
        📝 Esporta TXT
      </button>

      {/* Clear History */}
      <button onClick={onClearHistory} className="danger">
        🗑️ Cancella Cronologia
      </button>
    </div>
  );
}
```

### 📱 Mobile - HistoryMenu.js

```javascript
// mobile/src/components/HistoryMenu.js

export default function HistoryMenu({
  visible,
  onDismiss,
  onExportJSON,
  onExportText,
  onClearHistory,
  messageCount,
  storageStats
}) {
  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss}>
        <Surface>
          <Text variant="titleLarge">📱 Cronologia Locale</Text>

          {/* Privacy Banner */}
          <Surface style={styles.privacyBanner}>
            <Text>
              🔒 Privacy-First: {messageCount} messaggi salvati solo sul tuo
              dispositivo. Il server non memorizza nulla!
            </Text>
          </Surface>

          {/* Storage Stats */}
          <Text>📊 Statistiche: {storageStats.storageUsedKB} KB</Text>

          {/* Export Buttons */}
          <Button icon="file-code" onPress={onExportJSON}>
            Esporta JSON
          </Button>
          <Button icon="file-document" onPress={onExportText}>
            Esporta TXT
          </Button>

          {/* Clear History */}
          <Button icon="delete" onPress={onClearHistory}>
            Cancella Cronologia
          </Button>
        </Surface>
      </Modal>
    </Portal>
  );
}
```

## Formati Export

### JSON Format

```json
{
  "version": "2.0",
  "platform": "web",
  "exportDate": "2024-01-15T14:30:00.000Z",
  "messageCount": 42,
  "messages": [
    {
      "id": "msg-1705329000000-1-abc123",
      "type": "message",
      "username": "Alice",
      "message": "Hello Bob!",
      "timestamp": "2024-01-15T14:30:00.000Z",
      "isOwn": true,
      "encrypted": true
    },
    {
      "id": "msg-1705329001000-2-def456",
      "type": "system",
      "message": "Bob è entrato nella chat"
    }
  ]
}
```

### Text Format

```
=== PieraChat History Export ===
Exported: 15/01/2024, 14:30:00
Total Messages: 42
========================================

[15/01/2024, 14:30:00] Alice: Hello Bob!
[SYSTEM] Bob è entrato nella chat
[15/01/2024, 14:30:05] Bob: Hi Alice!
[15/01/2024, 14:30:10] Alice: How are you?
...
```

## Flusso Completo

### 1. Primo Accesso (No History)

```
User opens app
    ↓
localStorage.init()
    ↓
loadMessages() → [] (empty)
    ↓
historyLoaded = false
    ↓
User sends message
    ↓
saveMessage() → IndexedDB/AsyncStorage
    ↓
Message stored locally ✅
```

### 2. Accesso Successivo (With History)

```
User opens app
    ↓
localStorage.init()
    ↓
loadMessages() → [msg1, msg2, ...]
    ↓
setMessages([...]) → UI shows history
    ↓
historyLoaded = true
    ↓
"📦 Loaded 42 messages from local storage"
```

### 3. Nuovo Messaggio (Real-time + Save)

```
Server broadcasts message
    ↓
handleMessage(data)
    ↓
newMessage = { ... }
    ↓
setMessages(prev => [...prev, newMessage])  (UI update)
    ↓
localStorage.saveMessage(newMessage)        (Persist)
    ↓
"💾 Message saved locally on your device"
```

### 4. Export Cronologia

```
User clicks "Esporta JSON"
    ↓
exportMessages()
    ↓
loadMessages(Infinity) → all messages
    ↓
createExportData() → JSON object
    ↓
WEB: downloadExport() → Blob download
MOBILE: exportToFile() → Share dialog
    ↓
"💾 Chat history exported"
```

### 5. Clear Cronologia

```
User clicks "Cancella Cronologia"
    ↓
Show confirmation dialog
    ↓
User confirms
    ↓
clearMessages()
    ↓
WEB: clear IndexedDB store
MOBILE: AsyncStorage.removeItem()
    ↓
setMessages([])
setHistoryLoaded(false)
    ↓
"🗑️ All messages cleared from device"
```

## Vantaggi Privacy

### ✅ Massima Privacy
1. **Nessun server storage** - Il server non può leggere cronologia
2. **Controllo utente** - L'utente decide quando cancellare
3. **No cloud backup** - Dati non sincronizzati automaticamente
4. **Export portabile** - Utente può esportare e migrare dati

### ✅ Compliance GDPR
1. **Data Minimization** - Solo messaggi necessari
2. **Right to Erasure** - Clear history immediato
3. **Data Portability** - Export JSON/TXT
4. **Privacy by Design** - Storage locale fin dall'inizio

### ✅ Sicurezza
1. **E2EE** - Messaggi crittografati in transito
2. **Local storage** - Messaggi solo su device
3. **No metadata leak** - Server non ha cronologia
4. **User control** - Utente gestisce i propri dati

## Limitazioni

### ⚠️ Storage Limits

**Web (IndexedDB):**
- Limite: ~50% dello spazio disco disponibile
- Tipico: 50MB - 100MB per dominio
- Pulizia automatica browser se spazio limitato

**Mobile (AsyncStorage):**
- Android: Illimitato (storage device)
- iOS: ~6MB (può aumentare)
- Gestito da OS (può essere ripulito)

### ⚠️ Sincronizzazione

- **NO sync tra dispositivi** - Design intenzionale
- Ogni dispositivo ha la propria cronologia
- Export/Import manuale se necessario

### ⚠️ Backup

- **NO backup automatico** - Privacy-first
- Utente deve fare export manuale
- Perdita device = perdita cronologia

## Best Practices

### Per Utenti

1. **Export regolare** - Backup cronologia importante
2. **Clear periodico** - Libera spazio su device
3. **Multi-device** - Ricorda che cronologia è locale
4. **Privacy consapevole** - Export condivide messaggi

### Per Sviluppatori

1. **NO logging messaggi** - Mai loggare contenuto
2. **Graceful degradation** - App funziona senza storage
3. **Error handling** - Gestisci quota exceeded
4. **User notification** - Avvisa quando storage pieno

## Troubleshooting

### Web: "QuotaExceededError"

```javascript
try {
  await localStorage.saveMessage(message);
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    alert('Storage pieno! Esporta e cancella cronologia vecchia.');
  }
}
```

### Mobile: "Storage full"

```javascript
try {
  await AsyncStorage.setItem(key, value);
} catch (error) {
  if (error.message.includes('quota')) {
    Alert.alert(
      'Storage Pieno',
      'Esporta e cancella messaggi per liberare spazio'
    );
  }
}
```

### Corruzione Dati

**Web:**
```javascript
// Clear corrupted IndexedDB
indexedDB.deleteDatabase('PieraChatDB');
// Refresh page to reinit
```

**Mobile:**
```javascript
// Clear corrupted AsyncStorage
await AsyncStorage.clear();
// Restart app
```

## Future Improvements

### Possibili Enhancements

1. **Selective Storage** - Salva solo messaggi importanti
2. **Auto-cleanup** - Rimuovi messaggi vecchi di X giorni
3. **Compression** - Comprimi JSON per risparmiare spazio
4. **Cloud Sync (Opt-in)** - Sync crittografato su storage utente
5. **Encrypted Backup** - Export crittografato con password
6. **Import History** - Importa da file JSON

## Conclusione

Il sistema di storage locale di PieraChat garantisce:

- ✅ **Privacy assoluta** - Messaggi solo su device utente
- ✅ **Zero server storage** - Server è solo relay
- ✅ **Controllo utente** - Export/clear quando vuoi
- ✅ **GDPR compliant** - Privacy by design
- ✅ **Multi-platform** - Web e Mobile consistenti

**Il tuo dispositivo, i tuoi dati, il tuo controllo.**

---

**Ultimo aggiornamento**: 2024-01-15
**Versione**: 2.0.0
**Maintainer**: PieraChat Team

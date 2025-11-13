/**
 * History Menu Component - Mobile
 * Manages local chat history with export/clear functionality
 * Privacy-First: All data stored locally on user's device
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Portal,
  Modal,
  Surface,
  Text,
  Button,
  Divider,
  IconButton
} from 'react-native-paper';

export default function HistoryMenu({
  visible,
  onDismiss,
  onExportJSON,
  onExportText,
  onClearHistory,
  messageCount = 0,
  storageStats = null
}) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportJSON = async () => {
    try {
      setIsExporting(true);
      await onExportJSON();
      Alert.alert(
        'Esportazione Completata',
        'Cronologia esportata in formato JSON',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Errore', 'Errore durante l\'esportazione');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportText = async () => {
    try {
      setIsExporting(true);
      await onExportText();
      Alert.alert(
        'Esportazione Completata',
        'Cronologia esportata in formato testo',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Errore', 'Errore durante l\'esportazione');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Conferma Eliminazione',
      `Sei sicuro di voler cancellare ${messageCount} messaggi dalla cronologia locale?\n\nQuesta azione è irreversibile.`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              await onClearHistory();
              Alert.alert(
                'Cronologia Eliminata',
                'Tutti i messaggi sono stati rimossi dal dispositivo',
                [{ text: 'OK', onPress: onDismiss }]
              );
            } catch (error) {
              Alert.alert('Errore', 'Errore durante l\'eliminazione');
            }
          }
        }
      ]
    );
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <Surface style={styles.surface}>
          <View style={styles.header}>
            <View>
              <Text variant="titleLarge" style={styles.title}>
                📱 Cronologia Locale
              </Text>
              <Text variant="bodySmall" style={styles.subtitle}>
                Privacy-First Storage
              </Text>
            </View>
            <IconButton
              icon="close"
              size={24}
              onPress={onDismiss}
            />
          </View>

          <Divider />

          <ScrollView style={styles.content}>
            {/* Privacy Banner */}
            <Surface style={styles.privacyBanner}>
              <Text style={styles.privacyIcon}>🔒</Text>
              <Text variant="bodyMedium" style={styles.privacyText}>
                <Text style={styles.bold}>Privacy-First:</Text> {messageCount} messaggi
                salvati solo sul tuo dispositivo.{'\n'}
                <Text style={styles.bold}>Il server non memorizza nulla!</Text>
              </Text>
            </Surface>

            {/* Storage Stats */}
            {storageStats && (
              <Surface style={styles.statsCard}>
                <Text variant="titleSmall" style={styles.statsTitle}>
                  📊 Statistiche Storage
                </Text>
                <View style={styles.statsRow}>
                  <Text variant="bodyMedium">Messaggi:</Text>
                  <Text variant="bodyMedium" style={styles.bold}>
                    {storageStats.messageCount}
                  </Text>
                </View>
                {storageStats.storageUsedKB && (
                  <View style={styles.statsRow}>
                    <Text variant="bodyMedium">Spazio usato:</Text>
                    <Text variant="bodyMedium" style={styles.bold}>
                      {storageStats.storageUsedKB} KB
                    </Text>
                  </View>
                )}
              </Surface>
            )}

            {/* Export Section */}
            <Text variant="titleMedium" style={styles.sectionTitle}>
              💾 Esporta Cronologia
            </Text>

            <Button
              mode="contained"
              icon="file-code"
              onPress={handleExportJSON}
              disabled={isExporting || messageCount === 0}
              style={styles.button}
            >
              Esporta JSON
            </Button>

            <Text variant="bodySmall" style={styles.buttonDescription}>
              Formato JSON per backup completo con metadata
            </Text>

            <Button
              mode="contained"
              icon="file-document"
              onPress={handleExportText}
              disabled={isExporting || messageCount === 0}
              style={styles.button}
            >
              Esporta TXT
            </Button>

            <Text variant="bodySmall" style={styles.buttonDescription}>
              Formato testo leggibile per condivisione
            </Text>

            <Divider style={styles.divider} />

            {/* Clear Section */}
            <Text variant="titleMedium" style={styles.sectionTitle}>
              🗑️ Gestione Dati
            </Text>

            <Button
              mode="outlined"
              icon="delete"
              onPress={handleClearHistory}
              disabled={messageCount === 0}
              style={styles.dangerButton}
              textColor="#d32f2f"
            >
              Cancella Cronologia
            </Button>

            <Text variant="bodySmall" style={styles.warningText}>
              ⚠️ Questa azione elimina tutti i messaggi dal dispositivo ed è
              irreversibile
            </Text>

            {/* Info Section */}
            <Surface style={styles.infoCard}>
              <Text variant="titleSmall" style={styles.infoTitle}>
                ℹ️ Come Funziona
              </Text>
              <Text variant="bodySmall" style={styles.infoText}>
                • Tutti i messaggi sono salvati localmente sul tuo dispositivo
                usando AsyncStorage{'\n'}
                • Il server PieraChat fa solo da relay - non memorizza mai
                nessun messaggio{'\n'}
                • I tuoi dati rimangono completamente privati e sotto il tuo
                controllo{'\n'}
                • Puoi esportare o cancellare la cronologia in qualsiasi momento
              </Text>
            </Surface>
          </ScrollView>
        </Surface>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  surface: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: 16,
    overflow: 'hidden'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 12
  },
  title: {
    fontWeight: 'bold'
  },
  subtitle: {
    color: '#666',
    marginTop: 4
  },
  content: {
    padding: 16
  },
  privacyBanner: {
    padding: 16,
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  privacyIcon: {
    fontSize: 24,
    marginRight: 12
  },
  privacyText: {
    flex: 1,
    color: '#1565c0'
  },
  bold: {
    fontWeight: 'bold'
  },
  statsCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#f5f5f5'
  },
  statsTitle: {
    fontWeight: 'bold',
    marginBottom: 12
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 12
  },
  button: {
    marginVertical: 6
  },
  buttonDescription: {
    color: '#666',
    marginBottom: 12,
    marginLeft: 8
  },
  divider: {
    marginVertical: 16
  },
  dangerButton: {
    marginVertical: 6,
    borderColor: '#d32f2f'
  },
  warningText: {
    color: '#d32f2f',
    marginTop: 8,
    marginLeft: 8
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: '#f9fbe7'
  },
  infoTitle: {
    fontWeight: 'bold',
    marginBottom: 8
  },
  infoText: {
    color: '#555',
    lineHeight: 20
  }
});

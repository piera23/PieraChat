import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Surface, HelperText } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../config/constants';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    const trimmed = username.trim();

    if (!trimmed) {
      setError('Inserisci un nome utente');
      return;
    }

    if (trimmed.length < 2) {
      setError('Il nome utente deve avere almeno 2 caratteri');
      return;
    }

    if (trimmed.length > 20) {
      setError('Il nome utente non può superare i 20 caratteri');
      return;
    }

    // Navigate to chat
    navigation.replace('Chat', { username: trimmed });
  };

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.secondary]}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          <Surface style={styles.iconContainer} elevation={4}>
            <MaterialCommunityIcons name="chat" size={60} color={COLORS.primary} />
          </Surface>

          <Text style={styles.title} variant="headlineLarge">
            PieraChat
          </Text>

          <Text style={styles.subtitle} variant="bodyLarge">
            Chat crittografata end-to-end
          </Text>

          <View style={styles.formContainer}>
            <Surface style={styles.formSurface} elevation={2}>
              <TextInput
                label="Nome utente"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  setError('');
                }}
                mode="outlined"
                style={styles.input}
                maxLength={20}
                autoCapitalize="none"
                autoCorrect={false}
                error={!!error}
                left={<TextInput.Icon icon="account" />}
              />

              {error && (
                <HelperText type="error" visible={!!error}>
                  {error}
                </HelperText>
              )}

              <Button
                mode="contained"
                onPress={handleLogin}
                style={styles.button}
                contentStyle={styles.buttonContent}
                icon="login"
              >
                Entra nella Chat
              </Button>

              <View style={styles.featuresContainer}>
                <View style={styles.feature}>
                  <MaterialCommunityIcons name="lock" size={16} color={COLORS.primary} />
                  <Text style={styles.featureText}>Crittografia E2E</Text>
                </View>
                <View style={styles.feature}>
                  <MaterialCommunityIcons name="lightning-bolt" size={16} color={COLORS.primary} />
                  <Text style={styles.featureText}>Tempo reale</Text>
                </View>
                <View style={styles.feature}>
                  <MaterialCommunityIcons name="shield-check" size={16} color={COLORS.primary} />
                  <Text style={styles.featureText}>Sicuro</Text>
                </View>
              </View>
            </Surface>
          </View>

          <Text style={styles.footer} variant="bodySmall">
            v2.0.0 • Secure WebSocket Chat
          </Text>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 32,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  formSurface: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'white',
  },
  input: {
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  feature: {
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  footer: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 24,
  },
});

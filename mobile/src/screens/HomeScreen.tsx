import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api } from '../services/api';

type RootStackParamList = {
  Home: undefined;
  Editor: { key: string };
};

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateKey = (value: string): boolean => {
    if (value.length < 2 || value.length > 20) {
      setError('Key must be 2-20 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9]+$/.test(value)) {
      setError('Key can only contain letters and numbers');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!key.trim()) return;
    if (!validateKey(key)) return;

    setLoading(true);
    try {
      const data = await api.validateKey(key);
      if (data.valid) {
        navigation.navigate('Editor', { key });
      } else {
        setError(data.error || 'Invalid key');
      }
    } catch {
      setError('Failed to validate key');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.generateKey();
      if (data.key) {
        setKey(data.key);
      } else {
        setError('Failed to generate key');
      }
    } catch {
      setError('Failed to generate key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>TTC</Text>
          </View>
          <Text style={styles.title}>Welcome to TTC</Text>
          <Text style={styles.subtitle}>
            Instant real-time anonymous code sharing.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={key}
              onChangeText={(text) => {
                setKey(text);
                if (error) validateKey(text);
              }}
              placeholder="enter-session-key"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <Text style={styles.helperText}>2-20 alphanumeric characters</Text>
          )}

          <TouchableOpacity
            style={[styles.button, styles.primaryButton, (!key.trim() || loading) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!key.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Start Sharing</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, loading && styles.buttonDisabled]}
            onPress={handleGenerateKey}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>Generate Random Key</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Systems Operational</Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#f1f5f9',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  helperText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#334155',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    opacity: 0.5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginRight: 8,
  },
  statusText: {
    color: '#64748b',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

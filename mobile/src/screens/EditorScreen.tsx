import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Share,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../services/api';

type RootStackParamList = {
  Home: undefined;
  Editor: { key: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Editor'>;

export default function EditorScreen({ route, navigation }: Props) {
  const { key } = route.params;
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('Never');
  const [language, setLanguage] = useState('Plain Text');
  const lastTypedAt = useRef<number>(0);
  const contentRef = useRef<string>('');

  // Auto-detect language based on content
  const detectLanguage = (code: string): string => {
    if (!code || code.length < 10) return 'Plain Text';

    if (/\bdef\s+\w+\s*\(|import\s+\w+|from\s+\w+\s+import|class\s+\w+:|print\s*\(|__name__/.test(code)) return 'Python';
    if (/:\s*(string|number|boolean|any|void|interface|type\s+\w+\s*=)|<\w+>|\bas\s+\w+/.test(code)) return 'TypeScript';
    if (/\b(const|let|var|function|=>|console\.log|require\(|export\s+(default|const)|async\s+function)\b/.test(code)) return 'JavaScript';
    if (/\bpublic\s+(class|static|void)|System\.out\.println|private\s+\w+\s+\w+|extends\s+\w+|implements\s+\w+/.test(code)) return 'Java';
    if (/#include\s*<|std::|cout\s*<<|cin\s*>>|namespace\s+\w+|int\s+main\s*\(/.test(code)) return 'C++';
    if (/^package\s+\w+|func\s+\w+\s*\(|import\s+\(|fmt\.Print/.test(code)) return 'Go';
    if (/\bfn\s+\w+|let\s+mut\s+|println!|impl\s+\w+|use\s+std::/.test(code)) return 'Rust';
    if (/^<\?php|<\?=|\$\w+\s*=|function\s+\w+\s*\(.*\)\s*{|echo\s+/.test(code)) return 'PHP';
    if (/\bdef\s+\w+|puts\s+|require\s+['"]|end\b|attr_accessor/.test(code)) return 'Ruby';
    if (/<!DOCTYPE\s+html>|<html|<body|<div|<span|<h1/.test(code)) return 'HTML';
    if (/{[\s\S]*?}|@media|@import|color:|background:|font-/.test(code) && !code.includes('const') && !code.includes('var')) return 'CSS';
    if (/^[\s\n]*[{\[]/.test(code) && /[:"\[\],]/.test(code)) return 'JSON';
    if (/^#\s+|##\s+|\[.*\]\(.*\)|- \w+|\*\*.*\*\*/m.test(code)) return 'Markdown';

    return 'Plain Text';
  };

  // Keep ref in sync
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Initial fetch
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const data = await api.getCode(key);
        if (data) {
          setContent(data.content || '');
          setLanguage(detectLanguage(data.content || ''));
          const date = new Date(data.updatedAt);
          const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          setLastUpdate(timeStr);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load code');
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [key]);

  // Auto-save on change
  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(async () => {
      const now = Date.now();
      if (now - lastTypedAt.current >= 1000 && contentRef.current) {
        setSaving(true);
        await api.updateCode(key, contentRef.current);
        setSaving(false);

        const date = new Date();
        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        setLastUpdate(timeStr);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [content, loading, key]);

  // Polling for updates
  useEffect(() => {
    const interval = setInterval(async () => {
      const data = await api.getCode(key);
      if (data && data.content !== contentRef.current) {
        setContent(data.content || '');
        setLanguage(detectLanguage(data.content || ''));
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [key]);

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(content);
    Alert.alert('Success', 'Code copied to clipboard');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this code: ${key}`,
        url: `ttc://${key}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <View style={styles.keyContainer}>
            <Text style={styles.keyText}>{key}</Text>
          </View>
          <View style={styles.languageBadge}>
             <Text style={styles.languageText}>{language}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Editor */}
      <ScrollView
        style={styles.editorContainer}
        contentContainerStyle={styles.editorContent}
      >
        <TextInput
          style={styles.textInput}
          value={content}
          onChangeText={(text) => {
            lastTypedAt.current = Date.now();
            setContent(text);
            const newLang = detectLanguage(text);
            if (newLang !== language) setLanguage(newLang);
          }}
          placeholder="// Start typing..."
          placeholderTextColor="#64748b"
          multiline
          autoCorrect={false}
          autoCapitalize="none"
          spellCheck={false}
        />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerText}>
            {saving ? 'Saving...' : `Last update: ${lastUpdate}`}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.copyButton}
          onPress={handleCopyCode}
        >
          <Text style={styles.copyButtonText}>Copy Code</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101922',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#101922',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1c2127',
    borderBottomWidth: 1,
    borderBottomColor: '#283039',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#3b82f6',
    fontSize: 16,
  },
  keyContainer: {
    backgroundColor: '#101922',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#283039',
  },
  keyText: {
    color: '#f1f5f9',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  shareButton: {
    padding: 8,
  },
  shareButtonText: {
    color: '#3b82f6',
    fontSize: 16,
  },
  editorContainer: {
    flex: 1,
    backgroundColor: '#101922',
  },
  editorContent: {
    padding: 16,
  },
  textInput: {
    color: '#abb2bf',
    fontSize: 14,
    fontFamily: 'monospace',
    lineHeight: 21,
    minHeight: 500,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#151b23',
    borderTopWidth: 1,
    borderTopColor: '#283039',
  },
  footerLeft: {
    flex: 1,
  },
  footerText: {
    color: '#9dabb9',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  copyButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  titleContainer: {
    alignItems: 'center',
  },
  languageBadge: {
    marginTop: 4,
    backgroundColor: '#334155',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  languageText: {
    color: '#94a3b8',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

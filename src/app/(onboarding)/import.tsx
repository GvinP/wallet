import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { ClipboardPaste } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { splitMnemonic, validateMnemonic } from '@/core/wallet';
import { onboardingDraft } from '@/stores';
import { Button } from '@/ui/Button';
import { mnemonicErrorText } from '@/ui/copy';
import { Header } from '@/ui/Header';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

export default function ImportScreen() {
  usePreventScreenCapture();
  const { theme } = useUnistyles();
  const [phrase, setPhrase] = useState('');
  const [error, setError] = useState<string | null>(null);

  const wordCount = splitMnemonic(phrase).length;

  const paste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setPhrase(text);
      setError(null);
    }
  };

  const submit = () => {
    const result = validateMnemonic(phrase);
    if (!result.ok) {
      setError(mnemonicErrorText(result));
      return;
    }
    onboardingDraft.start('import', result.mnemonic);
    router.push('/set-pin');
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen scroll>
        <Header
          onBack={() => {
            onboardingDraft.clear();
            if (router.canGoBack()) router.back();
            else router.replace('/welcome');
          }}
        />
        <Text variant="title">Import a wallet</Text>
        <Text color="muted" style={styles.subtitle}>
          Enter your 12 or 24-word recovery phrase, separating words with spaces.
        </Text>

        <View style={styles.inputCard(!!error)}>
          <TextInput
            value={phrase}
            onChangeText={(text) => {
              setPhrase(text);
              setError(null);
            }}
            multiline
            placeholder="word1 word2 word3 …"
            placeholderTextColor={theme.colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            autoComplete="off"
            importantForAutofill="no"
            textContentType="none"
            // Android: disables suggestions/learning for this field.
            keyboardType={Platform.OS === 'android' ? 'visible-password' : 'default'}
            accessibilityLabel="Recovery phrase"
            style={styles.input}
          />
          <View style={styles.inputFooter}>
            <Text variant="caption" color="muted">
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </Text>
            <Pressable accessibilityRole="button" onPress={paste} hitSlop={8} style={styles.paste}>
              <ClipboardPaste size={16} color={theme.colors.accentText} />
              <Text variant="label" color="accentText">
                Paste
              </Text>
            </Pressable>
          </View>
        </View>

        {error ? (
          <Text variant="small" color="dangerText" style={styles.error}>
            {error}
          </Text>
        ) : null}

        <View style={styles.footer}>
          <Button title="Continue" disabled={wordCount === 0} onPress={submit} />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create((theme) => ({
  flex: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  subtitle: {
    marginTop: theme.space(2),
    marginBottom: theme.space(5),
  },
  inputCard: (hasError: boolean) => ({
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: hasError ? theme.colors.dangerText : theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.space(4),
  }),
  input: {
    minHeight: 120,
    textAlignVertical: 'top',
    color: theme.colors.text,
    ...theme.typography.body,
  },
  inputFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.space(2),
  },
  paste: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space(1.5),
    minHeight: theme.layout.minTapTarget,
  },
  error: {
    marginTop: theme.space(3),
  },
  footer: {
    marginTop: 'auto',
    paddingTop: theme.space(6),
  },
}));

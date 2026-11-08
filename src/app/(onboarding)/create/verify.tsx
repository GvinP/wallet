import { Redirect, router } from 'expo-router';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { createVerifyQuestions, splitMnemonic, type VerifyQuestion } from '@/core/wallet';
import { onboardingDraft } from '@/stores';
import { Button } from '@/ui/Button';
import { Header } from '@/ui/Header';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

type Choice = { option: string; correct: boolean };

function Question({
  question,
  choice,
  onChoose,
}: {
  question: VerifyQuestion;
  choice: Choice | undefined;
  onChoose: (option: string) => void;
}) {
  const solved = choice?.correct === true;
  return (
    <View style={styles.question}>
      <Text variant="label">Word #{question.position}</Text>
      <View style={styles.options}>
        {question.options.map((option) => {
          const state = choice?.option === option ? (choice.correct ? 'correct' : 'wrong') : 'idle';
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected: state !== 'idle', disabled: solved }}
              disabled={solved}
              onPress={() => onChoose(option)}
              style={styles.option(state)}
            >
              <Text variant="bodyMedium">{option}</Text>
            </Pressable>
          );
        })}
      </View>
      {choice && !choice.correct ? (
        <Text variant="caption" color="dangerText">
          {`That's not word #${question.position}. Check your written copy.`}
        </Text>
      ) : null}
    </View>
  );
}

export default function VerifyScreen() {
  usePreventScreenCapture();
  const [questions] = useState(() =>
    onboardingDraft.mode === 'create'
      ? createVerifyQuestions(splitMnemonic(onboardingDraft.mnemonic ?? ''))
      : [],
  );
  const [choices, setChoices] = useState<Record<number, Choice>>({});

  if (questions.length === 0) return <Redirect href="/welcome" />;

  const allCorrect = questions.every((q) => choices[q.position]?.correct);

  return (
    <Screen scroll>
      <Header progress={{ step: 2, total: 3 }} />
      <Text variant="title">Confirm your phrase</Text>
      <Text color="muted" style={styles.subtitle}>
        Pick the right words to make sure you saved the phrase correctly.
      </Text>

      <View style={styles.list}>
        {questions.map((q) => (
          <Question
            key={q.position}
            question={q}
            choice={choices[q.position]}
            onChoose={(option) =>
              setChoices((prev) => ({
                ...prev,
                [q.position]: { option, correct: option === q.answer },
              }))
            }
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Button title="Continue" disabled={!allCorrect} onPress={() => router.push('/set-pin')} />
        <Button title="Show the phrase again" variant="outline" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  subtitle: {
    marginTop: theme.space(2),
    marginBottom: theme.space(6),
  },
  list: {
    gap: theme.space(6),
  },
  question: {
    gap: theme.space(3),
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: theme.space(2.5),
  },
  option: (state: 'idle' | 'correct' | 'wrong') => ({
    width: '48.5%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor:
      state === 'correct'
        ? theme.colors.okText
        : state === 'wrong'
          ? theme.colors.dangerText
          : theme.colors.border,
    backgroundColor: state === 'correct' ? theme.colors.okBg : theme.colors.surface,
  }),
  footer: {
    marginTop: 'auto',
    paddingTop: theme.space(8),
    gap: theme.space(3),
  },
}));

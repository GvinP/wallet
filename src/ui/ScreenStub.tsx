import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Button } from './Button';
import { Screen } from './Screen';
import { Text } from './Text';

type StubLink = { title: string; href: Href; replace?: boolean };

type ScreenStubProps = {
  title: string;
  phase: number;
  description?: string;
  links?: StubLink[];
  children?: ReactNode;
  bottomInset?: boolean;
};

/** Phase 0 placeholder: shows what the route will become and lets us walk the navigation. */
export function ScreenStub({
  title,
  phase,
  description,
  links = [],
  children,
  bottomInset,
}: ScreenStubProps) {
  return (
    <Screen scroll bottomInset={bottomInset}>
      <Text variant="title">{title}</Text>
      <View style={styles.badge}>
        <Text variant="caption" color="accentText">
          Placeholder · implemented in phase {phase}
        </Text>
      </View>
      {description ? (
        <Text color="muted" style={styles.description}>
          {description}
        </Text>
      ) : null}
      {children}
      {links.length > 0 ? (
        <View style={styles.links}>
          {links.map((link) => (
            <Button
              key={link.title}
              title={link.title}
              variant="secondary"
              onPress={() => (link.replace ? router.replace(link.href) : router.push(link.href))}
            />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  badge: {
    alignSelf: 'flex-start',
    marginTop: theme.space(3),
    paddingHorizontal: theme.space(3),
    paddingVertical: theme.space(1),
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
  },
  description: {
    marginTop: theme.space(4),
  },
  links: {
    marginTop: theme.space(6),
    gap: theme.space(3),
  },
}));

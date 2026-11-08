import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { ColorName, TypographyVariant } from '@/theme/tokens';

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  color?: ColorName;
  align?: 'left' | 'center' | 'right';
};

export function Text({
  variant = 'body',
  color = 'text',
  align = 'left',
  style,
  ...rest
}: TextProps) {
  styles.useVariants({ variant });
  return <RNText style={[styles.text, styles.dynamic(color, align), style]} {...rest} />;
}

const styles = StyleSheet.create((theme) => ({
  text: {
    variants: {
      variant: theme.typography,
    },
  },
  dynamic: (color: ColorName, align: 'left' | 'center' | 'right') => ({
    color: theme.colors[color],
    textAlign: align,
  }),
}));

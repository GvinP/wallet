import { router } from 'expo-router';
import { KeyRound, Lock, Zap, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { generateMnemonic } from '@/core/wallet';
import { useBiometryStatus } from '@/hooks/useBiometryStatus';
import { onboardingDraft } from '@/stores';
import { Button } from '@/ui/Button';
import { Logo } from '@/ui/Logo';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

function Benefit({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  const { theme } = useUnistyles();
  return (
    <View style={styles.benefit}>
      <View style={styles.benefitIcon}>
        <Icon size={18} color={theme.colors.accentText} />
      </View>
      <View style={styles.benefitText}>
        <Text variant="label">{title}</Text>
        <Text variant="caption" color="muted">
          {text}
        </Text>
      </View>
    </View>
  );
}

export default function WelcomeScreen() {
  const biometry = useBiometryStatus();
  const securityTitle = biometry?.available ? `${biometry.label} and PIN` : 'PIN protection';

  const create = () => {
    onboardingDraft.start('create', generateMnemonic());
    router.push('/create/backup');
  };

  const importWallet = () => {
    onboardingDraft.start('import');
    router.push('/import');
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <Logo />
        <Text variant="title" align="center" style={styles.name}>
          Amethyst
        </Text>
        <Text color="muted" align="center" style={styles.tagline}>
          A self-custody wallet for Polygon. Hold POL and USDT, send and receive in seconds.
        </Text>
      </View>

      <View style={styles.card}>
        <Benefit
          icon={KeyRound}
          title="Your keys, your crypto"
          text="Keys are stored only on this device"
        />
        <Benefit
          icon={Zap}
          title="Low fees on Polygon"
          text="Transfers usually cost a fraction of a cent"
        />
        <Benefit icon={Lock} title={securityTitle} text="Every transfer needs your confirmation" />
      </View>

      <View style={styles.actions}>
        <Button title="Create a new wallet" onPress={create} />
        <Button title="I already have a wallet" variant="outline" onPress={importWallet} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.space(2),
  },
  name: {
    marginTop: theme.space(5),
    fontSize: 32,
    lineHeight: 38,
  },
  tagline: {
    marginTop: theme.space(3),
  },
  card: {
    gap: theme.space(4),
    padding: theme.space(4),
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space(3),
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface2,
  },
  benefitText: {
    flex: 1,
  },
  actions: {
    marginTop: theme.space(8),
    gap: theme.space(3),
  },
}));

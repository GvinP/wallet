import { DEFAULT_PIN_ITERATIONS, hashPin } from '@/core/security/pin';
import { deriveAccount, generateMnemonic, mnemonicToSeed } from '@/core/wallet';

/** Public test phrase — benchmarks never touch the user's wallet. */
const TEST_MNEMONIC = 'test test test test test test test test test test test junk';

export type BenchmarkResult = { name: string; medianMs: number; runs: number[] };

async function measure(name: string, runs: number, fn: () => unknown): Promise<BenchmarkResult> {
  const times: number[] = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    await fn();
    times.push(performance.now() - start);
  }
  const sorted = [...times].sort((a, b) => a - b);
  return { name, medianMs: sorted[Math.floor(sorted.length / 2)]!, runs: times };
}

/** Phase 1 acceptance: measure key-handling costs on a real device (Hermes, no JIT). */
export async function runWalletBenchmarks(runs = 3): Promise<BenchmarkResult[]> {
  const seed = await mnemonicToSeed(TEST_MNEMONIC);
  const salt = new Uint8Array(16);
  return [
    await measure('Generate 12-word mnemonic', runs, () => generateMnemonic()),
    await measure('Mnemonic → seed (PBKDF2-SHA512 ×2048)', runs, () =>
      mnemonicToSeed(TEST_MNEMONIC),
    ),
    await measure('Seed → account (BIP32 + secp256k1)', runs, () => deriveAccount(seed)),
    await measure(`PIN hash (PBKDF2-SHA256 ×${DEFAULT_PIN_ITERATIONS})`, runs, () =>
      hashPin('123456', salt, DEFAULT_PIN_ITERATIONS),
    ),
  ];
}

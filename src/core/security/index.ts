import { expoSecureStore } from './expoSecureStore';
import { PinManager } from './pin';
import { Vault } from './vault';

export * from './biometrics';
export * from './lockout';
export * from './pin';
export * from './secureStore';
export * from './vault';

/** App-wide instances backed by the real SecureStore. */
export const vault = new Vault(expoSecureStore);
export const pinManager = new PinManager(expoSecureStore);

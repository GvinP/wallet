import { getAddress, type Address } from 'viem';

import type { Network } from './networks';

/**
 * What goes into the receive QR code: the bare checksummed address.
 * Every wallet and exchange scanner understands it (MetaMask included), whereas EIP-681
 * `ethereum:` URIs with a chain id are parsed inconsistently by other apps.
 */
export function receiveQrValue(address: Address): string {
  return getAddress(address);
}

/** Text for the system share sheet. */
export function receiveShareMessage(network: Network, address: Address): string {
  return `My ${network.name} address (POL and USDT):\n${getAddress(address)}`;
}

/** Spec §7 warning, adapted to the selected network. */
export function receiveWarning(network: Network): string {
  return `Only send POL and ${network.name} tokens (like USDT) on the ${network.name} network. Funds sent from other networks may be lost.`;
}

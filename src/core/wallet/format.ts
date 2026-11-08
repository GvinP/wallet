/** 0x7a3F2e81…4E5f1c9c2E → "0x7a3F…9c2E" (keeps checksum casing). */
export function shortenAddress(address: string, chars = 4): string {
  if (address.length <= 2 + chars * 2) return address;
  return `${address.slice(0, 2 + chars)}…${address.slice(-chars)}`;
}

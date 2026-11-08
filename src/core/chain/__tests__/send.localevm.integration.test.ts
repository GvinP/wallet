/**
 * End-to-end send pipeline against a local EVM with chain id 80002 (anvil/ganache) and a
 * deployed MockUSDT — exercises the real app code: Vault → estimate → sign → broadcast → track.
 *
 *   anvil --chain-id 80002            # funds the "test … junk" accounts
 *   # deploy contracts/MockUSDT.sol from account #0, then:
 *   LOCAL_RPC_URL=http://127.0.0.1:8545 MOCK_USDT_ADDRESS=0x… npm run test:integration
 *
 * Skipped when LOCAL_RPC_URL is not set.
 */
import {
  createPublicClient,
  createWalletClient,
  erc20Abi,
  http,
  parseUnits,
  type Address,
  type PublicClient,
} from 'viem';
import { mnemonicToAccount } from 'viem/accounts';

import { createMemorySecureStore } from '../../security/secureStore';
import { Vault } from '../../security/vault';
import { fetchBalances } from '../balances';
import { NETWORKS, type Network } from '../networks';
import { trackTransaction } from '../pendingTx';
import { checkFunds, estimateTransferFee, maxSendable } from '../send';
import { classifySendError, sendTransfer } from '../transfer';

const RPC = process.env.LOCAL_RPC_URL;
const USDT_ADDRESS = process.env.MOCK_USDT_ADDRESS as Address | undefined;
const run = RPC && USDT_ADDRESS ? describe : describe.skip;

const PHRASE = 'test test test test test test test test test test test junk';
const OTHER: Address = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // account #1, same phrase

run('send pipeline on a local 80002 chain', () => {
  const network: Network = {
    ...NETWORKS.amoy,
    rpcUrl: RPC!,
    tokens: [NETWORKS.amoy.tokens[0], { ...NETWORKS.amoy.tokens[1], address: USDT_ADDRESS }],
  };
  const [POL, USDT] = network.tokens;
  const client = createPublicClient({ chain: network.chain, transport: http(RPC) }) as PublicClient;
  const vault = new Vault(createMemorySecureStore());
  let self: Address;

  const track = (hash: `0x${string}`) =>
    trackTransaction(client, hash, { timeoutMs: 30_000, pollingInterval: 200 });

  beforeAll(async () => {
    ({ address: self } = await vault.importMnemonic(PHRASE));
    await expect(client.getChainId()).resolves.toBe(80002);
  });

  it('sends POL: the recipient gets exactly the amount, the fee stays under the estimate', async () => {
    const amount = parseUnits('0.5', 18);
    const before = await fetchBalances(client, network, self);
    const otherBefore = await client.getBalance({ address: OTHER });

    const fee = await estimateTransferFee(client, { token: POL, from: self, to: OTHER, amount });
    expect(fee.gas).toBe(21_000n);
    expect(checkFunds(POL, amount, { token: before.POL!, pol: before.POL! }, fee)).toEqual({
      ok: true,
    });

    const hash = await vault.withSigner((account) =>
      sendTransfer(network, account, { token: POL, to: OTHER, amount }, fee),
    );
    await expect(track(hash)).resolves.toEqual({ status: 'confirmed' });

    const receipt = await client.getTransactionReceipt({ hash });
    const paid = receipt.gasUsed * receipt.effectiveGasPrice;
    expect(paid).toBeLessThanOrEqual(fee.maxFee);
    expect(await client.getBalance({ address: OTHER })).toBe(otherBefore + amount);
    expect((await fetchBalances(client, network, self)).POL).toBe(before.POL! - amount - paid);
  });

  it('sends USDT via transfer(): balances move by exactly the amount', async () => {
    const amount = parseUnits('25', 6);
    const before = await fetchBalances(client, network, self);
    const fee = await estimateTransferFee(client, { token: USDT, from: self, to: OTHER, amount });

    const hash = await vault.withSigner((account) =>
      sendTransfer(network, account, { token: USDT, to: OTHER, amount }, fee),
    );
    await expect(track(hash)).resolves.toEqual({ status: 'confirmed' });

    const after = await fetchBalances(client, network, self);
    expect(after.USDT).toBe(before.USDT! - amount);
    const otherUsdt = await client.readContract({
      address: USDT_ADDRESS!,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [OTHER],
    });
    expect(otherUsdt).toBeGreaterThanOrEqual(amount);
  });

  it('Max for POL leaves enough for the fee — the transfer goes through', async () => {
    // A fresh, lightly funded account: send it 1 POL first.
    const fresh = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' as Address; // account #2
    const fund = await estimateTransferFee(client, {
      token: POL,
      from: self,
      to: fresh,
      amount: parseUnits('1', 18),
    });
    const fundHash = await vault.withSigner((a) =>
      sendTransfer(network, a, { token: POL, to: fresh, amount: parseUnits('1', 18) }, fund),
    );
    await track(fundHash);

    // Account #2 = index 2 of the same phrase; derived via viem for this test only.
    const signer2 = mnemonicToAccount(PHRASE, { addressIndex: 2 });
    expect(signer2.address).toBe(fresh);

    const pol = await client.getBalance({ address: fresh });
    const fee = await estimateTransferFee(client, {
      token: POL,
      from: fresh,
      to: OTHER,
      amount: 0n,
    });
    const max = maxSendable(POL, { token: pol, pol }, fee);
    expect(max).toBeGreaterThan(0n);
    const hash = await sendTransfer(network, signer2, { token: POL, to: OTHER, amount: max }, fee);
    await expect(track(hash)).resolves.toEqual({ status: 'confirmed' });
    expect(await client.getBalance({ address: fresh })).toBeGreaterThanOrEqual(0n);
  });

  it('a USDT transfer above the balance is mined as failed and reported as such', async () => {
    const tooMuch = parseUnits('999999999', 6);
    const fee = await estimateTransferFee(client, {
      token: USDT,
      from: self,
      to: OTHER,
      amount: 1n,
    });
    const hash = await vault.withSigner((account) =>
      sendTransfer(network, account, { token: USDT, to: OTHER, amount: tooMuch }, fee),
    );
    await expect(track(hash)).resolves.toEqual({ status: 'failed' });
  });

  it('a POL transfer above the balance is rejected by the node as insufficient funds', async () => {
    const balance = await client.getBalance({ address: self });
    const fee = await estimateTransferFee(client, {
      token: POL,
      from: self,
      to: OTHER,
      amount: 1n,
    });
    const error = await vault
      .withSigner((account) =>
        sendTransfer(network, account, { token: POL, to: OTHER, amount: balance * 2n }, fee),
      )
      .catch((e: unknown) => e);
    expect(classifySendError(error)).toBe('insufficient_funds');
  });

  it('MockUSDT refuses to mint more than 1,000,000 per call', async () => {
    const wallet = createWalletClient({
      account: mnemonicToAccount(PHRASE),
      chain: network.chain,
      transport: http(RPC),
    });
    const mintAbi = [
      {
        type: 'function',
        name: 'mint',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ],
        outputs: [],
      },
    ] as const;
    const ok = await wallet.writeContract({
      address: USDT_ADDRESS!,
      abi: mintAbi,
      functionName: 'mint',
      args: [OTHER, parseUnits('1000', 6)],
      gas: 200_000n,
    });
    await expect(track(ok)).resolves.toEqual({ status: 'confirmed' });
    const tooBig = await wallet.writeContract({
      address: USDT_ADDRESS!,
      abi: mintAbi,
      functionName: 'mint',
      args: [OTHER, parseUnits('1000001', 6)],
      gas: 200_000n,
    });
    await expect(track(tooBig)).resolves.toEqual({ status: 'failed' });
  });
});

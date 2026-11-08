# MockUSDT on Polygon Amoy

There is no official USDT on Amoy, so we deploy our own test token:
[`contracts/MockUSDT.sol`](../contracts/MockUSDT.sol) — a standard OpenZeppelin ERC-20 with **6 decimals**
(like real USDT), an open `mint` (max 1,000,000 per call) and a constructor that refuses to deploy on
any chain other than Amoy (80002). The token has no value.

Verified locally before release: compiles with solc 0.8.24 + OpenZeppelin 5.6; on a chain-80002 EVM it
deploys, reports `decimals() = 6`, `symbol() = USDT`, mints 1,000,000 to the deployer, rejects mints
above the cap, and refuses to deploy on chain 1.

## 1. Get test POL

1. Add **Polygon Amoy** to MetaMask (chainlist.org → search "Amoy", or Settings → Networks → Add:
   RPC `https://polygon-amoy.drpc.org`, chain id `80002`, symbol `POL`, explorer `https://amoy.polygonscan.com`).
2. Get POL from the faucet: https://faucet.polygon.technology (select Amoy). 0.1 POL is plenty.

> Use a **test** MetaMask account. Never use an account that holds real funds for testnet experiments.

## 2. Deploy with Remix

1. Open https://remix.ethereum.org → File explorer → **New file** `MockUSDT.sol` → paste the contents of
   `contracts/MockUSDT.sol`. Remix resolves the `@openzeppelin/contracts` import automatically.
2. **Solidity compiler** tab → compiler `0.8.24` (or any newer 0.8.x) → **Compile MockUSDT.sol**.
3. **Deploy & run transactions** tab:
   - Environment: **Injected Provider – MetaMask**; MetaMask must be on Amoy (Remix shows `Custom (80002)`).
   - Contract: `MockUSDT` → **Deploy** → confirm in MetaMask.
4. Copy the deployed address from "Deployed Contracts" (or from the tx on amoy.polygonscan.com).

## 3. Point the app at it

```bash
# .env
EXPO_PUBLIC_USDT_AMOY=0xYourMockUsdtAddress
```

Restart Metro with a clean cache so the new value is inlined: `npx expo start --dev-client --clear`.
The USDT row on the home screen now shows a balance instead of "Not configured".

## 4. Get test USDT into the app wallet

In Remix, under the deployed contract:

- `mint(to, amount)` — `to` = your Amethyst address (Receive screen → Copy), `amount` in base units:
  `1000000000` = 1,000 USDT (6 decimals).
- Or send some of the deployer's 1,000,000 USDT from MetaMask (Import tokens → paste the address).

## Optional: verify the source on Polygonscan

Remix → Plugin manager → enable **Contract Verification** → Etherscan → paste an Etherscan API key
(the same V2 key as `EXPO_PUBLIC_ETHERSCAN_KEY`) → choose chain _Polygon Amoy_ → Verify. Not required by
the app, but makes the token readable on amoy.polygonscan.com.

## Local end-to-end test (no testnet needed)

```bash
anvil --chain-id 80002          # or ganache with chainId 80002 and the "test … junk" mnemonic
# deploy contracts/MockUSDT.sol from account #0 (e.g. with Remix → "Dev - Foundry Provider")
LOCAL_RPC_URL=http://127.0.0.1:8545 MOCK_USDT_ADDRESS=0x… npm run test:integration
```

This runs the app's real send pipeline (Vault → fee estimate → sign → broadcast → receipt tracking) for
POL and USDT, plus failure cases.

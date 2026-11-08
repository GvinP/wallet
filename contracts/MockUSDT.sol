// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockUSDT — a test stand-in for USDT on Polygon Amoy (there is no official USDT there).
/// @notice ERC-20 with 6 decimals, like real USDT. Anyone can mint: this token has no value.
/// @dev Refuses to deploy anywhere except Amoy (chain id 80002), so it can't be mistaken for
///      a real token on mainnet.
contract MockUSDT is ERC20 {
    uint256 public constant AMOY_CHAIN_ID = 80002;
    /// @notice Per-call mint cap: 1,000,000 USDT.
    uint256 public constant MAX_MINT = 1_000_000 * 10 ** 6;

    error WrongChain(uint256 chainId);
    error MintTooLarge(uint256 amount);

    constructor() ERC20("Mock Tether USD", "USDT") {
        if (block.chainid != AMOY_CHAIN_ID) revert WrongChain(block.chainid);
        _mint(msg.sender, MAX_MINT);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Test faucet: mint up to 1,000,000 USDT to any address.
    /// @param to Recipient.
    /// @param amount Amount in base units (6 decimals): 1 USDT = 1000000.
    function mint(address to, uint256 amount) external {
        if (amount > MAX_MINT) revert MintTooLarge(amount);
        _mint(to, amount);
    }
}

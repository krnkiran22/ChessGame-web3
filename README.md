# LigerGames Chess – Web3 Multiplayer Chess with Real Rewards

## Overview

LigerGames Chess is a modern, real-time multiplayer chess platform that rewards winners with ERC20 tokens (LGT) on the Ethereum Sepolia testnet. It features:

- Real-time multiplayer using Ably
- MetaMask wallet integration
- On-chain token rewards for winners
- Rematch system with mutual agreement
- Modern UI with React and TailwindCSS

---

## Features

- **Web3 Integration:** Connect MetaMask, claim LGT tokens for wins, and add the token to your wallet with one click.
- **Real-Time Multiplayer:** Play with friends anywhere using a room code, powered by Ably.
- **Smart Contract Rewards:** Winners receive 10 LGT tokens per game, minted directly to their wallet.
- **Rematch System:** Both players must agree to start a new game after a match ends.
- **Modern UI:** Responsive, user-friendly interface with pop-up modals for game results, rewards, and rematch requests.

---

## Getting Started

### Prerequisites

- Node.js and npm
- MetaMask browser extension

### Installation

```bash
npm install
npm run dev
```

### Usage

1. Open the app in your browser.
2. Connect your MetaMask wallet.
3. Start a local game or create/join a multiplayer room.
4. Play chess! The winner can claim 10 LGT tokens.
5. Add LGT token to MetaMask using the Home page button.
6. View reward transactions on Sepolia Etherscan.

---

## Smart Contract

**LigerGamesToken (LGT)**

- **Network:** Sepolia Testnet
- **Contract Address:** `0x8f1afe3e227566cfb39eb04148fa6dc302ffd7e5`
- **Symbol:** LGT
- **Decimals:** 18
- **Reward:** 10 LGT per win (minted by contract owner)

### Key Functions

- `mintWinReward(address winner)` – Mints 10 LGT tokens to the winner (only owner can call)
- `mint(address to, uint256 amount)` – Mints any amount to any address (only owner)
- `burn(uint256 amount)` – Burns tokens from sender's balance

**Contract ABI:** (see `ChessGame.jsx` for full ABI array)

---

## Main Components & Functions

### `src/components/ChessGame.jsx`

- **Game State & Logic:**
  - `getLegalMoves`, `updateStatus`, `handleSquareClick` – Chess rules, move validation, check/checkmate logic
- **Ably Integration:**
  - Real-time move sync, room code logic, rematch requests/acceptance, presence detection
- **Web3 Integration:**
  - `connectWallet` – Connects MetaMask and stores wallet address
  - `rewardWinnerLGT` – Calls contract to mint LGT tokens to winner
  - Shows 'Claim Reward' and 'View Transaction' buttons in modal
- **Rematch Flow:**
  - Rematch request/accept logic, synced via Ably events
  - Both players must agree to start a new game
- **UI/UX:**
  - Pop-up modals for game end, rematch, and reward claim
  - Responsive chessboard and controls

### `src/components/Home.jsx`

- **Landing Page & Navigation:**
  - Start local game, create/join multiplayer room
  - 'Add LGT Token to MetaMask' button for easy wallet setup

---

## How the Logic Works

- **Chess Rules:** All move validation, check, checkmate, and castling logic is in `ChessGame.jsx`.
- **Multiplayer:** Ably channels are used for real-time move sync and rematch negotiation.
- **Wallet & Rewards:** MetaMask is used for wallet connection; ethers.js is used to call the smart contract and mint tokens.
- **Rematch:** After a game, the loser can request a rematch. The winner must accept. Both boards reset when accepted.
- **UI:** All user feedback (modals, popups, status) is handled in `ChessGame.jsx`.

---

## Demo Flow

1. Both users connect MetaMask and join the same room code.
2. Play a game. When the game ends, the winner sees a 'Claim 10 LGT Reward' button in the popup.
3. After claiming, a 'View Transaction' button appears, linking to Sepolia Etherscan.
4. The loser can request a rematch; the winner must accept for a new game to start.

---

## Extending the Project

- Add tournaments, NFT trophies, or cross-game rewards.
- Integrate more games or reward types.
- Deploy to mainnet for real-world rewards.

---

## License

MIT

import React, { useState, useEffect, useRef } from "react";
import Ably from "ably";
import { ethers } from "ethers";

// Unicode chess pieces
const PIECES = {
  wK: "\u2654", wQ: "\u2655", wR: "\u2656", wB: "\u2657", wN: "\u2658", wP: "\u2659",
  bK: "\u265A", bQ: "\u265B", bR: "\u265C", bB: "\u265D", bN: "\u265E", bP: "\u265F"
};

// Initial board setup
const initialBoard = [
  ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"],
  ["bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP"],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ["wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP"],
  ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"]
];

function isWhite(piece) { return piece && piece[0] === "w"; }
function isBlack(piece) { return piece && piece[0] === "b"; }

function cloneBoard(board) {
  return board.map(row => [...row]);
}

function findKing(board, color) {
  for (let x = 0; x < 8; x++) for (let y = 0; y < 8; y++) {
    if (board[x][y] === (color + "K")) return [x, y];
  }
  return null;
}

function isAttacked(board, x, y, attackerColor) {
  // For each enemy piece, see if it can move to (x, y)
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
    const piece = board[i][j];
    if ((attackerColor === "w" && isWhite(piece)) || (attackerColor === "b" && isBlack(piece))) {
      const moves = getLegalMoves(board, [i, j], attackerColor, {}, false); // ignore check for attackers
      if (moves.some(([tx, ty]) => tx === x && ty === y)) return true;
    }
  }
  return false;
}

function getLegalMoves(board, from, turn, castleRights, filterCheck = true) {
  // Basic moves + castling
  const [fx, fy] = from;
  const piece = board[fx][fy];
  if (!piece) return [];
  const moves = [];
  const directions = {
    N: [-1, 0], S: [1, 0], E: [0, 1], W: [0, -1],
    NE: [-1, 1], NW: [-1, -1], SE: [1, 1], SW: [1, -1]
  };
  const add = (tx, ty) => {
    if (tx < 0 || tx > 7 || ty < 0 || ty > 7) return;
    const target = board[tx][ty];
    if (!target || (isWhite(piece) && isBlack(target)) || (isBlack(piece) && isWhite(target))) {
      moves.push([tx, ty]);
    }
  };
  if (piece[1] === "P") {
    const dir = isWhite(piece) ? -1 : 1;
    if (board[fx + dir] && !board[fx + dir][fy]) add(fx + dir, fy);
    if ((isWhite(piece) && fx === 6) || (isBlack(piece) && fx === 1)) {
      if (!board[fx + dir][fy] && !board[fx + 2 * dir][fy]) add(fx + 2 * dir, fy);
    }
    for (let dy of [-1, 1]) {
      if (board[fx + dir] && board[fx + dir][fy + dy]) {
        const target = board[fx + dir][fy + dy];
        if ((isWhite(piece) && isBlack(target)) || (isBlack(piece) && isWhite(target))) {
          add(fx + dir, fy + dy);
        }
      }
    }
  } else if (piece[1] === "N") {
    for (let [dx, dy] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) {
      add(fx + dx, fy + dy);
    }
  } else if (piece[1] === "B" || piece[1] === "Q") {
    for (let [dx, dy] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
      for (let i = 1; i < 8; i++) {
        const tx = fx + dx * i, ty = fy + dy * i;
        if (tx < 0 || tx > 7 || ty < 0 || ty > 7) break;
        if (!board[tx][ty]) moves.push([tx, ty]);
        else {
          if ((isWhite(piece) && isBlack(board[tx][ty])) || (isBlack(piece) && isWhite(board[tx][ty]))) moves.push([tx, ty]);
          break;
        }
      }
    }
  }
  if (piece[1] === "R" || piece[1] === "Q") {
    for (let [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      for (let i = 1; i < 8; i++) {
        const tx = fx + dx * i, ty = fy + dy * i;
        if (tx < 0 || tx > 7 || ty < 0 || ty > 7) break;
        if (!board[tx][ty]) moves.push([tx, ty]);
        else {
          if ((isWhite(piece) && isBlack(board[tx][ty])) || (isBlack(piece) && isWhite(board[tx][ty]))) moves.push([tx, ty]);
          break;
        }
      }
    }
  }
  if (piece[1] === "K") {
    for (let [dx, dy] of Object.values(directions)) {
      add(fx + dx, fy + dy);
    }
    // Castling
    if (castleRights) {
      const color = isWhite(piece) ? "w" : "b";
      const homeRank = color === "w" ? 7 : 0;
      if (fx === homeRank && fy === 4) {
        // Kingside
        if (castleRights[color + "K"] &&
          !board[homeRank][5] && !board[homeRank][6] &&
          !isAttacked(board, homeRank, 4, color === "w" ? "b" : "w") &&
          !isAttacked(board, homeRank, 5, color === "w" ? "b" : "w") &&
          !isAttacked(board, homeRank, 6, color === "w" ? "b" : "w") &&
          board[homeRank][7] === (color + "R")) {
          moves.push([homeRank, 6, "castleK"]);
        }
        // Queenside
        if (castleRights[color + "Q"] &&
          !board[homeRank][3] && !board[homeRank][2] && !board[homeRank][1] &&
          !isAttacked(board, homeRank, 4, color === "w" ? "b" : "w") &&
          !isAttacked(board, homeRank, 3, color === "w" ? "b" : "w") &&
          !isAttacked(board, homeRank, 2, color === "w" ? "b" : "w") &&
          board[homeRank][0] === (color + "R")) {
          moves.push([homeRank, 2, "castleQ"]);
        }
      }
    }
  }
  // Remove moves that leave king in check
  if (filterCheck) {
    return moves.filter(([tx, ty, special]) => {
      const newBoard = cloneBoard(board);
      // Special: castling
      if (special === "castleK") {
        newBoard[fx][fy] = null;
        newBoard[fx][6] = piece;
        newBoard[fx][7] = null;
        newBoard[fx][5] = turn + "R";
      } else if (special === "castleQ") {
        newBoard[fx][fy] = null;
        newBoard[fx][2] = piece;
        newBoard[fx][0] = null;
        newBoard[fx][3] = turn + "R";
      } else {
        newBoard[tx][ty] = piece;
        newBoard[fx][fy] = null;
      }
      const kingPos = findKing(newBoard, isWhite(piece) ? "w" : "b");
      if (!kingPos) return false;
      return !isAttacked(newBoard, kingPos[0], kingPos[1], isWhite(piece) ? "b" : "w");
    });
  }
  return moves;
}

// LGT contract details
const LGT_CONTRACT_ADDRESS = "0x8f1afe3e227566cfb39eb04148fa6dc302ffd7e5";
const LGT_ABI = [
  {"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"burn","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},
  {"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"allowance","type":"uint256"},{"internalType":"uint256","name":"needed","type":"uint256"}],"name":"ERC20InsufficientAllowance","type":"error"},
  {"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"uint256","name":"balance","type":"uint256"},{"internalType":"uint256","name":"needed","type":"uint256"}],"name":"ERC20InsufficientBalance","type":"error"},
  {"inputs":[{"internalType":"address","name":"approver","type":"address"}],"name":"ERC20InvalidApprover","type":"error"},
  {"inputs":[{"internalType":"address","name":"receiver","type":"address"}],"name":"ERC20InvalidReceiver","type":"error"},
  {"inputs":[{"internalType":"address","name":"sender","type":"address"}],"name":"ERC20InvalidSender","type":"error"},
  {"inputs":[{"internalType":"address","name":"spender","type":"address"}],"name":"ERC20InvalidSpender","type":"error"},
  {"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},
  {"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},
  {"inputs":[{"internalType":"address","name":"winner","type":"address"}],"name":"mintWinReward","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},
  {"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},
  {"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"WIN_REWARD","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
];

export default function ChessGame({ roomCode, mode }) {
  const [board, setBoard] = useState(initialBoard.map(row => [...row]));
  const [turn, setTurn] = useState("w");
  const [selected, setSelected] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [castleRights, setCastleRights] = useState({ wK: true, wQ: true, bK: true, bQ: true });
  const [status, setStatus] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [playerColor, setPlayerColor] = useState("w");
  const [walletAddress, setWalletAddress] = useState("");
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [rewardTxHash, setRewardTxHash] = useState("");
  const [rematchRequested, setRematchRequested] = useState(false);
  const [rematchReceived, setRematchReceived] = useState(false);
  const [rematchAccepted, setRematchAccepted] = useState(false);
  const ablyRef = useRef(null);
  const channelRef = useRef(null);

  // MetaMask connect handler
  async function connectWallet() {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
      } catch (err) {
        alert("Wallet connection failed: " + err.message);
      }
    } else {
      alert("MetaMask is not installed. Please install MetaMask and try again.");
    }
  }

  // Reward winner with LGT tokens (only works if owner wallet is connected)
  async function rewardWinnerLGT() {
    if (!window.ethereum) {
      alert("MetaMask is not installed");
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(LGT_CONTRACT_ADDRESS, LGT_ABI, signer);
      const tx = await contract.mintWinReward(walletAddress);
      setRewardTxHash(tx.hash);
      await tx.wait();
      setRewardClaimed(true);
      alert("10 LGT tokens sent to your wallet!");
    } catch (err) {
      alert("Reward failed: " + (err.reason || err.message));
    }
  }

  // Rematch handler: send request via Ably
  function handleRematch() {
    setRematchRequested(true);
    if (channelRef.current) {
      channelRef.current.publish("rematch-request", { from: walletAddress });
    }
  }
  // Accept rematch handler: send accept via Ably
  function handleAcceptRematch() {
    setRematchAccepted(true);
    if (channelRef.current) {
      channelRef.current.publish("rematch-accept", { from: walletAddress });
    }
    doRematch();
  }
  // Actually reset the board and state
  function doRematch() {
    setBoard(initialBoard.map(row => [...row]));
    setTurn("w");
    setSelected(null);
    setLegalMoves([]);
    setCastleRights({ wK: true, wQ: true, bK: true, bQ: true });
    setStatus("");
    setGameOver(false);
    setRewardClaimed(false);
    setRewardTxHash("");
    setRematchRequested(false);
    setRematchReceived(false);
    setRematchAccepted(false);
  }

  // Setup Ably for multiplayer
  useEffect(() => {
    if (mode === "local") return;
    // Always create a new Ably client and channel on roomCode/mode change
    const ABLY_API_KEY = "APLiMQ.ZqdWTQ:iOBXJhzwuW75r7GoRCyqBWjnykv0CM3I-7PtJQ61aTU";
    const uniqueClientId = (mode === "create" ? "w" : "b") + '-' + Math.random().toString(36).slice(2, 8);
    const ably = new Ably.Realtime({ key: ABLY_API_KEY, clientId: uniqueClientId });
    ablyRef.current = ably;
    const channel = ably.channels.get("chess-" + roomCode);
    channelRef.current = channel;

    setPlayerColor(mode === "create" ? "w" : "b");

    // Handlers
    const moveHandler = msg => {
      console.log("[Ably] Move received", msg.data);
      const { move, newBoard, nextTurn, newCastleRights } = msg.data;
      setBoard(newBoard);
      setTurn(nextTurn);
      setCastleRights(newCastleRights);
      setSelected(null);
      setLegalMoves([]);
      setTimeout(() => updateStatus(newBoard, nextTurn, newCastleRights), 0);
    };

    // Always check presence count on any presence event
    const updatePresence = () => {
      channel.presence.get().then(members => {
        console.log("[Ably] Presence members:", members.map(m => m.clientId));
        setOpponentConnected(members.length > 1);
      });
    };

    channel.subscribe("move", moveHandler);
    channel.presence.subscribe("enter", updatePresence);
    channel.presence.subscribe("leave", updatePresence);
    channel.presence.enter();
    updatePresence();

    // Add rematch event handlers
    const rematchRequestHandler = msg => {
      if (msg.data && msg.data.from !== walletAddress) {
        setRematchReceived(true);
      }
    };
    const rematchAcceptHandler = msg => {
      doRematch();
    };
    if (channelRef.current) {
      channelRef.current.subscribe("rematch-request", rematchRequestHandler);
      channelRef.current.subscribe("rematch-accept", rematchAcceptHandler);
    }

    // Cleanup: only unsubscribe handlers, do not close connection
    return () => {
      channel.unsubscribe("move", moveHandler);
      channel.presence.unsubscribe("enter", updatePresence);
      channel.presence.unsubscribe("leave", updatePresence);
      if (channelRef.current) {
        channelRef.current.unsubscribe("rematch-request", rematchRequestHandler);
        channelRef.current.unsubscribe("rematch-accept", rematchAcceptHandler);
      }
      ablyRef.current = null;
      channelRef.current = null;
    };
  }, [mode, roomCode, walletAddress]);

  function updateStatus(newBoard, nextTurn, newCastleRights) {
    const kingPos = findKing(newBoard, nextTurn);
    const inCheck = kingPos && isAttacked(newBoard, kingPos[0], kingPos[1], nextTurn === "w" ? "b" : "w");
    // Any legal moves?
    let hasMoves = false;
    for (let x = 0; x < 8; x++) for (let y = 0; y < 8; y++) {
      const piece = newBoard[x][y];
      if ((nextTurn === "w" && isWhite(piece)) || (nextTurn === "b" && isBlack(piece))) {
        if (getLegalMoves(newBoard, [x, y], nextTurn, newCastleRights).length > 0) {
          hasMoves = true;
          break;
        }
      }
    }
    if (inCheck && !hasMoves) {
      // FIX: Winner is the opposite of nextTurn
      setStatus(`Checkmate! ${(nextTurn === "w" ? "Black" : "White")} wins!`);
      setGameOver(true);
    } else if (!inCheck && !hasMoves) {
      setStatus("Stalemate! Draw.");
      setGameOver(true);
    } else if (inCheck) {
      setStatus((nextTurn === "w" ? "White" : "Black") + " is in check!");
      setGameOver(false);
    } else {
      setStatus("");
      setGameOver(false);
    }
  }

  function handleSquareClick(x, y) {
    if (gameOver) return;
    // Multiplayer: only allow correct color to move
    if (mode !== "local" && turn !== playerColor) return;
    const piece = board[x][y];
    if (selected) {
      const move = legalMoves.find(([tx, ty, special]) => tx === x && ty === y);
      if (move) {
        const [fx, fy] = selected;
        const newBoard = cloneBoard(board);
        let newCastleRights = { ...castleRights };
        // Special: castling
        if (move[2] === "castleK") {
          newBoard[fx][fy] = null;
          newBoard[fx][6] = board[fx][fy];
          newBoard[fx][7] = null;
          newBoard[fx][5] = turn + "R";
          // King and rook have moved
          newCastleRights[turn + "K"] = false;
          newCastleRights[turn + "Q"] = false;
        } else if (move[2] === "castleQ") {
          newBoard[fx][fy] = null;
          newBoard[fx][2] = board[fx][fy];
          newBoard[fx][0] = null;
          newBoard[fx][3] = turn + "R";
          newCastleRights[turn + "K"] = false;
          newCastleRights[turn + "Q"] = false;
        } else {
          newBoard[x][y] = board[fx][fy];
          newBoard[fx][fy] = null;
          // Update castling rights if king or rook moves
          if (board[fx][fy][1] === "K") {
            newCastleRights[turn + "K"] = false;
            newCastleRights[turn + "Q"] = false;
          } else if (board[fx][fy][1] === "R") {
            if (turn === "w" && fx === 7 && fy === 0) newCastleRights.wQ = false;
            if (turn === "w" && fx === 7 && fy === 7) newCastleRights.wK = false;
            if (turn === "b" && fx === 0 && fy === 0) newCastleRights.bQ = false;
            if (turn === "b" && fx === 0 && fy === 7) newCastleRights.bK = false;
          }
        }
        // After move, sync via Ably if multiplayer
        if (mode !== "local" && channelRef.current) {
          channelRef.current.publish("move", {
            move: { from: [fx, fy], to: [x, y], special: move[2] },
            newBoard,
            nextTurn: turn === "w" ? "b" : "w",
            newCastleRights
          });
        }
        setBoard(newBoard);
        setTurn(turn === "w" ? "b" : "w");
        setSelected(null);
        setLegalMoves([]);
        setCastleRights(newCastleRights);
        setTimeout(() => updateStatus(newBoard, turn === "w" ? "b" : "w", newCastleRights), 0);
        return;
      } else {
        setSelected(null);
        setLegalMoves([]);
        return;
      }
    }
    if (piece && ((turn === "w" && isWhite(piece)) || (turn === "b" && isBlack(piece)))) {
      setSelected([x, y]);
      setLegalMoves(getLegalMoves(board, [x, y], turn, castleRights));
    }
  }

  // Determine if the local user is the winner
  const isLocalWinner = gameOver && status.includes("wins") && (
    (status.includes("White") && playerColor === "w") ||
    (status.includes("Black") && playerColor === "b")
  );

  // UI: show player color, wallet, and waiting status
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      minHeight: "100vh",
      justifyContent: "center",
      background: "linear-gradient(to bottom right, #222, #444)",
      position: "relative"
    }}>
      <h1 style={{ color: "white", marginBottom: 16 }}>Chess</h1>
      {mode !== "local" && (
        <div style={{ color: "#ffe066", marginBottom: 8, fontWeight: "bold" }}>
          You are playing as {playerColor === "w" ? "White" : "Black"} <br />
          {opponentConnected ? "Opponent connected!" : "Waiting for opponent to join..."}
        </div>
      )}
      {/* Wallet connect UI */}
      {!walletAddress ? (
        <button
          onClick={connectWallet}
          style={{
            background: '#f59e42', color: '#222', fontWeight: 'bold', fontSize: 20, padding: '12px 32px', borderRadius: 8, margin: 16, boxShadow: '0 2px 8px #000a', cursor: 'pointer', border: 'none'
          }}
        >
          Connect Wallet
        </button>
      ) : (
        <div style={{ color: '#a3e635', marginBottom: 12, fontSize: 16 }}>
          Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
        </div>
      )}
      {/* Block chessboard until wallet connected */}
      {walletAddress ? (
        <div
          style={{
            display: "grid",
            gridTemplateRows: "repeat(8, 70px)",
            gridTemplateColumns: "repeat(8, 70px)",
            border: "6px solid #ffe066",
            boxShadow: "0 0 32px #000a",
            background: "#b58863"
          }}
        >
          {board.map((row, x) =>
            row.map((piece, y) => {
              const isSelected = selected && selected[0] === x && selected[1] === y;
              const isLegal = legalMoves.some(([tx, ty]) => tx === x && ty === y);
              const isLight = (x + y) % 2 === 1;
              return (
                <div
                  key={x + "-" + y}
                  onClick={() => handleSquareClick(x, y)}
                  style={{
                    width: 70,
                    height: 70,
                    fontSize: 48,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isSelected
                      ? "#ffe066"
                      : isLegal
                      ? "#a3e635"
                      : isLight
                      ? "#f0d9b5"
                      : "#b58863",
                    border: isSelected ? "3px solid #f59e42" : "1px solid #222",
                    cursor: piece || isLegal ? "pointer" : "default",
                    userSelect: "none"
                  }}
                >
                  {piece ? PIECES[piece] : ""}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div style={{ color: '#fff', margin: 24, fontSize: 18 }}>
          Please connect your wallet to start the game.
        </div>
      )}
      {/* Modal popup for game over or rematch messages */}
      {(gameOver || rematchReceived) && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.65)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#222",
            color: "#ffe066",
            padding: "32px 24px",
            borderRadius: 14,
            boxShadow: "0 8px 32px #000a",
            fontSize: 22,
            fontWeight: "bold",
            textAlign: "center",
            minWidth: 240,
            maxWidth: 340
          }}>
            {/* Show concise message */}
            {rematchReceived ? (
              <>
                Opponent wants a rematch!<br />
                <button
                  onClick={handleAcceptRematch}
                  style={{
                    background: '#a3e635', color: '#222', fontWeight: 'bold', fontSize: 18, padding: '10px 24px', borderRadius: 8, margin: '24px auto 0', boxShadow: '0 2px 8px #000a', cursor: 'pointer', border: 'none', display: 'block'
                  }}
                >
                  Accept Rematch
                </button>
              </>
            ) : (
              <>
                {status || (turn === "w" ? "White" : "Black") + "'s turn."}
                {/* Show claim reward button if local user is winner and not yet claimed */}
                {isLocalWinner && !rewardClaimed && (
                  <button
                    onClick={rewardWinnerLGT}
                    style={{
                      background: '#a3e635', color: '#222', fontWeight: 'bold', fontSize: 18, padding: '10px 24px', borderRadius: 8, margin: '24px auto 0', boxShadow: '0 2px 8px #000a', cursor: 'pointer', border: 'none', display: 'block'
                    }}
                  >
                    Claim 10 LGT Reward
                  </button>
                )}
                {isLocalWinner && rewardClaimed && (
                  <div style={{ color: '#a3e635', margin: '24px auto 0', fontWeight: 'bold', fontSize: 16 }}>
                    Reward claimed!<br />
                    {rewardTxHash && (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${rewardTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-block',
                          marginTop: 12,
                          background: '#6366f1',
                          color: '#fff',
                          padding: '8px 20px',
                          borderRadius: 8,
                          fontWeight: 'bold',
                          textDecoration: 'none',
                          fontSize: 15,
                          boxShadow: '0 2px 8px #000a'
                        }}
                      >
                        View Transaction
                      </a>
                    )}
                  </div>
                )}
                {/* Rematch button for the loser, disabled if already requested */}
                {gameOver && !isLocalWinner && status.includes("wins") && !rematchRequested && (
                  <button
                    onClick={handleRematch}
                    style={{
                      background: '#f59e42', color: '#222', fontWeight: 'bold', fontSize: 18, padding: '10px 24px', borderRadius: 8, margin: '24px auto 0', boxShadow: '0 2px 8px #000a', cursor: 'pointer', border: 'none', display: 'block'
                    }}
                  >
                    Rematch
                  </button>
                )}
                {gameOver && !isLocalWinner && status.includes("wins") && rematchRequested && (
                  <div style={{ color: '#f59e42', margin: '24px auto 0', fontWeight: 'bold', fontSize: 16 }}>
                    Waiting for opponent to accept rematch...
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
      <p style={{ color: "#ccc", marginTop: 16, fontWeight: gameOver ? "bold" : "normal", fontSize: gameOver ? 24 : 16 }}>
        {status || (turn === "w" ? "White" : "Black") + "'s turn. Click a piece, then a destination square."}<br />
        {gameOver && status.includes("wins") && (status.includes("White") ? "White user wins!" : "Black user wins!")}<br />
        (Castling, check, and checkmate supported. No en passant or promotion yet)
      </p>
      {/* Remove claim reward button from below the board */}
    </div>
  );
} 
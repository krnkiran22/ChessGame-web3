import React, { useState } from "react";
import { ethers } from "ethers";
import { Crown, Shield, Castle, Gem, Swords, Circle, Coins } from 'lucide-react';
// Remove: import Chess3DBackground from './Chess3DBackground';

// Add LGT to MetaMask handler
const addLGTtoMetaMask = async () => {
  if (window.ethereum) {
    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: '0x8f1afe3e227566cfb39eb04148fa6dc302ffd7e5',
            symbol: 'LGT',
            decimals: 18,
            image: '', // Optionally add a token logo URL
          },
        },
      });
    } catch (error) {
      alert('Could not add token: ' + error.message);
    }
  } else {
    alert('MetaMask is not installed.');
  }
};

// Mock user level (replace with real user progress logic as needed)
const userLevel = 3; // Change to 5+ to unlock Andhra Pradesh

const ACHIEVEMENT_CONTRACT = "0x200a4631d0383af06a8e8ed34d78786963ef9f28";
const ACHIEVEMENT_ABI = [
  {"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"string","name":"achievementType","type":"string"},{"internalType":"string","name":"tokenURI","type":"string"}],"name":"mintAchievement","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"string","name":"","type":"string"}],"name":"hasAchievement","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}
];

// Demo: track wins in localStorage
function getWins() {
  return parseInt(localStorage.getItem("chessWins") || "0", 10);
}
function setWins(wins) {
  localStorage.setItem("chessWins", String(wins));
}

async function mintAchievementNFT({ setToast }) {
  if (!window.ethereum) {
    setToast("MetaMask required");
    setTimeout(() => setToast(""), 2500);
    return;
  }
  const wins = getWins();
  if (wins < 100) {
    setToast("Win 100 matches to mint Grand Master NFT!");
    setTimeout(() => setToast(""), 2500);
    return;
  }
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(ACHIEVEMENT_CONTRACT, ACHIEVEMENT_ABI, signer);
    const address = await signer.getAddress();
    // Check if already minted
    const alreadyMinted = await contract.hasAchievement(address, "Grand Master");
    if (alreadyMinted) {
      setToast("You already minted this achievement!");
      setTimeout(() => setToast(""), 2500);
      return;
    }
    // Example tokenURI (should be a real hosted metadata JSON for production)
    const tokenURI = "https://gateway.pinata.cloud/ipfs/QmGrandMasterMetadataHash";
    const tx = await contract.mintAchievement(address, "Grand Master", tokenURI);
    await tx.wait();
    setToast("Grand Master NFT Minted!");
    setTimeout(() => setToast(""), 2500);
  } catch (err) {
    setToast("Mint failed: " + (err.reason || err.message));
    setTimeout(() => setToast(""), 2500);
  }
}

export default function Home({ onStartGame, onCreateRoom, onJoinRoom }) {
  const [mode, setMode] = useState("home");
  const [roomCode, setRoomCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [points, setPoints] = useState(500); // In-game wallet points
  const [toast, setToast] = useState("");

  const knightCursor =
    "url('data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 448 512\'><path d=\'M96 48L82.7 61.3C70.7 73.3 64 89.5 64 106.5l0 132.4c0 10.7 5.3 20.7 14.2 26.6l10.6 7c14.3 9.6 32.7 10.7 48.1 3l3.2-1.6c2.6-1.3 5-2.8 7.3-4.5l49.4-37c6.6-5 15.7-5 22.3 0c10.2 7.7 9.9 23.1-.7 30.3L90.4 350C73.9 361.3 64 380 64 400l320 0 28.9-159c2.1-11.3 3.1-22.8 3.1-34.3l0-14.7C416 86 330 0 224 0L83.8 0C72.9 0 64 8.9 64 19.8c0 7.5 4.2 14.3 10.9 17.7L96 48zm24 68a20 20 0 1 1 40 0 20 20 0 1 1 -40 0zM22.6 473.4c-4.2 4.2-6.6 10-6.6 16C16 501.9 26.1 512 38.6 512l370.7 0c12.5 0 22.6-10.1 22.6-22.6c0-6-2.4-11.8-6.6-16L384 432 64 432 22.6 473.4z' fill=\'%23fff\'/></svg>') 16 16, auto";
  const kingCursor =
    "url('data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 320 512\'><path d=\'M104 0C90.7 0 80 10.7 80 24c0 11.2 7.6 20.6 18 23.2c-7.8 8-16.1 17-24.4 27C38.2 116.7 0 178.8 0 250.9c0 44.8 24.6 72.2 48 87.8L48 352l48 0 0-27c0-9-5-17.2-13-21.3c-18-9.3-35-24.7-35-52.7c0-55.5 29.8-106.8 62.4-145.9c16-19.2 32.1-34.8 44.2-45.5c1.9-1.7 3.7-3.2 5.3-4.6c1.7 1.4 3.4 3 5.3 4.6c12.1 10.7 28.2 26.3 44.2 45.5c5.3 6.3 10.5 13 15.5 20L159 191c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l57.8-57.8c12.8 25.9 21.2 54.3 21.2 83.8c0 28-17 43.4-35 52.7c-8 4.1-13 12.3-13 21.3l0 27 48 0 0-13.3c23.4-15.6 48-42.9 48-87.8c0-72.1-38.2-134.2-73.6-176.7c-8.3-9.9-16.6-19-24.4-27c10.3-2.7 18-12.1 18-23.2c0-13.3-10.7-24-24-24L160 0 104 0zM52.7 464l16.6-32 181.6 0 16.6 32L52.7 464zm207.9-80l-201 0c-12 0-22.9 6.7-28.4 17.3L4.6 452.5c-3 5.8-4.6 12.2-4.6 18.7C0 493.8 18.2 512 40.8 512l238.5 0c22.5 0 40.8-18.2 40.8-40.8c0-6.5-1.6-12.9-4.6-18.7l-26.5-51.2c-5.5-10.6-16.5-17.3-28.4-17.3z' fill=\'%23fff\'/></svg>') 16 16, auto";
  const [cursor, setCursor] = useState(knightCursor);
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setCursor((prev) => (prev === knightCursor ? kingCursor : knightCursor));
  //   }, 2000);
  //   return () => clearInterval(interval);
  // }, []);

  const levels = [
    { name: "London", unlocked: true },
    { name: "New York", unlocked: true },
    { name: "Delhi", unlocked: true },
    { name: "Chennai", unlocked: true },
    { name: "Andhra Pradesh", unlocked: userLevel >= 5 }
  ];

  function handleLevelSelect(level) {
    if (points < 100) {
      setToast("You don’t have enough money");
      setShowLevelModal(false);
      setTimeout(() => setToast(""), 2500);
      return;
    }
    setSelectedLevel(level);
    setShowLevelModal(false);
    setPoints(points - 100);
    onStartGame(level);
  }

  if (mode === "create-room") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <h1 className="text-4xl font-bold text-white mb-6 drop-shadow-lg">Room Created</h1>
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg flex flex-col items-center">
          <p className="text-lg text-white mb-2">Share this code with your friend:</p>
          <div className="text-3xl font-mono text-yellow-400 mb-4 select-all">{roomCode}</div>
          <button
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-6 rounded-lg text-lg shadow-lg transition"
            onClick={() => onCreateRoom(roomCode)}
          >
            Start Game
          </button>
          <button
            className="mt-4 text-gray-400 hover:text-white underline"
            onClick={() => setMode("home")}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (mode === "join-room") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <h1 className="text-4xl font-bold text-white mb-6 drop-shadow-lg">Join Room</h1>
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg flex flex-col items-center">
          <input
            className="mb-4 px-4 py-2 rounded text-lg text-black w-56"
            placeholder="Enter room code"
            value={inputCode}
            onChange={e => setInputCode(e.target.value.toUpperCase())}
            maxLength={8}
          />
          <button
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-6 rounded-lg text-lg shadow-lg transition"
            onClick={() => onJoinRoom(inputCode)}
            disabled={!inputCode}
          >
            Join Game
          </button>
          <button
            className="mt-4 text-gray-400 hover:text-white underline"
            onClick={() => setMode("home")}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800"
      style={{ cursor }}
    >
      {/* Ensure cursor stays as knight/king on all elements and hover states */}
      <style>{`
         .min-h-screen *, .min-h-screen *:hover, .min-h-screen *:active {
           cursor: ${cursor} !important;
         }
      `}</style>
      {/* Decorative Chess Coins in the background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        {/* Top left */}
        <span style={{ position: 'absolute', top: 32, left: 32, opacity: 0.13 }}>
          <Circle size={80} color="#FFD700" fill="#FFD700" strokeWidth={2} />
          <Crown size={40} color="#bfa100" style={{ position: 'absolute', left: 20, top: 20 }} />
        </span>
        {/* Top right */}
        <span style={{ position: 'absolute', top: 64, right: 48, opacity: 0.10 }}>
          <Circle size={60} color="#FFD700" fill="#FFD700" strokeWidth={2} />
          <Gem size={28} color="#bfa100" style={{ position: 'absolute', left: 16, top: 16 }} />
        </span>
        {/* Bottom left */}
        <span style={{ position: 'absolute', bottom: 48, left: 64, opacity: 0.11 }}>
          <Circle size={56} color="#FFD700" fill="#FFD700" strokeWidth={2} />
          <Castle size={28} color="#bfa100" style={{ position: 'absolute', left: 14, top: 14 }} />
        </span>
        {/* Bottom right */}
        <span style={{ position: 'absolute', bottom: 32, right: 32, opacity: 0.12 }}>
          <Circle size={70} color="#FFD700" fill="#FFD700" strokeWidth={2} />
          <Swords size={32} color="#bfa100" style={{ position: 'absolute', left: 19, top: 19 }} />
        </span>
        {/* Center left */}
        <span style={{ position: 'absolute', top: '50%', left: 16, opacity: 0.09, transform: 'translateY(-50%)' }}>
          <Circle size={48} color="#FFD700" fill="#FFD700" strokeWidth={2} />
          <Gem size={20} color="#bfa100" style={{ position: 'absolute', left: 10, top: 10 }} />
        </span>
        {/* Center right */}
        <span style={{ position: 'absolute', top: '60%', right: 24, opacity: 0.09, transform: 'translateY(-50%)' }}>
          <Circle size={44} color="#FFD700" fill="#FFD700" strokeWidth={2} />
          <Crown size={18} color="#bfa100" style={{ position: 'absolute', left: 13, top: 13 }} />
        </span>
      </div>
      {/* Mint Achievement NFT floating button top right */}
      <div style={{ position: 'fixed', top: 24, right: 32, zIndex: 10 }}>
        <button
          className="flex items-center gap-2 bg-gradient-to-r from-pink-600 via-pink-400 to-pink-700 hover:from-pink-700 hover:to-pink-400 text-white font-extrabold py-3 px-6 rounded-full text-lg shadow-2xl transition-all duration-200 border-4 border-pink-200 hover:scale-105 active:scale-95"
          onClick={() => mintAchievementNFT({ setToast })}
        >
          <Crown className="inline-block text-yellow-100 drop-shadow-md" size={22} />
          Mint Grand Master NFT
        </button>
      </div>
      {/* Wallet UI */}
      <div className="flex items-center gap-3 bg-gray-800 rounded-xl px-6 py-3 shadow-lg mt-8 mb-4 self-start">
        <span className="inline-block w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center text-black font-bold text-lg mr-2">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path fill="#000" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
        </span>
        <span className="text-yellow-300 font-bold text-xl">{points}</span>
        <span className="text-gray-300 ml-1">Points</span>
      </div>
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 text-lg font-bold animate-bounce">
          {toast}
        </div>
      )}
      <h1 className="text-5xl font-bold text-white mb-10 drop-shadow-lg">Chess Game</h1>
      <div className="flex flex-col gap-6 w-80">
        <button
          className="flex items-center justify-center gap-3 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-extrabold py-4 px-8 rounded-2xl text-xl shadow-2xl transition-all duration-200 mb-3 border-4 border-yellow-200 hover:scale-105 active:scale-95"
          onClick={() => setShowLevelModal(true)}
        >
          <Gem className="inline-block text-yellow-600 drop-shadow-md" size={28} />
          Start Game
        </button>
        <button
          className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 hover:from-blue-600 hover:to-blue-400 text-white font-extrabold py-4 px-8 rounded-2xl text-xl shadow-2xl transition-all duration-200 border-4 border-blue-200 hover:scale-105 active:scale-95"
          onClick={() => {
            // Generate a random 6-character room code
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            setRoomCode(code);
            setMode("create-room");
          }}
        >
          <Coins className="inline-block text-yellow-300 drop-shadow-md" size={26} />
          Play with Friend (create room)
        </button>
        <button
          className="flex items-center justify-center gap-3 bg-gradient-to-r from-green-500 via-green-400 to-green-600 hover:from-green-600 hover:to-green-400 text-white font-extrabold py-4 px-8 rounded-2xl text-xl shadow-2xl transition-all duration-200 border-4 border-green-200 hover:scale-105 active:scale-95"
          onClick={() => setMode("join-room-popup")}
        >
          <Coins className="inline-block text-yellow-300 drop-shadow-md" size={26} />
          Play with Friend (join room)
        </button>
        {/* Add LGT Token to MetaMask button */}
        <button
          className="flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 via-purple-500 to-purple-700 hover:from-purple-700 hover:to-purple-500 text-white font-extrabold py-3 px-8 rounded-2xl text-lg shadow-2xl transition-all duration-200 border-4 border-purple-200 hover:scale-105 active:scale-95 mt-2"
          onClick={addLGTtoMetaMask}
        >
          <Gem className="inline-block text-yellow-200 drop-shadow-md" size={22} />
          Add LGT Token to MetaMask
        </button>
      </div>
      {/* Level selection modal */}
      {showLevelModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-gray-900 rounded-xl shadow-2xl p-8 flex flex-col items-center min-w-[320px]">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6">Select Level</h2>
            <div className="flex flex-col gap-4 w-full">
              {levels.map(lvl => (
                <button
                  key={lvl.name}
                  className={`py-3 px-6 rounded-lg text-lg font-bold shadow-lg transition w-full mb-1 ${lvl.unlocked ? 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer' : 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-60'}`}
                  onClick={() => lvl.unlocked && handleLevelSelect(lvl.name)}
                  disabled={!lvl.unlocked}
                >
                  {lvl.name} {lvl.name === "Andhra Pradesh" && !lvl.unlocked && <span className="ml-2 text-xs">(Unlock at Level 5)</span>}
                </button>
              ))}
            </div>
            <button
              className="mt-6 text-gray-400 hover:text-white underline"
              onClick={() => setShowLevelModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {/* Join Room Popup Modal */}
      {mode === "join-room-popup" && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-gray-900 rounded-xl shadow-2xl p-8 flex flex-col items-center min-w-[320px]">
            <h2 className="text-2xl font-bold text-green-400 mb-6">Join Room</h2>
            <input
              className="mb-4 px-4 py-2 rounded text-lg text-black w-56"
              placeholder="Enter room code"
              value={inputCode}
              onChange={e => setInputCode(e.target.value.toUpperCase())}
              maxLength={8}
              autoFocus
            />
            <button
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-6 rounded-lg text-lg shadow-lg transition mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                setRoomCode(inputCode);
                onJoinRoom(inputCode);
                setInputCode("");
                setMode("home");
              }}
              disabled={!inputCode}
            >
              Join Game
            </button>
            <button
              className="text-gray-400 hover:text-white underline"
              onClick={() => {
                setInputCode("");
                setMode("home");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {/* Render ChessGame with points props if needed */}
      {mode === "game" && (
        <ChessGame
          roomCode={roomCode}
          mode={mode}
          points={points}
          setPoints={setPoints}
          showToast={msg => {
            setToast(msg);
            setTimeout(() => setToast(""), 2500);
          }}
        />
      )}
    </div>
  );
} 
import React, { useState } from "react";

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

export default function Home({ onStartGame, onCreateRoom, onJoinRoom }) {
  const [mode, setMode] = useState("home");
  const [roomCode, setRoomCode] = useState("");
  const [inputCode, setInputCode] = useState("");

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <h1 className="text-5xl font-bold text-white mb-10 drop-shadow-lg">Chess Game</h1>
      <div className="flex flex-col gap-6 w-80">
        <button
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-4 px-8 rounded-lg text-xl shadow-lg transition mb-3"
          onClick={onStartGame}
        >
          Start Game
        </button>
        <button
          className="bg-gray-700 text-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg opacity-60 cursor-not-allowed"
          disabled
        >
          Multiplayer (coming soon)
        </button>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg transition"
          onClick={() => {
            // Generate a random 6-character room code
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            setRoomCode(code);
            setMode("create-room");
          }}
        >
          Play with Friend (create room)
        </button>
        <button
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg transition"
          onClick={() => setMode("join-room")}
        >
          Play with Friend (join room)
        </button>
        {/* Add LGT Token to MetaMask button */}
        <button
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg text-lg shadow-lg transition mt-2"
          onClick={addLGTtoMetaMask}
        >
          Add LGT Token to MetaMask
        </button>
      </div>
    </div>
  );
} 
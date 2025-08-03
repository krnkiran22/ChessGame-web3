import React, { useState } from "react";
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from './wagmi.js';
import ChessGame from './components/ChessGame';
import Home from './components/Home';

import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();




export default function App() {
  const [page, setPage] = useState("home");
  const [roomCode, setRoomCode] = useState("");
  const [mode, setMode] = useState(""); // "local", "create", "join"

  const gameComponent = page === "game" ? <ChessGame roomCode={roomCode} mode={mode} /> : null;
  const homeComponent = page === "home" ? (
    <Home
      onStartGame={() => {
        setMode("local");
        setPage("game");
      }}
      onCreateRoom={code => {
        setRoomCode(code);
        setMode("create");
        setPage("game");
      }}
      onJoinRoom={code => {
        setRoomCode(code);
        setMode("join");
        setPage("game");
      }}
    />
  ) : null;

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {gameComponent}
          {homeComponent}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

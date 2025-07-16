import React, { useState } from "react";
import ChessGame from './components/ChessGame';
import Home from './components/Home';

export default function App() {
  const [page, setPage] = useState("home");
  const [roomCode, setRoomCode] = useState("");
  const [mode, setMode] = useState(""); // "local", "create", "join"

  if (page === "game") {
    return <ChessGame roomCode={roomCode} mode={mode} />;
  }

  return <Home
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
  />;
}

import { useEffect, useState } from "react";
import { socket } from "./services/socket";
import GameLobby from "./components/GameLobby";
import GameRoom from "./components/GameRoom";
import GameBoard from "./components/GameBoard";
import GameOver from "./components/GameOver";
import PlayerHand from "./components/PlayerHand";
import type { PublicPlayer, PublicGameState, Card } from "../../shared/types";
import "./App.css";

type GameScreen = "lobby" | "room" | "game" | "game-over";

function App() {
  const [winner, setWinner] = useState<PublicPlayer | null>(null);
  const [currentScreen, setCurrentScreen] = useState<GameScreen>("lobby");
  const [error, setError] = useState("");

  const [players, setPlayers] = useState<PublicPlayer[]>([]);
  const [gameState, setGameState] = useState<PublicGameState | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<number | undefined>();
  const [playerId, setPlayerId] = useState("");

  useEffect(() => {
    socket.on("room_created", ({ roomId: code, playerId: pid }) => {
      setRoomCode(code);
      setPlayerId(pid);
      setCurrentScreen("room");
      setError("");
    });

    socket.on("room_joined", ({ roomId: code, playerId: pid }) => {
      setRoomCode(code);
      setPlayerId(pid);
      setCurrentScreen("room");
      setError("");
    });

    socket.on("room_error", ({ message }) => {
      setError(message);
    });

    socket.on(
      "game_state_update",
      ({ players: newPlayers, gameState: newGameState, roomId: code }) => {
        setPlayers(newPlayers);
        setGameState(newGameState);
        setRoomCode(code);
      }
    );

    socket.on("game_started", () => {
      setCurrentScreen("game");
    });

    socket.on("your_hand", (hand) => {
      setPlayerHand(hand);
    });

    socket.on("game_over", ({ winner }) => {
      setWinner(winner ?? null);
      setCurrentScreen("game-over");
    });

    socket.on("game_aborted", ({ reason }) => {
      console.log("game_aborted", reason);
      setCurrentScreen("room");
    });

    socket.on("player_left", ({ playerName }) => {
      console.log("player_left", playerName);
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("room_created");
      socket.off("room_joined");
      socket.off("room_error");
      socket.off("game_state_update");
      socket.off("game_started");
      socket.off("your_hand");
      socket.off("game_over");
      socket.off("game_aborted");
      socket.off("player_left");
    };
  }, []);

  const handleJoinRoom = (name: string, code: string) => {
    setError("");
    socket.emit("join_room", { playerName: name, roomId: code });
  };

  const handleCreateRoom = (name: string) => {
    setError("");
    socket.emit("create_room", { playerName: name });
  };

  const handleStartGame = () => {
    socket.emit("start_game");
  };

  const handleLeaveRoom = () => {
    socket.emit("leave_room");
    setCurrentScreen("lobby");
    setPlayers([]);
    setGameState(null);
    setRoomCode("");
    setPlayerHand([]);
    setSelectedCard(undefined);
    setPlayerId("");
  };

  const handleToggleReady = () => {
    socket.emit("player_ready");
  };

  const handleCardSelect = (cardNumber: number) => {
    if (gameState?.phase !== "playing") {
      return;
    }
    setSelectedCard((prev) => (prev === cardNumber ? undefined : cardNumber));
    socket.emit("select_card", { card: cardNumber });
  };

  const handleConfirmSelection = () => {
    if (!selectedCard) {
      return;
    }

    socket.emit("submit_card");
    setSelectedCard(undefined);
  };

  const handleRowSelect = (rowIndex: number) => {
    socket.emit("select_row", { row: rowIndex });
  };

  const handleBackToRoom = () => {
    setCurrentScreen("room");
  };

  // derived
  const currentPlayer = players.find((p) => p.id === playerId);
  const readyCount = players.filter((p) => p.isReady).length;
  const canStartGame =
    players.length >= 2 &&
    readyCount === players.length &&
    currentPlayer?.isHost;

  return (
    <div className="app-container">
      {currentScreen === "lobby" && (
        <GameLobby
          onJoinRoom={handleJoinRoom}
          onCreateRoom={handleCreateRoom}
          error={error}
        />
      )}

      {currentScreen === "room" && (
        <GameRoom
          roomId={roomCode}
          players={players}
          currentPlayer={playerId}
          onStartGame={handleStartGame}
          onLeaveRoom={handleLeaveRoom}
          onToggleReady={handleToggleReady}
          canStartGame={!!canStartGame}
        />
      )}

      {currentScreen === "game" && gameState && (
        <div className="game-screen">
          <div className="game-layout">
            <GameBoard
              rows={gameState.rows}
              players={players}
              currentPlayer={playerId}
              gamePhase={
                gameState.phase === "selecting-row"
                  ? "selecting-row"
                  : gameState.phase === "round-reveal"
                  ? "round-reveal"
                  : "playing"
              }
              roundCards={gameState.roundCards}
              onRowSelect={handleRowSelect}
              selectableRows={
                gameState.phase === "selecting-row" &&
                gameState.playerToSelectRow === playerId
              }
            />

            <PlayerHand
              cards={playerHand}
              selectedCard={selectedCard}
              onCardSelect={handleCardSelect}
              onConfirmSelection={handleConfirmSelection}
              isMyTurn={
                gameState.phase === "playing" &&
                !currentPlayer?.hasSubmittedCard
              }
              canConfirm={!!selectedCard && !currentPlayer?.hasSubmittedCard}
            />
          </div>
        </div>
      )}

      {currentScreen === "game-over" && (
        <GameOver
          winner={winner}
          players={players}
          onBackToRoom={handleBackToRoom}
        />
      )}
    </div>
  );
}

export default App;

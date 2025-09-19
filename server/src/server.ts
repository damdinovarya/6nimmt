import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { randomUUID } from "crypto";

import { GameEngine } from "./gameEngine";

import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  GameRoom,
  Player,
  PublicPlayer,
  PublicGameState,
  GameState,
} from "../../shared/types";

const PORT = process.env.PORT || 3000;
const CLIENT_ORIGIN = process.env.ORIGIN || "http://localhost:5173";

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));

const server = http.createServer(app);
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server, {
  cors: { origin: CLIENT_ORIGIN, methods: ["GET", "POST"] },
});

const rooms = new Map<string, GameRoom>();

io.on("connection", (socket) => {
  console.log(rooms);

  // Helper function to get public player data
  const getPublicPlayer = (player: Player): PublicPlayer => ({
    id: player.id,
    name: player.name,
    isReady: player.isReady,
    isHost: player.isHost,
    penaltyScore: player.penaltyScore,
    hasSubmittedCard: player.hasSubmittedCard,
  });

  // Helper function to get public game state
  const getPublicGameState = (gameState: GameState): PublicGameState => ({
    phase: gameState.phase,
    rows: gameState.rows,
    roundCards: gameState.roundCards.map((c) => ({
      playerId: c.playerId,
      card: gameState.phase === "round-reveal" ? c.card : undefined,
    })),
    playerToSelectRow: gameState.playerToSelectRow,
    round: gameState.round,
    maxRounds: gameState.maxRounds,
  });

  // Helper function to broadcast room state
  const broadcastRoomState = (roomId: string) => {
    const room = rooms.get(roomId);
    if (!room) {
      return;
    }

    const publicPlayers = Array.from(room.players.values()).map(
      getPublicPlayer
    );
    const publicGameState = getPublicGameState(room.gameState);

    io.to(roomId).emit("game_state_update", {
      players: publicPlayers,
      gameState: publicGameState,
      roomId: room.id,
    });
  };

  // Helper function to generate room code
  const generateroomId = (): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return rooms.has(result) ? generateroomId() : result;
  };

  // Helper function to abort game and send everyone back to lobby
  const abortGame = (roomId: string, reason: string) => {
    const room = rooms.get(roomId);
    if (!room) return;

    // Reset game state to waiting
    room.gameState = {
      phase: "waiting",
      rows: [],
      deck: [],
      roundCards: [],
      round: 1,
      maxRounds: 10,
    };

    // Reset all players
    for (const player of Array.from(room.players.values())) {
      player.penaltyScore = 0;
      player.hand = [];
      player.selectedCard = undefined;
      player.hasSubmittedCard = false;
      player.isReady = false;
    }

    io.to(roomId).emit("game_aborted", { reason });
    broadcastRoomState(roomId);
  };

  // Handle player leaving (disconnect or manual leave)
  const handlePlayerLeaving = () => {
    const { roomId, playerId, playerName } = socket.data;
    if (!roomId || !playerId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    // Check if game is in progress
    const wasGameActive = room.gameState.phase !== "waiting";

    // Remove player from room
    room.players.delete(playerId);
    socket.leave(roomId);

    // If room is empty, delete it
    if (room.players.size === 0) {
      rooms.delete(roomId);
      return;
    }

    // If game was active, abort it and send everyone back to lobby
    if (wasGameActive) {
      abortGame(roomId, `${playerName} left the game`);
      io.to(roomId).emit("player_left", { playerName });
      return;
    }

    // If game was not active, just assign new host
    const players = Array.from(room.players.values());
    const currentHost = players.find((p) => p.isHost);
    if (!currentHost && players.length > 0) {
      players[0].isHost = true;
    }

    io.to(roomId).emit("player_left", { playerName });
    broadcastRoomState(roomId);
  };

  // Join Room
  socket.on("join_room", (data) => {
    const { playerName, roomId } = data;

    //   socket.emit("room_error", {
    //     message: "Invalid data",
    //   });

    try {
      const room = rooms.get(roomId);

      if (playerName.length < 1 || playerName.length > 20) {
        socket.emit("room_error", { message: "Invalid name" });
        return;
      }

      if (!room) {
        socket.emit("room_error", { message: "Room not found" });
        return;
      }

      if (room.gameState.phase !== "waiting") {
        socket.emit("room_error", { message: "Game already in progress" });
        return;
      }

      if (room.players.size >= room.maxPlayers) {
        socket.emit("room_error", { message: "Room is full" });
        return;
      }

      const playerId = randomUUID();
      const player: Player = {
        id: playerId,
        name: playerName,
        isReady: false,
        isHost: false,
        penaltyScore: 0,
        hand: [],
        hasSubmittedCard: false,
      };

      room.players.set(playerId, player);

      socket.data = { playerId, playerName, roomId };
      socket.join(roomId);

      socket.emit("room_joined", {
        roomId,
        playerId,
      });

      broadcastRoomState(roomId);
    } catch (error) {
      socket.emit("room_error", { message: "Failed to join room" });
    }
  });

  // Create Room
  socket.on("create_room", (data) => {
    const { playerName } = data;

    if (playerName.length < 1 || playerName.length > 20) {
      socket.emit("room_error", { message: "Invalid name" });
      return;
    }

    try {
      const roomId = generateroomId();
      const playerId = randomUUID();

      // Create player
      const player: Player = {
        id: playerId,
        name: playerName,
        isReady: false,
        isHost: true,
        penaltyScore: 0,
        hand: [],
        hasSubmittedCard: false,
      };

      // Create room
      const room: GameRoom = {
        id: roomId,
        players: new Map([[playerId, player]]),
        gameState: {
          phase: "waiting",
          rows: [],
          deck: [],
          roundCards: [],
          round: 1,
          maxRounds: 10,
        },
        maxPlayers: 10,
      };

      rooms.set(roomId, room);

      // Set socket data and join room
      socket.data = { playerId, playerName, roomId };
      socket.join(roomId);

      socket.emit("room_created", {
        roomId,
        playerId,
      });

      broadcastRoomState(roomId);
    } catch (error) {
      socket.emit("room_error", { message: "Failed to create room" });
    }
  });

  // Player Ready Toggle
  socket.on("player_ready", () => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) {
      return;
    }

    const room = rooms.get(roomId);
    if (!room) {
      return;
    }

    const player = room.players.get(playerId);
    if (!player) {
      return;
    }

    player.isReady = !player.isReady;
    broadcastRoomState(roomId);
  });

  // Start Game
  socket.on("start_game", () => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) {
      return;
    }

    const room = rooms.get(roomId);
    if (!room) {
      return;
    }

    const player = room.players.get(playerId);
    if (!player?.isHost) {
      return;
    }

    const players = Array.from(room.players.values());
    if (players.length < 2 || !players.every((p) => p.isReady)) {
      {
        return;
      }
    }

    // Initialize game
    GameEngine.initializeGame(room);

    // Send private hands to each player
    const socketsInRoom = Array.from(io.sockets.sockets.values()).filter((s) =>
      s.rooms.has(roomId)
    );

    for (const playerSocket of socketsInRoom) {
      const socketPlayerId = playerSocket.data.playerId;
      const gamePlayer = room.players.get(socketPlayerId);
      if (gamePlayer) {
        playerSocket.emit("your_hand", gamePlayer.hand);
      }
    }

    io.to(roomId).emit("game_started");
    broadcastRoomState(roomId);
  });

  // Select Card
  socket.on("select_card", (data) => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) {
      return;
    }

    try {
      const { card } = data;

      const room = rooms.get(roomId);
      if (!room || room.gameState.phase !== "playing") {
        return;
      }

      const player = room.players.get(playerId);
      if (!player || player.hasSubmittedCard) {
        return;
      }

      // Check if player has this card
      const hasCard = player.hand.some((c) => c.number === card);
      if (!hasCard) {
        return;
      }

      player.selectedCard = card;
      broadcastRoomState(roomId);
    } catch (error) {
      console.error("Select card error:", error);
    }
  });

  // Submit Card
  socket.on("submit_card", () => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) {
      return;
    }

    const room = rooms.get(roomId);
    if (!room || room.gameState.phase !== "playing") {
      return;
    }

    const player = room.players.get(playerId);
    if (!player || !player.selectedCard || player.hasSubmittedCard) {
      return;
    }

    // Find and remove card from hand
    const cardIndex = player.hand.findIndex(
      (card) => card.number === player.selectedCard
    );
    if (cardIndex === -1) {
      return;
    }

    const selectedCard = player.hand[cardIndex];
    player.hand.splice(cardIndex, 1);

    socket.emit("your_hand", player.hand);

    // Add to round cards
    room.gameState.roundCards.push({
      playerId,
      card: selectedCard,
    });

    player.hasSubmittedCard = true;
    player.selectedCard = undefined;

    // Check if all players submitted
    if (GameEngine.allPlayersSubmitted(room)) {
      room.gameState.phase = "round-reveal";

      broadcastRoomState(roomId);

      setTimeout(() => {
        const currentRoom = rooms.get(roomId);
        if (!currentRoom) {
          return;
        }

        // Resolve round
        const result = GameEngine.resolveRound(currentRoom);

        if (result.playersToSelectRow.length > 0) {
          currentRoom.gameState.phase = "selecting-row";
        } else {
          // Move to next round
          currentRoom.gameState.round++;

          if (GameEngine.isGameOver(currentRoom)) {
            currentRoom.gameState.phase = "finished";
            const winner = GameEngine.getWinner(currentRoom);
            io.to(roomId).emit("game_over", {
              winner: winner ? getPublicPlayer(winner) : null,
            });
          } else {
            currentRoom.gameState.phase = "playing";
            GameEngine.resetRound(currentRoom);
          }
        }

        broadcastRoomState(roomId);
      }, 3000); // Show revealed cards for 3 seconds
    } else {
      broadcastRoomState(roomId);
    }
  });

  // Select Row
  socket.on("select_row", (data) => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) {
      return;
    }

    try {
      const { row } = data;
      const room = rooms.get(roomId);
      if (!room || room.gameState.phase !== "selecting-row") {
        return;
      }

      if (room.gameState.playerToSelectRow !== playerId) {
        return;
      }

      const success = GameEngine.playerSelectsRow(room, playerId, row);
      if (!success) {
        return;
      }

      // Check if more players need to select rows or if round is complete
      if (!room.gameState.playerToSelectRow) {
        // Round complete, move to next round
        room.gameState.round++;

        if (GameEngine.isGameOver(room)) {
          room.gameState.phase = "finished";
          const winner = GameEngine.getWinner(room);
          io.to(roomId).emit("game_over", {
            winner: winner ? getPublicPlayer(winner) : null,
          });
        } else {
          room.gameState.phase = "playing";
          GameEngine.resetRound(room);
        }
      }

      broadcastRoomState(roomId);
    } catch (error) {
      console.error("Select row error:", error);
    }
  });

  // Leave Room
  socket.on("leave_room", () => {
    handlePlayerLeaving();
  });

  // Disconnect
  socket.on("disconnect", () => {
    handlePlayerLeaving();
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

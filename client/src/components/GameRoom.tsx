import type { PublicPlayer } from "../../../shared/types";
import "./styles/GameRoom.css";

interface Props {
  roomId: string;
  players: PublicPlayer[];
  currentPlayer: string; // id
  canStartGame: boolean;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onToggleReady: () => void;
}

export default function GameRoom({
  roomId,
  players,
  currentPlayer,
  canStartGame,
  onStartGame,
  onLeaveRoom,
  onToggleReady,
}: Props) {
  const currentPlayerData = players.find((p) => p.id === currentPlayer);
  return (
    <div className="game-room">
      <div className="room-header">
        <h2 className="room-title">Комната: {roomId}</h2>
        <div className="room-buttons">
          <button
            className={`btn ${
              currentPlayerData?.isReady ? "btn--primary" : "btn--success"
            }`}
            onClick={onToggleReady}
          >
            {currentPlayerData?.isReady ? "Не готов" : "Готов"}
          </button>

          {canStartGame && (
            <button className="btn btn--success" onClick={onStartGame}>
              Начать игру
            </button>
          )}

          <button className="btn btn--danger" onClick={onLeaveRoom}>
            Выйти
          </button>
        </div>
      </div>

      <ul className="room-players">
        {players.map((p) => (
          <li
            key={p.id}
            className={`room-player ${
              p.id === currentPlayer ? "room-player-me" : ""
            } ${p.isReady ? "room-player-ready" : ""}`}
          >
            <span>{p.name}</span>
            {p.isHost && <span className="room-player-host"> (host)</span>}
            {p.id === currentPlayer && (
              <span className="room-player-host">(me)</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

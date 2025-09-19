import type { PublicPlayer } from "../../../shared/types";
import "./styles/GameOver.css";

interface Props {
  winner: PublicPlayer | null;
  players: PublicPlayer[];
  onBackToRoom: () => void;
}

const GameOver = ({ winner, players, onBackToRoom }: Props) => {
  const sorted = [...players].sort((a, b) => a.penaltyScore - b.penaltyScore);
  return (
    <div className="game-over">
      <h2 className="go-title">Игра завершена</h2>

      <div className="go-winner">
        Победитель: <strong>{winner?.name}</strong> ({winner?.penaltyScore})
      </div>

      <div className="go-table">
        {sorted.map((p, i) => (
          <div key={p.id} className={`go-row ${i === 0 ? "first" : ""}`}>
            <span className="go-place">{i + 1}.</span>
            <span className="go-name">{p.name}</span>
            <span className="go-score">{p.penaltyScore}</span>
          </div>
        ))}
      </div>

      <div className="go-buttons">
        <button className="btn btn--success" onClick={onBackToRoom}>
          Вернуться в комнату
        </button>
      </div>
    </div>
  );
};

export default GameOver;

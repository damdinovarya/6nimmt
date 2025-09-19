import GameRow from "./GameRow";
import GameCard from "./GameCard";
import type { Card, PublicPlayer } from "../../../shared/types";
import "./styles/GameBoard.css";

type GamePhase = "playing" | "round-reveal" | "selecting-row";

interface Props {
  rows: Card[][];
  players: PublicPlayer[];
  currentPlayer: string; // id
  gamePhase: GamePhase;
  roundCards: { playerId: string; card?: Card }[];
  selectableRows: boolean;
  onRowSelect: (rowIndex: number) => void;
}

const GameBoard = ({
  rows,
  players,
  currentPlayer,
  gamePhase,
  roundCards,
  selectableRows,
  onRowSelect,
}: Props) => {
  const isReveal = gamePhase === "round-reveal";

  return (
    <div className="game-board">
      <div className="board-players">
        {players.map((p) => (
          <div
            key={p.id}
            className={`board-player ${p.id === currentPlayer ? "board-player-me" : ""}`}
          >
            <span>{p.name}</span>
            <span> — {p.penaltyScore}</span>
          </div>
        ))}
      </div>

      {isReveal && (
        <div className="reveal">
          <div className="reveal-title">Сыгранные карты:</div>
          <div className="reveal-grid">
            {roundCards.map(({ playerId, card }) => (
              <div key={playerId} className="reveal-item">
                <div className="reveal-name">
                  {players.find((p) => p.id === playerId)!.name}
                </div>
                <div className="reveal-card">
                  {<GameCard number={card!.number} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="board-rows">
        {rows.map((row, idx) => (
          <div key={idx} className="board-row">
            <GameRow
              rowIndex={idx}
              cards={row}
              canSelect={gamePhase === "selecting-row" && selectableRows}
              onSelect={onRowSelect}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameBoard;

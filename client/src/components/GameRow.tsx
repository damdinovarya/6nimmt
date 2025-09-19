import GameCard from "./GameCard";
import type { Card } from "../../../shared/types";
import "./styles/GameRow.css";

interface Props {
  rowIndex: number;
  cards: Card[];
  canSelect: boolean;
  onSelect: (rowIndex: number) => void;
}

const GameRow = ({ rowIndex, cards, canSelect, onSelect }: Props) => {
  return (
    <div
      className={`game-row ${canSelect ? "row-selectable" : ""}`}
      onClick={canSelect ? () => onSelect(rowIndex) : undefined}
    >
      {cards.map((c) => (
        <GameCard key={c.number} number={c.number} className="row-card" />
      ))}
    </div>
  );
};

export default GameRow;

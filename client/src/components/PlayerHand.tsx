import GameCard from "./GameCard";
import type { Card } from "../../../shared/types";
import "./styles/PlayerHand.css";

interface Props {
  cards: Card[];
  selectedCard?: number;
  onCardSelect: (cardNumber: number) => void;
  onConfirmSelection: () => void;
  isMyTurn: boolean;
  canConfirm: boolean;
}

const PlayerHand = ({
  cards,
  selectedCard,
  onCardSelect,
  onConfirmSelection,
  isMyTurn,
  canConfirm,
}: Props) => {
  return (
    <div className="player-hand">
      <div className="hand-header">
        <span className="hand-turn">
          {isMyTurn ? "Ваш ход" : "Ожидание других…"}
        </span>
        <button
          className="btn btn--success"
          onClick={onConfirmSelection}
          disabled={!canConfirm}
        >
          Подтвердить карту
        </button>
      </div>

      <div className="hand-cards">
        {cards.map((c) => (
          <GameCard
            key={c.number}
            number={c.number}
            selected={selectedCard === c.number}
            onClick={() => onCardSelect(c.number)}
            className="hand-card"
          />
        ))}
      </div>
    </div>
  );
};

export default PlayerHand;

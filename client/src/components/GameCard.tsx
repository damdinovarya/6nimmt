import { getCardSrc } from "../assets/cards";
import "./styles/GameCard.css";

type Props = {
  number: number;
  selected?: boolean;
  className?: string;
  onClick?: () => void;
};

const GameCard = ({ number, selected = false, className, onClick }: Props) => {
  const src = getCardSrc(number);
  return (
    <img
      className={`game-card ${selected ? "card-selected" : ""} ${className}`}
      src={src}
      alt={`Card ${number}`}
      onClick={onClick}
    />
  );
};

export default GameCard;

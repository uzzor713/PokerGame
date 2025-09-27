import { getCardImage } from "../data/cards";

interface CardProps {
  value: string; // 牌值
}

export default function Card({ value }: CardProps) {
  if (value === "?") {
    // 卡背
    return (
      <img
        src="/cards/back.png"
        alt="背面"
        className="w-28 h-42 object-contain rounded shadow"
      />
    );
  }

  return (
    <img
      src={getCardImage(value)}
      alt={value}
      className="w-28 h-42 object-contain rounded shadow"
    />
  );
}

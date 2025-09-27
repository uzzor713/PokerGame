import Card from "./Card";

interface PlayerHandProps {
  cards: string[];
}

export default function PlayerHand({ cards }: PlayerHandProps) {
  return (
    <div>
      <h2 className="text-xl mb-2 text-center">玩家手牌</h2>
      <div className="flex space-x-2">
        {cards.map((card, idx) => (
          <Card key={idx} value={card} />
        ))}
      </div>
    </div>
  );
}

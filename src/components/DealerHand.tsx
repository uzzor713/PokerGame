import Card from "./Card";

interface DealerHandProps {
  cards: string[];
  reveal: boolean;
}

export default function DealerHand({ cards, reveal }: DealerHandProps) {
  return (
    <div>
      <h2 className="text-xl mb-2 text-center">庄家手牌</h2>
      <div className="flex space-x-2">
        {cards.map((card, idx) => {
          if (idx === 1 && !reveal) {
            return <Card key={idx} value="?" />;
          }
          return <Card key={idx} value={card} />;
        })}
      </div>
    </div>
  );
}

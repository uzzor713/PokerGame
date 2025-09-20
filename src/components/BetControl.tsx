interface BetControlProps {
  bet: number;
  setBet: (value: number) => void;
  minBet?: number;
  step?: number;
}

export default function BetControl({ bet, setBet, minBet = 100, step = 100 }: BetControlProps) {
  const increment = () => setBet(bet + step);
  const decrement = () => setBet(Math.max(minBet, bet - step));
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value) || minBet;
    if (value < minBet) value = minBet;
    value = Math.floor(value / step) * step; // 保证是 step 整倍数
    setBet(value);
  };

  return (
    <div className="flex flex-col items-center mb-4">
      <span className="text-white font-semibold mb-2">底注: {minBet}</span>
      <div className="flex items-center space-x-2">
        <button
          className="btn-primary w-12 h-10 flex items-center justify-center"
          onClick={decrement}
        >
          -
        </button>
        <input
          type="number"
          className="w-24 h-10 text-center rounded
                     [&::-webkit-outer-spin-button]:appearance-none
                     [&::-webkit-inner-spin-button]:appearance-none
                     -moz-appearance:textfield"
          value={bet}
          onChange={handleChange}
        />
        <button
          className="btn-primary w-12 h-10 flex items-center justify-center"
          onClick={increment}
        >
          +
        </button>
      </div>
    </div>
  );
}

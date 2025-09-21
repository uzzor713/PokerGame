import { useState } from 'react';

interface BetControlProps {
  bet: number;
  setBet: (value: number) => void;
  minBet?: number;
  step?: number;
  disabled?: boolean; // 新增
}

export default function BetControl({
  bet,
  setBet,
  minBet = 100,
  step = 100,
  disabled = false, // 默认可用
}: BetControlProps) {
  const [inputValue, setInputValue] = useState(bet.toString());

  const increment = () => {
    if (disabled) return; // 禁用时不操作
    const newValue = bet + step;
    setBet(newValue);
    setInputValue(newValue.toString());
  };

  const decrement = () => {
    if (disabled) return;
    const newValue = Math.max(minBet, bet - step);
    setBet(newValue);
    setInputValue(newValue.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    setInputValue(e.target.value);
  };

  const commitValue = () => {
    if (disabled) return;
    let value = parseInt(inputValue);
    if (isNaN(value)) value = minBet;
    if (value < minBet) value = minBet;
    value = Math.floor(value / step) * step;
    setBet(value);
    setInputValue(value.toString());
  };

  return (
    <div className="flex flex-col items-center mb-4">
      <span className="text-white font-semibold mb-2">底注: {minBet}</span>
      <div className="flex items-center space-x-2">
        <button
          className={`btn-primary w-16 h-10 flex items-center justify-center ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={decrement}
          disabled={disabled}
        >
          -{step}
        </button>
        <input
          type="text"
          className="w-24 h-10 text-center rounded
                     [&::-webkit-outer-spin-button]:appearance-none
                     [&::-webkit-inner-spin-button]:appearance-none
                     -moz-appearance:textfield"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={commitValue}
          onKeyDown={(e) => e.key === 'Enter' && commitValue()}
          disabled={disabled}
        />
        <button
          className={`btn-primary w-16 h-10 flex items-center justify-center ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={increment}
          disabled={disabled}
        >
          +{step}
        </button>
      </div>
    </div>
  );
}

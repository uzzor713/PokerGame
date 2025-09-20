import React from 'react';

interface CardProps {
  value: string;
}

export default function Card({ value }: CardProps) {
  return (
    <div className="w-24 h-36 bg-white text-black flex justify-center items-center rounded shadow">
      {value}
    </div>
  );
}

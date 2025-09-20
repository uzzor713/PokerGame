export const suits = ['♠', '♥', '♦', '♣'];
export const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

export const deck = suits.flatMap(suit => ranks.map(rank => `${rank}${suit}`));

// 洗牌函数
export function shuffleDeck(deck: string[]): string[] {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}

// 计算牌点数（A算11或1，J/Q/K算10）
export function calculatePoints(cards: string[]): number {
  let sum = 0;
  let aces = 0;

  cards.forEach(card => {
    const rank = card.slice(0, -1); // 去掉花色
    if (rank === 'A') {
      sum += 11;
      aces += 1;
    } else if (['J','Q','K'].includes(rank)) {
      sum += 10;
    } else {
      sum += parseInt(rank);
    }
  });

  // 如果超过21点，把A当作1点
  while (sum > 21 && aces > 0) {
    sum -= 10;
    aces--;
  }

  return sum;
}

import { useState } from 'react';
import { deck, shuffleDeck, calculatePoints } from '../data/cards';
import DealerHand from '../components/DealerHand';
import PlayerHand from '../components/PlayerHand';

export default function Game() {
  const [playerCards, setPlayerCards] = useState<string[]>([]);
  const [dealerCards, setDealerCards] = useState<string[]>([]);
  const [gameDeck, setGameDeck] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [dealerReveal, setDealerReveal] = useState(false);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);

  const startGame = () => {
    const newDeck = shuffleDeck(deck);
    setPlayerCards([]);
    setDealerCards([]);
    setMessage('');
    setDealerReveal(false);
    setIsPlayerTurn(false);

    // 动画发牌
    setTimeout(() => {
      setPlayerCards([newDeck[0]]);
      setTimeout(() => {
        setPlayerCards([newDeck[0], newDeck[1]]);
        setTimeout(() => {
          setDealerCards([newDeck[2]]);
          setTimeout(() => {
            setDealerCards([newDeck[2], newDeck[3]]);
            setIsPlayerTurn(true);
          }, 500);
        }, 500);
      }, 500);
    }, 500);
    
    setGameDeck(newDeck.slice(4));

  };

  const playerHit = () => {
    if (gameDeck.length === 0 || !isPlayerTurn) return;
    const [nextCard, ...restDeck] = gameDeck;
    const newPlayerCards = [...playerCards, nextCard];
    setPlayerCards(newPlayerCards);
    setGameDeck(restDeck);

    const points = calculatePoints(newPlayerCards);
    if (points > 21) {
      setMessage('玩家爆掉！庄家胜利');
      setDealerReveal(true);
      setIsPlayerTurn(false);
    }
  };

  const dealerTurn = () => {
    if (!isPlayerTurn || message) return;
    setDealerReveal(true);
    setIsPlayerTurn(false);
    const newDealerCards = [...dealerCards];
    let remainingDeck = [...gameDeck];

    // 第一个周期只翻牌
    setTimeout(() => {
      const dealOne = () => {
        const dealerPoints = calculatePoints(newDealerCards);
        if (dealerPoints < 17 && remainingDeck.length > 0) {
          const [nextCard, ...restDeck] = remainingDeck;
          newDealerCards.push(nextCard);
          remainingDeck = restDeck;
          setDealerCards([...newDealerCards]);
          setGameDeck([...remainingDeck]);
          setTimeout(dealOne, 1000);
        } else {
          // 结算
          const playerPoints = calculatePoints(playerCards);
          if (dealerPoints > 21) {
            setMessage('庄家爆掉！玩家胜利');
          } else if (playerPoints > dealerPoints) {
            setMessage('玩家胜利！');
          } else if (dealerPoints === playerPoints) {
            setMessage('平局');
          } else {
            setMessage('庄家胜利！');
          }
        }
      };
      dealOne();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_#14532d_0%,_#052e16_80%)] text-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.1)_0%,_transparent_70%)]" />
      <header className="fixed top-0 left-0 w-full z-10">
        <h1 className="text-3xl font-bold py-4 text-center">黑杰克 21 点</h1>
      </header>

      {/* 庄家手牌固定在顶部 header 下方 */}
      <div className="absolute top-24 left-0 w-full flex flex-col items-center z-0">
        <DealerHand cards={dealerCards} reveal={dealerReveal} />
      </div>

      {/* 玩家手牌固定在底部 */}
      <div className="absolute bottom-24 left-0 w-full flex flex-col items-center z-0">
        <PlayerHand cards={playerCards} />
      </div>

      {/* 按钮居中显示 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex space-x-4 z-10">
        <button className="btn-primary px-6 py-2" onClick={startGame}>
          新的一局
        </button>
        <button
          className={`btn-primary px-6 py-2${
            !isPlayerTurn ? ' opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={playerHit}
          disabled={!isPlayerTurn}
        >
          要牌
        </button>
        <button
          className={`btn-primary px-6 py-2${
            !isPlayerTurn ? ' opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={dealerTurn}
          disabled={!isPlayerTurn}
        >
          停牌
        </button>
      </div>

      {/* 提示消息固定在按钮下方 */}
      {message && (
        <div className="absolute left-1/2 top-[calc(50%+60px)] -translate-x-1/2 z-10">
          <p className="text-2xl font-bold mt-4 text-center">{message}</p>
        </div>
      )}
    </div>
  );
}

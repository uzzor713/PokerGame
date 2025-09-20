import { useState } from 'react';
import { deck, shuffleDeck, calculatePoints } from '../data/cards';
import DealerHand from '../components/DealerHand';
import PlayerHand from '../components/PlayerHand';
import BetControl from '../components/BetControl';

export default function Game() {
  const [playerCards, setPlayerCards] = useState<string[]>([]);      // 当前玩家的手牌
  const [dealerCards, setDealerCards] = useState<string[]>([]);      // 当前庄家的手牌
  const [gameDeck, setGameDeck] = useState<string[]>([]);            // 当前游戏使用的牌堆
  const [message, setMessage] = useState('');                        // 游戏结束后的提示消息
  const [dealerReveal, setDealerReveal] = useState(false);           // 庄家是否翻开暗牌
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);            // 是否轮到玩家回合            
  const [gameOver, setGameOver] = useState(true);                    // 游戏是否结束
  const [bet, setBet] = useState(100);                               // 当前下注筹码
  const [playerChips, setPlayerChips] = useState(1000);             // 玩家总筹码

  // 独立函数：初始牌 Blackjack 判定
  const checkInitialBlackjack = (playerInit: string[], dealerInit: string[]) => {
    const playerPoints = calculatePoints(playerInit);
    const dealerPoints = calculatePoints(dealerInit);
    const playerBlackjack = playerPoints === 21;
    const dealerBlackjack = dealerPoints === 21;

    if (playerBlackjack || dealerBlackjack) {
      setDealerReveal(true);
      setIsPlayerTurn(false);
      setGameOver(true);

      if (playerBlackjack && dealerBlackjack) {
        setMessage('双方 Blackjack，平局');
      } else if (playerBlackjack) {
        setMessage('玩家 Blackjack 胜利，赔付 1.5 倍');
        setPlayerChips((prev) => prev + bet * 1.5);
      } else {
        setMessage('庄家 Blackjack 胜利，玩家失败');
        setPlayerChips((prev) => prev - bet);
      }
      return true;
    }

    // 没有 Blackjack，正常进入玩家回合
    setDealerReveal(false);
    setIsPlayerTurn(true);
    setGameOver(false);
    return false;
  };

  // 延时函数
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // 初始发牌
  const startGame = async () => {
    const newDeck = shuffleDeck(deck);
    const playerInit = [newDeck[0], newDeck[1]];
    const dealerInit = [newDeck[2], newDeck[3]];

    setPlayerCards([]);
    setDealerCards([]);
    setMessage('');
    setDealerReveal(false);
    setIsPlayerTurn(false);
    setGameOver(false);

    setGameDeck(newDeck.slice(4));

    // 动画发牌
    await delay(500);
    setPlayerCards([playerInit[0]]);
    await delay(500);
    setPlayerCards(playerInit);
    await delay(500);
    setDealerCards([dealerInit[0]]);
    await delay(500);
    setDealerCards(dealerInit);

    // 发完牌后判定 Blackjack
    checkInitialBlackjack(playerInit, dealerInit);
  };

  // 玩家要牌
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
      setGameOver(true);
      setPlayerChips((prev) => prev - bet);
    }
  };

  // 玩家停牌，庄家回合
  const dealerTurn = () => {
    if (!isPlayerTurn || message) return;
    setDealerReveal(true);
    setIsPlayerTurn(false);
    const newDealerCards = [...dealerCards];
    let remainingDeck = [...gameDeck];

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
            setPlayerChips((prev) => prev + bet);
          } else if (playerPoints > dealerPoints) {
            setMessage('玩家胜利！');
            setPlayerChips((prev) => prev + bet);
          } else if (dealerPoints === playerPoints) {
            setMessage('平局');
          } else {
            setMessage('庄家胜利！玩家失败');
            setPlayerChips((prev) => prev - bet);
          }
          setGameOver(true);
        }
      };
      dealOne();
    }, 1000);
  };

  return (
    <div className='min-h-screen text-white relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_#14532d_0%,_#052e16_80%)]'>
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.1)_0%,_transparent_70%)]" />

      <header className='fixed top-0 left-0 w-full z-10 bg-transparent'>
        <h1 className="py-4 text-center text-3xl font-bold">黑杰克</h1>
      </header>

      {/* 网格布局 */}
      <div className="grid grid-cols-3 grid-rows-3 gap-4 h-[calc(100vh-4rem)] p-4 pt-20">
        {/* 左侧纸张区域 */}
        <div className="col-start-1 row-start-1 row-span-3 bg-white/90 text-black p-4 rounded-lg shadow-lg overflow-auto mx-auto">
          <h2 className="text-xl font-semibold mb-2">游戏规则 & 提示</h2>
          <p>这里可以放置游戏规则、下注说明以及特殊情况提示。</p>
        </div>

        {/* 中间列 */}
        <div className="col-start-2 row-start-1 flex flex-col items-center justify-start bg-transparent">
          <DealerHand cards={dealerCards} reveal={dealerReveal} />
        </div>

        <div className="col-start-2 row-start-2 flex flex-col items-center justify-center space-y-2">
          <div className="flex space-x-2">
            <button
              className={`btn-primary px-6 py-2${!gameOver ? ' opacity-50 cursor-not-allowed' : ''}`}
              onClick={startGame}
              disabled={!gameOver}
              title={!gameOver ? '游戏进行中，请耐心等待' : ''}
            >
              新的一局
            </button>
            <button
              className={`btn-primary px-6 py-2${!isPlayerTurn ? ' opacity-50 cursor-not-allowed' : ''}`}
              onClick={playerHit}
              disabled={!isPlayerTurn}
            >
              要牌
            </button>
            <button
              className={`btn-primary px-6 py-2${!isPlayerTurn ? ' opacity-50 cursor-not-allowed' : ''}`}
              onClick={dealerTurn}
              disabled={!isPlayerTurn}
            >
              停牌
            </button>
          </div>
        </div>

        <div className="col-start-2 row-start-3 flex flex-col items-center justify-start bg-transparent">
          <PlayerHand cards={playerCards} />
        </div>

        {/* 右侧列 */}
        <div className="col-start-3 row-start-1"></div>
        <div className="col-start-3 row-start-2 flex items-center justify-center">
          {message && <p className="text-xl font-bold text-center">{message}</p>}
        </div>
        <div className="col-start-3 row-start-3 flex flex-col items-center justify-start space-y-2">
          <p className="text-lg font-semibold">玩家筹码: {playerChips}</p>
          <BetControl bet={bet} setBet={setBet} minBet={100} step={100} />
        </div>
      </div>
    </div>
  );
}
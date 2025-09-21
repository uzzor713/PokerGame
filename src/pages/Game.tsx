import { useState, useEffect, useRef } from 'react';
import { deck, shuffleDeck, calculatePoints } from '../data/cards';
import DealerHand from '../components/DealerHand';
import PlayerHand from '../components/PlayerHand';
import BetControl from '../components/BetControl';
import blackjack from '../data/games/blackjack.json';

export default function Game() {
  const [playerCards, setPlayerCards] = useState<string[]>([]);
  const [dealerCards, setDealerCards] = useState<string[]>([]);
  const [gameDeck, setGameDeck] = useState<string[]>([]);
  const [message, setMessage] = useState('欢迎!');
  const [dealerReveal, setDealerReveal] = useState(false);
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [gameOver, setGameOver] = useState(true);
  const [bet, setBet] = useState(100);
  const [playerChips, setPlayerChips] = useState(50000);
  const [hasBet, setHasBet] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const logEndRef = useRef<HTMLDivElement | null>(null);

  // 每次日志更新后，滚动到底部
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // 获取时间戳
  const getTimestamp = () => {
    const now = new Date();
    return now.toLocaleTimeString('zh-CN', { hour12: false });
  };

  // 添加日志
  const addLog = (text: string) => {
    setLogs((prev) => [...prev, `[${getTimestamp()}] ${text}`]);
  };

  // 结算函数
  const settleGame = (result: 'playerWin' | 'playerOut' | 'dealerWin' | 'dealerOut' | 'draw' | 'playerBlackjack' | 'dealerBlackjack' | 'bothBlackjack') => {
    let chipChange = 0;
    let msg = '';
    switch (result) {
      case 'bothBlackjack':
        msg = '双方Blackjack,平局';
        chipChange = bet; // 筹码退回
        addLog(`双方Blackjack,平局,筹码退回+${chipChange}`);
        break;
      case 'playerBlackjack':
        msg = '玩家Blackjack,赔付1.5倍';
        chipChange = bet * 2.5;
        addLog(`玩家Blackjack,筹码退回+${bet},赔付1.5倍+${bet*1.5}`);
        break;
      case 'dealerBlackjack':
        msg = '庄家Blackjack';
        chipChange = 0;
        addLog('庄家Blackjack胜利,筹码归庄家');
        break;
      case 'playerWin':
        msg = '玩家胜利!';
        chipChange = bet * 2;
        addLog(`玩家胜利 +${chipChange}`);
        break;
      case 'playerOut':
        msg = '玩家爆掉,庄家胜利!';
        chipChange = 0;
        addLog('庄家胜利,筹码归庄家');
        break;
      case 'dealerWin':
        msg = '庄家胜利!';
        chipChange = 0;
        addLog('庄家胜利,筹码归庄家');
        break;
      case 'dealerOut':
        msg = '庄家爆掉,玩家胜利!';
        chipChange = bet * 2;
        addLog(`玩家胜利 +${chipChange}`);
        break;
      case 'draw':
        msg = '平局';
        chipChange = bet;
        addLog(`平局,返还 ${chipChange}`);
        break;
    }

    // 更新状态
    setMessage(msg);
    setPlayerChips((prev) => prev + chipChange);
    setDealerReveal(true);
    setIsPlayerTurn(false);
    setGameOver(true);
  };

  // 初始牌 Blackjack 判定
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
        settleGame('bothBlackjack');
      } else if (playerBlackjack) {
        settleGame('playerBlackjack');
      } else if (dealerBlackjack) {
        settleGame('dealerBlackjack');
      }
      return true;
    }

    setDealerReveal(false);
    setIsPlayerTurn(true);
    setGameOver(false);
    return false;
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // 新的一局
  const startGame = () => {
    setPlayerCards([]);
    setDealerCards([]);
    setMessage('请下注');
    setDealerReveal(false);
    setIsPlayerTurn(false);
    setGameOver(false);
    setHasBet(false);
  };

  // 下注并发牌
  const placeBet = async () => {
    if (hasBet) return;

    if (bet > playerChips) {
      setMessage(`筹码不够哦,现有筹码：${playerChips}`);
      return;
    }

    setPlayerChips((prev) => prev - bet);
    setHasBet(true);
    addLog(`下注 ${bet},剩余筹码 ${playerChips - bet}`);

    const newDeck = shuffleDeck(deck);
    const playerInit = [newDeck[0], newDeck[1]];
    const dealerInit = [newDeck[2], newDeck[3]];

    setGameDeck(newDeck.slice(4));
    setMessage('发牌中...');

    // 动画发牌
    await delay(700);
    setPlayerCards([playerInit[0]]);
    await delay(700);
    setPlayerCards(playerInit);
    await delay(700);
    setDealerCards([dealerInit[0]]);
    await delay(700);
    setDealerCards(dealerInit);

    checkInitialBlackjack(playerInit, dealerInit);
    setMessage('请选择操作');
  };

  // 玩家要牌
  const playerHit = () => {
    if (!isPlayerTurn) return;
    const [nextCard, ...restDeck] = gameDeck;
    const newPlayerCards = [...playerCards, nextCard];
    setPlayerCards(newPlayerCards);
    setGameDeck(restDeck);

    const points = calculatePoints(newPlayerCards);
    if (points > 21) {
      settleGame('playerOut');
    }
  };

  // 停牌
const stopAsking = () => {
  // 如果不是玩家回合或者游戏已经结束，直接返回
  if (!isPlayerTurn || gameOver) return;

  // 显示庄家手牌并结束玩家回合
  setDealerReveal(true);
  setIsPlayerTurn(false);

  const newDealerCards = [...dealerCards];
  let remainingDeck = [...gameDeck];

  // 避免多次触发递归，可以用局部变量
  let dealerInProgress = true;

  const dealOne = () => {
    if (!dealerInProgress) return; // 防止多次触发
    const dealerPoints = calculatePoints(newDealerCards);

    if (dealerPoints < 17 && remainingDeck.length > 0) {
      // 庄家继续要牌
      const [nextCard, ...restDeck] = remainingDeck;
      newDealerCards.push(nextCard);
      remainingDeck = restDeck;

      setDealerCards([...newDealerCards]);
      setGameDeck([...remainingDeck]);

      setTimeout(dealOne, 1000); // 延迟模拟发牌动画
    } else {
      // 庄家停牌，结算结果
      const playerPoints = calculatePoints(playerCards);
      if (dealerPoints > 21) {
        settleGame('dealerOut');
      } else if(playerPoints > dealerPoints){
        settleGame('playerWin');
      } else if (playerPoints === dealerPoints) {
        settleGame('draw');
      } else {
        settleGame('dealerWin');
      }
      dealerInProgress = false;
    }
  };

  setTimeout(dealOne, 1000); // 延迟开始庄家发牌
};


  return (
    <div className='min-h-screen text-white relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_#14532d_0%,_#052e16_80%)]'>
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.1)_0%,_transparent_70%)]" />

      <header className='fixed top-0 left-0 w-full z-10 bg-transparent'>
        <h1 className="py-4 text-center text-3xl font-bold">黑杰克</h1>
      </header>

      <div className="grid grid-cols-[2fr_3fr_2fr] grid-rows-3 gap-4 h-[calc(100vh-4rem)] p-4 pt-20">
        {/* 左边：规则 */}
        <div className="col-start-1 row-start-1 row-span-3 bg-amber-50 text-black p-6 rounded-lg shadow-lg overflow-auto ml-8 flex flex-col space-y-6">
          {/* 游戏规则 */}
          <div className="flex flex-col space-y-2">
            <h2 className="text-2xl font-semibold text-center">游戏规则</h2>
            {blackjack.rules.map((p, i) => ( 
              <p key={i}>{p}</p> 
            ))}
          </div>
        </div>

        {/* 庄家 */}
        <div className="col-start-2 row-start-1 flex flex-col items-center justify-center bg-transparent">
          <DealerHand cards={dealerCards} reveal={dealerReveal} />
        </div>

        {/* 中间提示消息和控制区 */}
        <div className="col-start-2 row-start-2 flex flex-col items-center justify-center space-y-2">
          <div className="text-white font-bold text-3xl">{message}</div>
          <div className="flex space-x-2">
            <button
              className={`btn-primary px-6 py-2${!gameOver ? ' opacity-50 cursor-not-allowed' : ''}`}
              onClick={startGame}
              disabled={!gameOver}
              title={!gameOver ? '游戏进行中,请耐心等待' : ''}
            >
              开始
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
              onClick={stopAsking}
              disabled={!isPlayerTurn}
            >
              停牌
            </button>
          </div>
        </div>

        {/* 玩家 */}
        <div className="col-start-2 row-start-3 flex flex-col items-center justify-center bg-transparent">
          { hasBet ? (
            <div className="col-start-2 row-start-3 flex flex-col items-center justify-start bg-transparent">
              <PlayerHand cards={playerCards} />
            </div>
          ) : (
            <div className="col-start-3 row-start-3 flex flex-col items-center justify-center space-y-2">
              <p className="text-lg font-semibold">玩家筹码: {playerChips}</p>
              <BetControl
                bet={bet}
                setBet={setBet}
                minBet={100}
                step={100}
                disabled={hasBet || gameOver}
              />
              <button
                className={`btn-primary px-6 py-2${hasBet || gameOver ? ' opacity-50 cursor-not-allowed' : ''}`}
                onClick={placeBet}
                disabled={hasBet || gameOver}
              >
                下注
              </button>
            </div>
          )}
        </div>

        {/* 右边：介绍与日志 */}
        <div className="col-start-3 row-start-1 bg-amber-50 text-black py-2 px-6 rounded-lg shadow-lg overflow-auto mr-8 flex flex-col space-y-4">
          {/* 游戏介绍 */}
          <div className="flex flex-col space-y-2">
            <h2 className="text-2xl font-semibold text-center">游戏介绍</h2>
            {blackjack.intro.map((p, i) => ( 
              <p key={i}>{p}</p> 
            ))}
          </div>
        </div>

        {/* 右下角日志 */}
        <div className="col-start-3 row-start-2 row-span-2 bg-black/40 rounded-lg p-4 shadow-lg overflow-y-auto mr-8">
          <h2 className="text-lg font-semibold mb-2">游戏日志</h2>
          <ul className="space-y-1 text-sm font-mono">
            {logs.map((log, i) => (
              <li key={i} className="whitespace-pre-wrap">{log}</li>
            ))}
            <div ref={logEndRef} />
          </ul>
        </div>
      </div>
    </div>
  );
}

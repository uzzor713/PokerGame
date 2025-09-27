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
  const [insuranceVisible, setInsuranceVisible] = useState(false);
  const [insuranceResolver, setInsuranceResolver] = useState<((take: boolean) => void) | null>(null);

  const logEndRef = useRef<HTMLDivElement | null>(null);

  // 每次日志更新后，滚动到底部
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // 获取时间戳
  const getTimestamp = () => new Date().toLocaleTimeString('zh-CN', { hour12: false });

  // 添加日志
  const addLog = (text: string) => setLogs(prev => [...prev, `[${getTimestamp()}] ${text}`]);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // 等待玩家选择保险
  const waitForInsuranceChoice = () => {
    return new Promise<boolean>(resolve => {
      setInsuranceResolver(() => resolve);
      setInsuranceVisible(true);
    });
  };

  const handleInsurance = (take: boolean) => {
    setInsuranceVisible(false);
    if (take) {
      const insuranceBet = bet / 2;
      if (insuranceBet <= playerChips) {
        setPlayerChips(prev => prev - insuranceBet);
        addLog(`购买保险，扣除 ${insuranceBet}，剩余筹码 ${playerChips - insuranceBet}`);
      } else {
        addLog('筹码不足，无法购买保险');
      }
    } else {
      addLog('玩家拒绝保险');
    }
    insuranceResolver?.(take);
    setInsuranceResolver(null);
  };

  const settleInsurance = (takeInsurance: boolean, dealerInit: string[]) => {
    if (!takeInsurance) {
      addLog('玩家拒绝保险');
      return;
    }

    const insuranceBet = bet / 2;
    if (insuranceBet > playerChips) {
      addLog('筹码不足，无法购买保险');
      return;
    }

    const dealerPoints = calculatePoints(dealerInit);
    let chipChange = 0;

    if (dealerPoints === 21) {
      // 保险成功：返还本金 + 2倍保险金
      chipChange = insuranceBet * 3; // 最终净增加 = +保险额2倍
      addLog(`保险成功! 赔付 ${insuranceBet * 2} + 保险本金 ${insuranceBet}`);
    } else {
      // 保险失败：扣除保险金
      chipChange = 0;
      addLog('保险失败，保险金没收');
    }

    setPlayerChips(prev => prev + chipChange);
  };

  // 结算函数
  const settleGame = (
    result:
      | 'playerWin'
      | 'playerOut'
      | 'dealerWin'
      | 'dealerOut'
      | 'draw'
      | 'playerBlackjack'
      | 'dealerBlackjack'
      | 'bothBlackjack'
  ) => {
    let chipChange = 0;
    let msg = '';

    switch (result) {
      case 'bothBlackjack':
        msg = '双方Blackjack,平局';
        chipChange = bet;
        addLog(`双方Blackjack,平局,筹码退回+${chipChange}`);
        break;
      case 'playerBlackjack':
        msg = '玩家Blackjack,赔付1.5倍';
        chipChange = bet * 2.5;
        addLog(`玩家Blackjack,筹码退回+${bet},赔付1.5倍+${bet * 1.5}`);
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
    setPlayerChips(prev => prev + chipChange);
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

    if (playerBlackjack && dealerBlackjack) return 'bothBlackjack';
    if (playerBlackjack) return 'playerBlackjack';
    if (dealerBlackjack) return 'dealerBlackjack';
    return null;
  };

  // 开始新游戏
  const startGame = () => {
    setPlayerCards([]);
    setDealerCards([]);
    setMessage('请下注');
    setDealerReveal(false);
    setIsPlayerTurn(false);
    setGameOver(false);
    setHasBet(false);
    setInsuranceVisible(false);
  };

  // 下注
  const placeBet = async () => {
    if (hasBet) return;
    if (bet > playerChips) {
      setMessage(`筹码不够哦,现有筹码：${playerChips}`);
      return;
    }

    setPlayerChips(prev => prev - bet);
    setHasBet(true);
    addLog(`下注 ${bet},剩余筹码 ${playerChips - bet}`);

    const newDeck = shuffleDeck(deck);
    // const newDeck = ['AH', '2D', 'AS', '10C', '3S', '4H', '7D', '8C', '2S', 'KH', 'JD', 'QC', '10S'];
    const playerInit = [newDeck[0], newDeck[1]];
    const dealerInit = [newDeck[2], newDeck[3]];
    setGameDeck(newDeck.slice(4));

    // 发牌动画
    setMessage('发牌中...');
    await delay(700);
    setPlayerCards([playerInit[0]]);
    await delay(700);
    setPlayerCards(playerInit);
    await delay(700);
    setDealerCards([dealerInit[0]]);
    await delay(700);
    setDealerCards(dealerInit);

    // 如果庄家明牌是 A，等待保险选择
    if (dealerInit[0].startsWith("A")) {
      const takeInsurance = await waitForInsuranceChoice();
      settleInsurance(takeInsurance, dealerInit);
    }

    const result = checkInitialBlackjack(playerInit, dealerInit);
    if (result) {
      // 如果是庄家A明牌，保险已经选择
      settleGame(result);
    } else {
      setDealerReveal(false);
      setIsPlayerTurn(true);
      setMessage('请选择操作');
    }
  };

  // 玩家要牌
  const playerHit = () => {
    if (!isPlayerTurn) return;
    const [nextCard, ...restDeck] = gameDeck;
    const newPlayerCards = [...playerCards, nextCard];
    setPlayerCards(newPlayerCards);
    setGameDeck(restDeck);

    const points = calculatePoints(newPlayerCards);
    if (points > 21) settleGame('playerOut');
  };

  // 停牌
  const stopAsking = () => {
    if (!isPlayerTurn || gameOver) return;
    setDealerReveal(true);
    setIsPlayerTurn(false);

    const newDealerCards = [...dealerCards];
    let remainingDeck = [...gameDeck];

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
        const playerPoints = calculatePoints(playerCards);
        if (dealerPoints > 21) settleGame('dealerOut');
        else if (playerPoints > dealerPoints) settleGame('playerWin');
        else if (playerPoints === dealerPoints) settleGame('draw');
        else settleGame('dealerWin');
      }
    };

    setTimeout(dealOne, 1000);
  };

  // 加倍
  const doubleDown = () => {
    if (!isPlayerTurn || playerCards.length !== 2) return;
    if (bet > playerChips) {
      setMessage(`筹码不足以加倍, 现有筹码：${playerChips}`);
      return;
    }
    setPlayerChips(prev => prev - bet);
    const newBet = bet * 2;
    setBet(newBet);
    addLog(`加倍! 额外下注 ${bet}, 总下注 ${newBet}`);

    const [nextCard, ...restDeck] = gameDeck;
    const newPlayerCards = [...playerCards, nextCard];
    setPlayerCards(newPlayerCards);
    setGameDeck(restDeck);

    const points = calculatePoints(newPlayerCards);
    if (points > 21) settleGame('playerOut');
    else stopAsking();
  };

  // 弃牌
  const surrender = () => {
    if (!isPlayerTurn || playerCards.length !== 2) return;
    const refund = bet / 2;
    setMessage('玩家弃牌，返还一半筹码');
    addLog(`玩家弃牌，返还 ${refund}`);
    setPlayerChips(prev => prev + refund);
    setDealerReveal(true);
    setIsPlayerTurn(false);
    setGameOver(true);
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
          { hasBet && (
            <DealerHand cards={dealerCards} reveal={dealerReveal} />
          )}
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
            <button
              className={`btn-primary px-6 py-2${!isPlayerTurn || playerCards.length !== 2 ? ' opacity-50 cursor-not-allowed' : ''}`}
              onClick={doubleDown}
              disabled={!isPlayerTurn || playerCards.length !== 2}
            >
              加倍
            </button>
            <button
              className={`btn-primary px-6 py-2${!isPlayerTurn || playerCards.length !== 2 ? ' opacity-50 cursor-not-allowed' : ''}`}
              onClick={surrender}
              disabled={!isPlayerTurn || playerCards.length !== 2}
            >
              弃牌
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
        <div className="col-start-3 row-start-1 bg-amber-50 text-black p-4 rounded-lg shadow-lg overflow-auto mr-8 flex flex-col space-y-4">
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

      {insuranceVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4 text-center">购买保险</h2>
            <p className="mb-4 text-gray-700">
              庄家明牌是 <span className="font-semibold">A</span>，
              你可以选择购买保险（保险额为下注的一半）。
            </p>
            <div className="mt-4 p-3 rounded bg-yellow-50 border border-yellow-200 text-sm text-gray-700">
              <h3 className="font-semibold mb-2">保险规则说明：</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>保险金额 = 当前下注金额的一半</li>
                <li>如果庄家是 Blackjack：赔付 2 倍保险金</li>
                <li>如果庄家不是 Blackjack：保险金没收，继续游戏</li>
              </ul>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => handleInsurance(false)} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400">不买</button>
              <button onClick={() => handleInsurance(true)} className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600">买保险</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


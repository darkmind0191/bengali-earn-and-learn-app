import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Car, Coins, Heart, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { watchAdForLife } from '../../utils/rewardedAd';

type Lane = 0 | 1 | 2;

type EnemyCar = {
  id: number;
  lane: Lane;
  y: number;
  speed: number;
  type: number;
};

type Coin = {
  id: number;
  lane: Lane;
  y: number;
};

const LANE_COUNT = 3;
const START_LIVES = 3;

const enemyColors = [
  '#ef4444',
  '#f97316',
  '#8b5cf6',
  '#22c55e',
  '#eab308',
  '#ec4899',
];

const TrafficEscape: React.FC = () => {
  const navigate = useNavigate();

  const gameRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);

  const lastTimeRef = useRef(0);
  const enemyTimerRef = useRef(0);
  const coinTimerRef = useRef(0);

  const playerLaneRef = useRef<Lane>(1);
  const enemiesRef = useRef<EnemyCar[]>([]);
  const coinsRef = useRef<Coin[]>([]);

  const scoreRef = useRef(0);
  const livesRef = useRef(START_LIVES);
  const speedRef = useRef(230);

  const [playerLane, setPlayerLane] = useState<Lane>(1);
  const [enemies, setEnemies] = useState<EnemyCar[]>([]);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(START_LIVES);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);

  // Rewarded Ad states
  const [adBusy, setAdBusy] = useState(false);
  const [adMessage, setAdMessage] = useState<string | null>(null);

  const nextIdRef = useRef(1);

  useEffect(() => {
    const saved = Number(
      localStorage.getItem('trafficEscapeHighScore') || 0
    );

    setHighScore(saved);
  }, []);

  const lanePosition = (lane: Lane) => {
    if (lane === 0) return '16.66%';
    if (lane === 1) return '50%';
    return '83.33%';
  };

  const movePlayer = useCallback(
    (direction: -1 | 1) => {
      if (!gameStarted || gameOver) return;

      const current = playerLaneRef.current;

      const next = Math.max(
        0,
        Math.min(LANE_COUNT - 1, current + direction)
      ) as Lane;

      if (next !== current) {
        playerLaneRef.current = next;
        setPlayerLane(next);
      }
    },
    [gameStarted, gameOver]
  );

  const resetGame = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    playerLaneRef.current = 1;
    enemiesRef.current = [];
    coinsRef.current = [];

    scoreRef.current = 0;
    livesRef.current = START_LIVES;
    speedRef.current = 230;

    enemyTimerRef.current = 0;
    coinTimerRef.current = 0;
    lastTimeRef.current = 0;

    setPlayerLane(1);
    setEnemies([]);
    setCoins([]);
    setScore(0);
    setLives(START_LIVES);
    setGameOver(false);
    setGameStarted(true);
    setAdMessage(null);
  }, []);

  const startGame = () => {
    resetGame();
  };

  const endGame = useCallback(() => {
    setGameOver(true);
    setGameStarted(false);

    const finalScore = scoreRef.current;

    if (finalScore > highScore) {
      setHighScore(finalScore);

      localStorage.setItem(
        'trafficEscapeHighScore',
        String(finalScore)
      );
    }
  }, [highScore]);

  // ============================================
  // Rewarded Ad → Get 1 Extra Life
  // ============================================
  const handleWatchAdForLife = async () => {
    if (adBusy) return;

    setAdBusy(true);
    setAdMessage(null);

    try {
      const rewarded = await watchAdForLife();

      if (rewarded) {
        // Give exactly 1 extra life
        livesRef.current = 1;
        setLives(1);

        // Continue the current game
        setGameOver(false);
        setGameStarted(true);

        // Reset timing so the game resumes smoothly
        lastTimeRef.current = 0;

        setAdMessage('🎉 অভিনন্দন! আপনি ১টি Life পেয়েছেন।');

        // Message একটু দেখিয়ে তারপর সরিয়ে ফেলি
        setTimeout(() => {
          setAdMessage(null);
        }, 2500);
      } else {
        setAdMessage(
          'বিজ্ঞাপন সম্পূর্ণ হয়নি। আবার চেষ্টা করুন।'
        );
      }
    } catch (error) {
      console.error('Life Reward Ad error:', error);

      setAdMessage(
        'বিজ্ঞাপন চালু করা যায়নি। আবার চেষ্টা করুন।'
      );
    } finally {
      setAdBusy(false);
    }
  };

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === 'ArrowLeft' ||
        event.key.toLowerCase() === 'a'
      ) {
        event.preventDefault();
        movePlayer(-1);
      }

      if (
        event.key === 'ArrowRight' ||
        event.key.toLowerCase() === 'd'
      ) {
        event.preventDefault();
        movePlayer(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameStarted, gameOver, movePlayer]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = (time: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = time;
      }

      const delta = Math.min(
        (time - lastTimeRef.current) / 1000,
        0.05
      );

      lastTimeRef.current = time;

      enemyTimerRef.current += delta;
      coinTimerRef.current += delta;

      scoreRef.current += delta * 10;
      setScore(Math.floor(scoreRef.current));

      speedRef.current += delta * 4;

      if (enemyTimerRef.current > 0.72) {
        enemyTimerRef.current = 0;

        const lane = Math.floor(Math.random() * 3) as Lane;

        enemiesRef.current.push({
          id: nextIdRef.current++,
          lane,
          y: -18,
          speed:
            speedRef.current + Math.random() * 50,
          type: Math.floor(
            Math.random() * enemyColors.length
          ),
        });
      }

      if (coinTimerRef.current > 1.15) {
        coinTimerRef.current = 0;

        const lane = Math.floor(Math.random() * 3) as Lane;

        coinsRef.current.push({
          id: nextIdRef.current++,
          lane,
          y: -8,
        });
      }

      enemiesRef.current = enemiesRef.current
        .map((enemy) => ({
          ...enemy,
          y: enemy.y + enemy.speed * delta,
        }))
        .filter((enemy) => enemy.y < 110);

      coinsRef.current = coinsRef.current
        .map((coin) => ({
          ...coin,
          y: coin.y + speedRef.current * delta,
        }))
        .filter((coin) => coin.y < 110);

      const playerLaneNow = playerLaneRef.current;

      const hitEnemy = enemiesRef.current.find(
        (enemy) =>
          enemy.lane === playerLaneNow &&
          enemy.y > 72 &&
          enemy.y < 94
      );

      if (hitEnemy) {
        enemiesRef.current =
          enemiesRef.current.filter(
            (enemy) => enemy.id !== hitEnemy.id
          );

        livesRef.current -= 1;
        setLives(livesRef.current);

        if (livesRef.current <= 0) {
          endGame();
          return;
        }
      }

      const collectedCoins = coinsRef.current.filter(
        (coin) =>
          coin.lane === playerLaneNow &&
          coin.y > 74 &&
          coin.y < 94
      );

      if (collectedCoins.length > 0) {
        const collectedIds = new Set(
          collectedCoins.map((coin) => coin.id)
        );

        coinsRef.current =
          coinsRef.current.filter(
            (coin) => !collectedIds.has(coin.id)
          );

        scoreRef.current +=
          collectedCoins.length * 50;

        setScore(Math.floor(scoreRef.current));
      }

      setEnemies([...enemiesRef.current]);
      setCoins([...coinsRef.current]);

      animationRef.current =
        requestAnimationFrame(gameLoop);
    };

    animationRef.current =
      requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(
          animationRef.current
        );
      }
    };
  }, [gameStarted, gameOver, endGame]);

  const renderEnemy = (enemy: EnemyCar) => {
    return (
      <div
        key={enemy.id}
        className="absolute w-14 h-24 -translate-x-1/2"
        style={{
          left: lanePosition(enemy.lane),
          top: `${enemy.y}%`,
        }}
      >
        <div
          className="relative w-full h-full rounded-[14px] border-2 border-white/30 shadow-xl"
          style={{
            background: enemyColors[enemy.type],
          }}
        >
          <div className="absolute top-3 left-2 right-2 h-7 rounded-md bg-sky-200/80 border border-white/30" />

          <div className="absolute top-12 left-2 right-2 h-2 bg-white/30 rounded-full" />

          <div className="absolute bottom-3 left-2 w-2 h-4 rounded bg-slate-900" />
          <div className="absolute bottom-3 right-2 w-2 h-4 rounded bg-slate-900" />

          <div className="absolute bottom-1 left-2 w-2 h-1 rounded-full bg-yellow-200" />
          <div className="absolute bottom-1 right-2 w-2 h-1 rounded-full bg-yellow-200" />
        </div>
      </div>
    );
  };

  return (
    <div
      ref={gameRef}
      className="min-h-screen bg-slate-950 text-white flex flex-col overflow-hidden select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-white/10">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center active:scale-95"
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>

        <div className="text-center">
          <div className="font-black text-lg tracking-wide">
            TRAFFIC ESCAPE
          </div>

          <div className="text-xs text-slate-400">
            Dodge • Drive • Survive
          </div>
        </div>

        <div className="flex items-center gap-1 text-yellow-300 font-black">
          <Coins size={19} />
          {score}
        </div>
      </div>

      {/* HUD */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((index) => (
            <Heart
              key={index}
              size={21}
              fill={
                index < lives
                  ? 'currentColor'
                  : 'none'
              }
              className={
                index < lives
                  ? 'text-red-500'
                  : 'text-slate-600'
              }
            />
          ))}
        </div>

        <div className="text-sm font-bold text-slate-300">
          HIGH SCORE: {highScore}
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex items-center justify-center p-3">
        <div
          className="relative w-full max-w-[430px] aspect-[9/15] max-h-[72vh] overflow-hidden rounded-3xl border-4 border-slate-700 shadow-2xl bg-slate-800"
          style={{
            background:
              'linear-gradient(to bottom, #38bdf8 0%, #bae6fd 18%, #64748b 18%, #475569 100%)',
          }}
        >
          {/* Sky */}
          <div className="absolute inset-x-0 top-0 h-[18%] bg-gradient-to-b from-sky-400 to-sky-200">
            <div className="absolute left-[12%] top-[25%] w-20 h-8 bg-white/70 rounded-full" />
            <div className="absolute left-[5%] top-[35%] w-10 h-5 bg-white/50 rounded-full" />
            <div className="absolute right-[10%] top-[20%] w-24 h-9 bg-white/60 rounded-full" />
          </div>

          {/* Road */}
          <div className="absolute inset-x-[8%] top-[18%] bottom-0 bg-slate-700">
            {/* Road edges */}
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-yellow-300" />
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-yellow-300" />

            {/* Lane separators */}
            <div className="absolute left-1/3 top-0 bottom-0 border-l-4 border-dashed border-white/70" />
            <div className="absolute left-2/3 top-0 bottom-0 border-l-4 border-dashed border-white/70" />

            {/* Road shine */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_0,_transparent_40%)]" />

            {/* Enemy cars */}
            {enemies.map(renderEnemy)}

            {/* Coins */}
            {coins.map((coin) => (
              <div
                key={coin.id}
                className="absolute w-9 h-9 -translate-x-1/2 rounded-full bg-yellow-300 border-4 border-yellow-100 shadow-lg flex items-center justify-center text-yellow-700 font-black"
                style={{
                  left: lanePosition(coin.lane),
                  top: `${coin.y}%`,
                }}
              >
                $
              </div>
            ))}

            {/* Player */}
            <div
              className="absolute bottom-[7%] w-16 h-28 -translate-x-1/2 transition-[left] duration-150"
              style={{
                left: lanePosition(playerLane),
              }}
            >
              <div className="relative w-full h-full rounded-[17px] bg-blue-600 border-2 border-white/50 shadow-2xl">
                {/* windshield */}
                <div className="absolute top-3 left-2 right-2 h-8 rounded-lg bg-sky-200 border border-white/40" />

                {/* center stripe */}
                <div className="absolute top-11 left-1/2 -translate-x-1/2 w-2 h-12 rounded-full bg-white/70" />

                {/* wheels */}
                <div className="absolute left-[-5px] top-7 w-3 h-8 rounded bg-slate-950" />
                <div className="absolute right-[-5px] top-7 w-3 h-8 rounded bg-slate-950" />
                <div className="absolute left-[-5px] bottom-7 w-3 h-8 rounded bg-slate-950" />
                <div className="absolute right-[-5px] bottom-7 w-3 h-8 rounded bg-slate-950" />

                {/* headlights */}
                <div className="absolute bottom-2 left-2 w-3 h-2 rounded bg-yellow-200" />
                <div className="absolute bottom-2 right-2 w-3 h-2 rounded bg-yellow-200" />

                <Car
                  size={22}
                  className="absolute top-1 left-1/2 -translate-x-1/2 text-white"
                />
              </div>
            </div>
          </div>

          {/* Start screen */}
          {!gameStarted && !gameOver && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="w-full max-w-xs text-center">
                <div className="mx-auto w-20 h-20 rounded-3xl bg-cyan-500 flex items-center justify-center shadow-xl mb-5">
                  <Car size={46} />
                </div>

                <h1 className="text-3xl font-black">
                  TRAFFIC ESCAPE
                </h1>

                <p className="mt-2 text-slate-300">
                  গাড়ি চালান, ট্রাফিক এড়িয়ে চলুন
                </p>

                <button
                  type="button"
                  onClick={startGame}
                  className="mt-7 w-full py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-black text-lg shadow-lg"
                >
                  START GAME
                </button>
              </div>
            </div>
          )}

          {/* Game Over */}
          {gameOver && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="w-full max-w-xs text-center">
                <div className="text-5xl mb-3">
                  🚗💥
                </div>

                <h2 className="text-3xl font-black">
                  GAME OVER
                </h2>

                <div className="mt-5 rounded-2xl bg-white/10 p-5">
                  <div className="text-sm text-slate-400">
                    YOUR SCORE
                  </div>

                  <div className="text-4xl font-black text-yellow-300 mt-1">
                    {score}
                  </div>

                  <div className="text-sm text-slate-400 mt-3">
                    HIGH SCORE
                  </div>

                  <div className="text-xl font-black">
                    {highScore}
                  </div>
                </div>

                {/* Rewarded Ad Life Button */}
                <button
                  type="button"
                  onClick={handleWatchAdForLife}
                  disabled={adBusy}
                  className="mt-5 w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base shadow-lg active:scale-95 disabled:opacity-60 disabled:active:scale-100 flex items-center justify-center gap-2"
                >
                  {adBusy ? (
                    <>
                      <span className="inline-block w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      বিজ্ঞাপন লোড হচ্ছে...
                    </>
                  ) : (
                    <>
                      ❤️ বিজ্ঞাপন দেখে ১ Life নিন
                    </>
                  )}
                </button>

                {/* Ad message */}
                {adMessage && (
                  <div className="mt-3 rounded-xl bg-white/10 border border-white/10 px-3 py-2 text-sm text-slate-200">
                    {adMessage}
                  </div>
                )}

                {/* Play Again */}
                <button
                  type="button"
                  onClick={resetGame}
                  disabled={adBusy}
                  className="mt-4 w-full py-4 rounded-2xl bg-cyan-500 text-slate-950 font-black text-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <RotateCcw size={21} />
                  PLAY AGAIN
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 pb-5">
        <div className="max-w-[430px] mx-auto flex gap-3">
          <button
            type="button"
            disabled={!gameStarted}
            onClick={() => movePlayer(-1)}
            className="flex-1 h-14 rounded-2xl bg-slate-800 border border-white/10 text-3xl font-black disabled:opacity-40 active:scale-95"
            aria-label="Move left"
          >
            ←
          </button>

          <button
            type="button"
            disabled={!gameStarted}
            onClick={() => movePlayer(1)}
            className="flex-1 h-14 rounded-2xl bg-slate-800 border border-white/10 text-3xl font-black disabled:opacity-40 active:scale-95"
            aria-label="Move right"
          >
            →
          </button>
        </div>

        <div className="text-center text-xs text-slate-500 mt-2">
          ← → ব্যবহার করে গাড়ি চালান
        </div>
      </div>
    </div>
  );
};

export default TrafficEscape;

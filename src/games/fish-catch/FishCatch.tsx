import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Heart,
  RotateCcw,
  Trophy,
  Fish,
  Timer,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { watchAdForLife } from '../../utils/rewardedAd';

type FishType = {
  id: number;
  emoji: string;
  points: number;
  size: string;
  speed: number;
  top: number;
  direction: 'left' | 'right';
};

const START_LIVES = 3;
const GAME_TIME = 45;

const fishTypes = [
  {
    emoji: '🐠',
    points: 10,
    size: 'text-5xl',
    speed: 55,
  },
  {
    emoji: '🐟',
    points: 15,
    size: 'text-5xl',
    speed: 75,
  },
  {
    emoji: '🐡',
    points: 25,
    size: 'text-5xl',
    speed: 45,
  },
  {
    emoji: '🦈',
    points: 50,
    size: 'text-6xl',
    speed: 90,
  },
  {
    emoji: '🐙',
    points: 30,
    size: 'text-5xl',
    speed: 40,
  },
];

const FishCatch: React.FC = () => {
  const navigate = useNavigate();

  const gameRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);

  const fishRef = useRef<FishType[]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(START_LIVES);
  const timeRef = useRef(GAME_TIME);
  const lastTimeRef = useRef(0);
  const nextIdRef = useRef(1);

  const [fish, setFish] = useState<FishType[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(START_LIVES);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);

  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const [highScore, setHighScore] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const [adBusy, setAdBusy] = useState(false);
  const [adMessage, setAdMessage] = useState<string | null>(null);

  useEffect(() => {
    const saved = Number(
      localStorage.getItem('fishCatchHighScore') || 0
    );

    setHighScore(saved);
  }, []);

  const createFish = useCallback(() => {
    const type =
      fishTypes[Math.floor(Math.random() * fishTypes.length)];

    const direction =
      Math.random() > 0.5 ? 'left' : 'right';

    const newFish: FishType = {
      id: nextIdRef.current++,
      emoji: type.emoji,
      points: type.points,
      size: type.size,
      speed: type.speed,
      top: 18 + Math.random() * 65,
      direction,
    };

    if (direction === 'left') {
      newFish.speed = -Math.abs(newFish.speed);
    } else {
      newFish.speed = Math.abs(newFish.speed);
    }

    fishRef.current.push(newFish);
  }, []);

  const resetGame = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    fishRef.current = [];
    scoreRef.current = 0;
    livesRef.current = START_LIVES;
    timeRef.current = GAME_TIME;
    lastTimeRef.current = 0;

    nextIdRef.current = 1;

    setFish([]);
    setScore(0);
    setLives(START_LIVES);
    setTimeLeft(GAME_TIME);

    setGameOver(false);
    setGameStarted(true);
    setMessage(null);

    // Initial fish
    for (let i = 0; i < 5; i++) {
      createFish();
    }

    setFish([...fishRef.current]);
  }, [createFish]);

  const startGame = () => {
    resetGame();
  };

  const endGame = useCallback(() => {
    setGameStarted(false);
    setGameOver(true);

    const finalScore = scoreRef.current;

    if (finalScore > highScore) {
      setHighScore(finalScore);

      localStorage.setItem(
        'fishCatchHighScore',
        String(finalScore)
      );
    }
  }, [highScore]);

  const catchFish = (fishId: number) => {
    if (!gameStarted || gameOver) return;

    const target = fishRef.current.find(
      (item) => item.id === fishId
    );

    if (!target) return;

    fishRef.current = fishRef.current.filter(
      (item) => item.id !== fishId
    );

    scoreRef.current += target.points;

    setScore(scoreRef.current);

    setMessage(`+${target.points} ⭐`);

    setTimeout(() => {
      setMessage(null);
    }, 600);

    // Immediately create another fish
    createFish();

    setFish([...fishRef.current]);
  };

  const missTap = () => {
    if (!gameStarted || gameOver) return;

    livesRef.current -= 1;

    setLives(livesRef.current);

    setMessage('💥 Miss! -1 Life');

    setTimeout(() => {
      setMessage(null);
    }, 700);

    if (livesRef.current <= 0) {
      endGame();
    }
  };

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

      // Timer
      timeRef.current -= delta;

      if (timeRef.current <= 0) {
        timeRef.current = 0;
        setTimeLeft(0);
        endGame();
        return;
      }

      setTimeLeft(Math.ceil(timeRef.current));

      // Move fish
      fishRef.current = fishRef.current
        .map((item) => {
          const movement = item.speed * delta;

          const currentLeft =
            item.direction === 'right'
              ? (item as any).left ?? -10
              : (item as any).left ?? 110;

          const nextLeft =
            currentLeft + movement / 2;

          return {
            ...item,
            ...(item as any),
            left: nextLeft,
          };
        })
        .filter((item: any) => {
          return item.left > -15 && item.left < 115;
        });

      // Add new fish if needed
      if (fishRef.current.length < 5) {
        createFish();
      }

      setFish([...fishRef.current]);

      animationRef.current =
        requestAnimationFrame(gameLoop);
    };

    animationRef.current =
      requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameStarted, gameOver, createFish, endGame]);

const handleWatchAdForLife = async () => {
  if (adBusy) return;

  setAdBusy(true);
  setAdMessage(null);

  try {
    const rewarded = await watchAdForLife();

    if (rewarded) {
      livesRef.current = 1;
      setLives(1);

      setGameOver(false);
      setGameStarted(true);

      lastTimeRef.current = 0;

      setAdMessage('🎉 অভিনন্দন! আপনি ১টি Life পেয়েছেন।');

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

  return (
    <div
      ref={gameRef}
      className="min-h-screen bg-sky-950 text-white flex flex-col overflow-hidden select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-sky-900 border-b border-white/10">
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
            FISH CATCH
          </div>

          <div className="text-xs text-sky-300">
            Catch • Score • Enjoy
          </div>
        </div>

        <div className="flex items-center gap-1 text-yellow-300 font-black">
          ⭐ {score}
        </div>
      </div>

      {/* HUD */}
      <div className="flex items-center justify-between px-4 py-3 bg-sky-900/90">
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

        <div className="flex items-center gap-2 font-black text-cyan-200">
          <Timer size={19} />
          {timeLeft}s
        </div>

        <div className="flex items-center gap-1 text-yellow-300 font-black">
          <Trophy size={18} />
          {highScore}
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex items-center justify-center p-3">
        <div
          className="relative w-full max-w-[430px] aspect-[9/15] max-h-[72vh] overflow-hidden rounded-3xl border-4 border-cyan-700 shadow-2xl bg-blue-500"
          onClick={missTap}
        >
          {/* Ocean Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-cyan-500 to-blue-900" />

          {/* Light Rays */}
          <div className="absolute inset-x-0 top-0 h-[35%] opacity-20 bg-[radial-gradient(ellipse_at_top,_white_0,_transparent_70%)]" />

          {/* Bubbles */}
          <div className="absolute left-[10%] top-[20%] w-4 h-4 rounded-full border-2 border-white/40" />
          <div className="absolute left-[25%] top-[65%] w-7 h-7 rounded-full border-2 border-white/30" />
          <div className="absolute right-[15%] top-[30%] w-5 h-5 rounded-full border-2 border-white/40" />
          <div className="absolute right-[30%] top-[75%] w-3 h-3 rounded-full border border-white/40" />

          {/* Seaweed */}
          <div className="absolute bottom-0 left-[5%] text-7xl opacity-60">
            🌿
          </div>

          <div className="absolute bottom-0 right-[5%] text-7xl opacity-60">
            🌿
          </div>

          {/* Fish */}
          {fish.map((item: any) => (
            <button
              key={item.id}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                catchFish(item.id);
              }}
              className={`absolute ${item.size} leading-none transition-transform duration-100 active:scale-75`}
              style={{
                top: `${item.top}%`,
                left: `${item.left ?? (item.direction === 'right' ? -10 : 110)}%`,
                transform:
                  item.direction === 'left'
                    ? 'scaleX(-1)'
                    : 'scaleX(1)',
              }}
              aria-label="Catch fish"
            >
              {item.emoji}
            </button>
          ))}

          {/* Message */}
          {message && (
            <div className="absolute left-1/2 top-[42%] -translate-x-1/2 pointer-events-none">
              <div className="px-5 py-3 rounded-2xl bg-slate-950/70 backdrop-blur-sm text-2xl font-black text-yellow-300 shadow-xl">
                {message}
              </div>
            </div>
          )}

          {/* Start Screen */}
          {!gameStarted && !gameOver && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="w-full max-w-xs text-center">
                <div className="mx-auto w-20 h-20 rounded-3xl bg-cyan-400 flex items-center justify-center shadow-xl mb-5">
                  <Fish size={46} />
                </div>

                <h1 className="text-3xl font-black">
                  FISH CATCH
                </h1>

                <p className="mt-2 text-slate-300">
                  মাছগুলোতে tap করে পয়েন্ট সংগ্রহ করুন
                </p>

                <div className="mt-5 rounded-2xl bg-white/10 p-4 text-sm text-slate-300">
                  🐠 ছোট মাছ = +10
                  <br />
                  🐟 নীল মাছ = +15
                  <br />
                  🐡 Puffer = +25
                  <br />
                  🐙 Octopus = +30
                  <br />
                  🦈 Shark = +50
                </div>

                <button
                  type="button"
                  onClick={startGame}
                  className="mt-6 w-full py-4 rounded-2xl bg-cyan-400 hover:bg-cyan-300 active:scale-95 text-slate-950 font-black text-lg shadow-lg"
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
                  🐟🎉
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

                <button
                  type="button"
                  onClick={resetGame}
                  className="mt-6 w-full py-4 rounded-2xl bg-cyan-400 text-slate-950 font-black text-lg flex items-center justify-center gap-2 active:scale-95"
                >
                  <RotateCcw size={21} />
                  PLAY AGAIN
                </button>
                {adMessage && (
                  <div className="mt-3 text-center text-sm font-bold text-white">
                    {adMessage}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="px-4 pb-5">
        <div className="max-w-[430px] mx-auto text-center">
          <div className="text-xs text-sky-300">
            🐠 মাছ ধরতে মাছের উপর tap করুন
          </div>
        </div>
      </div>
    </div>
  );
};

export default FishCatch;
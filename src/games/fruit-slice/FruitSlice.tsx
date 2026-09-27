import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Heart,
  RotateCcw,
  Trophy,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type FruitType = {
  emoji: string;
  points: number;
};

type Fruit = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  type: FruitType;
  sliced: boolean;
};

type SlashPoint = {
  x: number;
  y: number;
  time: number;
};

const GAME_WIDTH = 360;
const GAME_HEIGHT = 620;

const HIGH_SCORE_KEY = 'fruitSliceHighScore';

const FRUITS: FruitType[] = [
  { emoji: '🍎', points: 10 },
  { emoji: '🍊', points: 12 },
  { emoji: '🍉', points: 15 },
  { emoji: '🍓', points: 18 },
  { emoji: '🍍', points: 20 },
  { emoji: '🥝', points: 15 },
];

const BOMB = '💣';

export default function FruitSlice() {
  const navigate = useNavigate();

  const gameRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);

  const fruitsRef = useRef<Fruit[]>([]);
  const slashRef = useRef<SlashPoint[]>([]);
  const spawnTimerRef = useRef(0);
  const nextIdRef = useRef(1);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem(HIGH_SCORE_KEY);
    return saved ? Number(saved) : 0;
  });

  const [lives, setLives] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [slashPoints, setSlashPoints] = useState<SlashPoint[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [combo, setCombo] = useState(0);

  const livesRef = useRef(3);
  const scoreRef = useRef(0);

  const createFruit = useCallback((): Fruit => {
    const type =
      FRUITS[Math.floor(Math.random() * FRUITS.length)];

    const fromLeft = Math.random() > 0.5;

    return {
      id: nextIdRef.current++,
      x: fromLeft
        ? 35 + Math.random() * 80
        : GAME_WIDTH - 115 + Math.random() * 80,
      y: GAME_HEIGHT + 30,
      vx: fromLeft
        ? 70 + Math.random() * 100
        : -(70 + Math.random() * 100),
      vy: -(560 + Math.random() * 180),
      size: 48 + Math.random() * 12,
      rotation: Math.random() * 360,
      rotationSpeed:
        (Math.random() > 0.5 ? 1 : -1) *
        (70 + Math.random() * 150),
      type,
      sliced: false,
    };
  }, []);

  const createBomb = useCallback((): Fruit => {
    const fromLeft = Math.random() > 0.5;

    return {
      id: nextIdRef.current++,
      x: fromLeft
        ? 35 + Math.random() * 80
        : GAME_WIDTH - 115 + Math.random() * 80,
      y: GAME_HEIGHT + 30,
      vx: fromLeft
        ? 80 + Math.random() * 100
        : -(80 + Math.random() * 100),
      vy: -(580 + Math.random() * 160),
      size: 48,
      rotation: Math.random() * 360,
      rotationSpeed:
        (Math.random() > 0.5 ? 1 : -1) *
        (100 + Math.random() * 120),
      type: {
        emoji: BOMB,
        points: -1,
      },
      sliced: false,
    };
  }, []);

  const startGame = useCallback(() => {
    fruitsRef.current = [];
    slashRef.current = [];
    spawnTimerRef.current = 0;
    lastTimeRef.current = 0;

    scoreRef.current = 0;
    livesRef.current = 3;

    setScore(0);
    setLives(3);
    setCombo(0);
    setFruits([]);
    setSlashPoints([]);
    setMessage(null);
    setGameOver(false);
    setGameStarted(true);
  }, []);

  const endGame = useCallback(() => {
    setGameStarted(false);
    setGameOver(true);
    setCombo(0);
    fruitsRef.current = [];
  }, []);

  const loseLife = useCallback(() => {
    livesRef.current -= 1;

    setLives(livesRef.current);
    setCombo(0);

    if (livesRef.current <= 0) {
      endGame();
    } else {
      setMessage('❤️ Life হারিয়েছেন!');
      setTimeout(() => setMessage(null), 900);
    }
  }, [endGame]);

  const sliceFruit = useCallback(
    (fruit: Fruit) => {
      if (fruit.sliced) return;

      fruit.sliced = true;

      if (fruit.type.emoji === BOMB) {
        setMessage('💥 BOMB!');
        setCombo(0);

        setTimeout(() => {
          setMessage(null);
        }, 1000);

        livesRef.current = 0;
        setLives(0);

        endGame();
        return;
      }

      const points = fruit.type.points;

      setScore((current) => {
        const next = current + points;
        scoreRef.current = next;

        if (next > highScore) {
          setHighScore(next);
          localStorage.setItem(
            HIGH_SCORE_KEY,
            String(next)
          );
        }

        return next;
      });

      setCombo((current) => {
        const next = current + 1;

        if (next >= 3) {
          setMessage(`🔥 ${next} COMBO!`);

          setTimeout(() => {
            setMessage(null);
          }, 700);
        }

        return next;
      });
    },
    [endGame, highScore]
  );

  const getGamePosition = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    const element = gameRef.current;

    if (!element) {
      return { x: 0, y: 0 };
    }

    const rect = element.getBoundingClientRect();

    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerMove = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!gameStarted || gameOver) return;

    const point = getGamePosition(event);

    const now = performance.now();

    slashRef.current.push({
      x: point.x,
      y: point.y,
      time: now,
    });

    slashRef.current =
      slashRef.current.filter(
        (item) => now - item.time < 180
      );

    for (const fruit of fruitsRef.current) {
      if (fruit.sliced) continue;

      const dx = fruit.x - point.x;
      const dy = fruit.y - point.y;

      const distance = Math.sqrt(
        dx * dx + dy * dy
      );

      if (distance < fruit.size * 0.65) {
        sliceFruit(fruit);
      }
    }

    setSlashPoints([...slashRef.current]);
  };

  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!gameStarted || gameOver) return;

    event.currentTarget.setPointerCapture(
      event.pointerId
    );

    const point = getGamePosition(event);

    slashRef.current = [
      {
        x: point.x,
        y: point.y,
        time: performance.now(),
      },
    ];

    setSlashPoints([...slashRef.current]);
  };

  const handlePointerUp = () => {
    slashRef.current = [];
    setSlashPoints([]);
  };

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const loop = (time: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = time;
      }

      const delta =
        Math.min(time - lastTimeRef.current, 32) /
        1000;

      lastTimeRef.current = time;

      spawnTimerRef.current -= delta;

      if (spawnTimerRef.current <= 0) {
        const fruitCount =
          Math.random() > 0.75 ? 2 : 1;

        for (let i = 0; i < fruitCount; i++) {
          const shouldBomb =
            Math.random() < 0.12;

          fruitsRef.current.push(
            shouldBomb
              ? createBomb()
              : createFruit()
          );
        }

        spawnTimerRef.current =
          0.55 + Math.random() * 0.45;
      }

      for (const fruit of fruitsRef.current) {
        fruit.x += fruit.vx * delta;
        fruit.y += fruit.vy * delta;

        fruit.vy += 920 * delta;

        fruit.rotation +=
          fruit.rotationSpeed * delta;
      }

      const remaining: Fruit[] = [];

      for (const fruit of fruitsRef.current) {
        if (fruit.y < GAME_HEIGHT + 90) {
          remaining.push(fruit);
        } else if (
          !fruit.sliced &&
          fruit.type.emoji !== BOMB
        ) {
          loseLife();
        }
      }

      fruitsRef.current = remaining;

      setFruits(
        fruitsRef.current.map((fruit) => ({
          ...fruit,
        }))
      );

      const now = performance.now();

      slashRef.current =
        slashRef.current.filter(
          (point) => now - point.time < 180
        );

      setSlashPoints([...slashRef.current]);

      animationRef.current =
        requestAnimationFrame(loop);
    };

    animationRef.current =
      requestAnimationFrame(loop);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(
          animationRef.current
        );
      }

      animationRef.current = null;
    };
  }, [
    createBomb,
    createFruit,
    gameOver,
    gameStarted,
    loseLife,
  ]);

  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(
          animationRef.current
        );
      }
    };
  }, []);

  const slashPath =
    slashPoints.length > 1
      ? slashPoints
          .map(
            (point, index) =>
              `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
          )
          .join(' ')
      : '';

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-slate-900 border-b border-slate-800">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center active:scale-95"
        >
          <ArrowLeft size={22} />
        </button>

        <div className="text-center">
          <h1 className="text-xl font-black tracking-wide">
            FRUIT SLICE
          </h1>

          <p className="text-xs text-slate-400">
            ফল কাটুন, স্কোর বাড়ান
          </p>
        </div>

        <div className="w-11 h-11 rounded-xl bg-orange-500/20 flex items-center justify-center">
          <Sparkles
            size={22}
            className="text-orange-300"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 grid grid-cols-3 gap-2 bg-slate-900/80">
        <div className="rounded-xl bg-slate-800 px-3 py-2">
          <div className="text-[10px] text-slate-400">
            SCORE
          </div>

          <div className="font-black text-lg">
            {score}
          </div>
        </div>

        <div className="rounded-xl bg-slate-800 px-3 py-2 text-center">
          <div className="text-[10px] text-slate-400">
            LIFE
          </div>

          <div className="flex justify-center gap-1 mt-1">
            {Array.from(
              { length: 3 },
              (_, index) => (
                <Heart
                  key={index}
                  size={17}
                  fill={
                    index < lives
                      ? 'currentColor'
                      : 'transparent'
                  }
                  className={
                    index < lives
                      ? 'text-red-400'
                      : 'text-slate-600'
                  }
                />
              )
            )}
          </div>
        </div>

        <div className="rounded-xl bg-slate-800 px-3 py-2 text-right">
          <div className="text-[10px] text-slate-400">
            BEST
          </div>

          <div className="font-black text-lg text-yellow-400">
            {highScore}
          </div>
        </div>
      </div>

      {/* Game */}
      <div className="flex-1 px-3 py-4 flex flex-col items-center">
        <div
          ref={gameRef}
          className="relative w-full max-w-md aspect-[360/620] overflow-hidden rounded-[2rem] border border-slate-700 bg-gradient-to-b from-sky-500 via-blue-600 to-indigo-900 shadow-2xl touch-none select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-8 left-8 text-5xl opacity-30">
              ☁️
            </div>

            <div className="absolute top-28 right-5 text-6xl opacity-25">
              ☁️
            </div>

            <div className="absolute top-1/2 left-4 text-4xl opacity-20">
              ☁️
            </div>

            <div className="absolute bottom-8 left-0 right-0 h-20 bg-green-500/30 blur-xl" />
          </div>

          {/* Fruits */}
          {fruits.map((fruit) => (
            <div
              key={fruit.id}
              className="absolute pointer-events-none"
              style={{
                left: `${(fruit.x / GAME_WIDTH) * 100}%`,
                top: `${(fruit.y / GAME_HEIGHT) * 100}%`,
                fontSize: `${fruit.size}px`,
                transform: `translate(-50%, -50%) rotate(${fruit.rotation}deg) ${
                  fruit.sliced ? 'scale(1.25)' : 'scale(1)'
                }`,
                opacity: fruit.sliced ? 0.3 : 1,
                transition:
                  'transform 80ms linear, opacity 120ms linear',
                filter:
                  fruit.type.emoji === BOMB
                    ? 'drop-shadow(0 5px 8px rgba(0,0,0,.45))'
                    : 'drop-shadow(0 5px 6px rgba(0,0,0,.25))',
              }}
            >
              {fruit.type.emoji}
            </div>
          ))}

          {/* Slash */}
          {slashPath && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
              viewBox={`0 0 ${GAME_WIDTH} ${GAME_HEIGHT}`}
              preserveAspectRatio="none"
            >
              <path
                d={slashPath}
                fill="none"
                stroke="white"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.95"
              />

              <path
                d={slashPath}
                fill="none"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="15"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}

          {/* Combo */}
          {combo >= 2 &&
            gameStarted &&
            !gameOver && (
              <div className="absolute top-5 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full bg-yellow-400 text-slate-950 font-black text-lg shadow-xl animate-pulse">
                🔥 {combo} COMBO
              </div>
            )}

          {/* Start */}
          {!gameStarted && !gameOver && (
            <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-5">
              <div className="w-full rounded-3xl bg-slate-900/95 border border-orange-400/30 p-6 text-center shadow-2xl">
                <div className="text-6xl mb-3">
                  🍉🍎🍓
                </div>

                <h2 className="text-3xl font-black">
                  FRUIT SLICE
                </h2>

                <p className="text-sm text-slate-400 mt-2">
                  আঙুল দিয়ে ফল কাটুন এবং
                  বেশি স্কোর করুন!
                </p>

                <div className="mt-4 grid grid-cols-3 gap-2 text-2xl">
                  <div className="rounded-xl bg-slate-800 py-3">
                    🍎
                  </div>

                  <div className="rounded-xl bg-slate-800 py-3">
                    🍉
                  </div>

                  <div className="rounded-xl bg-slate-800 py-3">
                    🍓
                  </div>
                </div>

                <p className="text-xs text-red-300 mt-4">
                  💣 Bomb কাটবেন না!
                </p>

                <button
                  type="button"
                  onClick={startGame}
                  className="mt-5 w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white font-black text-lg shadow-lg active:scale-95"
                >
                  🍎 START GAME
                </button>
              </div>
            </div>
          )}

          {/* Game Over */}
          {gameOver && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-5">
              <div className="w-full rounded-3xl bg-slate-900 border border-orange-500/30 p-6 text-center shadow-2xl">
                <Trophy
                  size={58}
                  className="mx-auto text-yellow-400"
                />

                <h2 className="mt-3 text-3xl font-black">
                  GAME OVER
                </h2>

                <div className="grid grid-cols-2 gap-3 mt-5">
                  <div className="bg-slate-800 rounded-2xl p-4">
                    <div className="text-xs text-slate-400">
                      SCORE
                    </div>

                    <div className="text-2xl font-black mt-1">
                      {score}
                    </div>
                  </div>

                  <div className="bg-slate-800 rounded-2xl p-4">
                    <div className="text-xs text-slate-400">
                      BEST
                    </div>

                    <div className="text-2xl font-black mt-1 text-yellow-400">
                      {highScore}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={startGame}
                  className="mt-6 w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white font-black text-lg shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  <RotateCcw size={20} />
                  PLAY AGAIN
                </button>
              </div>
            </div>
          )}
        </div>

        {message && (
          <div className="mt-3 text-center font-black text-yellow-300 animate-pulse">
            {message}
          </div>
        )}

        <div className="mt-5 w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-4">
          <div className="text-center text-xs font-bold text-slate-400">
            🍎 ফলের উপর আঙুল টেনে কাটুন
          </div>

          <div className="flex justify-center gap-5 mt-3 text-3xl">
            <span>🍎</span>
            <span>🍊</span>
            <span>🍉</span>
            <span>🍓</span>
            <span>🍍</span>
            <span>🥝</span>
          </div>

          <div className="text-center text-xs text-red-400 font-bold mt-3">
            💣 Bomb এড়িয়ে চলুন!
          </div>
        </div>
      </div>

      <div className="px-4 pb-5 text-center text-xs text-slate-500">
        যত বেশি ফল কাটবেন, তত বেশি Score পাবেন 🍉
      </div>
    </div>
  );
}
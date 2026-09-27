import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Heart,
  RotateCcw,
  Trophy,
  Zap,
  Crosshair,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { watchAdForLife } from '../../utils/rewardedAd';

type Enemy = {
  id: number;
  x: number;
  y: number;
  speed: number;
  size: number;
  type: 'normal' | 'fast' | 'tank';
};

type Bullet = {
  id: number;
  x: number;
  y: number;
  speed: number;
};

type Star = {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
};

const WIDTH = 100;
const HEIGHT = 100;

const INITIAL_LIVES = 3;
const GAME_TIME = 60;

const HIGH_SCORE_KEY = 'spaceFighterHighScore';

const randomBetween = (min: number, max: number) =>
  Math.random() * (max - min) + min;

const createEnemy = (id: number): Enemy => {
  const roll = Math.random();

  if (roll < 0.18) {
    return {
      id,
      x: randomBetween(8, 92),
      y: -12,
      speed: randomBetween(0.45, 0.7),
      size: randomBetween(8, 11),
      type: 'tank',
    };
  }

  if (roll < 0.45) {
    return {
      id,
      x: randomBetween(8, 92),
      y: -10,
      speed: randomBetween(0.9, 1.35),
      size: randomBetween(6, 8),
      type: 'fast',
    };
  }

  return {
    id,
    x: randomBetween(8, 92),
    y: -10,
    speed: randomBetween(0.55, 0.9),
    size: randomBetween(6, 9),
    type: 'normal',
  };
};

const createStar = (id: number, initial = false): Star => ({
  id,
  x: randomBetween(1, 99),
  y: initial ? randomBetween(0, 100) : -3,
  size: randomBetween(0.7, 2),
  speed: randomBetween(0.25, 0.7),
});

export default function SpaceFighter() {
  const navigate = useNavigate();

  const [adBusy, setAdBusy] = useState(false);
  const [adMessage, setAdMessage] = useState<string | null>(null);

  const [playerX, setPlayerX] = useState(50);
  const playerXRef = useRef(50);

  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);

  const [bullets, setBullets] = useState<Bullet[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);

  const [stars, setStars] = useState<Star[]>(() =>
    Array.from({ length: 55 }, (_, index) => createStar(index, true))
  );

  const starsRef = useRef<Star[]>(stars);

  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);

  const [lives, setLives] = useState(INITIAL_LIVES);
  const livesRef = useRef(INITIAL_LIVES);

  const [timeLeft, setTimeLeft] = useState(GAME_TIME);

  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem(HIGH_SCORE_KEY);
    return saved ? Number(saved) : 0;
  });

  const [flash, setFlash] = useState(false);

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);

  const enemyIdRef = useRef(1);
  const bulletIdRef = useRef(1);

  const spawnTimerRef = useRef(0);
  const shootTimerRef = useRef(0);

  const addScore = useCallback((points: number) => {
    scoreRef.current += points;
    setScore(scoreRef.current);
  }, []);

  const loseLife = useCallback(() => {
    const nextLives = livesRef.current - 1;

    livesRef.current = nextLives;
    setLives(nextLives);

    setFlash(true);

    setTimeout(() => {
      setFlash(false);
    }, 300);

    if (nextLives <= 0) {
      setGameOver(true);
      setGameStarted(false);
    }
  }, []);

  const fireBullet = useCallback(() => {
    if (!gameStarted || gameOver) return;

    const bullet: Bullet = {
      id: bulletIdRef.current++,
      x: playerXRef.current,
      y: 87,
      speed: 2.2,
    };

    bulletsRef.current = [...bulletsRef.current, bullet];
    setBullets(bulletsRef.current);
  }, [gameStarted, gameOver]);

  const movePlayer = useCallback((direction: number) => {
    const next = Math.max(
      8,
      Math.min(92, playerXRef.current + direction * 5)
    );

    playerXRef.current = next;
    setPlayerX(next);
  }, []);

  const startGame = useCallback(() => {
    scoreRef.current = 0;
    setScore(0);

    livesRef.current = INITIAL_LIVES;
    setLives(INITIAL_LIVES);

    setTimeLeft(GAME_TIME);

    playerXRef.current = 50;
    setPlayerX(50);

    enemiesRef.current = [];
    setEnemies([]);

    bulletsRef.current = [];
    setBullets([]);

    spawnTimerRef.current = 0;
    shootTimerRef.current = 0;

    setGameOver(false);
    setGameStarted(true);

    lastTimeRef.current = 0;
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
        event.preventDefault();
        movePlayer(-1);
      }

      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
        event.preventDefault();
        movePlayer(1);
      }

      if (event.code === 'Space') {
        event.preventDefault();

        if (!gameStarted && !gameOver) {
          startGame();
        } else {
          fireBullet();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [fireBullet, gameOver, gameStarted, movePlayer, startGame]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          setGameStarted(false);
          setGameOver(true);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [gameStarted, gameOver]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }

      const delta = Math.min(
        2,
        (timestamp - lastTimeRef.current) / 16.67
      );

      lastTimeRef.current = timestamp;

      // Move stars
      starsRef.current = starsRef.current
        .map((star) => {
          const nextY = star.y + star.speed * delta;

          if (nextY > 105) {
            return createStar(star.id);
          }

          return {
            ...star,
            y: nextY,
          };
        });

      setStars(starsRef.current);

      // Spawn enemies
      spawnTimerRef.current += delta;

      if (spawnTimerRef.current > 28) {
        spawnTimerRef.current = 0;

        const enemy = createEnemy(enemyIdRef.current++);

        enemiesRef.current = [
          ...enemiesRef.current,
          enemy,
        ];
      }

      // Move enemies
      enemiesRef.current = enemiesRef.current
        .map((enemy) => ({
          ...enemy,
          y: enemy.y + enemy.speed * delta,
        }))
        .filter((enemy) => enemy.y < 112);

      // Move bullets
      bulletsRef.current = bulletsRef.current
        .map((bullet) => ({
          ...bullet,
          y: bullet.y - bullet.speed * delta,
        }))
        .filter((bullet) => bullet.y > -10);

      // Collision: bullets vs enemies
      const remainingEnemies: Enemy[] = [];
      const remainingBullets = [...bulletsRef.current];

      for (const enemy of enemiesRef.current) {
        let destroyed = false;

        for (let i = 0; i < remainingBullets.length; i++) {
          const bullet = remainingBullets[i];

          const dx = bullet.x - enemy.x;
          const dy = bullet.y - enemy.y;

          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < enemy.size * 0.8) {
            destroyed = true;

            remainingBullets.splice(i, 1);

            const points =
              enemy.type === 'tank'
                ? 30
                : enemy.type === 'fast'
                  ? 20
                  : 10;

            addScore(points);
            break;
          }
        }

        if (!destroyed) {
          remainingEnemies.push(enemy);
        }
      }

      enemiesRef.current = remainingEnemies;
      bulletsRef.current = remainingBullets;

      // Collision: enemies vs player
      const safeEnemies: Enemy[] = [];

      for (const enemy of enemiesRef.current) {
        const dx = enemy.x - playerXRef.current;
        const dy = enemy.y - 88;

        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < enemy.size * 0.75 + 4) {
          loseLife();
        } else {
          safeEnemies.push(enemy);
        }
      }

      enemiesRef.current = safeEnemies;

      setEnemies(enemiesRef.current);
      setBullets(bulletsRef.current);

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [addScore, gameOver, gameStarted, loseLife]);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem(
        HIGH_SCORE_KEY,
        String(score)
      );
    }
  }, [highScore, score]);

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
            SPACE FIGHTER
          </h1>

          <p className="text-xs text-slate-400">
            মহাকাশের শত্রু ধ্বংস করুন
          </p>
        </div>

        <div className="w-11 h-11 rounded-xl bg-indigo-500/20 flex items-center justify-center">
          <Zap
            size={22}
            className="text-indigo-300"
          />
        </div>
      </div>

      {/* HUD */}
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
              { length: INITIAL_LIVES },
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
            TIME
          </div>

          <div className="font-black text-lg">
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 px-3 py-3 flex items-center justify-center">
        <div
          className={`relative w-full max-w-md aspect-[9/16] overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 shadow-2xl ${
            flash ? 'animate-pulse' : ''
          }`}
          onPointerDown={(event) => {
            if (!gameStarted || gameOver) return;

            const rect =
              event.currentTarget.getBoundingClientRect();

            const x =
              ((event.clientX - rect.left) /
                rect.width) *
              100;

            playerXRef.current = Math.max(
              8,
              Math.min(92, x)
            );

            setPlayerX(playerXRef.current);
          }}
        >
          {/* Stars */}
          {stars.map((star) => (
            <div
              key={star.id}
              className="absolute rounded-full bg-white"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: 0.35 + star.size / 3,
              }}
            />
          ))}

          {/* Nebula glow */}
          <div className="absolute top-[10%] left-[10%] w-40 h-40 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute bottom-[20%] right-[5%] w-48 h-48 rounded-full bg-purple-500/10 blur-3xl" />

          {/* Enemies */}
          {enemies.map((enemy) => {
            const enemyEmoji =
              enemy.type === 'tank'
                ? '🛸'
                : enemy.type === 'fast'
                  ? '👾'
                  : '🚀';

            return (
              <div
                key={enemy.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 select-none"
                style={{
                  left: `${enemy.x}%`,
                  top: `${enemy.y}%`,
                  fontSize: `${enemy.size * 2.4}px`,
                  filter:
                    enemy.type === 'tank'
                      ? 'drop-shadow(0 0 8px rgba(244,63,94,.8))'
                      : 'drop-shadow(0 0 7px rgba(99,102,241,.7))',
                }}
              >
                {enemyEmoji}
              </div>
            );
          })}

          {/* Bullets */}
          {bullets.map((bullet) => (
            <div
              key={bullet.id}
              className="absolute -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,.95)]"
              style={{
                left: `${bullet.x}%`,
                top: `${bullet.y}%`,
                width: '5px',
                height: '18px',
              }}
            />
          ))}

          {/* Player */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-[left] duration-75 select-none"
            style={{
              left: `${playerX}%`,
              top: '88%',
              fontSize: '48px',
              filter:
                'drop-shadow(0 0 12px rgba(56,189,248,.9))',
            }}
          >
            🚀
          </div>

          {/* Start Screen */}
          {!gameStarted && !gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/65 backdrop-blur-sm p-6">
              <div className="w-full rounded-3xl bg-slate-900/95 border border-indigo-500/30 p-6 text-center shadow-2xl">
                <div className="text-6xl mb-4">
                  🚀
                </div>

                <h2 className="text-2xl font-black">
                  SPACE FIGHTER
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  শত্রু স্পেসশিপ ধ্বংস করুন এবং
                  সর্বোচ্চ Score করুন!
                </p>

                <div className="grid grid-cols-3 gap-2 mt-5 text-xs">
                  <div className="bg-slate-800 rounded-xl p-3">
                    <div className="text-2xl">
                      👾
                    </div>
                    <div className="mt-1">
                      +10
                    </div>
                  </div>

                  <div className="bg-slate-800 rounded-xl p-3">
                    <div className="text-2xl">
                      🚀
                    </div>
                    <div className="mt-1">
                      +20
                    </div>
                  </div>

                  <div className="bg-slate-800 rounded-xl p-3">
                    <div className="text-2xl">
                      🛸
                    </div>
                    <div className="mt-1">
                      +30
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={startGame}
                  className="mt-6 w-full py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-lg shadow-lg active:scale-95"
                >
                  🚀 START MISSION
                </button>
              </div>
            </div>
          )}

          {/* Game Over */}
          {gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-6">
              <div className="w-full rounded-3xl bg-slate-900/95 border border-indigo-500/30 p-6 text-center shadow-2xl">
                <Trophy
                  size={55}
                  className="mx-auto text-yellow-400"
                />

                <h2 className="mt-3 text-3xl font-black">
                  MISSION OVER
                </h2>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="bg-slate-800 rounded-2xl p-4">
                    <div className="text-xs text-slate-400">
                      YOUR SCORE
                    </div>

                    <div className="text-2xl font-black mt-1">
                      {score}
                    </div>
                  </div>

                  <div className="bg-slate-800 rounded-2xl p-4">
                    <div className="text-xs text-slate-400">
                      HIGH SCORE
                    </div>

                    <div className="text-2xl font-black mt-1 text-yellow-400">
                      {highScore}
                    </div>
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

{adMessage && (
  <div className="mt-3 text-center text-sm font-bold text-white">
    {adMessage}
  </div>
)}
                <button
                  type="button"
                  onClick={startGame}
                  className="mt-6 w-full py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-lg shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  <RotateCcw size={20} />
                  PLAY AGAIN
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 pb-5">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-3">
          <button
            type="button"
            onPointerDown={() => movePlayer(-1)}
            className="h-16 rounded-2xl bg-slate-800 border border-slate-700 active:scale-95 flex items-center justify-center text-3xl"
          >
            ◀
          </button>

          <button
            type="button"
            onPointerDown={fireBullet}
            className="h-16 rounded-2xl bg-indigo-500 hover:bg-indigo-400 active:scale-95 flex items-center justify-center gap-2 font-black"
          >
            <Crosshair size={23} />
            FIRE
          </button>

          <button
            type="button"
            onPointerDown={() => movePlayer(1)}
            className="h-16 rounded-2xl bg-slate-800 border border-slate-700 active:scale-95 flex items-center justify-center text-3xl"
          >
            ▶
          </button>
        </div>

        <p className="text-center text-xs text-slate-500 mt-3">
          ◀ ▶ দিয়ে নড়াচড়া করুন • FIRE দিয়ে গুলি করুন
        </p>
      </div>
    </div>
  );
}
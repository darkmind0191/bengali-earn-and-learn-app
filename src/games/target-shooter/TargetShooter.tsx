import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Crosshair,
  Flame,
  Heart,
  Play,
  RotateCcw,
  Star,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';

const GAME_TIME = 60;
const START_LIVES = 3;

type TargetItem = {
  id: number;
  x: number;
  y: number;
  size: number;
  points: number;
  color: string;
};

const TARGET_COLORS = [
  'from-red-400 to-rose-600',
  'from-orange-400 to-red-500',
  'from-cyan-400 to-blue-600',
  'from-purple-400 to-violet-600',
  'from-pink-400 to-fuchsia-600',
];

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export default function TargetShooter() {
  const navigate = useNavigate();

  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [lives, setLives] = useState(START_LIVES);
  const [combo, setCombo] = useState(0);
  const [level, setLevel] = useState(1);

  const [targets, setTargets] = useState<TargetItem[]>([]);
  const [hitEffect, setHitEffect] = useState<number | null>(null);

  const targetIdRef = useRef(0);
  const spawnTimerRef = useRef<number | null>(null);

  const playSound = useCallback(
    (type: 'hit' | 'miss' | 'start' | 'gameover') => {
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          }).webkitAudioContext;

        if (!AudioContextClass) return;

        const ctx = new AudioContextClass();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'hit') {
          oscillator.frequency.value = 650 + Math.random() * 180;
          oscillator.type = 'sine';
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            ctx.currentTime + 0.12
          );
          oscillator.start();
          oscillator.stop(ctx.currentTime + 0.12);
        }

        if (type === 'miss') {
          oscillator.frequency.value = 160;
          oscillator.type = 'sawtooth';
          gain.gain.setValueAtTime(0.05, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            ctx.currentTime + 0.15
          );
          oscillator.start();
          oscillator.stop(ctx.currentTime + 0.15);
        }

        if (type === 'start') {
          oscillator.frequency.value = 500;
          oscillator.type = 'triangle';
          gain.gain.setValueAtTime(0.06, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            ctx.currentTime + 0.2
          );
          oscillator.start();
          oscillator.stop(ctx.currentTime + 0.2);
        }

        if (type === 'gameover') {
          oscillator.frequency.value = 220;
          oscillator.type = 'triangle';
          gain.gain.setValueAtTime(0.07, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            ctx.currentTime + 0.35
          );
          oscillator.start();
          oscillator.stop(ctx.currentTime + 0.35);
        }
      } catch {
        // Audio is optional.
      }
    },
    []
  );

  const getLevel = useCallback((currentHits: number) => {
    return Math.min(10, Math.floor(currentHits / 5) + 1);
  }, []);

  const spawnTarget = useCallback(() => {
    const newLevel = getLevel(hits);

    const size = Math.max(52, 88 - newLevel * 4);

    const target: TargetItem = {
      id: targetIdRef.current++,
      x: randomBetween(5, 95),
      y: randomBetween(7, 88),
      size,
      points: Math.max(5, 15 - Math.floor(newLevel / 2)),
      color:
        TARGET_COLORS[
          Math.floor(Math.random() * TARGET_COLORS.length)
        ],
    };

    setTargets((current) => {
      const next = [...current, target];

      const maxTargets = Math.min(5, 1 + Math.floor(newLevel / 2));

      return next.slice(-maxTargets);
    });
  }, [getLevel, hits]);

  const finishGame = useCallback(() => {
    setGameStarted(false);
    setGameOver(true);
    setTargets([]);
    playSound('gameover');
  }, [playSound]);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setTimeLeft(GAME_TIME);
    setScore(0);
    setHits(0);
    setMisses(0);
    setLives(START_LIVES);
    setCombo(0);
    setLevel(1);
    setTargets([]);
    targetIdRef.current = 0;

    playSound('start');

    setTimeout(() => {
      spawnTarget();
    }, 200);
  };

  const handleTargetHit = (target: TargetItem) => {
    if (!gameStarted) return;

    const nextCombo = combo + 1;
    const comboBonus = Math.min(5, Math.floor(nextCombo / 3));
    const earned = target.points + comboBonus * 2;

    setScore((value) => value + earned);
    setHits((value) => {
      const next = value + 1;
      setLevel(getLevel(next));
      return next;
    });

    setCombo(nextCombo);
    setHitEffect(target.id);
    setTargets((current) =>
      current.filter((item) => item.id !== target.id)
    );

    playSound('hit');

    setTimeout(() => {
      setHitEffect(null);
    }, 180);
  };

  const handleMiss = () => {
    if (!gameStarted) return;

    setMisses((value) => value + 1);
    setCombo(0);

    setLives((current) => {
      const next = current - 1;

      if (next <= 0) {
        setTimeout(() => finishGame(), 0);
        return 0;
      }

      return next;
    });

    playSound('miss');
  };

  /*
   * Countdown
   */
  useEffect(() => {
    if (!gameStarted) return;

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setTimeout(() => finishGame(), 0);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [gameStarted, finishGame]);

  /*
   * Target spawning
   */
  useEffect(() => {
    if (!gameStarted) return;

    if (spawnTimerRef.current) {
      window.clearInterval(spawnTimerRef.current);
    }

    const interval = Math.max(420, 1050 - level * 60);

    spawnTimerRef.current = window.setInterval(() => {
      spawnTarget();
    }, interval);

    return () => {
      if (spawnTimerRef.current) {
        window.clearInterval(spawnTimerRef.current);
      }
    };
  }, [gameStarted, level, spawnTarget]);

  /*
   * Targets automatically disappear.
   * Missing them costs a life.
   */
  useEffect(() => {
    if (!gameStarted) return;

    const timer = window.setInterval(() => {
      setTargets((current) => {
        if (current.length === 0) return current;

        const expired = current[0];

        setTimeout(() => {
          if (gameStarted) {
            handleMiss();
          }
        }, 0);

        return current.slice(1);
      });
    }, Math.max(950, 1500 - level * 60));

    return () => window.clearInterval(timer);
  }, [gameStarted, level]);

  const accuracy =
    hits + misses > 0
      ? Math.round((hits / (hits + misses)) * 100)
      : 0;

  /*
   * Start Screen
   */
  if (!gameStarted && !gameOver) {
    return (
      <div className="min-h-screen bg-slate-950 text-white pb-24">
        <div className="max-w-xl mx-auto min-h-screen flex flex-col">

          {/* App Bar */}
          <div className="px-4 pt-5">
            <button
              type="button"
              onClick={() => navigate('/mini-games')}
              className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center active:scale-95 transition"
            >
              <ArrowLeft size={21} />
            </button>
          </div>

          {/* Logo */}
          <div className="flex-1 flex flex-col items-center justify-center px-6">

            <div className="relative mb-7">
              <div className="w-32 h-32 rounded-[32px] bg-gradient-to-br from-red-500 via-orange-500 to-yellow-400 shadow-2xl shadow-orange-500/30 flex items-center justify-center">
                <div className="w-24 h-24 rounded-[26px] bg-slate-950/20 border border-white/20 flex items-center justify-center">
                  <Target size={58} strokeWidth={2.2} />
                </div>
              </div>

              <div className="absolute -right-3 -bottom-3 w-12 h-12 rounded-2xl bg-yellow-400 text-slate-950 flex items-center justify-center shadow-lg">
                <Zap size={25} fill="currentColor" />
              </div>
            </div>

            <h1 className="text-4xl font-black tracking-tight">
              TARGET SHOOTER
            </h1>

            <p className="text-orange-300 font-semibold mt-2">
              🎯 লক্ষ্য করুন • দ্রুত শুট করুন
            </p>

            {/* Feature Cards */}
            <div className="grid grid-cols-3 gap-2 w-full max-w-sm mt-8">
              <div className="rounded-2xl bg-white/5 border border-white/10 p-3 text-center">
                <Trophy
                  size={20}
                  className="mx-auto text-yellow-400"
                />
                <p className="text-xs text-slate-400 mt-2">
                  High Score
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 border border-white/10 p-3 text-center">
                <Flame
                  size={20}
                  className="mx-auto text-orange-400"
                />
                <p className="text-xs text-slate-400 mt-2">
                  Combo
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 border border-white/10 p-3 text-center">
                <Star
                  size={20}
                  className="mx-auto text-cyan-400"
                />
                <p className="text-xs text-slate-400 mt-2">
                  Levels
                </p>
              </div>
            </div>

            {/* Start Button */}
            <button
              type="button"
              onClick={startGame}
              className="w-full max-w-sm mt-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 font-black text-lg shadow-xl shadow-orange-500/20 active:scale-[0.98] transition flex items-center justify-center gap-2"
            >
              <Play size={22} fill="currentColor" />
              START GAME
            </button>

            <p className="text-xs text-slate-500 mt-4 text-center">
              ৬০ সেকেন্ডে যত বেশি target hit করতে পারবেন
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
   * Game Over Screen
   */
  if (gameOver) {
    return (
      <div className="min-h-screen bg-slate-950 text-white pb-24">
        <div className="max-w-xl mx-auto min-h-screen flex flex-col">

          <div className="px-4 pt-5">
            <button
              type="button"
              onClick={() => navigate('/mini-games')}
              className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"
            >
              <ArrowLeft size={21} />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center px-5">

            <div className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-2xl mb-5">
              <Trophy
                size={48}
                className="text-white"
                fill="currentColor"
              />
            </div>

            <p className="text-orange-400 font-bold tracking-widest text-sm">
              GAME COMPLETE
            </p>

            <h1 className="text-4xl font-black mt-2">
              দারুণ খেলেছেন!
            </h1>

            {/* Score */}
            <div className="w-full max-w-sm mt-7 rounded-3xl bg-white/5 border border-white/10 p-6 text-center">
              <p className="text-sm text-slate-400">
                আপনার স্কোর
              </p>

              <div className="text-6xl font-black text-yellow-400 mt-2">
                {score}
              </div>

              <div className="grid grid-cols-3 gap-2 mt-6">
                <div className="rounded-2xl bg-white/5 p-3">
                  <p className="text-xl font-bold">
                    {hits}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    HIT
                  </p>
                </div>

                <div className="rounded-2xl bg-white/5 p-3">
                  <p className="text-xl font-bold">
                    {accuracy}%
                  </p>
                  <p className="text-[11px] text-slate-500">
                    ACCURACY
                  </p>
                </div>

                <div className="rounded-2xl bg-white/5 p-3">
                  <p className="text-xl font-bold">
                    {level}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    LEVEL
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="w-full max-w-sm mt-6 space-y-3">
              <button
                type="button"
                onClick={startGame}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition"
              >
                <RotateCcw size={20} />
                আবার খেলুন
              </button>

              <button
                type="button"
                onClick={() => navigate('/mini-games')}
                className="w-full py-4 rounded-2xl bg-white/10 border border-white/10 font-semibold active:scale-[0.98] transition"
              >
                সব গেম দেখুন
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
   * Gameplay
   */
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">

      <div className="max-w-xl mx-auto min-h-screen flex flex-col">

        {/* Top Bar */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">

            <button
              type="button"
              onClick={() => navigate('/mini-games')}
              className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"
            >
              <ArrowLeft size={20} />
            </button>

            {/* Game Logo */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                <Crosshair size={20} />
              </div>

              <div>
                <p className="text-xs text-slate-400 leading-none">
                  GAME
                </p>
                <p className="font-bold text-sm leading-tight">
                  TARGET SHOOTER
                </p>
              </div>
            </div>

            <div className="w-10" />
          </div>
        </div>

        {/* Stats */}
        <div className="px-4">
          <div className="grid grid-cols-4 gap-2">

            <div className="rounded-2xl bg-white/5 border border-white/10 p-2.5 text-center">
              <p className="text-[10px] text-slate-500">
                SCORE
              </p>
              <p className="font-black text-yellow-400">
                {score}
              </p>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-2.5 text-center">
              <p className="text-[10px] text-slate-500">
                TIME
              </p>
              <p
                className={`font-black ${
                  timeLeft <= 10
                    ? 'text-red-400'
                    : 'text-cyan-400'
                }`}
              >
                {timeLeft}s
              </p>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-2.5 text-center">
              <p className="text-[10px] text-slate-500">
                LEVEL
              </p>
              <p className="font-black text-purple-400">
                {level}
              </p>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-2.5 text-center">
              <p className="text-[10px] text-slate-500">
                COMBO
              </p>
              <p className="font-black text-orange-400">
                x{Math.max(1, combo)}
              </p>
            </div>

          </div>
        </div>

        {/* Timer Bar */}
        <div className="px-4 mt-3">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                timeLeft <= 10
                  ? 'bg-red-500'
                  : 'bg-gradient-to-r from-cyan-400 to-blue-500'
              }`}
              style={{
                width: `${(timeLeft / GAME_TIME) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Lives */}
        <div className="px-4 mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {Array.from({ length: START_LIVES }).map((_, index) => (
              <Heart
                key={index}
                size={18}
                className={
                  index < lives
                    ? 'text-red-500'
                    : 'text-slate-700'
                }
                fill={
                  index < lives
                    ? 'currentColor'
                    : 'none'
                }
              />
            ))}
          </div>

          <div className="text-xs text-slate-500">
            লক্ষ্য করুন এবং ট্যাপ করুন 🎯
          </div>
        </div>

        {/* Game Arena */}
        <div className="flex-1 px-3 py-3">

          <div
            className="relative w-full h-full min-h-[520px] rounded-[28px] overflow-hidden border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950"
            style={{
              backgroundImage: `
                radial-gradient(circle at 20% 20%, rgba(59,130,246,0.10), transparent 25%),
                radial-gradient(circle at 80% 70%, rgba(168,85,247,0.10), transparent 25%)
              `,
            }}
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                handleMiss();
              }
            }}
          >

            {/* Grid decoration */}
            <div
              className="absolute inset-0 opacity-[0.035] pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />

            {/* Center instruction when no target */}
            {targets.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center opacity-40">
                  <Crosshair
                    size={48}
                    className="mx-auto"
                  />
                  <p className="text-sm mt-3">
                    Target আসছে...
                  </p>
                </div>
              </div>
            )}

            {/* Targets */}
            {targets.map((target) => (
              <button
                key={target.id}
                type="button"
                aria-label="Shoot target"
                onClick={(event) => {
                  event.stopPropagation();
                  handleTargetHit(target);
                }}
                className={`absolute rounded-full bg-gradient-to-br ${target.color} shadow-xl shadow-black/30 active:scale-75 transition-transform duration-100 ${
                  hitEffect === target.id
                    ? 'scale-150 opacity-0'
                    : 'scale-100'
                }`}
                style={{
                  width: target.size,
                  height: target.size,
                  left: `${target.x}%`,
                  top: `${target.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {/* Target rings */}
                <span className="absolute inset-[10%] rounded-full border-2 border-white/70" />
                <span className="absolute inset-[25%] rounded-full border-2 border-white/70" />
                <span className="absolute inset-[40%] rounded-full bg-white/90" />

                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[11px] font-black text-white drop-shadow-lg">
                  +{target.points}
                </span>
              </button>
            ))}

            {/* Combo indicator */}
            {combo >= 3 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
                <div className="px-4 py-2 rounded-full bg-orange-500/90 shadow-lg shadow-orange-500/20 flex items-center gap-2 animate-pulse">
                  <Flame size={17} fill="currentColor" />
                  <span className="font-black text-sm">
                    {combo} COMBO!
                  </span>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Bottom Hint */}
        <div className="px-4 pb-5 text-center">
          <p className="text-[11px] text-slate-600">
            Target-এ ট্যাপ করুন • Miss করলে Life কমবে
          </p>
        </div>

      </div>
    </div>
  );
}


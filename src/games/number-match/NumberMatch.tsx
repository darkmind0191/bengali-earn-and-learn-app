import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  Clock3,
  Coins,
  RotateCcw,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react';

const TOTAL_ROUNDS = 10;
const TIME_PER_ROUND = 8;
const POINTS_PER_MATCH = 5;

type Round = {
  target: number;
  numbers: number[];
};

function createRound(): Round {
  const target = Math.floor(Math.random() * 9) + 1;

  const numbers = Array.from({ length: 9 }, (_, index) => {
    if (index === Math.floor(Math.random() * 9)) {
      return target;
    }

    return Math.floor(Math.random() * 9) + 1;
  });

  // নিশ্চিত করি অন্তত একটি target থাকবে
  numbers[Math.floor(Math.random() * numbers.length)] = target;

  return {
    target,
    numbers,
  };
}

function createRounds(): Round[] {
  return Array.from({ length: TOTAL_ROUNDS }, () => createRound());
}

export default function NumberMatch() {
  const navigate = useNavigate();

  const [rounds, setRounds] = useState<Round[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_ROUND);

  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const currentRound = rounds[roundIndex];

  const progress = useMemo(() => {
    if (!rounds.length) return 0;

    return ((roundIndex + 1) / rounds.length) * 100;
  }, [roundIndex, rounds.length]);

  const startGame = () => {
    setRounds(createRounds());
    setRoundIndex(0);
    setScore(0);
    setCorrect(0);
    setTimeLeft(TIME_PER_ROUND);
    setSelectedIndex(null);
    setAnswered(false);
    setGameStarted(true);
    setGameFinished(false);
  };

  useEffect(() => {
    if (!gameStarted || gameFinished || answered || !currentRound) {
      return;
    }

    if (timeLeft <= 0) {
      setAnswered(true);

      window.setTimeout(() => {
        goNextRound();
      }, 700);

      return;
    }

    const timer = window.setTimeout(() => {
      setTimeLeft((value) => value - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [
    gameStarted,
    gameFinished,
    answered,
    timeLeft,
    currentRound,
  ]);

  const goNextRound = () => {
    if (roundIndex + 1 >= rounds.length) {
      setGameFinished(true);
      return;
    }

    setRoundIndex((value) => value + 1);
    setSelectedIndex(null);
    setAnswered(false);
    setTimeLeft(TIME_PER_ROUND);
  };

  const handleNumberClick = (number: number, index: number) => {
    if (answered || !currentRound) return;

    setSelectedIndex(index);
    setAnswered(true);

    if (number === currentRound.target) {
      setScore((value) => value + POINTS_PER_MATCH);
      setCorrect((value) => value + 1);
    }

    window.setTimeout(() => {
      goNextRound();
    }, 700);
  };

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
        <div className="max-w-xl mx-auto px-4 py-5">

          <button
            type="button"
            onClick={() => navigate('/mini-games')}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 mb-5"
          >
            <ArrowLeft size={19} />
            মিনি গেম
          </button>

          {/* Game App Header */}
          <div className="rounded-[28px] overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">

            <div className="bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 p-6 text-white">

              <div className="flex items-center gap-4">

                {/* Game Logo */}
                <div className="w-20 h-20 rounded-[24px] bg-white/15 border border-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg shrink-0">
                  <div className="relative">
                    <Brain size={43} strokeWidth={2.2} />

                    <div className="absolute -right-3 -top-3 w-7 h-7 rounded-full bg-yellow-300 text-blue-700 flex items-center justify-center font-black text-xs">
                      123
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
                    Mini Game
                  </div>

                  <h1 className="text-3xl font-black mt-1">
                    নাম্বার ম্যাচ
                  </h1>

                  <p className="text-sm text-blue-100 mt-1">
                    মিল খুঁজুন, দ্রুত জিতুন!
                  </p>
                </div>

              </div>

              <div className="grid grid-cols-3 gap-2 mt-7">

                <div className="rounded-2xl bg-white/10 border border-white/10 p-3 text-center">
                  <div className="text-lg font-black">
                    {TOTAL_ROUNDS}
                  </div>
                  <div className="text-[11px] text-white/70">
                    রাউন্ড
                  </div>
                </div>

                <div className="rounded-2xl bg-white/10 border border-white/10 p-3 text-center">
                  <div className="text-lg font-black">
                    {TIME_PER_ROUND}s
                  </div>
                  <div className="text-[11px] text-white/70">
                    সময়
                  </div>
                </div>

                <div className="rounded-2xl bg-white/10 border border-white/10 p-3 text-center">
                  <div className="text-lg font-black">
                    +{POINTS_PER_MATCH}
                  </div>
                  <div className="text-[11px] text-white/70">
                    পয়েন্ট
                  </div>
                </div>

              </div>

            </div>

            <div className="bg-white dark:bg-slate-900 p-5">

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <Sparkles className="text-blue-600" size={20} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white">
                    কীভাবে খেলবেন?
                  </h2>

                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    উপরের target সংখ্যাটি খুঁজে সঠিক নম্বরে চাপ দিন।
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={startGame}
                className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 font-bold text-base shadow-lg active:scale-[0.98] transition"
              >
                🎮 খেলা শুরু করুন
              </button>

            </div>

          </div>

        </div>
      </div>
    );
  }

  if (gameFinished) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
        <div className="max-w-xl mx-auto px-4 py-6">

          <div className="rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-6 text-center">

            <div className="w-24 h-24 mx-auto rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
              <Trophy
                size={48}
                className="text-yellow-500"
              />
            </div>

            <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold">
              <Sparkles size={14} />
              GAME COMPLETE
            </div>

            <h1 className="text-3xl font-black text-slate-900 dark:text-white mt-4">
              নাম্বার ম্যাচ
            </h1>

            <p className="text-slate-500 dark:text-slate-400 mt-1">
              আপনার গেমের ফলাফল
            </p>

            <div className="mt-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5">

              <div className="flex items-center justify-center gap-2">
                <Coins
                  size={24}
                  className="text-yellow-500"
                />

                <span className="text-5xl font-black text-blue-600 dark:text-blue-400">
                  {score}
                </span>
              </div>

              <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                মোট পয়েন্ট
              </div>

              <div className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                {correct} / {TOTAL_ROUNDS} সঠিক
              </div>

            </div>

            <button
              type="button"
              onClick={startGame}
              className="w-full mt-6 rounded-2xl bg-blue-600 text-white py-4 font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition"
            >
              <RotateCcw size={19} />
              আবার খেলুন
            </button>

            <button
              type="button"
              onClick={() => navigate('/mini-games')}
              className="w-full mt-2 py-3 text-sm font-semibold text-slate-500 dark:text-slate-400"
            >
              মিনি গেমে ফিরে যান
            </button>

          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      <div className="max-w-xl mx-auto px-4 py-5">

        {/* Top App Bar */}
        <div className="flex items-center justify-between mb-5">

          <button
            type="button"
            onClick={() => navigate('/mini-games')}
            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex items-center gap-2">

            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white flex items-center justify-center">
              <Brain size={21} />
            </div>

            <div>
              <div className="font-black text-sm text-slate-900 dark:text-white">
                নাম্বার ম্যাচ
              </div>

              <div className="text-[11px] text-slate-400">
                Mini Game
              </div>
            </div>

          </div>

          <div className="flex items-center gap-1 font-black text-yellow-500">
            <Coins size={18} />
            {score}
          </div>

        </div>

        {/* Progress */}
        <div className="mb-5">

          <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2">
            <span>
              রাউন্ড {roundIndex + 1} / {TOTAL_ROUNDS}
            </span>

            <span>
              {Math.round(progress)}%
            </span>
          </div>

          <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-indigo-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

        </div>

        {/* Target Card */}
        <div className="rounded-[28px] bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 p-6 text-white shadow-xl">

          <div className="flex items-center justify-between">

            <div>
              <div className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                Find Number
              </div>

              <div className="text-sm font-semibold mt-1">
                এই সংখ্যাটি খুঁজুন
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-white/15 rounded-xl px-3 py-2">
              <Clock3 size={17} />
              <span className="font-black">
                {timeLeft}s
              </span>
            </div>

          </div>

          <div className="text-center py-7">

            <div className="text-sm text-white/70 font-semibold">
              TARGET
            </div>

            <div className="text-7xl font-black tracking-tight mt-1">
              {currentRound?.target}
            </div>

          </div>

        </div>

        {/* Number Grid */}
        <div className="mt-5 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm">

          <div className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">
            সঠিক সংখ্যাটিতে চাপ দিন
          </div>

          <div className="grid grid-cols-3 gap-3">

            {currentRound?.numbers.map((number, index) => {

              const isSelected = selectedIndex === index;
              const isCorrect =
                answered &&
                number === currentRound.target;

              const isWrong =
                isSelected &&
                number !== currentRound.target;

              return (
                <button
                  key={`${roundIndex}-${index}`}
                  type="button"
                  onClick={() => handleNumberClick(number, index)}
                  disabled={answered}
                  className={`aspect-square rounded-2xl border-2 text-3xl font-black transition active:scale-95 ${
                    isCorrect
                      ? 'border-green-500 bg-green-50 text-green-600 dark:bg-green-900/20'
                      : isWrong
                      ? 'border-red-500 bg-red-50 text-red-600 dark:bg-red-900/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white'
                  }`}
                >
                  {number}

                  {isCorrect && (
                    <CheckCircle2
                      size={19}
                      className="mx-auto mt-1 text-green-500"
                    />
                  )}

                  {isWrong && (
                    <XCircle
                      size={19}
                      className="mx-auto mt-1 text-red-500"
                    />
                  )}

                </button>
              );
            })}

          </div>

        </div>

      </div>
    </div>
  );
}


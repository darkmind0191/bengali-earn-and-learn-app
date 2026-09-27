import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Brain,
  CheckCircle,
  Clock3,
  Coins,
  PlayCircle,
  RotateCcw,
  Trophy,
  XCircle,
} from 'lucide-react';
import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';
import { useAuth } from "../../AuthContext";
import { supabase } from "../../lib/supabase";

const REWARDED_AD_ID = 'ca-app-pub-7724637834567497/4602473415';

const QUESTIONS_PER_GAME = 10;
const QUESTION_TIME = 10;
const POINTS_PER_CORRECT = 5;

type Question = {
  question: string;
  options: string[];
  answer: number;
};

const QUESTIONS: Question[] = [
  {
    question: '৫ + ৭ = কত?',
    options: ['১০', '১১', '১২', '১৩'],
    answer: 2,
  },
  {
    question: 'বাংলাদেশের রাজধানী কোনটি?',
    options: ['চট্টগ্রাম', 'ঢাকা', 'খুলনা', 'রাজশাহী'],
    answer: 1,
  },
  {
    question: 'এক ডজন সমান কতটি?',
    options: ['১০', '১১', '১২', '১৩'],
    answer: 2,
  },
  {
    question: 'পানির রাসায়নিক সংকেত কোনটি?',
    options: ['CO₂', 'O₂', 'H₂O', 'NaCl'],
    answer: 2,
  },
  {
    question: '৯ × ৩ = কত?',
    options: ['১৮', '২১', '২৭', '৩০'],
    answer: 2,
  },
  {
    question: 'সূর্য কোন দিকে ওঠে?',
    options: ['পূর্ব', 'পশ্চিম', 'উত্তর', 'দক্ষিণ'],
    answer: 0,
  },
  {
    question: 'বাংলা বর্ণমালায় স্বরবর্ণ কয়টি?',
    options: ['৯', '১০', '১১', '১২'],
    answer: 2,
  },
  {
    question: 'এক ঘণ্টায় কত মিনিট?',
    options: ['৩০', '৪৫', '৬০', '৯০'],
    answer: 2,
  },
  {
    question: 'পৃথিবীর উপগ্রহ কোনটি?',
    options: ['সূর্য', 'চাঁদ', 'মঙ্গল', 'শুক্র'],
    answer: 1,
  },
  {
    question: '১৫ - ৬ = কত?',
    options: ['৭', '৮', '৯', '১০'],
    answer: 2,
  },
  {
    question: 'বাংলাদেশের জাতীয় ফুল কোনটি?',
    options: ['গোলাপ', 'শাপলা', 'জবা', 'বেলি'],
    answer: 1,
  },
  {
    question: '২ × ৮ = কত?',
    options: ['১৪', '১৫', '১৬', '১৮'],
    answer: 2,
  },
];

function shuffleQuestions() {
  return [...QUESTIONS]
    .sort(() => Math.random() - 0.5)
    .slice(0, QUESTIONS_PER_GAME);
}

export default function SmartQuick() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);

  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);

  const [adBusy, setAdBusy] = useState(false);
  const [adMessage, setAdMessage] = useState<string | null>(null);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (!gameStarted || gameFinished || selectedAnswer !== null) {
      return;
    }

    if (timeLeft <= 0) {
      handleAnswer(-1);
      return;
    }

    const timer = window.setTimeout(() => {
      setTimeLeft((value) => value - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [
    gameStarted,
    gameFinished,
    selectedAnswer,
    timeLeft,
  ]);

  const startGame = () => {
    setQuestions(shuffleQuestions());
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setCorrectAnswers(0);
    setTimeLeft(QUESTION_TIME);
    setGameStarted(true);
    setGameFinished(false);
    setAdMessage(null);
    setRewardClaimed(false);
  };

  const handleAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null || !currentQuestion) return;

    setSelectedAnswer(answerIndex);

    if (answerIndex === currentQuestion.answer) {
      setScore((value) => value + POINTS_PER_CORRECT);
      setCorrectAnswers((value) => value + 1);
    }

    window.setTimeout(() => {
      if (currentIndex + 1 >= questions.length) {
        setGameFinished(true);
        return;
      }

      setCurrentIndex((value) => value + 1);
      setSelectedAnswer(null);
      setTimeLeft(QUESTION_TIME);
    }, 650);
  };

  const claimGamePoints = async () => {
    if (!profile?.id || score <= 0) return;

    const { error } = await supabase.rpc('increment_balance', {
      p_user_id: profile.id,
      p_amount: score,
    });

    if (error) {
      console.error('Game reward error:', error);
      setAdMessage('পয়েন্ট যোগ করতে সমস্যা হয়েছে।');
      return;
    }

    await refreshProfile();
  };

  const handleRewardedAd = async () => {
    if (!profile?.id) {
      setAdMessage('আগে লগইন করুন।');
      return;
    }

    if (adBusy || rewardClaimed) {
      return;
    }

    setAdBusy(true);
    setAdMessage('বিজ্ঞাপন প্রস্তুত হচ্ছে...');

    let rewardGranted = false;
    let rewardListener: { remove: () => Promise<void> } | null = null;

    const rewardId = crypto.randomUUID();

    try {
      rewardListener = await AdMob.addListener(
        RewardAdPluginEvents.Rewarded,
        async () => {
          if (rewardGranted) return;

          rewardGranted = true;

          setAdMessage('বিজ্ঞাপন সম্পূর্ণ হয়েছে। পয়েন্ট যোগ হচ্ছে...');

          console.log('Smart Quick rewarded event received');
          console.log('Reward ID:', rewardId);

          const { data, error } = await supabase.rpc(
            'claim_ad_reward',
            {
              p_reward_id: rewardId,
            }
          );

          console.log('claim_ad_reward data:', data);
          console.log('claim_ad_reward error:', error);

          if (error) {
            console.error('claim_ad_reward RPC error:', error);

            setAdMessage(
              `পয়েন্ট যোগ হয়নি: ${error.message}`
            );

            return;
          }

          if (!data?.success) {
            console.error(
              'claim_ad_reward rejected:',
              data
            );

            const errorMap: Record<string, string> = {
              not_authenticated: 'আপনি লগইন করা নেই।',
              profile_not_found: 'প্রোফাইল পাওয়া যায়নি।',
              duplicate_reward:
                'এই বিজ্ঞাপনের reward ইতিমধ্যে দেওয়া হয়েছে।',
            };

            setAdMessage(
              errorMap[data?.error] ??
                `Reward নেওয়া যায়নি: ${data?.error ?? 'unknown error'}`
            );

            return;
          }

          setRewardClaimed(true);

          await refreshProfile();

          setAdMessage(
            `🎉 অভিনন্দন! +${data.points} পয়েন্ট আপনার Wallet-এ যোগ হয়েছে।`
          );
        }
      );

      await AdMob.prepareRewardVideoAd({
        adId: REWARDED_AD_ID,
        isTesting: false,
      });

      setAdMessage('বিজ্ঞাপন চালু হচ্ছে...');

      await AdMob.showRewardVideoAd();

      // Reward event callback পাওয়ার জন্য সামান্য সময়
      await new Promise((resolve) =>
        setTimeout(resolve, 1500)
      );

    } catch (error) {
      console.error('Smart Quick Rewarded Ad error:', error);

      setAdMessage(
        'বিজ্ঞাপন চালু করা যায়নি। আবার চেষ্টা করুন।'
      );
    } finally {
      if (rewardListener) {
        await rewardListener.remove();
      }

      setAdBusy(false);
    }
  };

  const finishGame = async () => {
    if (score > 0) {
      await claimGamePoints();
    }
  };

  useEffect(() => {
    if (gameFinished) {
      finishGame();
    }
  }, [gameFinished]);

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
        <div className="max-w-xl mx-auto px-4 py-5">

          <button
            type="button"
            onClick={() => navigate('/mini-games')}
            className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 mb-5"
          >
            <ArrowLeft size={19} />
            মিনি গেম
          </button>

          <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-6 text-white shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mb-5">
              <Brain size={34} />
            </div>

            <h1 className="text-2xl font-bold">
              স্মার্ট কুইক
            </h1>

            <p className="text-blue-100 mt-2">
              দ্রুত চিন্তা করুন, সঠিক উত্তর দিন এবং পয়েন্ট অর্জন করুন।
            </p>

            <div className="grid grid-cols-3 gap-2 mt-6">
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="font-bold">
                  {QUESTIONS_PER_GAME}
                </div>
                <div className="text-[11px] text-white/70">
                  প্রশ্ন
                </div>
              </div>

              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="font-bold">
                  {QUESTION_TIME}s
                </div>
                <div className="text-[11px] text-white/70">
                  সময়
                </div>
              </div>

              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="font-bold">
                  +{POINTS_PER_CORRECT}
                </div>
                <div className="text-[11px] text-white/70">
                  সঠিক উত্তর
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={startGame}
              className="w-full mt-6 bg-white text-indigo-700 rounded-xl py-3.5 font-bold flex items-center justify-center gap-2 active:scale-95 transition"
            >
              <PlayCircle size={21} />
              গেম শুরু করুন
            </button>
          </div>

          <div className="mt-4 rounded-2xl bg-white dark:bg-slate-800 p-4 border border-slate-100 dark:border-slate-700">
            <div className="flex items-start gap-3">
              <Clock3 className="text-blue-500 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  কীভাবে খেলবেন?
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  প্রতিটি প্রশ্নের জন্য নির্দিষ্ট সময় থাকবে।
                  যত বেশি সঠিক উত্তর দেবেন, তত বেশি পয়েন্ট পাবেন।
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  if (gameFinished) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
        <div className="max-w-xl mx-auto px-4 py-6">

          <div className="rounded-3xl bg-white dark:bg-slate-800 p-6 text-center shadow-sm border border-slate-100 dark:border-slate-700">

            <div className="w-20 h-20 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center mx-auto">
              <Trophy className="text-yellow-500" size={42} />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-5">
              গেম শেষ!
            </h1>

            <p className="text-slate-500 dark:text-slate-400 mt-1">
              আপনার ফলাফল
            </p>

            <div className="mt-6 rounded-2xl bg-blue-50 dark:bg-blue-900/20 p-5">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {score}
              </div>

              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                অর্জিত পয়েন্ট
              </div>

              <div className="text-sm text-slate-600 dark:text-slate-300 mt-3">
                {correctAnswers} / {QUESTIONS_PER_GAME} সঠিক উত্তর
              </div>
            </div>

            {score > 0 && !rewardClaimed && (
              <div className="mt-5 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 p-4 text-white text-left">

                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                    <PlayCircle size={23} />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-bold">
                      আরও পয়েন্ট চান?
                    </h3>

                    <p className="text-xs text-white/75 mt-0.5">
                      একটি Rewarded Ad দেখুন এবং bonus পয়েন্ট নিন।
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRewardedAd}
                  disabled={adBusy}
                  className="w-full mt-4 bg-white text-indigo-700 rounded-xl py-3 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 active:scale-95 transition"
                >
                  <PlayCircle size={18} />

                  {adBusy
                    ? 'বিজ্ঞাপন প্রস্তুত হচ্ছে...'
                    : 'বিজ্ঞাপন দেখে bonus নিন'}
                </button>

                {adMessage && (
                  <p className="text-xs text-white/85 mt-3 text-center">
                    {adMessage}
                  </p>
                )}
              </div>
            )}

            {rewardClaimed && (
              <div className="mt-5 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 p-3 text-sm font-medium">
                ✓ বিজ্ঞাপনের bonus ইতিমধ্যে যোগ হয়েছে।
              </div>
            )}

            <button
              type="button"
              onClick={startGame}
              className="w-full mt-5 bg-blue-600 text-white rounded-xl py-3.5 font-bold flex items-center justify-center gap-2 active:scale-95 transition"
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      <div className="max-w-xl mx-auto px-4 py-5">

        <div className="flex items-center justify-between mb-5">
          <button
            type="button"
            onClick={() => navigate('/mini-games')}
            className="p-2 -ml-2 text-slate-600 dark:text-slate-300"
          >
            <ArrowLeft size={21} />
          </button>

          <div className="text-center">
            <div className="text-xs text-slate-400">
              প্রশ্ন {currentIndex + 1} / {questions.length}
            </div>
            <div className="font-bold text-slate-900 dark:text-white">
              স্মার্ট কুইক
            </div>
          </div>

          <div className="flex items-center gap-1 text-brand-600 dark:text-brand-400 font-bold">
            <Coins size={17} />
            {score}
          </div>
        </div>

        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-5">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / questions.length) * 100}%`,
            }}
          />
        </div>

        <div className="rounded-3xl bg-white dark:bg-slate-800 p-5 shadow-sm border border-slate-100 dark:border-slate-700">

          <div className="flex items-center justify-between mb-5">
            <span className="text-xs font-semibold text-slate-400">
              দ্রুত উত্তর দিন
            </span>

            <div
              className={`flex items-center gap-1 font-bold ${
                timeLeft <= 3
                  ? 'text-red-500'
                  : 'text-blue-600 dark:text-blue-400'
              }`}
            >
              <Clock3 size={17} />
              {timeLeft}s
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
            {currentQuestion?.question}
          </h2>

          <div className="space-y-3 mt-6">
            {currentQuestion?.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect =
                selectedAnswer !== null &&
                index === currentQuestion.answer;
              const isWrong =
                isSelected && index !== currentQuestion.answer;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleAnswer(index)}
                  disabled={selectedAnswer !== null}
                  className={`w-full p-4 rounded-xl border text-left flex items-center gap-3 transition ${
                    isCorrect
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : isWrong
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
                  }`}
                >
                  <span className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                    {String.fromCharCode(65 + index)}
                  </span>

                  <span className="flex-1 font-medium text-slate-800 dark:text-slate-200">
                    {option}
                  </span>

                  {isCorrect && (
                    <CheckCircle
                      className="text-green-500 shrink-0"
                      size={20}
                    />
                  )}

                  {isWrong && (
                    <XCircle
                      className="text-red-500 shrink-0"
                      size={20}
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
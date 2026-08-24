import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';

type DailyChallengeData = {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  points: number;
  challenge_date: string;
};

export default function DailyChallenge() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();

  const [dailyChallenge, setDailyChallenge] =
    useState<DailyChallengeData | null>(null);

  const [challengeAnswered, setChallengeAnswered] = useState(false);
  const [challengeResult, setChallengeResult] = useState<string | null>(null);
  const [challengeBusy, setChallengeBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadDailyChallenge = useCallback(async () => {
    if (!profile) return;

    setLoading(true);

    // প্রথমে সরাসরি সর্বশেষ Daily Challenge আনা হচ্ছে
    const { data: challenge, error } = await supabase
      .from('daily_challenges')
      .select('*')
      .order('challenge_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log('Daily Challenge result:', challenge);
    console.log('Daily Challenge error:', error);

    if (error) {
      console.error('Daily challenge load error:', error);
      setDailyChallenge(null);
      setLoading(false);
      return;
    }

    setDailyChallenge(challenge as DailyChallengeData | null);

    if (challenge) {
      const { data: attempt, error: attemptError } = await supabase
        .from('daily_challenge_attempts')
        .select('id')
        .eq('user_id', profile.id)
        .eq('challenge_id', challenge.id)
        .maybeSingle();

      console.log('Daily Challenge attempt:', attempt);
      console.log('Daily Challenge attempt error:', attemptError);

      setChallengeAnswered(!!attempt);

      if (attempt) {
        setChallengeResult(
          'আজকের চ্যালেঞ্জ ইতিমধ্যে সম্পন্ন হয়েছে ✓'
        );
      } else {
        setChallengeResult(null);
      }
    } else {
      setChallengeAnswered(false);
      setChallengeResult(null);
    }

    setLoading(false);
  }, [profile]);

  useEffect(() => {
    loadDailyChallenge();
  }, [loadDailyChallenge]);

  async function answerDailyChallenge(answer: string) {
    if (!dailyChallenge || challengeAnswered || challengeBusy) return;

    setChallengeBusy(true);

    const { data, error } = await supabase.rpc(
      'submit_daily_challenge',
      {
        p_challenge_id: dailyChallenge.id,
        p_answer: answer,
      }
    );

    if (error) {
      alert(error.message);
      setChallengeBusy(false);
      return;
    }

    if (data?.success) {
      if (data.is_correct) {
        setChallengeResult(`সঠিক! +${data.points} পয়েন্ট`);
        await refreshProfile();
      } else {
        setChallengeResult('ভুল উত্তর!');
      }

      setChallengeAnswered(true);
    }

    setChallengeBusy(false);
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        Daily Challenge লোড হচ্ছে...
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">

      {/* Quiz / Daily Challenge Switch */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        <button
          onClick={() => navigate('/quiz')}
          className="flex-1 py-2.5 rounded-lg font-semibold text-slate-600 dark:text-slate-300"
        >
          📝 কুইজ
        </button>

        <button
          onClick={() => navigate('/daily-challenge')}
          className="flex-1 py-2.5 rounded-lg font-semibold bg-purple-600 text-white"
        >
          🎯 Daily Challenge
        </button>
      </div>

      {!dailyChallenge ? (
        <div className="p-6 text-center border rounded-xl bg-white dark:bg-slate-800">
          <Sparkles
            className="mx-auto text-purple-500 mb-3"
            size={40}
          />

          <h2 className="font-bold text-lg">
            আজকের কোনো চ্যালেঞ্জ নেই
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Admin আজকের Daily Challenge যোগ করেনি।
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">

          {/* Challenge header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <Sparkles
                className="text-purple-600 dark:text-purple-400"
                size={24}
              />
            </div>

            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">
                আজকের চ্যালেঞ্জ
              </h2>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                সঠিক উত্তর দিলে +{dailyChallenge.points} পয়েন্ট
              </p>
            </div>
          </div>

          {/* Question */}
          <p className="font-semibold text-lg text-slate-900 dark:text-white">
            {dailyChallenge.question}
          </p>

          {/* Options */}
          <div className="space-y-2">
            {(['a', 'b', 'c', 'd'] as const).map((key) => (
              <button
                key={key}
                disabled={challengeAnswered || challengeBusy}
                onClick={() => answerDailyChallenge(key)}
                className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 transition active:scale-[0.99] disabled:opacity-60"
              >
                {dailyChallenge[`option_${key}`]}
              </button>
            ))}
          </div>

          {/* Result */}
          {challengeResult && (
            <div className="rounded-xl bg-slate-100 dark:bg-slate-700 px-3 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
              {challengeResult}
            </div>
          )}

          {challengeAnswered && (
            <div className="text-sm text-green-600 dark:text-green-400 font-semibold">
              আজকের চ্যালেঞ্জ সম্পন্ন ✓
            </div>
          )}
        </div>
      )}
    </div>
  );
}
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { supabase } from '../lib/supabase';
import type { QuizQuestion, QuizAttempt } from '../types';
import { Brain, Check, X, Trophy, RotateCcw } from 'lucide-react';

type AnswerResult = {
  questionId: string;
  isCorrect: boolean;
  correctAnswer: string;
  pointsEarned: number;
};

export default function Quiz() {
  const { profile, refreshProfile } = useAuth();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [attemptedIds, setAttemptedIds] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);

  const loadData = useCallback(async () => {
    if (!profile) return;
    const [{ data: qData }, { data: aData }] = await Promise.all([
      supabase.from('quiz_questions').select('*').order('created_at', { ascending: false }),
      supabase.from('quiz_attempts').select('question_id, is_correct, points_earned').eq('user_id', profile.id),
    ]);
    const qs = (qData as QuizQuestion[] | null) ?? [];
    const atts = (aData as QuizAttempt[] | null) ?? [];
    setQuestions(qs);
    const ids = new Set(atts.map((a) => a.question_id));
    setAttemptedIds(ids);
    setScore(atts.filter((a) => a.is_correct).reduce((s, a) => s + a.points_earned, 0));
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const unattempted = questions.filter((q) => !attemptedIds.has(q.id));
  const current = unattempted[currentIndex];

  const handleAnswer = async (answer: string) => {
    if (!current || selected) return;
    setSelected(answer);
    setBusy(true);
    const { data, error } = await supabase.rpc('submit_quiz_answer', {
      p_question_id: current.id,
      p_answer: answer,
    });
    if (error) {
      console.error(error);
      setBusy(false);
      return;
    }
    if (data?.success) {
      setResult({
        questionId: current.id,
        isCorrect: data.is_correct,
        correctAnswer: data.correct_answer,
        pointsEarned: data.points_earned,
      });
      if (data.is_correct) {
        setScore((s) => s + data.points_earned);
      }
      setAttemptedIds((prev) => new Set(prev).add(current.id));
      await refreshProfile();
    }
    setBusy(false);
  };

  const nextQuestion = () => {
    setSelected(null);
    setResult(null);
    if (currentIndex < unattempted.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <header className="sticky top-0 z-30 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Brain className="text-brand-600 dark:text-brand-400" size={22} /> কুইজ
        </h1>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Score card */}
        <div className="app-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
              <Trophy className="text-accent-600 dark:text-accent-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">আপনার স্কোর</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{score} পয়েন্ট</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500 dark:text-slate-400">উত্তর দেওয়া</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {attemptedIds.size}/{questions.length}
            </p>
          </div>
        </div>

        {questions.length === 0 && (
          <div className="app-card p-8 text-center">
            <Brain className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={48} />
            <p className="text-slate-500 dark:text-slate-400">এখনও কোনো প্রশ্ন নেই। অ্যাডমিন প্রশ্ন যোগ করবেন।</p>
          </div>
        )}

        {questions.length > 0 && unattempted.length === 0 && (
          <div className="app-card p-8 text-center">
            <Trophy className="mx-auto text-accent-500 mb-3" size={48} />
            <p className="font-semibold text-slate-900 dark:text-white">সব প্রশ্নের উত্তর দেওয়া হয়ে গেছে!</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">নতুন প্রশ্নের জন্য অপেক্ষা করুন</p>
          </div>
        )}

        {current && (
          <div className="app-card p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                প্রশ্ন {currentIndex + 1}/{unattempted.length}
              </span>
              <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 px-2 py-1 rounded-md">
                +{current.points} পয়েন্ট
              </span>
            </div>

            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 leading-relaxed">
              {current.question}
            </h3>

            <div className="space-y-2.5">
              {(['a', 'b', 'c', 'd'] as const).map((key) => {
                const text = current[`option_${key}`];
                const isCorrect = result?.correctAnswer === key;
                const isSelected = selected === key;
                let style = 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700';
                if (result) {
                  if (isCorrect) {
                    style = 'border-brand-500 bg-brand-50 dark:bg-brand-900/30';
                  } else if (isSelected) {
                    style = 'border-red-500 bg-red-50 dark:bg-red-900/20';
                  } else {
                    style = 'border-slate-200 dark:border-slate-700 opacity-50';
                  }
                } else if (isSelected) {
                  style = 'border-brand-500 bg-brand-50 dark:bg-brand-900/20';
                }
                return (
                  <button
                    key={key}
                    onClick={() => handleAnswer(key)}
                    disabled={!!result || busy}
                    className={`w-full text-left p-3.5 rounded-xl border-2 transition flex items-center justify-between ${style} ${
                      !result ? 'active:scale-[0.98]' : ''
                    }`}
                  >
                    <span className="font-medium text-slate-900 dark:text-white">{text}</span>
                    {result && isCorrect && <Check className="text-brand-600 dark:text-brand-400" size={20} />}
                    {result && isSelected && !isCorrect && <X className="text-red-500" size={20} />}
                  </button>
                );
              })}
            </div>

            {result && (
              <div className="mt-4">
                <div
                  className={`p-3 rounded-xl text-center font-semibold ${
                    result.isCorrect
                      ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  }`}
                >
                  {result.isCorrect
                    ? `সঠিক উত্তর! +${result.pointsEarned} পয়েন্ট`
                    : 'ভুল উত্তর! আবার চেষ্টা করুন'}
                </div>
                <button onClick={nextQuestion} className="btn-primary w-full mt-3">
                  পরবর্তী প্রশ্ন
                </button>
              </div>
            )}
          </div>
        )}

        {attemptedIds.size > 0 && unattempted.length > 0 && (
          <button
            onClick={() => setCurrentIndex(0)}
            className="btn-ghost w-full flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} /> আবার শুরু করুন
          </button>
        )}
      </div>
    </div>
  );
}

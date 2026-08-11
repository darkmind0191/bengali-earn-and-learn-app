import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { supabase } from '../lib/supabase';
import type { CheckIn, Post } from '../types';
import {
  CalendarCheck,
  Brain,
  Gift,
  TrendingUp,
  ChevronRight,
  Moon,
  Sun,
  PlayCircle,
  Lightbulb,
  Wallet,
  UserPlus,
  Flame,
  Coins,
  ArrowDownToLine,
  Sparkles,
} from 'lucide-react';

export default function Home() {
  const { profile, refreshProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [checkInBusy, setCheckInBusy] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [streak, setStreak] = useState(0);

  const loadCheckInStatus = useCallback(async () => {
    if (!profile) return;
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('check_ins')
      .select('*')
      .eq('user_id', profile.id)
      .order('check_in_date', { ascending: false })
      .limit(30) as { data: CheckIn[] | null };

    if (data && data.length > 0) {
      setCheckedInToday(data[0].check_in_date === today);
      let s = 0;
      const d = new Date();
      for (const c of data) {
        const cd = new Date(c.check_in_date + 'T00:00:00');
        const diff = Math.round((d.getTime() - cd.getTime()) / 86400000);
        if (diff === s) {
          s++;
        } else {
          break;
        }
      }
      setStreak(s);
    }
  }, [profile]);

  const loadPosts = useCallback(async () => {
    const { data } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5) as { data: Post[] | null };
    if (data) setPosts(data);
  }, []);

  useEffect(() => {
    loadCheckInStatus();
    loadPosts();
  }, [loadCheckInStatus, loadPosts]);

  const handleCheckIn = async () => {
    setCheckInBusy(true);
    const { data, error } = await supabase.rpc('claim_check_in');
    if (error) {
      console.error(error);
    } else if (data?.success) {
      setCheckedInToday(true);
      setStreak((s) => s + 1);
      await refreshProfile();
    }
    setCheckInBusy(false);
  };

  const userName = profile?.email?.split('@')[0] ?? 'ব্যবহারকারী';

  return (
    <div>
      {/* Green-blue gradient header */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-brand-600 via-brand-700 to-blue-700 px-5 py-4 flex items-center justify-between shadow-lg shadow-brand-500/20">
        <div>
          <p className="text-brand-100 text-sm">স্বাগতম</p>
          <h1 className="text-lg font-bold text-white">{userName}</h1>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-white/15 backdrop-blur-sm text-white transition active:scale-90"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Balance card */}
        <div className="rounded-3xl bg-gradient-to-br from-brand-500 via-brand-600 to-blue-600 p-6 text-white shadow-xl shadow-brand-500/25 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 -left-4 w-24 h-24 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={18} className="text-brand-100" />
              <p className="text-brand-100 text-sm">আপনার ব্যালেন্স</p>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold">{profile?.points ?? 0}</span>
              <span className="text-brand-100 mb-1.5 text-sm">পয়েন্ট</span>
            </div>
            <div className="flex gap-6 mt-4">
              <div>
                <p className="text-brand-100 text-xs">মোট আয়</p>
                <p className="font-semibold text-lg flex items-center gap-1">
                  <TrendingUp size={14} className="text-brand-100" />
                  {profile?.total_earned ?? 0}
                </p>
              </div>
              <div className="w-px bg-white/20" />
              <div>
                <p className="text-brand-100 text-xs">স্ট্রিক</p>
                <p className="font-semibold text-lg flex items-center gap-1">
                  <Flame size={14} className="text-orange-300" />
                  {streak} দিন
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => navigate('/quiz')}
            className="rounded-2xl bg-white dark:bg-slate-800 p-3 flex flex-col items-center gap-2 shadow-sm border border-slate-100 dark:border-slate-700 transition active:scale-95 hover:shadow-md"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Brain className="text-white" size={22} />
            </div>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-200 text-center">
              কুইজ খেলুন
            </span>
          </button>
          <button
            onClick={() => navigate('/earn')}
            className="rounded-2xl bg-white dark:bg-slate-800 p-3 flex flex-col items-center gap-2 shadow-sm border border-slate-100 dark:border-slate-700 transition active:scale-95 hover:shadow-md"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center">
              <Gift className="text-white" size={22} />
            </div>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-200 text-center">
              আয় করুন
            </span>
          </button>
          <button
            onClick={() => navigate('/wallet')}
            className="rounded-2xl bg-white dark:bg-slate-800 p-3 flex flex-col items-center gap-2 shadow-sm border border-slate-100 dark:border-slate-700 transition active:scale-95 hover:shadow-md"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
              <ArrowDownToLine className="text-white" size={22} />
            </div>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-200 text-center">
              উত্তোলন
            </span>
          </button>
        </div>

        {/* Daily bonus card */}
        <div className="rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center shadow-sm">
                <CalendarCheck className="text-white" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">দৈনিক বোনাস</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {checkedInToday ? 'আজ চেক-ইন সম্পূর্ণ ✓' : '১০ পয়েন্ট পেতে চেক-ইন করুন'}
                </p>
              </div>
            </div>
            <button
              onClick={handleCheckIn}
              disabled={checkedInToday || checkInBusy}
              className={
                checkedInToday
                  ? 'px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                  : 'px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-sm transition active:scale-95'
              }
            >
              {checkInBusy ? '...' : checkedInToday ? 'সম্পূর্ণ' : 'চেক-ইন'}
            </button>
          </div>
          {streak > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Flame size={14} className="text-orange-500" />
              <span>{streak} দিন ধরে কন্টিনিউ করছেন!</span>
            </div>
          )}
        </div>

        {/* Referral card */}
        <button
          onClick={() => navigate('/earn')}
          className="w-full rounded-2xl bg-gradient-to-br from-blue-600 via-brand-700 to-brand-600 p-5 text-white shadow-lg shadow-blue-500/20 text-left transition active:scale-[0.98] relative overflow-hidden"
        >
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <UserPlus size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base">রেফারেল করুন</h3>
              <p className="text-sm text-blue-100 mt-0.5">
                বন্ধুদের আমন্ত্রণ জানান — দুজনেই ৫০ পয়েন্ট পাবেন!
              </p>
            </div>
            <ChevronRight size={20} className="text-white/70 shrink-0" />
          </div>
        </button>

        {/* Latest posts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles size={18} className="text-accent-500" />
              সর্বশেষ টিপস
            </h3>
            <button
              onClick={() => navigate('/earn')}
              className="text-sm text-brand-600 dark:text-brand-400 flex items-center gap-0.5"
            >
              সব দেখুন <ChevronRight size={16} />
            </button>
          </div>
          <div className="space-y-3">
            {posts.length === 0 && (
              <div className="rounded-2xl bg-white dark:bg-slate-800 p-8 text-center border border-slate-100 dark:border-slate-700">
                <Lightbulb className="mx-auto text-slate-300 dark:text-slate-600 mb-2" size={40} />
                <p className="text-sm text-slate-400 dark:text-slate-500">কোনো টিপস নেই</p>
              </div>
            )}
            {posts.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate('/earn')}
                className="w-full rounded-2xl bg-white dark:bg-slate-800 p-4 text-left flex items-start gap-3 shadow-sm border border-slate-100 dark:border-slate-700 transition active:scale-[0.98] hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  {p.type === 'video' ? (
                    <PlayCircle className="text-blue-600 dark:text-blue-400" size={20} />
                  ) : (
                    <Lightbulb className="text-accent-500" size={20} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm truncate">{p.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{p.content}</p>
                </div>
                <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 shrink-0 flex items-center gap-0.5">
                  <Coins size={12} />+{p.points}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

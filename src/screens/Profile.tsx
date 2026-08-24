import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Moon, Sun, Shield, LogOut, ChevronRight, Mail, Award, Users, TrendingUp } from 'lucide-react';

export default function Profile() {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [badges, setBadges] = useState<any[]>([]);

  useEffect(() => {
    loadBadges();
  }, [profile]);

  async function loadBadges() {
    if (!profile) return;

    const { data } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', profile.id)
      .order('unlocked_at', { ascending: false });

    setBadges(data ?? []);
  }

  return (
    <div>
      <header className="sticky top-0 z-30 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="text-brand-600 dark:text-brand-400" size={22} /> প্রোফাইল
        </h1>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Profile card */}
        <div className="app-card p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {profile?.email?.[0]?.toUpperCase() ?? 'ব্য'}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 dark:text-white truncate">
                {profile?.email ?? 'ব্যবহারকারী'}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  কোড: {profile?.referral_code ?? 'Loading...'}
                </span>
                {profile?.is_admin && (
                  <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 px-2 py-0.5 rounded-full">
                    অ্যাডমিন
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="app-card p-5 mt-4">
          <h3 className="font-bold text-slate-900 dark:text-white mb-3">
            অর্জিত ব্যাজ
          </h3>

          {badges.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              এখনো কোনো ব্যাজ অর্জিত হয়নি
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {badges.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700"
                >
                  <span className="text-xl">{b.badge_icon}</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {b.badge_name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="app-card p-3 text-center">
            <Award className="mx-auto text-brand-500 mb-1" size={20} />
            <p className="text-lg font-bold text-slate-900 dark:text-white">{profile?.points ?? 0}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">ব্যালেন্স</p>
          </div>
          <div className="app-card p-3 text-center">
            <TrendingUp className="mx-auto text-accent-500 mb-1" size={20} />
            <p className="text-lg font-bold text-slate-900 dark:text-white">{profile?.total_earned ?? 0}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">মোট আয়</p>
          </div>
          <div className="app-card p-3 text-center">
            <Users className="mx-auto text-blue-500 mb-1" size={20} />
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {profile?.referred_by ? '✓' : '—'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">রেফারেল</p>
          </div>
        </div>

        {/* Settings */}
        <div className="app-card overflow-hidden">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 p-4 border-b border-slate-100 dark:border-slate-700 transition active:bg-slate-50 dark:active:bg-slate-700/50"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              {theme === 'light' ? <Moon size={20} className="text-slate-600" /> : <Sun size={20} className="text-slate-300" />}
            </div>
            <span className="flex-1 text-left font-medium text-slate-900 dark:text-white">
              {theme === 'light' ? 'ডার্ক মোড' : 'লাইট মোড'}
            </span>
            <span className="text-sm text-slate-400 dark:text-slate-500">
              {theme === 'light' ? 'বন্ধ' : 'চালু'}
            </span>
          </button>

          {profile?.is_admin && (
            <button
              onClick={() => navigate('/admin')}
              className="w-full flex items-center gap-3 p-4 border-b border-slate-100 dark:border-slate-700 transition active:bg-slate-50 dark:active:bg-slate-700/50"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                <Shield size={20} className="text-brand-600 dark:text-brand-400" />
              </div>
              <span className="flex-1 text-left font-medium text-slate-900 dark:text-white">
                অ্যাডমিন প্যানেল
              </span>
              <ChevronRight size={20} className="text-slate-400" />
            </button>
          )}

          <div className="w-full flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <Mail size={20} className="text-slate-600 dark:text-slate-300" />
            </div>
            <span className="flex-1 text-left text-sm text-slate-500 dark:text-slate-400 truncate">
              {profile?.email}
            </span>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 text-red-500 font-semibold py-3 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 transition active:scale-95"
        >
          <LogOut size={20} /> লগআউট
        </button>

      </div>
    </div>
  );
}

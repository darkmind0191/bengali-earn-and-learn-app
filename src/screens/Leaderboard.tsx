import { useEffect, useState } from 'react';
import { Trophy, Medal } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';

type UserRow = {
  id: string;
  email: string;
  balance: number;
};

export default function Leaderboard() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  async function loadLeaderboard() {
    const { data } = await supabase
      .from('profiles')
      .select('id,email,balance')
      .order('balance', { ascending: false })
      .limit(20);

    setUsers((data as UserRow[]) ?? []);
  }

  function medal(rank: number) {
    if (rank === 0) return '🥇';
    if (rank === 1) return '🥈';
    if (rank === 2) return '🥉';
    return `#${rank + 1}`;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="text-yellow-500" size={28} />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          লিডারবোর্ড
        </h1>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        সর্বোচ্চ পয়েন্টধারী ব্যবহারকারীরা
      </p>

      <div className="space-y-3">
        {users.map((u, index) => (
          <div
            key={u.id}
            className={`rounded-2xl p-4 border flex items-center justify-between ${
              profile?.id === u.id
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="text-lg font-bold w-10 text-center">
                {medal(index)}
              </div>

              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {u.email?.split('@')[0] ?? 'User'}
                </p>

                {profile?.id === u.id && (
                  <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">
                    আপনি
                  </p>
                )}
              </div>
            </div>

            <div className="text-right">
              <p className="font-bold text-slate-900 dark:text-white">
                {u.balance ?? 0}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                পয়েন্ট
              </p>
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-center text-slate-500 dark:text-slate-400">
          এখনো কোনো ডাটা নেই
        </div>
      )}
    </div>
  );
}
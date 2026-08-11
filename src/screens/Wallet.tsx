import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { supabase } from '../lib/supabase';
import type { Withdrawal } from '../types';
import { Wallet as WalletIcon, ArrowDownToLine, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

export default function Wallet() {
  const { profile, refreshProfile } = useAuth();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bkash');
  const [number, setNumber] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWithdrawals = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    setWithdrawals((data as Withdrawal[] | null) ?? []);
  }, [profile]);

  useEffect(() => {
    loadWithdrawals();
  }, [loadWithdrawals]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amt = parseInt(amount, 10);
    if (!amt || amt < 100) {
      setError('সর্বনিম্ন ১০০ পয়েন্ট উত্তোলন করতে পারবেন');
      return;
    }
    if (!number.trim()) {
      setError('পেমেন্ট নম্বর দিন');
      return;
    }
    setBusy(true);
    const { data, error: rpcError } = await supabase.rpc('create_withdrawal', {
      p_amount: amt,
      p_method: method,
      p_number: number.trim(),
    });
    if (rpcError) {
      setError('সমস্যা হয়েছে, আবার চেষ্টা করুন');
    } else if (data?.success) {
      setShowForm(false);
      setAmount('');
      setNumber('');
      await Promise.all([refreshProfile(), loadWithdrawals()]);
    } else {
      const errMap: Record<string, string> = {
        minimum_not_met: 'সর্বনিম্ন ১০০ পয়েন্ট প্রয়োজন',
        insufficient_balance: 'পর্যাপ্ত ব্যালেন্স নেই',
        profile_not_found: 'প্রোফাইল পাওয়া যায়নি',
      };
      setError(errMap[data?.error] ?? 'সমস্যা হয়েছে');
    }
    setBusy(false);
  };

  const statusMap = {
    pending: { label: 'অপেক্ষমাণ', icon: Clock, color: 'text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-900/20' },
    approved: { label: 'অনুমোদিত', icon: CheckCircle, color: 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20' },
    rejected: { label: 'প্রত্যাখ্যাত', icon: XCircle, color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20' },
  };

  const methodLabels: Record<string, string> = {
    bkash: 'বিকাশ',
    nagad: 'নগদ',
    rocket: 'রকেট',
  };

  return (
    <div>
      <header className="sticky top-0 z-30 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <WalletIcon className="text-brand-600 dark:text-brand-400" size={22} /> ওয়ালেট
        </h1>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Balance card */}
        <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-white shadow-lg shadow-brand-500/20">
          <p className="text-brand-100 text-sm">বর্তমান ব্যালেন্স</p>
          <div className="flex items-end gap-2 mt-1">
            <span className="text-4xl font-bold">{profile?.points ?? 0}</span>
            <span className="text-brand-100 mb-1.5">পয়েন্ট</span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-sm text-brand-100">
            <TrendingUp size={16} />
            <span>মোট আয়: {profile?.total_earned ?? 0} পয়েন্ট</span>
          </div>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <ArrowDownToLine size={20} /> উত্তোলনের অনুরোধ
        </button>

        {/* Withdrawal history */}
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white mb-3">উত্তোলনের ইতিহাস</h3>
          {withdrawals.length === 0 ? (
            <div className="app-card p-8 text-center">
              <WalletIcon className="mx-auto text-slate-300 dark:text-slate-600 mb-2" size={40} />
              <p className="text-slate-500 dark:text-slate-400">কোনো উত্তোলন নেই</p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((w) => {
                const st = statusMap[w.status];
                return (
                  <div key={w.id} className="app-card p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{w.amount} পয়েন্ট</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {methodLabels[w.payment_method] ?? w.payment_method} • {w.payment_number}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {new Date(w.created_at).toLocaleDateString('bn-BD')}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 ${st.color}`}
                    >
                      <st.icon size={14} /> {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Withdrawal form modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">উত্তোলনের অনুরোধ</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  টাকার পরিমাণ
                </label>
                <input
                  type="number"
                  min={100}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-field"
                  placeholder="সর্বনিম্ন ১০০"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  পেমেন্ট মাধ্যম
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="input-field"
                >
                  <option value="bkash">বিকাশ</option>
                  <option value="nagad">নগদ</option>
                  <option value="rocket">রকেট</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  মোবাইল নম্বর
                </label>
                <input
                  type="text"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className="input-field"
                  placeholder="01XXXXXXXXX"
                />
              </div>
              {error && (
                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <button type="submit" disabled={busy} className="btn-primary w-full">
                {busy ? 'প্রক্রিয়াধীন...' : 'অনুরোধ জমা দিন'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost w-full">
                বাতিল
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

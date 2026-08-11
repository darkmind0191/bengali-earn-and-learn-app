import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { ThemeProvider, useTheme } from '../ThemeContext';
import { Moon, Sun } from 'lucide-react';
import BrandMark from '../components/BrandMark';

function AuthForm() {
  const { signIn, signUp } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fn = mode === 'signin' ? signIn : signUp;
    const { error } = await fn(email.trim(), password);
    if (error) setError(error);
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <div className="flex justify-end p-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm text-slate-600 dark:text-slate-300"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 max-w-md mx-auto w-full">
        <div className="text-center mb-8">
          <BrandMark />
          <p className="text-slate-500 dark:text-slate-400 mt-4">আয় করুন এবং শিখুন</p>
        </div>

        <div className="app-card p-6">
          <div className="flex gap-2 mb-6 p-1 bg-slate-100 dark:bg-slate-700 rounded-xl">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${
                mode === 'signin'
                  ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              লগইন
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${
                mode === 'signup'
                  ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              নতুন অ্যাকাউন্ট
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                ইমেইল
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="আপনার ইমেইল"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                পাসওয়ার্ড
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="৬ অক্ষরের বেশি"
              />
            </div>
            {error && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? 'অপেক্ষা করুন...' : mode === 'signin' ? 'লগইন করুন' : 'অ্যাকাউন্ট তৈরি করুন'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
          প্রথম অ্যাকাউন্ট তৈরি করলে স্বয়ংক্রিয়ভাবে অ্যাডমিন হবেন
        </p>
      </div>
    </div>
  );
}

export default function Auth() {
  return (
    <ThemeProvider>
      <AuthForm />
    </ThemeProvider>
  );
}

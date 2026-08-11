import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { supabase } from '../lib/supabase';
import type { QuizQuestion, Post, Withdrawal } from '../types';
import ScreenHeader from '../components/ScreenHeader';
import { Brain, FileText, Clock, CheckCircle, XCircle, Trash2, Plus } from 'lucide-react';

type Tab = 'quiz' | 'posts' | 'withdrawals';

export default function Admin() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('quiz');

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  // Quiz form
  const [qForm, setQForm] = useState({
    question: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'a' as 'a' | 'b' | 'c' | 'd',
    points: '10',
  });
  const [qBusy, setQBusy] = useState(false);
  const [qMsg, setQMsg] = useState<string | null>(null);

  // Post form
  const [pForm, setPForm] = useState({
    title: '',
    content: '',
    video_url: '',
    type: 'tip' as 'video' | 'tip',
    points: '5',
  });
  const [pBusy, setPBusy] = useState(false);
  const [pMsg, setPMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [{ data: q }, { data: p }, { data: w }] = await Promise.all([
      supabase.from('quiz_questions').select('*').order('created_at', { ascending: false }),
      supabase.from('posts').select('*').order('created_at', { ascending: false }),
      supabase.from('withdrawals').select('*').order('created_at', { ascending: false }),
    ]);
    setQuestions((q as QuizQuestion[] | null) ?? []);
    setPosts((p as Post[] | null) ?? []);
    setWithdrawals((w as Withdrawal[] | null) ?? []);
  }, []);

  useEffect(() => {
    if (!profile?.is_admin) {
      navigate('/', { replace: true });
      return;
    }
    loadData();
  }, [profile, navigate, loadData]);

  const addQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setQBusy(true);
    setQMsg(null);
    const { error } = await supabase.from('quiz_questions').insert({
      question: qForm.question,
      option_a: qForm.option_a,
      option_b: qForm.option_b,
      option_c: qForm.option_c,
      option_d: qForm.option_d,
      correct_answer: qForm.correct_answer,
      points: parseInt(qForm.points, 10) || 10,
    });
    if (error) {
      setQMsg('সমস্যা: ' + error.message);
    } else {
      setQMsg('প্রশ্ন যোগ হয়েছে!');
      setQForm({ question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'a', points: '10' });
      await loadData();
    }
    setQBusy(false);
  };

  const deleteQuestion = async (id: string) => {
    await supabase.from('quiz_questions').delete().eq('id', id);
    await loadData();
  };

  const addPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setPBusy(true);
    setPMsg(null);
    const { error } = await supabase.from('posts').insert({
      title: pForm.title,
      content: pForm.content,
      video_url: pForm.video_url || null,
      type: pForm.type,
      points: parseInt(pForm.points, 10) || 5,
    });
    if (error) {
      setPMsg('সমস্যা: ' + error.message);
    } else {
      setPMsg('পোস্ট যোগ হয়েছে!');
      setPForm({ title: '', content: '', video_url: '', type: 'tip', points: '5' });
      await loadData();
    }
    setPBusy(false);
  };

  const deletePost = async (id: string) => {
    await supabase.from('posts').delete().eq('id', id);
    await loadData();
  };

  const tabs: { key: Tab; label: string; icon: typeof Brain }[] = [
    { key: 'quiz', label: 'কুইজ', icon: Brain },
    { key: 'posts', label: 'পোস্ট', icon: FileText },
    { key: 'withdrawals', label: 'উত্তোলন', icon: Clock },
  ];

  const methodLabels: Record<string, string> = { bkash: 'বিকাশ', nagad: 'নগদ', rocket: 'রকেট' };
  const statusLabels: Record<string, string> = { pending: 'অপেক্ষমাণ', approved: 'অনুমোদিত', rejected: 'প্রত্যাখ্যাত' };

  return (
    <div>
      <ScreenHeader title="অ্যাডমিন প্যানেল" back />

      <div className="px-4 py-4 space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-1.5 ${
                tab === t.key
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* Quiz tab */}
        {tab === 'quiz' && (
          <div className="space-y-4">
            <form onSubmit={addQuestion} className="app-card p-4 space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-white">নতুন প্রশ্ন যোগ করুন</h3>
              <input
                type="text"
                required
                value={qForm.question}
                onChange={(e) => setQForm({ ...qForm, question: e.target.value })}
                className="input-field"
                placeholder="প্রশ্ন"
              />
              <div className="grid grid-cols-2 gap-2">
                {(['a', 'b', 'c', 'd'] as const).map((k) => (
                  <input
                    key={k}
                    type="text"
                    required
                    value={qForm[`option_${k}`]}
                    onChange={(e) => setQForm({ ...qForm, [`option_${k}`]: e.target.value })}
                    className="input-field"
                    placeholder={`অপশন ${k.toUpperCase()}`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <select
                  value={qForm.correct_answer}
                  onChange={(e) => setQForm({ ...qForm, correct_answer: e.target.value as 'a' | 'b' | 'c' | 'd' })}
                  className="input-field flex-1"
                >
                  <option value="a">সঠিক: A</option>
                  <option value="b">সঠিক: B</option>
                  <option value="c">সঠিক: C</option>
                  <option value="d">সঠিক: D</option>
                </select>
                <input
                  type="number"
                  value={qForm.points}
                  onChange={(e) => setQForm({ ...qForm, points: e.target.value })}
                  className="input-field w-24"
                  placeholder="পয়েন্ট"
                />
              </div>
              {qMsg && (
                <p className="text-sm px-3 py-2 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">
                  {qMsg}
                </p>
              )}
              <button type="submit" disabled={qBusy} className="btn-primary w-full flex items-center justify-center gap-2">
                <Plus size={18} /> {qBusy ? '...' : 'প্রশ্ন যোগ করুন'}
              </button>
            </form>

            <div className="space-y-2">
              {questions.map((q) => (
                <div key={q.id} className="app-card p-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white text-sm">{q.question}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      সঠিক: {q.correct_answer.toUpperCase()} • {q.points} পয়েন্ট
                    </p>
                  </div>
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {questions.length === 0 && (
                <p className="text-center text-sm text-slate-400 py-4">কোনো প্রশ্ন নেই</p>
              )}
            </div>
          </div>
        )}

        {/* Posts tab */}
        {tab === 'posts' && (
          <div className="space-y-4">
            <form onSubmit={addPost} className="app-card p-4 space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-white">নতুন পোস্ট যোগ করুন</h3>
              <input
                type="text"
                required
                value={pForm.title}
                onChange={(e) => setPForm({ ...pForm, title: e.target.value })}
                className="input-field"
                placeholder="শিরোনাম"
              />
              <textarea
                required
                value={pForm.content}
                onChange={(e) => setPForm({ ...pForm, content: e.target.value })}
                className="input-field min-h-[100px] resize-none"
                placeholder="বিস্তারিত"
              />
              <div className="flex gap-2">
                <select
                  value={pForm.type}
                  onChange={(e) => setPForm({ ...pForm, type: e.target.value as 'video' | 'tip' })}
                  className="input-field flex-1"
                >
                  <option value="tip">টিপস</option>
                  <option value="video">ভিডিও</option>
                </select>
                <input
                  type="number"
                  value={pForm.points}
                  onChange={(e) => setPForm({ ...pForm, points: e.target.value })}
                  className="input-field w-24"
                  placeholder="পয়েন্ট"
                />
              </div>
              {pForm.type === 'video' && (
                <input
                  type="url"
                  value={pForm.video_url}
                  onChange={(e) => setPForm({ ...pForm, video_url: e.target.value })}
                  className="input-field"
                  placeholder="ভিডিও URL (ঐচ্ছিক)"
                />
              )}
              {pMsg && (
                <p className="text-sm px-3 py-2 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">
                  {pMsg}
                </p>
              )}
              <button type="submit" disabled={pBusy} className="btn-primary w-full flex items-center justify-center gap-2">
                <Plus size={18} /> {pBusy ? '...' : 'পোস্ট যোগ করুন'}
              </button>
            </form>

            <div className="space-y-2">
              {posts.map((p) => (
                <div key={p.id} className="app-card p-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white text-sm">{p.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {p.type === 'video' ? 'ভিডিও' : 'টিপস'} • {p.points} পয়েন্ট
                    </p>
                  </div>
                  <button
                    onClick={() => deletePost(p.id)}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {posts.length === 0 && (
                <p className="text-center text-sm text-slate-400 py-4">কোনো পোস্ট নেই</p>
              )}
            </div>
          </div>
        )}

        {/* Withdrawals tab */}
        {tab === 'withdrawals' && (
          <div className="space-y-3">
            {withdrawals.length === 0 && (
              <div className="app-card p-8 text-center">
                <Clock className="mx-auto text-slate-300 dark:text-slate-600 mb-2" size={40} />
                <p className="text-slate-500 dark:text-slate-400">কোনো উত্তোলনের অনুরোধ নেই</p>
              </div>
            )}
            {withdrawals.map((w) => (
              <div key={w.id} className="app-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-slate-900 dark:text-white">{w.amount} পয়েন্ট</p>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      w.status === 'pending'
                        ? 'text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-900/20'
                        : w.status === 'approved'
                        ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20'
                        : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                    }`}
                  >
                    {statusLabels[w.status]}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {methodLabels[w.payment_method] ?? w.payment_method} • {w.payment_number}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {new Date(w.created_at).toLocaleDateString('bn-BD')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

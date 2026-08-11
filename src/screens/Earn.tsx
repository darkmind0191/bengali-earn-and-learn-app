import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { supabase } from '../lib/supabase';
import type { Post } from '../types';
import { Gift, Copy, Check, PlayCircle, Lightbulb, Share2, UserPlus, Play } from 'lucide-react';

export default function Earn() {
  const { profile, refreshProfile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
  const [referralCode, setReferralCode] = useState('');
  const [referralMsg, setReferralMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [busyPost, setBusyPost] = useState<string | null>(null);
  const [referralBusy, setReferralBusy] = useState(false);
  const [activePost, setActivePost] = useState<Post | null>(null);

  const loadData = useCallback(async () => {
    if (!profile) return;
    const [{ data: pData }, { data: vData }] = await Promise.all([
      supabase.from('posts').select('*').order('created_at', { ascending: false }),
      supabase.from('post_views').select('post_id').eq('user_id', profile.id),
    ]);
    setPosts((pData as Post[] | null) ?? []);
    setViewedIds(new Set(((vData as { post_id: string }[] | null) ?? []).map((v) => v.post_id)));
  }, [profile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleViewPost = async (post: Post) => {
    if (viewedIds.has(post.id)) {
      setActivePost(post);
      return;
    }
    setBusyPost(post.id);
    const { data, error } = await supabase.rpc('view_post', { p_post_id: post.id });
    if (error) {
      console.error(error);
    } else if (data?.success) {
      setViewedIds((prev) => new Set(prev).add(post.id));
      await refreshProfile();
    }
    setBusyPost(null);
    setActivePost(post);
  };

  const handleApplyReferral = async () => {
    if (!referralCode.trim()) return;
    setReferralBusy(true);
    setReferralMsg(null);
    const { data, error } = await supabase.rpc('apply_referral', { p_code: referralCode.trim() });
    if (error) {
      setReferralMsg({ type: 'error', text: 'কিছু সমস্যা হয়েছে' });
    } else if (data?.success) {
      setReferralMsg({ type: 'success', text: `রেফারেল সফল! +${data.points_earned} পয়েন্ট` });
      setReferralCode('');
      await refreshProfile();
    } else {
      const errMap: Record<string, string> = {
        invalid_code: 'ভুল রেফারেল কোড',
        already_referred: 'আপনি ইতিমধ্যে রেফারেল ব্যবহার করেছেন',
        cannot_refer_self: 'নিজের কোড ব্যবহার করা যাবে না',
      };
      setReferralMsg({ type: 'error', text: errMap[data?.error] ?? 'সমস্যা হয়েছে' });
    }
    setReferralBusy(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(profile?.referral_code ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareCode = async () => {
    const text = `দৈনিক আয় ও শিক্ষা অ্যাপে যোগ দিন! আমার রেফারেল কোড: ${profile?.referral_code}`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {}
    } else {
      copyCode();
    }
  };

  return (
    <div>
      <header className="sticky top-0 z-30 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Gift className="text-brand-600 dark:text-brand-400" size={22} /> আয় করুন
        </h1>
      </header>

      <div className="px-4 py-4 space-y-5">
        {/* Referral card */}
        <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white shadow-lg shadow-brand-500/20">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus size={20} />
            <h3 className="font-semibold">আপনার রেফারেল কোড</h3>
          </div>
          <div className="flex items-center gap-2 bg-white/15 rounded-xl p-3 mb-3">
            <span className="text-2xl font-bold tracking-wider flex-1">{profile?.referral_code}</span>
            <button onClick={copyCode} className="p-2 rounded-lg bg-white/20 transition active:scale-90">
              {copied ? <Check size={20} /> : <Copy size={20} />}
            </button>
          </div>
          <p className="text-sm text-brand-100 mb-3">বন্ধুদের শেয়ার করুন — দুজনেই ৫০ পয়েন্ট পাবেন!</p>
          <button
            onClick={shareCode}
            className="w-full bg-white/20 hover:bg-white/30 rounded-xl py-2.5 font-semibold text-sm flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Share2 size={18} /> শেয়ার করুন
          </button>
        </div>

        {/* Apply referral */}
        {profile && !profile.referred_by && (
          <div className="app-card p-4">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">রেফারেল কোড প্রয়োগ করুন</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                className="input-field flex-1 uppercase tracking-wider"
                placeholder="কোড লিখুন"
              />
              <button
                onClick={handleApplyReferral}
                disabled={referralBusy || !referralCode.trim()}
                className="btn-primary px-5"
              >
                {referralBusy ? '...' : 'প্রয়োগ'}
              </button>
            </div>
            {referralMsg && (
              <p
                className={`text-sm mt-2 px-3 py-2 rounded-lg ${
                  referralMsg.type === 'success'
                    ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                }`}
              >
                {referralMsg.text}
              </p>
            )}
          </div>
        )}

        {/* Posts / Videos / Tips */}
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white mb-3">ভিডিও ও টিপস</h3>
          <div className="space-y-3">
            {posts.length === 0 && (
              <div className="app-card p-8 text-center">
                <Lightbulb className="mx-auto text-slate-300 dark:text-slate-600 mb-2" size={40} />
                <p className="text-slate-500 dark:text-slate-400">এখনও কোনো টিপস বা ভিডিও নেই</p>
              </div>
            )}
            {posts.map((post) => {
              const viewed = viewedIds.has(post.id);
              return (
                <div key={post.id} className="app-card overflow-hidden">
                  <button
                    onClick={() => handleViewPost(post)}
                    disabled={busyPost === post.id}
                    className="w-full text-left p-4 flex items-start gap-3 transition active:scale-[0.98]"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        post.type === 'video'
                          ? 'bg-blue-100 dark:bg-blue-900/30'
                          : 'bg-accent-100 dark:bg-accent-900/30'
                      }`}
                    >
                      {post.type === 'video' ? (
                        <PlayCircle className="text-blue-600 dark:text-blue-400" size={24} />
                      ) : (
                        <Lightbulb className="text-accent-600 dark:text-accent-400" size={24} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{post.title}</h4>
                        {viewed && <Check className="text-brand-500 shrink-0" size={16} />}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {post.content}
                      </p>
                      <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 mt-1.5 inline-block">
                        {viewed ? '✓ দেখা হয়েছে' : `+${post.points} পয়েন্ট পেতে দেখুন`}
                      </span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Post detail modal */}
      {activePost && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center"
          onClick={() => setActivePost(null)}
        >
          <div
            className="bg-white dark:bg-slate-800 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{activePost.title}</h3>
            {activePost.video_url && (
              <div className="mb-4 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 aspect-video flex items-center justify-center">
                <video src={activePost.video_url} controls className="w-full h-full" />
              </div>
            )}
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
              {activePost.content}
            </p>
            {viewedIds.has(activePost.id) && (
              <p className="text-sm text-brand-600 dark:text-brand-400 mt-3 font-medium">
                ✓ {activePost.points} পয়েন্ট অর্জিত
              </p>
            )}
            <button onClick={() => setActivePost(null)} className="btn-ghost w-full mt-4">
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

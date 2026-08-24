import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  LayoutDashboard,
  FileQuestion,
  CalendarDays,
  Wallet,
  Users,
  BarChart3,
  Settings,
  Video,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  X,
  Save,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type Withdrawal = {
  id: string;
  amount: number;
  payment_method: string;
  payment_number: string;
  status: string;
  created_at: string;
};

type QuizQuestion = {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  points: number;
  created_at?: string;
};

type DailyChallenge = {
  id: string;
  challenge_date: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  points: number;
  created_at?: string;
};

type Post = {
  id: string;
  title: string;
  content: string;
  type: string;
  video_url?: string | null;
  points: number;
  created_at?: string;
};

type Profile = {
  id: string;
  email?: string | null;
  balance?: number | null;
  referral_code?: string | null;
  created_at?: string;
};

type Section =
  | 'dashboard'
  | 'questions'
  | 'dailyQuiz'
  | 'withdrawals'
  | 'posts'
  | 'users'
  | 'statistics'
  | 'settings';

export default function Admin() {
  const navigate = useNavigate();

  const [section, setSection] = useState<Section>('dashboard');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  /* =========================
     Questions
  ========================= */

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [question, setQuestion] = useState('');
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [c, setC] = useState('');
  const [d, setD] = useState('');
  const [correct, setCorrect] = useState('a');
  const [points, setPoints] = useState(5);

  const [editingQuestionId, setEditingQuestionId] =
    useState<string | null>(null);

  const [questionSearch, setQuestionSearch] = useState('');

  /* =========================
     Daily Quiz
  ========================= */

  const [dailyChallenges, setDailyChallenges] = useState<
    DailyChallenge[]
  >([]);

  const [dailyDate, setDailyDate] = useState('');
  const [dailyQuestion, setDailyQuestion] = useState('');
  const [dailyA, setDailyA] = useState('');
  const [dailyB, setDailyB] = useState('');
  const [dailyC, setDailyC] = useState('');
  const [dailyD, setDailyD] = useState('');
  const [dailyCorrect, setDailyCorrect] = useState('a');
  const [dailyPoints, setDailyPoints] = useState(20);

  const [editingDailyId, setEditingDailyId] =
    useState<string | null>(null);

  const [dailySearch, setDailySearch] = useState('');

  /* =========================
     Withdrawals
  ========================= */

  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  /* =========================
     Posts
  ========================= */

  const [posts, setPosts] = useState<Post[]>([]);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState('tip');
  const [postVideoUrl, setPostVideoUrl] = useState('');
  const [postPoints, setPostPoints] = useState(5);
  const [editingPostId, setEditingPostId] =
    useState<string | null>(null);

  /* =========================
     Users
  ========================= */

  const [users, setUsers] = useState<Profile[]>([]);
  const [userSearch, setUserSearch] = useState('');

  /* =========================
     Dashboard stats
  ========================= */

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalDailyChallenges, setTotalDailyChallenges] =
    useState(0);
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);

  /* =========================
     Load Questions
  ========================= */

  async function loadQuestions() {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setMsg('Question load error: ' + error.message);
      return;
    }

    const list = (data as QuizQuestion[]) ?? [];

    setQuestions(list);
    setTotalQuestions(list.length);
  }

  /* =========================
     Load Daily Challenges
  ========================= */

  async function loadDailyChallenges() {
    const { data, error } = await supabase
      .from('daily_challenges')
      .select('*')
      .order('challenge_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      setMsg('Daily Quiz load error: ' + error.message);
      return;
    }

    const list = (data as DailyChallenge[]) ?? [];

    setDailyChallenges(list);
    setTotalDailyChallenges(list.length);
  }

  /* =========================
     Load Withdrawals
  ========================= */

  async function loadWithdrawals() {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setMsg('Withdrawal load error: ' + error.message);
      return;
    }

    const list = (data as Withdrawal[]) ?? [];

    setWithdrawals(list);

    setPendingWithdrawals(
      list.filter((item) => item.status === 'pending').length
    );
  }

  /* =========================
     Load Posts
  ========================= */

  async function loadPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setMsg('Post load error: ' + error.message);
      return;
    }

    const list = (data as Post[]) ?? [];

    setPosts(list);
    setTotalPosts(list.length);
  }

  /* =========================
     Load Users
  ========================= */

  async function loadUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select(
        'id, email, balance, referral_code, created_at'
      )
      .order('created_at', { ascending: false });

    if (error) {
      setMsg('User load error: ' + error.message);
      return;
    }

    const list = (data as Profile[]) ?? [];

    setUsers(list);
    setTotalUsers(list.length);
  }

  /* =========================
     Load Everything
  ========================= */

  async function loadAll() {
    setLoading(true);
    setMsg('');

    await Promise.all([
      loadQuestions(),
      loadDailyChallenges(),
      loadWithdrawals(),
      loadPosts(),
      loadUsers(),
    ]);

    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  /* =========================
     Question Form Reset
  ========================= */

  function resetQuestionForm() {
    setEditingQuestionId(null);
    setQuestion('');
    setA('');
    setB('');
    setC('');
    setD('');
    setCorrect('a');
    setPoints(5);
  }

  /* =========================
     Add / Update Question
  ========================= */

  async function saveQuestion() {
    if (!question.trim()) {
      setMsg('প্রশ্ন লিখুন');
      return;
    }

    if (!a.trim() || !b.trim() || !c.trim() || !d.trim()) {
      setMsg('চারটি option পূরণ করুন');
      return;
    }

    if (!points || points < 1) {
      setMsg('Points ১ বা তার বেশি হতে হবে');
      return;
    }

    setLoading(true);
    setMsg('');

    if (editingQuestionId) {
      const { error } = await supabase
        .from('quiz_questions')
        .update({
          question: question.trim(),
          option_a: a.trim(),
          option_b: b.trim(),
          option_c: c.trim(),
          option_d: d.trim(),
          correct_answer: correct,
          points,
        })
        .eq('id', editingQuestionId);

      if (error) {
        setMsg('Update error: ' + error.message);
        setLoading(false);
        return;
      }

      setMsg('প্রশ্ন সফলভাবে Update হয়েছে');
    } else {
      const { error } = await supabase
        .from('quiz_questions')
        .insert({
          question: question.trim(),
          option_a: a.trim(),
          option_b: b.trim(),
          option_c: c.trim(),
          option_d: d.trim(),
          correct_answer: correct,
          points,
        });

      if (error) {
        setMsg('Add error: ' + error.message);
        setLoading(false);
        return;
      }

      setMsg('নতুন প্রশ্ন সফলভাবে যোগ হয়েছে');
    }

    resetQuestionForm();
    await loadQuestions();

    setLoading(false);
  }

  /* =========================
     Start Question Edit
  ========================= */

  function startQuestionEdit(q: QuizQuestion) {
    setEditingQuestionId(q.id);
    setQuestion(q.question);
    setA(q.option_a);
    setB(q.option_b);
    setC(q.option_c);
    setD(q.option_d);
    setCorrect(q.correct_answer);
    setPoints(q.points);

    setSection('questions');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  /* =========================
     Delete Question
  ========================= */

  async function deleteQuestion(id: string) {
    const confirmed = window.confirm(
      'এই প্রশ্নটি কি সত্যিই Delete করতে চান?'
    );

    if (!confirmed) return;

    setLoading(true);

    const { error } = await supabase
      .from('quiz_questions')
      .delete()
      .eq('id', id);

    if (error) {
      setMsg('Delete error: ' + error.message);
      setLoading(false);
      return;
    }

    await loadQuestions();

    setMsg('প্রশ্ন Delete হয়েছে');
    setLoading(false);
  }

  /* =========================
     Daily Quiz Reset
  ========================= */

  function resetDailyForm() {
    setEditingDailyId(null);

    setDailyDate('');
    setDailyQuestion('');
    setDailyA('');
    setDailyB('');
    setDailyC('');
    setDailyD('');
    setDailyCorrect('a');
    setDailyPoints(20);
  }

  /* =========================
     Save Daily Quiz
  ========================= */
async function saveDailyChallenge() {
  if (!dailyDate) {
    setMsg('Daily Quiz-এর তারিখ নির্বাচন করুন');
    return;
  }

  if (!dailyQuestion.trim()) {
    setMsg('Daily Quiz-এর প্রশ্ন লিখুন');
    return;
  }

  if (
    !dailyA.trim() ||
    !dailyB.trim() ||
    !dailyC.trim() ||
    !dailyD.trim()
  ) {
    setMsg('Daily Quiz-এর চারটি option পূরণ করুন');
    return;
  }

  if (!['a', 'b', 'c', 'd'].includes(dailyCorrect)) {
    setMsg('সঠিক উত্তর A, B, C অথবা D নির্বাচন করুন');
    return;
  }

  if (!dailyPoints || dailyPoints < 1) {
    setMsg('Daily Quiz Points ১ বা তার বেশি হতে হবে');
    return;
  }

  setLoading(true);
  setMsg('');

  try {
    const payload = {
      challenge_date: dailyDate,
      question: dailyQuestion.trim(),
      option_a: dailyA.trim(),
      option_b: dailyB.trim(),
      option_c: dailyC.trim(),
      option_d: dailyD.trim(),
      correct_answer: dailyCorrect,
      points: Number(dailyPoints),
    };

    console.log('DAILY QUIZ PAYLOAD:', payload);

    /* =========================
       EDIT
    ========================= */

    if (editingDailyId) {
      const { data, error } = await supabase
        .from('daily_challenges')
        .update(payload)
        .eq('id', editingDailyId)
        .select()
        .single();

      console.log('DAILY QUIZ UPDATE:', {
        data,
        error,
      });

      if (error) {
        setMsg(
          `Daily Quiz Update Error: ${error.message} | Code: ${
            error.code ?? 'N/A'
          }`
        );
        return;
      }

      if (!data) {
        setMsg(
          'Daily Quiz update হয়নি। Row পাওয়া যায়নি।'
        );
        return;
      }

      setMsg('Daily Quiz সফলভাবে Update হয়েছে');
    }

    /* =========================
       ADD NEW
    ========================= */

    else {
      /*
       * একই তারিখে একই প্রশ্ন থাকলে
       * duplicate হিসেবে আটকানো হবে।
       */
      const { data: existing, error: checkError } =
        await supabase
          .from('daily_challenges')
          .select('id')
          .eq('challenge_date', dailyDate)
          .eq('question', dailyQuestion.trim())
          .limit(1);

      console.log('DAILY QUIZ DUPLICATE CHECK:', {
        existing,
        checkError,
      });

      if (checkError) {
        setMsg(
          `Daily Quiz Check Error: ${checkError.message} | Code: ${
            checkError.code ?? 'N/A'
          }`
        );
        return;
      }

      if (existing && existing.length > 0) {
        setMsg(
          'এই তারিখে একই প্রশ্নের Daily Quiz আগে থেকেই আছে।'
        );
        return;
      }

      const { data, error } = await supabase
        .from('daily_challenges')
        .insert(payload)
        .select()
        .single();

      console.log('DAILY QUIZ INSERT RESULT:', {
        data,
        error,
      });

      if (error) {
        setMsg(
          `Daily Quiz Add Error: ${error.message} | Code: ${
            error.code ?? 'N/A'
          }`
        );
        return;
      }

      if (!data) {
        setMsg(
          'Daily Quiz save হয়নি — database কোনো row ফেরত দেয়নি।'
        );
        return;
      }

      setMsg('নতুন Daily Quiz সফলভাবে যোগ হয়েছে');
    }

    resetDailyForm();
    await loadDailyChallenges();
  } catch (error) {
    console.error(
      'DAILY QUIZ SAVE ERROR:',
      error
    );

    setMsg(
      'Daily Quiz save করার সময় error হয়েছে: ' +
        (error instanceof Error
          ? error.message
          : String(error))
    );
  } finally {
    setLoading(false);
  }
}



  /* =========================
     Start Daily Quiz Edit
  ========================= */

  function startDailyEdit(challenge: DailyChallenge) {
    setEditingDailyId(challenge.id);

    setDailyDate(challenge.challenge_date);
    setDailyQuestion(challenge.question);
    setDailyA(challenge.option_a);
    setDailyB(challenge.option_b);
    setDailyC(challenge.option_c);
    setDailyD(challenge.option_d);
    setDailyCorrect(challenge.correct_answer);
    setDailyPoints(challenge.points);

    setSection('dailyQuiz');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  /* =========================
     Delete Daily Quiz
  ========================= */

  async function deleteDailyChallenge(id: string) {
    const confirmed = window.confirm(
      'এই Daily Quiz টি Delete করতে চান?\n\nনোট: এই challenge-এর পুরোনো attempt record থাকলে database foreign-key/RLS policy অনুযায়ী Delete ব্যর্থ হতে পারে।'
    );

    if (!confirmed) return;

    setLoading(true);

    const { error } = await supabase
      .from('daily_challenges')
      .delete()
      .eq('id', id);

    if (error) {
      setMsg(
        'Daily Quiz delete error: ' + error.message
      );
      setLoading(false);
      return;
    }

    await loadDailyChallenges();

    setMsg('Daily Quiz Delete হয়েছে');
    setLoading(false);
  }

  /* =========================
     Withdrawal Status
  ========================= */

  async function updateStatus(
    id: string,
    status: 'approved' | 'rejected'
  ) {
    const action =
      status === 'approved' ? 'Approve' : 'Reject';

    const confirmed = window.confirm(
      `এই withdrawal request ${action} করতে চান?`
    );

    if (!confirmed) return;

    setLoading(true);

    // আগে withdrawal-এর বর্তমান তথ্য বের করি
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawals')
      .select('id, user_id, amount, status')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !withdrawal) {
      setMsg(
        'Withdrawal খুঁজে পাওয়া যায়নি'
      );
      setLoading(false);
      return;
    }

    // একই withdrawal বারবার process হতে দেবে না
    if (withdrawal.status !== 'pending') {
      setMsg(
        `এই withdrawal ইতিমধ্যে ${withdrawal.status} হয়েছে`
      );
      setLoading(false);
      return;
    }

    /*
     * Reject হলে আগে user-এর points ফেরত দিই।
     * increment_balance function-এ এই parameter-গুলোই ব্যবহার হচ্ছে।
     */
    if (status === 'rejected') {
      const { error: refundError } = await supabase.rpc(
        'increment_balance',
        {
          p_user_id: withdrawal.user_id,
          p_amount: withdrawal.amount,
        }
      );

      if (refundError) {
        setMsg(
          'পয়েন্ট ফেরত দেওয়া যায়নি: ' +
          refundError.message
        );
        setLoading(false);
        return;
      }
    }

    // তারপর withdrawal status update
    const { error: updateError } = await supabase
      .from('withdrawals')
      .update({ status })
      .eq('id', id)
      .eq('status', 'pending');

    if (updateError) {
      setMsg(
        'Withdrawal update error: ' +
        updateError.message
      );
      setLoading(false);
      return;
    }

    await loadWithdrawals();

    setMsg(
      status === 'approved'
        ? 'Withdrawal Approved হয়েছে'
        : `Withdrawal Rejected হয়েছে — ${withdrawal.amount} পয়েন্ট ফেরত দেওয়া হয়েছে`
    );

    setLoading(false);
  }


  /* =========================
     Post Form Reset
  ========================= */

  function resetPostForm() {
    setEditingPostId(null);
    setPostTitle('');
    setPostContent('');
    setPostType('tip');
    setPostVideoUrl('');
    setPostPoints(5);
  }

  /* =========================
     Save Post
  ========================= */

  async function savePost() {
    if (!postTitle.trim()) {
      setMsg('Post title লিখুন');
      return;
    }

    if (!postContent.trim()) {
      setMsg('Post content লিখুন');
      return;
    }

    if (!postPoints || postPoints < 0) {
      setMsg('Points সঠিকভাবে দিন');
      return;
    }

    setLoading(true);
    setMsg('');

    const payload = {
      title: postTitle.trim(),
      content: postContent.trim(),
      type: postType,
      video_url: postVideoUrl.trim() || null,
      points: postPoints,
    };

    if (editingPostId) {
      const { error } = await supabase
        .from('posts')
        .update(payload)
        .eq('id', editingPostId);

      if (error) {
        setMsg('Post update error: ' + error.message);
        setLoading(false);
        return;
      }

      setMsg('Post সফলভাবে Update হয়েছে');
    } else {
      const { error } = await supabase
        .from('posts')
        .insert(payload);

      if (error) {
        setMsg('Post add error: ' + error.message);
        setLoading(false);
        return;
      }

      setMsg('নতুন Post সফলভাবে যোগ হয়েছে');
    }

    resetPostForm();
    await loadPosts();

    setLoading(false);
  }

  /* =========================
     Start Post Edit
  ========================= */

  function startPostEdit(post: Post) {
    setEditingPostId(post.id);
    setPostTitle(post.title);
    setPostContent(post.content);
    setPostType(post.type);
    setPostVideoUrl(post.video_url ?? '');
    setPostPoints(post.points);

    setSection('posts');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  /* =========================
     Delete Post
  ========================= */

  async function deletePost(id: string) {
    const confirmed = window.confirm(
      'এই Postটি কি সত্যিই Delete করতে চান?'
    );

    if (!confirmed) return;

    setLoading(true);

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) {
      setMsg('Post delete error: ' + error.message);
      setLoading(false);
      return;
    }

    await loadPosts();

    setMsg('Post Delete হয়েছে');
    setLoading(false);
  }

  /* =========================
     Question Search
  ========================= */

  const filteredQuestions = useMemo(() => {
    const search = questionSearch.trim().toLowerCase();

    if (!search) return questions;

    const numberSearch = Number(search);

    return questions.filter((q, index) => {
      const questionNumber =
        String(index + 1);

      return (
        questionNumber === search ||
        q.question.toLowerCase().includes(search) ||
        q.option_a.toLowerCase().includes(search) ||
        q.option_b.toLowerCase().includes(search) ||
        q.option_c.toLowerCase().includes(search) ||
        q.option_d.toLowerCase().includes(search) ||
        q.id.toLowerCase().includes(search) ||
        (!Number.isNaN(numberSearch) &&
          q.points === numberSearch)
      );
    });
  }, [questions, questionSearch]);

  /* =========================
     Daily Quiz Search
  ========================= */

  const filteredDailyChallenges = useMemo(() => {
    const search = dailySearch.trim().toLowerCase();

    if (!search) return dailyChallenges;

    return dailyChallenges.filter((challenge) => {
      return (
        challenge.challenge_date
          .toLowerCase()
          .includes(search) ||
        challenge.question
          .toLowerCase()
          .includes(search) ||
        challenge.option_a
          .toLowerCase()
          .includes(search) ||
        challenge.option_b
          .toLowerCase()
          .includes(search) ||
        challenge.option_c
          .toLowerCase()
          .includes(search) ||
        challenge.option_d
          .toLowerCase()
          .includes(search) ||
        challenge.id
          .toLowerCase()
          .includes(search)
      );
    });
  }, [dailyChallenges, dailySearch]);

  /* =========================
     User Search
  ========================= */

  const filteredUsers = useMemo(() => {
    const search = userSearch.trim().toLowerCase();

    if (!search) return users;

    return users.filter((user) => {
      return (
        user.id.toLowerCase().includes(search) ||
        (user.email ?? '')
          .toLowerCase()
          .includes(search) ||
        (user.referral_code ?? '')
          .toLowerCase()
          .includes(search)
      );
    });
  }, [users, userSearch]);

  /* =========================
     Dashboard Navigation
  ========================= */

  const menuItems: {
    key: Section;
    title: string;
    subtitle: string;
    icon: typeof LayoutDashboard;
    color: string;
    bg: string;
  }[] = [
    {
      key: 'dashboard',
      title: 'Dashboard',
      subtitle: 'অ্যাপের সারসংক্ষেপ',
      icon: LayoutDashboard,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
    {
      key: 'questions',
      title: 'প্রশ্ন ম্যানেজমেন্ট',
      subtitle: 'প্রশ্ন তৈরি, Edit ও Delete',
      icon: FileQuestion,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      key: 'dailyQuiz',
      title: 'Daily Quiz',
      subtitle: 'দৈনিক Quiz ব্যবস্থাপনা',
      icon: CalendarDays,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      key: 'withdrawals',
      title: 'Withdrawal',
      subtitle: 'অনুরোধ Approve / Reject',
      icon: Wallet,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      key: 'posts',
      title: 'Posts / Videos',
      subtitle: 'ভিডিও, Tips ও Content',
      icon: Video,
      color: 'text-pink-600',
      bg: 'bg-pink-50 dark:bg-pink-900/20',
    },
    {
      key: 'users',
      title: 'Users',
      subtitle: 'ব্যবহারকারীদের তথ্য',
      icon: Users,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    },
    {
      key: 'statistics',
      title: 'Statistics',
      subtitle: 'অ্যাপের পরিসংখ্যান',
      icon: BarChart3,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      key: 'settings',
      title: 'Settings',
      subtitle: 'Admin Settings',
      icon: Settings,
      color: 'text-slate-600',
      bg: 'bg-slate-100 dark:bg-slate-800',
    },
  ];

  function openSection(value: Section) {
    setMsg('');
    setSection(value);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  /* =========================
     Section Header
  ========================= */

  function SectionHeader({
    title,
    subtitle,
    color = 'text-brand-600',
  }: {
    title: string;
    subtitle?: string;
    color?: string;
  }) {
    return (
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => openSection('dashboard')}
          className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center"
        >
          <ArrowLeft size={19} />
        </button>

        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {title}
          </h2>

          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={`ml-auto w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center ${color}`}
        >
          {section === 'questions' && (
            <FileQuestion size={19} />
          )}

          {section === 'dailyQuiz' && (
            <CalendarDays size={19} />
          )}

          {section === 'withdrawals' && (
            <Wallet size={19} />
          )}

          {section === 'posts' && <Video size={19} />}

          {section === 'users' && <Users size={19} />}

          {section === 'statistics' && <BarChart3 size={19} />}

          {section === 'settings' && <Settings size={19} />}
        </div>
      </div>
    );
  }

  /* =========================
     Render
  ========================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-brand-950/20">
      <div className="max-w-5xl mx-auto px-4 py-4 pb-10">

        {/* Top navigation */}

        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            <ArrowLeft size={18} />
            Profile
          </button>

          <button
            onClick={loadAll}
            disabled={loading}
            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-brand-600"
          >
            <RefreshCw
              size={18}
              className={loading ? 'animate-spin' : ''}
            />
          </button>
        </div>

        {/* Page title */}

        <div className="mb-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-3 py-1 text-xs font-bold mb-2">
            <LayoutDashboard size={14} />
            ADMIN CONTROL CENTER
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Admin Panel
          </h1>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Earn & Learn বাংলা — Admin Dashboard
          </p>
        </div>

        {/* Message */}

        {msg && (
          <div className="mb-5 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 px-4 py-3 text-sm flex items-center justify-between gap-3 border border-brand-100 dark:border-brand-900/30">
            <span>{msg}</span>

            <button onClick={() => setMsg('')}>
              <X size={17} />
            </button>
          </div>
        )}

        {/* =========================
            DASHBOARD
        ========================= */}

        {section === 'dashboard' && (
          <div className="space-y-5">

            {/* Stats */}

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">

              <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-4 shadow-md">
                <FileQuestion className="mb-2" size={22} />

                <p className="text-2xl font-bold">
                  {totalQuestions}
                </p>

                <p className="text-xs text-white/80">
                  মোট প্রশ্ন
                </p>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white p-4 shadow-md">
                <CalendarDays className="mb-2" size={22} />

                <p className="text-2xl font-bold">
                  {totalDailyChallenges}
                </p>

                <p className="text-xs text-white/80">
                  Daily Quiz
                </p>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white p-4 shadow-md">
                <Users className="mb-2" size={22} />

                <p className="text-2xl font-bold">
                  {totalUsers}
                </p>

                <p className="text-xs text-white/80">
                  মোট User
                </p>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white p-4 shadow-md">
                <Video className="mb-2" size={22} />

                <p className="text-2xl font-bold">
                  {totalPosts}
                </p>

                <p className="text-xs text-white/80">
                  মোট Content
                </p>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-white p-4 shadow-md">
                <Wallet className="mb-2" size={22} />

                <p className="text-2xl font-bold">
                  {pendingWithdrawals}
                </p>

                <p className="text-xs text-white/80">
                  Pending
                </p>
              </div>

            </div>

            {/* Admin buttons */}

            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                Admin Controls
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                {menuItems
                  .filter(
                    (item) => item.key !== 'dashboard'
                  )
                  .map((item) => {
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.key}
                        onClick={() =>
                          openSection(item.key)
                        }
                        className="w-full bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm hover:shadow-md flex items-center gap-4 text-left transition active:scale-[0.98] border border-slate-100 dark:border-slate-800"
                      >
                        <div
                          className={`w-12 h-12 rounded-xl ${item.bg} ${item.color} flex items-center justify-center shrink-0`}
                        >
                          <Icon size={24} />
                        </div>

                        <div className="flex-1">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {item.title}
                          </p>

                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {item.subtitle}
                          </p>
                        </div>

                        <span className="text-slate-400 text-lg">
                          →
                        </span>
                      </button>
                    );
                  })}

              </div>
            </div>
          </div>
        )}

        {/* =========================
            QUESTIONS
        ========================= */}

        {section === 'questions' && (
          <div className="space-y-5">

            <SectionHeader
              title="প্রশ্ন ম্যানেজমেন্ট"
              subtitle="Quiz প্রশ্ন তৈরি, Edit ও Delete"
              color="text-blue-600"
            />

            {/* Question form */}

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm space-y-3 border border-blue-100 dark:border-slate-800">

              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white">
                  {editingQuestionId
                    ? 'প্রশ্ন Edit করুন'
                    : 'নতুন প্রশ্ন তৈরি করুন'}
                </h3>

                {editingQuestionId && (
                  <button
                    onClick={resetQuestionForm}
                    className="text-xs text-red-500"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <textarea
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="প্রশ্ন লিখুন"
                rows={4}
                value={question}
                onChange={(e) =>
                  setQuestion(e.target.value)
                }
              />

              <input
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="Option A"
                value={a}
                onChange={(e) => setA(e.target.value)}
              />

              <input
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="Option B"
                value={b}
                onChange={(e) => setB(e.target.value)}
              />

              <input
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="Option C"
                value={c}
                onChange={(e) => setC(e.target.value)}
              />

              <input
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="Option D"
                value={d}
                onChange={(e) => setD(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-3">

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    সঠিক উত্তর
                  </label>

                  <select
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    value={correct}
                    onChange={(e) =>
                      setCorrect(e.target.value)
                    }
                  >
                    <option value="a">A</option>
                    <option value="b">B</option>
                    <option value="c">C</option>
                    <option value="d">D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Points
                  </label>

                  <input
                    type="number"
                    min={1}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    value={points}
                    onChange={(e) =>
                      setPoints(
                        Number(e.target.value)
                      )
                    }
                  />
                </div>

              </div>

              <button
                onClick={saveQuestion}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                {editingQuestionId ? (
                  <>
                    <Pencil size={18} />
                    Update Question
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Add Question
                  </>
                )}
              </button>

            </div>

            {/* Search */}

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  সব প্রশ্ন ({filteredQuestions.length}
                  {questionSearch
                    ? ` / ${questions.length}`
                    : ''}
                  )
                </h3>
              </div>

              <div className="relative">
                <Search
                  size={19}
                  className="absolute left-3 top-3.5 text-blue-500"
                />

                <input
                  className="w-full border-2 border-blue-100 dark:border-slate-700 focus:border-blue-500 rounded-xl p-3 pl-10 pr-10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                  placeholder="প্রশ্ন নম্বর, প্রশ্ন বা option দিয়ে Search করুন"
                  value={questionSearch}
                  onChange={(e) =>
                    setQuestionSearch(
                      e.target.value
                    )
                  }
                />

                {questionSearch && (
                  <button
                    onClick={() =>
                      setQuestionSearch('')
                    }
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-red-500"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-400 mt-2">
                যেমন: 1 লিখলে ১ নম্বর প্রশ্ন, অথবা
                প্রশ্নের কোনো শব্দ লিখে Search করুন।
              </p>
            </div>

            {/* Question list */}

            <div className="space-y-3">

              {filteredQuestions.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 text-center text-sm text-slate-500">
                  {questionSearch
                    ? 'Search অনুযায়ী কোনো প্রশ্ন পাওয়া যায়নি।'
                    : 'কোনো প্রশ্ন নেই।'}
                </div>
              ) : (
                filteredQuestions.map((q) => {
                  const originalIndex =
                    questions.findIndex(
                      (item) => item.id === q.id
                    );

                  return (
                    <div
                      key={q.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800"
                    >
                      <div className="flex items-start justify-between gap-3">

                        <div className="flex-1">

                          <p className="text-xs font-bold text-blue-500 mb-1">
                            প্রশ্ন #
                            {originalIndex + 1} •{' '}
                            {q.points} পয়েন্ট
                          </p>

                          <p className="font-semibold text-slate-900 dark:text-white">
                            {q.question}
                          </p>

                          <div className="text-sm text-slate-500 dark:text-slate-400 mt-3 space-y-1">
                            <p>A. {q.option_a}</p>
                            <p>B. {q.option_b}</p>
                            <p>C. {q.option_c}</p>
                            <p>D. {q.option_d}</p>
                          </div>

                          <p className="text-sm font-bold text-green-600 mt-3">
                            সঠিক উত্তর:{' '}
                            {q.correct_answer.toUpperCase()}
                          </p>

                        </div>

                      </div>

                      <div className="flex gap-2 mt-4">

                        <button
                          onClick={() =>
                            startQuestionEdit(q)
                          }
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2"
                        >
                          <Pencil size={16} />
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            deleteQuestion(q.id)
                          }
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>

                      </div>
                    </div>
                  );
                })
              )}

            </div>
          </div>
        )}

        {/* =========================
            DAILY QUIZ
        ========================= */}

        {section === 'dailyQuiz' && (
          <div className="space-y-5">

            <SectionHeader
              title="Daily Quiz"
              subtitle="তারিখ অনুযায়ী Daily Quiz তৈরি ও পরিচালনা করুন"
              color="text-purple-600"
            />

            {/* Daily Quiz form */}

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-purple-100 dark:border-slate-800 space-y-3">

              <div className="flex items-center justify-between">

                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {editingDailyId
                      ? 'Daily Quiz Edit করুন'
                      : 'নতুন Daily Quiz তৈরি করুন'}
                  </h3>

                  <p className="text-xs text-slate-400 mt-1">
                    এই Quiz সরাসরি daily_challenges table-এ
                    save হবে।
                  </p>
                </div>

                {editingDailyId && (
                  <button
                    onClick={resetDailyForm}
                    className="text-xs text-red-500 font-semibold"
                  >
                    Cancel
                  </button>
                )}

              </div>

              {/* Date */}

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Quiz Date
                </label>

                <input
                  type="date"
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  value={dailyDate}
                  onChange={(e) =>
                    setDailyDate(e.target.value)
                  }
                />
              </div>

              {/* Question */}

              <textarea
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="Daily Quiz প্রশ্ন লিখুন"
                rows={4}
                value={dailyQuestion}
                onChange={(e) =>
                  setDailyQuestion(e.target.value)
                }
              />

              {/* Options */}

              <input
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="Option A"
                value={dailyA}
                onChange={(e) =>
                  setDailyA(e.target.value)
                }
              />

              <input
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="Option B"
                value={dailyB}
                onChange={(e) =>
                  setDailyB(e.target.value)
                }
              />

              <input
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="Option C"
                value={dailyC}
                onChange={(e) =>
                  setDailyC(e.target.value)
                }
              />

              <input
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="Option D"
                value={dailyD}
                onChange={(e) =>
                  setDailyD(e.target.value)
                }
              />

              {/* Correct + Points */}

              <div className="grid grid-cols-2 gap-3">

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    সঠিক উত্তর
                  </label>

                  <select
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    value={dailyCorrect}
                    onChange={(e) =>
                      setDailyCorrect(
                        e.target.value
                      )
                    }
                  >
                    <option value="a">
                      A
                    </option>
                    <option value="b">
                      B
                    </option>
                    <option value="c">
                      C
                    </option>
                    <option value="d">
                      D
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Points
                  </label>

                  <input
                    type="number"
                    min={1}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    value={dailyPoints}
                    onChange={(e) =>
                      setDailyPoints(
                        Number(e.target.value)
                      )
                    }
                  />
                </div>

              </div>

              {/* Save */}

              <button
                onClick={saveDailyChallenge}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                {editingDailyId ? (
                  <>
                    <Save size={18} />
                    Update Daily Quiz
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Add Daily Quiz
                  </>
                )}
              </button>

            </div>

            {/* Search Daily Quiz */}

            <div>

              <div className="flex items-center justify-between mb-3">

                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  সব Daily Quiz (
                  {filteredDailyChallenges.length}
                  {dailySearch
                    ? ` / ${dailyChallenges.length}`
                    : ''}
                  )
                </h3>

              </div>

              <div className="relative">

                <Search
                  size={19}
                  className="absolute left-3 top-3.5 text-purple-500"
                />

                <input
                  className="w-full border-2 border-purple-100 dark:border-slate-700 focus:border-purple-500 rounded-xl p-3 pl-10 pr-10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                  placeholder="Date, প্রশ্ন বা option দিয়ে Search করুন"
                  value={dailySearch}
                  onChange={(e) =>
                    setDailySearch(
                      e.target.value
                    )
                  }
                />

                {dailySearch && (
                  <button
                    onClick={() =>
                      setDailySearch('')
                    }
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-red-500"
                  >
                    <X size={18} />
                  </button>
                )}

              </div>

            </div>

            {/* Daily Quiz list */}

            <div className="space-y-3">

              {filteredDailyChallenges.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 text-center text-sm text-slate-500">
                  {dailySearch
                    ? 'Search অনুযায়ী কোনো Daily Quiz পাওয়া যায়নি।'
                    : 'কোনো Daily Quiz নেই।'}
                </div>
              ) : (
                filteredDailyChallenges.map(
                  (challenge, index) => {

                    const today =
                      new Date()
                        .toISOString()
                        .split('T')[0];

                    const isToday =
                      challenge.challenge_date ===
                      today;

                    return (
                      <div
                        key={challenge.id}
                        className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800"
                      >

                        {/* Date header */}

                        <div className="flex items-start justify-between gap-3">

                          <div className="flex items-center gap-2">

                            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
                              <CalendarDays
                                size={20}
                              />
                            </div>

                            <div>
                              <p className="font-bold text-purple-600">
                                {challenge.challenge_date}
                              </p>

                              <p className="text-xs text-slate-400">
                                Daily Quiz #
                                {index + 1}
                              </p>
                            </div>

                          </div>

                          {isToday && (
                            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-green-100 text-green-700">
                              TODAY
                            </span>
                          )}

                        </div>

                        {/* Question */}

                        <div className="mt-4">

                          <p className="text-xs text-purple-500 font-bold mb-1">
                            {challenge.points}{' '}
                            Points
                          </p>

                          <p className="font-bold text-slate-900 dark:text-white">
                            {challenge.question}
                          </p>

                        </div>

                        {/* Options */}

                        <div className="mt-3 space-y-1 text-sm">

                          <p
                            className={
                              challenge.correct_answer ===
                              'a'
                                ? 'text-green-600 font-bold'
                                : 'text-slate-500 dark:text-slate-400'
                            }
                          >
                            A. {challenge.option_a}
                            {challenge.correct_answer ===
                              'a' && ' ✓'}
                          </p>

                          <p
                            className={
                              challenge.correct_answer ===
                              'b'
                                ? 'text-green-600 font-bold'
                                : 'text-slate-500 dark:text-slate-400'
                            }
                          >
                            B. {challenge.option_b}
                            {challenge.correct_answer ===
                              'b' && ' ✓'}
                          </p>

                          <p
                            className={
                              challenge.correct_answer ===
                              'c'
                                ? 'text-green-600 font-bold'
                                : 'text-slate-500 dark:text-slate-400'
                            }
                          >
                            C. {challenge.option_c}
                            {challenge.correct_answer ===
                              'c' && ' ✓'}
                          </p>

                          <p
                            className={
                              challenge.correct_answer ===
                              'd'
                                ? 'text-green-600 font-bold'
                                : 'text-slate-500 dark:text-slate-400'
                            }
                          >
                            D. {challenge.option_d}
                            {challenge.correct_answer ===
                              'd' && ' ✓'}
                          </p>

                        </div>

                        {/* Buttons */}

                        <div className="flex gap-2 mt-4">

                          <button
                            onClick={() =>
                              startDailyEdit(
                                challenge
                              )
                            }
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2"
                          >
                            <Pencil size={16} />
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              deleteDailyChallenge(
                                challenge.id
                              )
                            }
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>

                        </div>

                      </div>
                    );
                  }
                )
              )}

            </div>

          </div>
        )}

        {/* =========================
            WITHDRAWALS
        ========================= */}

        {section === 'withdrawals' && (
          <div className="space-y-5">

            <SectionHeader
              title="Withdrawal Requests"
              subtitle="Pending request Approve অথবা Reject করুন"
              color="text-orange-600"
            />

            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl p-5 shadow-md">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-white/80">
                    Pending Requests
                  </p>

                  <p className="text-3xl font-bold mt-1">
                    {pendingWithdrawals}
                  </p>
                </div>

                <Wallet size={35} />

              </div>

            </div>

            <div className="space-y-3">

              {withdrawals.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 text-center text-sm text-slate-500">
                  কোনো withdrawal request নেই।
                </div>
              ) : (
                withdrawals.map((w) => (
                  <div
                    key={w.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800"
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div>

                        <p className="font-bold text-lg text-slate-900 dark:text-white">
                          {w.amount} পয়েন্ট
                        </p>

                        <p className="text-sm text-slate-500 mt-1">
                          {w.payment_method} •{' '}
                          {w.payment_number}
                        </p>

                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(
                            w.created_at
                          ).toLocaleString('bn-BD')}
                        </p>

                      </div>

                      <span
                        className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                          w.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : w.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {w.status}
                      </span>

                    </div>

                    {w.status === 'pending' && (
                      <div className="flex gap-2 mt-4">

                        <button
                          onClick={() =>
                            updateStatus(
                              w.id,
                              'approved'
                            )
                          }
                          className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={17} />
                          Approve
                        </button>

                        <button
                          onClick={() =>
                            updateStatus(
                              w.id,
                              'rejected'
                            )
                          }
                          className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2"
                        >
                          <XCircle size={17} />
                          Reject
                        </button>

                      </div>
                    )}

                  </div>
                ))
              )}

            </div>
          </div>
        )}

        {/* =========================
            POSTS / VIDEOS
        ========================= */}

        {section === 'posts' && (
          <div className="space-y-5">

            <SectionHeader
              title="Posts / Videos / Tips"
              subtitle="Earn page-এর Content ম্যানেজ করুন"
              color="text-pink-600"
            />

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm space-y-3 border border-pink-100 dark:border-slate-800">

              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white">
                  {editingPostId
                    ? 'Post Edit করুন'
                    : 'নতুন Post তৈরি করুন'}
                </h3>

                {editingPostId && (
                  <button
                    onClick={resetPostForm}
                    className="text-xs text-red-500"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <input
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="Post title"
                value={postTitle}
                onChange={(e) =>
                  setPostTitle(e.target.value)
                }
              />

              <textarea
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="Content / Description"
                rows={5}
                value={postContent}
                onChange={(e) =>
                  setPostContent(e.target.value)
                }
              />

              <select
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                value={postType}
                onChange={(e) =>
                  setPostType(e.target.value)
                }
              >
                <option value="tip">Tip</option>
                <option value="video">Video</option>
              </select>

              <input
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="Video URL (optional)"
                value={postVideoUrl}
                onChange={(e) =>
                  setPostVideoUrl(e.target.value)
                }
              />

              <input
                type="number"
                min={0}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="Points"
                value={postPoints}
                onChange={(e) =>
                  setPostPoints(
                    Number(e.target.value)
                  )
                }
              />

              <button
                onClick={savePost}
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-600 to-rose-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                {editingPostId ? (
                  <>
                    <Pencil size={18} />
                    Update Post
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Add Post
                  </>
                )}
              </button>

            </div>

            <div className="space-y-3">

              {posts.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 text-center text-sm text-slate-500">
                  কোনো Post নেই।
                </div>
              ) : (
                posts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm"
                  >

                    <div className="flex gap-3">

                      <div className="w-11 h-11 rounded-xl bg-pink-50 dark:bg-pink-900/20 text-pink-600 flex items-center justify-center shrink-0">
                        <Video size={21} />
                      </div>

                      <div className="flex-1 min-w-0">

                        <p className="font-bold text-slate-900 dark:text-white">
                          {post.title}
                        </p>

                        <p className="text-xs text-slate-500 mt-1 line-clamp-3">
                          {post.content}
                        </p>

                        <div className="flex items-center gap-2 mt-2">

                          <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                            {post.type}
                          </span>

                          <span className="text-xs font-semibold text-pink-600">
                            +{post.points} points
                          </span>

                        </div>

                      </div>

                    </div>

                    <div className="flex gap-2 mt-4">

                      <button
                        onClick={() =>
                          startPostEdit(post)
                        }
                        className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2"
                      >
                        <Pencil size={16} />
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          deletePost(post.id)
                        }
                        className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>

                    </div>

                  </div>
                ))
              )}

            </div>
          </div>
        )}

        {/* =========================
            USERS
        ========================= */}

        {section === 'users' && (
          <div className="space-y-5">

            <SectionHeader
              title="Users"
              subtitle="ব্যবহারকারীদের basic information"
              color="text-cyan-600"
            />

            <div className="relative">

              <Search
                size={18}
                className="absolute left-3 top-3.5 text-cyan-500"
              />

              <input
                className="w-full border-2 border-cyan-100 dark:border-slate-700 rounded-xl p-3 pl-10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                placeholder="Email, User ID অথবা referral code দিয়ে Search"
                value={userSearch}
                onChange={(e) =>
                  setUserSearch(e.target.value)
                }
              />

            </div>

            <div className="space-y-3">

              {filteredUsers.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 text-center text-sm text-slate-500">
                  কোনো User পাওয়া যায়নি।
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm"
                  >

                    <p className="font-semibold text-slate-900 dark:text-white break-all">
                      {user.email ??
                        'Email unavailable'}
                    </p>

                    <p className="text-xs text-slate-400 mt-1 break-all">
                      ID: {user.id}
                    </p>

                    <div className="grid grid-cols-2 gap-3 mt-3">

                      <div className="rounded-xl bg-cyan-50 dark:bg-slate-800 p-3">
                        <p className="text-xs text-slate-400">
                          Balance
                        </p>

                        <p className="font-bold text-slate-900 dark:text-white mt-1">
                          {user.balance ?? 0}
                        </p>
                      </div>

                      <div className="rounded-xl bg-cyan-50 dark:bg-slate-800 p-3">
                        <p className="text-xs text-slate-400">
                          Referral
                        </p>

                        <p className="font-bold text-slate-900 dark:text-white mt-1">
                          {user.referral_code ??
                            '-'}
                        </p>
                      </div>

                    </div>

                  </div>
                ))
              )}

            </div>
          </div>
        )}

        {/* =========================
            STATISTICS
        ========================= */}

        {section === 'statistics' && (
          <div className="space-y-5">

            <SectionHeader
              title="Statistics"
              subtitle="অ্যাপের বর্তমান পরিসংখ্যান"
              color="text-emerald-600"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl p-5 shadow-md">
                <Users className="mb-3" size={25} />

                <p className="text-sm text-white/80">
                  মোট Users
                </p>

                <p className="text-3xl font-bold mt-1">
                  {totalUsers}
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white rounded-2xl p-5 shadow-md">
                <CalendarDays className="mb-3" size={25} />

                <p className="text-sm text-white/80">
                  Daily Quiz
                </p>

                <p className="text-3xl font-bold mt-1">
                  {totalDailyChallenges}
                </p>
              </div>

              <div className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-2xl p-5 shadow-md">
                <FileQuestion className="mb-3" size={25} />

                <p className="text-sm text-white/80">
                  মোট Questions
                </p>

                <p className="text-3xl font-bold mt-1">
                  {totalQuestions}
                </p>
              </div>

              <div className="bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-2xl p-5 shadow-md">
                <Video className="mb-3" size={25} />

                <p className="text-sm text-white/80">
                  মোট Posts / Videos
                </p>

                <p className="text-3xl font-bold mt-1">
                  {totalPosts}
                </p>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-2xl p-5 shadow-md">
                <Wallet className="mb-3" size={25} />

                <p className="text-sm text-white/80">
                  Pending Withdrawals
                </p>

                <p className="text-3xl font-bold mt-1">
                  {pendingWithdrawals}
                </p>
              </div>

            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm">

              <h3 className="font-bold text-slate-900 dark:text-white">
                Withdrawal Summary
              </h3>

              <div className="grid grid-cols-3 gap-3 mt-4">

                <div>
                  <p className="text-xs text-slate-400">
                    Pending
                  </p>

                  <p className="text-xl font-bold text-yellow-600 mt-1">
                    {
                      withdrawals.filter(
                        (w) =>
                          w.status === 'pending'
                      ).length
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Approved
                  </p>

                  <p className="text-xl font-bold text-green-600 mt-1">
                    {
                      withdrawals.filter(
                        (w) =>
                          w.status === 'approved'
                      ).length
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Rejected
                  </p>

                  <p className="text-xl font-bold text-red-600 mt-1">
                    {
                      withdrawals.filter(
                        (w) =>
                          w.status === 'rejected'
                      ).length
                    }
                  </p>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* =========================
            SETTINGS
        ========================= */}

        {section === 'settings' && (
          <div className="space-y-5">

            <SectionHeader
              title="Settings"
              subtitle="Admin application settings"
              color="text-slate-600"
            />

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm">

              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <Settings size={27} />
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                App Settings
              </h3>

              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Reward points, referral settings,
                Daily Quiz settings এবং অন্যান্য
                global settings-এর জন্য database-backed
                settings table এখনো তোমার দেওয়া
                schema-তে নেই।
              </p>

              <div className="mt-5 rounded-xl bg-slate-50 dark:bg-slate-800 p-4">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  এই sectionটি আপাতত placeholder
                  রাখা হয়েছে, যাতে অজানা database
                  table ধরে কোনো code তৈরি করে
                  বর্তমানে কাজ করা system নষ্ট না হয়।
                </p>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
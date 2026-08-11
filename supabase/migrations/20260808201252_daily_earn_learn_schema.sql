/*
# Daily Earn & Learn - Full Schema

## Overview
Bengali rewards app where users earn points through daily check-ins, quizzes,
watching/reading tips, and referrals. Points accumulate in a wallet and can be
withdrawn via request. Admins manage posts and quiz questions.

## New Tables
1. profiles — extends auth.users with points, balance, referral code, admin flag.
2. quiz_questions — admin-created quiz questions.
3. quiz_attempts — one attempt per user per question.
4. posts — admin-created videos/tips.
5. post_views — tracks which user viewed which post.
6. check_ins — daily check-in records.
7. referrals — referral relationships.
8. withdrawals — withdraw requests.

## Security (RLS)
- All tables have RLS enabled.
- profiles: users read/update own profile.
- quiz_questions: all authenticated read; admins insert/update/delete.
- quiz_attempts: users CRUD own attempts.
- posts: all authenticated read; admins insert/update/delete.
- post_views: users CRUD own views.
- check_ins: users read own; insert via SECURITY DEFINER function only.
- referrals: users read own (as referrer or referred).
- withdrawals: users read/insert own.

## SECURITY DEFINER Functions
- claim_check_in() — atomically checks + creates check-in + awards 10 points.
- submit_quiz_answer(question_id, answer) — verifies correctness, awards points.
- view_post(post_id) — marks post viewed, awards points once.
- apply_referral(code) — applies referral code, awards 50 pts to both.
- create_withdrawal(amount, method, number) — deducts balance, creates request.

## Triggers
- handle_new_user — auto-creates profile row on signup with generated referral code.
  First user to sign up is automatically promoted to admin.
*/

-- ===================== PROFILES =====================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  points integer NOT NULL DEFAULT 0,
  total_earned integer NOT NULL DEFAULT 0,
  referral_code text UNIQUE NOT NULL,
  referred_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile" ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile" ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ===================== QUIZ QUESTIONS =====================
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_answer text NOT NULL CHECK (correct_answer IN ('a','b','c','d')),
  points integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_quiz_questions" ON public.quiz_questions;
CREATE POLICY "read_quiz_questions" ON public.quiz_questions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_quiz" ON public.quiz_questions;
CREATE POLICY "admin_insert_quiz" ON public.quiz_questions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "admin_update_quiz" ON public.quiz_questions;
CREATE POLICY "admin_update_quiz" ON public.quiz_questions FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "admin_delete_quiz" ON public.quiz_questions;
CREATE POLICY "admin_delete_quiz" ON public.quiz_questions FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ===================== QUIZ ATTEMPTS =====================
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  selected_answer text NOT NULL,
  is_correct boolean NOT NULL,
  points_earned integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_attempts" ON public.quiz_attempts;
CREATE POLICY "select_own_attempts" ON public.quiz_attempts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_attempts" ON public.quiz_attempts;
CREATE POLICY "insert_own_attempts" ON public.quiz_attempts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_attempts" ON public.quiz_attempts;
CREATE POLICY "delete_own_attempts" ON public.quiz_attempts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ===================== POSTS =====================
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  video_url text,
  type text NOT NULL DEFAULT 'tip' CHECK (type IN ('video','tip')),
  points integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_posts" ON public.posts;
CREATE POLICY "read_posts" ON public.posts FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_post" ON public.posts;
CREATE POLICY "admin_insert_post" ON public.posts FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "admin_update_post" ON public.posts;
CREATE POLICY "admin_update_post" ON public.posts FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "admin_delete_post" ON public.posts;
CREATE POLICY "admin_delete_post" ON public.posts FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ===================== POST VIEWS =====================
CREATE TABLE IF NOT EXISTS public.post_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_views" ON public.post_views;
CREATE POLICY "select_own_views" ON public.post_views FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_views" ON public.post_views;
CREATE POLICY "insert_own_views" ON public.post_views FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ===================== CHECK-INS =====================
CREATE TABLE IF NOT EXISTS public.check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  check_in_date date NOT NULL DEFAULT CURRENT_DATE,
  points_earned integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, check_in_date)
);

ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_checkins" ON public.check_ins;
CREATE POLICY "select_own_checkins" ON public.check_ins FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- ===================== REFERRALS =====================
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points_earned integer NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(referred_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_referrals" ON public.referrals;
CREATE POLICY "select_own_referrals" ON public.referrals FOR SELECT
  TO authenticated USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- ===================== WITHDRAWALS =====================
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  payment_method text NOT NULL,
  payment_number text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_withdrawals" ON public.withdrawals;
CREATE POLICY "select_own_withdrawals" ON public.withdrawals FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_withdrawals" ON public.withdrawals;
CREATE POLICY "insert_own_withdrawals" ON public.withdrawals FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ===================== INDEXES =====================
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_post_views_user ON public.post_views(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_user ON public.check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);

-- ===================== TRIGGER: auto-create profile on signup =====================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_is_first boolean;
BEGIN
  v_code := upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 8));
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO v_is_first;
  INSERT INTO public.profiles (id, referral_code, is_admin)
  VALUES (NEW.id, v_code, v_is_first);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===================== FUNCTION: claim daily check-in =====================
CREATE OR REPLACE FUNCTION public.claim_check_in()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_today date := CURRENT_DATE;
  v_exists boolean;
  v_reward integer := 10;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.check_ins WHERE user_id = v_user_id AND check_in_date = v_today
  ) INTO v_exists;

  IF v_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_checked_in');
  END IF;

  INSERT INTO public.check_ins (user_id, check_in_date, points_earned)
  VALUES (v_user_id, v_today, v_reward);

  UPDATE public.profiles
  SET points = points + v_reward, total_earned = total_earned + v_reward
  WHERE id = v_user_id;

  RETURN jsonb_build_object('success', true, 'points_earned', v_reward);
END;
$$;

-- ===================== FUNCTION: submit quiz answer =====================
CREATE OR REPLACE FUNCTION public.submit_quiz_answer(p_question_id uuid, p_answer text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_question record;
  v_already boolean;
  v_correct boolean;
  v_earned integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO v_question FROM public.quiz_questions WHERE id = p_question_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'question_not_found');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.quiz_attempts WHERE user_id = v_user_id AND question_id = p_question_id
  ) INTO v_already;
  IF v_already THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_answered');
  END IF;

  v_correct := (p_answer = v_question.correct_answer);
  IF v_correct THEN
    v_earned := v_question.points;
  END IF;

  INSERT INTO public.quiz_attempts (user_id, question_id, selected_answer, is_correct, points_earned)
  VALUES (v_user_id, p_question_id, p_answer, v_correct, v_earned);

  IF v_correct THEN
    UPDATE public.profiles
    SET points = points + v_earned, total_earned = total_earned + v_earned
    WHERE id = v_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'is_correct', v_correct,
    'correct_answer', v_question.correct_answer,
    'points_earned', v_earned
  );
END;
$$;

-- ===================== FUNCTION: view post (earn points once) =====================
CREATE OR REPLACE FUNCTION public.view_post(p_post_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_post record;
  v_already boolean;
  v_earned integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO v_post FROM public.posts WHERE id = p_post_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'post_not_found');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.post_views WHERE user_id = v_user_id AND post_id = p_post_id
  ) INTO v_already;
  IF v_already THEN
    RETURN jsonb_build_object('success', true, 'already_viewed', true, 'points_earned', 0);
  END IF;

  INSERT INTO public.post_views (user_id, post_id) VALUES (v_user_id, p_post_id);
  v_earned := v_post.points;
  UPDATE public.profiles
  SET points = points + v_earned, total_earned = total_earned + v_earned
  WHERE id = v_user_id;

  RETURN jsonb_build_object('success', true, 'points_earned', v_earned);
END;
$$;

-- ===================== FUNCTION: apply referral code =====================
CREATE OR REPLACE FUNCTION public.apply_referral(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_referrer record;
  v_already_referred boolean;
  v_reward integer := 50;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO v_referrer FROM public.profiles WHERE referral_code = upper(p_code);
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_code');
  END IF;

  IF v_referrer.id = v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'cannot_refer_self');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.referrals WHERE referred_id = v_user_id
  ) INTO v_already_referred;
  IF v_already_referred THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_referred');
  END IF;

  INSERT INTO public.referrals (referrer_id, referred_id, points_earned)
  VALUES (v_referrer.id, v_user_id, v_reward);

  UPDATE public.profiles SET points = points + v_reward, total_earned = total_earned + v_reward
  WHERE id IN (v_referrer.id, v_user_id);

  UPDATE public.profiles SET referred_by = v_referrer.id WHERE id = v_user_id;

  RETURN jsonb_build_object('success', true, 'points_earned', v_reward);
END;
$$;

-- ===================== FUNCTION: create withdrawal =====================
CREATE OR REPLACE FUNCTION public.create_withdrawal(p_amount integer, p_method text, p_number text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_balance integer;
  v_min_withdraw integer := 100;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT points INTO v_balance FROM public.profiles WHERE id = v_user_id;
  IF v_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'profile_not_found');
  END IF;

  IF p_amount < v_min_withdraw THEN
    RETURN jsonb_build_object('success', false, 'error', 'minimum_not_met', 'minimum', v_min_withdraw);
  END IF;

  IF p_amount > v_balance THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_balance');
  END IF;

  INSERT INTO public.withdrawals (user_id, amount, payment_method, payment_number)
  VALUES (v_user_id, p_amount, p_method, p_number);

  UPDATE public.profiles SET points = points - p_amount WHERE id = v_user_id;

  RETURN jsonb_build_object('success', true, 'new_balance', v_balance - p_amount);
END;
$$;

-- ===================== GRANTS =====================
GRANT EXECUTE ON FUNCTION public.claim_check_in() TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_quiz_answer(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.view_post(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_referral(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_withdrawal(integer, text, text) TO authenticated;

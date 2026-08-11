export type Profile = {
  id: string;
  points: number;
  total_earned: number;
  referral_code: string;
  referred_by: string | null;
  is_admin: boolean;
  created_at: string;
};

export type QuizQuestion = {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  points: number;
  created_at: string;
};

export type QuizAttempt = {
  id: string;
  user_id: string;
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  points_earned: number;
  created_at: string;
};

export type Post = {
  id: string;
  title: string;
  content: string;
  video_url: string | null;
  type: 'video' | 'tip';
  points: number;
  created_at: string;
};

export type CheckIn = {
  id: string;
  user_id: string;
  check_in_date: string;
  points_earned: number;
  created_at: string;
};

export type Referral = {
  id: string;
  referrer_id: string;
  referred_id: string;
  points_earned: number;
  created_at: string;
};

export type Withdrawal = {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  payment_number: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
};

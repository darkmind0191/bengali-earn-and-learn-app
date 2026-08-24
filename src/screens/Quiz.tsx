import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';

type Question = {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  points: number;
};

export default function Quiz() {
  const navigate = useNavigate();

  const { profile, session, refreshProfile } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [index, setIndex] = useState(0);
  const [searchNumber, setSearchNumber] = useState('');

  useEffect(() => {
    loadQuestions();
  }, []);

  async function loadQuestions() {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setQuestions(data as Question[]);
    }

    setLoading(false);
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (questions.length === 0) {
    return <div className="p-6">কোনো প্রশ্ন পাওয়া যায়নি।</div>;
  }

  const q = questions[index];

 async function choose(answer: string) {
   if (showResult || !profile?.id) return;

   setSelected(answer);

   try {
     const { data, error } = await supabase.rpc('submit_quiz_answer_safe', {
       p_question_id: q.id,
       p_answer: answer,
     });

     if (error) {
       console.error('QUIZ RPC ERROR:', error);
       alert(
         'RPC ERROR\n\n' +
         'Message: ' + error.message +
         '\n\nCode: ' + error.code +
         '\n\nDetails: ' + error.details +
         '\n\nHint: ' + error.hint
       );
       return;
     }

     if (!data) {
       alert('কোনো ফলাফল পাওয়া যায়নি।');
       return;
     }

     // প্রশ্নটি আগে উত্তর দেওয়া হয়ে থাকলে
     if (data.already_answered) {
       setShowResult(true);
       return;
     }

     // প্রথমবারের উত্তর
     if (data.success) {
       if (data.is_correct) {
         setScore((s) => s + (data.points_earned ?? 0));
       }

       setShowResult(true);

       // Balance RPC-এর ভেতরেই update হয়েছে
       await refreshProfile();
     }
   } catch (err) {
     console.error('Quiz error:', err);
     alert('একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।');
   }
 }

function goToQuestion() {
  const number = Number(searchNumber);

  if (!number || number < 1 || number > questions.length) {
    alert(`১ থেকে ${questions.length} এর মধ্যে প্রশ্ন নম্বর দিন`);
    return;
  }

  setIndex(number - 1);
  setSelected(null);
  setShowResult(false);
  setSearchNumber('');
}

  function nextQuestion() {
    setSelected(null);
    setShowResult(false);

    if (index + 1 < questions.length) {
      setIndex(index + 1);
    }
  }

  const options = [
    { key: 'a', text: q.option_a },
    { key: 'b', text: q.option_b },
    { key: 'c', text: q.option_c },
    { key: 'd', text: q.option_d },
  ];

  return (
    <div className="p-4 space-y-4">

      {/* Quiz / Daily Challenge Switch */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        <button
          onClick={() => navigate('/quiz')}
          className="flex-1 py-2.5 rounded-lg font-semibold bg-green-600 text-white"
        >
          📝 কুইজ
        </button>

        <button
          onClick={() => navigate('/daily-challenge')}
          className="flex-1 py-2.5 rounded-lg font-semibold text-slate-600 dark:text-slate-300"
        >
          🎯 Daily Challenge
        </button>
      </div>

      {/* Question Search */}
      <div className="p-3 border rounded-xl bg-white dark:bg-slate-800">
        <div className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
          🔎 প্রশ্ন নম্বর দিয়ে খুঁজুন
        </div>

        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            max={questions.length}
            value={searchNumber}
            onChange={(e) => setSearchNumber(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                goToQuestion();
              }
            }}
            placeholder={`১ - ${questions.length}`}
            className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          />

          <button
            onClick={goToQuestion}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold"
          >
            যান
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">কুইজ</h1>

        <div className="font-semibold text-green-600">
          স্কোর: {score}
        </div>
      </div>

      <div className="p-4 border rounded-xl bg-white dark:bg-slate-800 space-y-3">
        <div className="text-sm text-slate-500">
          প্রশ্ন {index + 1} / {questions.length}
        </div>

        <div className="font-semibold text-lg">{q.question}</div>

        <div className="space-y-2">
          {options.map((o) => {
            const isCorrect = showResult && o.key === q.correct_answer;
            const isWrong = showResult && selected === o.key && o.key !== q.correct_answer;

            return (
              <button
                key={o.key}
                onClick={() => choose(o.key)}
                className={`w-full text-left p-3 rounded-lg border transition ${
                  isCorrect
                    ? 'border-green-500 bg-green-50'
                    : isWrong
                    ? 'border-red-500 bg-red-50'
                    : 'border-slate-300 bg-white dark:bg-slate-700'
                }`}
              >
                {o.text}
              </button>
            );
          })}
        </div>

        {showResult && (
          <div className="space-y-3">
            <div
              className={`p-3 rounded-lg font-medium ${
                selected === q.correct_answer
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {selected === q.correct_answer
                ? `সঠিক! +${q.points} পয়েন্ট`
                : 'ভুল উত্তর'}
            </div>

            {index + 1 < questions.length ? (
              <button
                onClick={nextQuestion}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold"
              >
                পরবর্তী প্রশ্ন
              </button>
            ) : (
              <div className="text-center font-semibold text-blue-600">
                কুইজ শেষ! মোট স্কোর: {score}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
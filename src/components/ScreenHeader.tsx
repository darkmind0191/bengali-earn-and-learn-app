import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

type Props = {
  title: string;
  back?: boolean;
  right?: ReactNode;
};

export default function ScreenHeader({ title, back, right }: Props) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-3 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
      {back && (
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        >
          <ArrowLeft size={20} className="text-slate-700 dark:text-slate-200" />
        </button>
      )}
      <h1 className="text-lg font-bold text-slate-900 dark:text-white flex-1">{title}</h1>
      {right}
    </header>
  );
}

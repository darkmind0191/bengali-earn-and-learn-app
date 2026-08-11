type BrandMarkProps = {
  compact?: boolean;
  light?: boolean;
};

export default function BrandMark({ compact = false, light = false }: BrandMarkProps) {
  return (
    <div className={`flex items-center gap-3 ${compact ? '' : 'flex-col gap-4'}`}>
      <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-gradient-to-br from-brand-400 via-brand-500 to-blue-600 shadow-lg shadow-brand-500/25">
        <div className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-accent-400 shadow-sm" />
        <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
          <path d="M14 19.5c9.5-5.5 18.5-5.5 27 0v29c-9-5-18-5-27 0v-29Z" fill="none" stroke="white" strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M41 19.5c3.5-2 6.5-2.2 9-.8v29c-3-1.3-6-1-9 0" fill="none" stroke="white" strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M18.5 27.5c6.5-2.3 13-2.3 19.5 0M18.5 35c6.5-2.3 13-2.3 19.5 0" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity=".8" />
          <path d="M44 14c4.5.2 7.6 2.4 9 6.6-4.4.3-7.5-1.9-9-6.6Z" fill="#fbbf24" />
        </svg>
      </div>
      <div className={compact ? '' : 'text-center'}>
        <p className={`text-xl font-bold leading-tight tracking-tight ${light ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
          আয় <span className={light ? 'text-brand-200' : 'text-brand-600 dark:text-brand-400'}>&amp;</span> শিক্ষা
        </p>
        <p className={`mt-0.5 text-xs font-medium tracking-[0.16em] ${light ? 'text-brand-100' : 'text-slate-500 dark:text-slate-400'}`}>
          EARN &amp; LEARN বাংলা
        </p>
      </div>
    </div>
  );
}

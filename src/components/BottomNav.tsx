import { NavLink } from 'react-router-dom';
import { Home, Brain, Gift, Wallet, User } from 'lucide-react';

const items = [
  { to: '/', label: 'হোম', icon: Home },
  { to: '/quiz', label: 'কুইজ', icon: Brain },
  { to: '/earn', label: 'আয়', icon: Gift },
  { to: '/wallet', label: 'ওয়ালেট', icon: Wallet },
  { to: '/profile', label: 'প্রোফাইল', icon: User },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-all ${
                isActive
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[11px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

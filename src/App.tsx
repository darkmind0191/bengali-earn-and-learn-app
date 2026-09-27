import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import BottomNav from './components/BottomNav';
import Auth from './screens/Auth';
import Home from './screens/Home';
import Quiz from './screens/Quiz';
import Earn from './screens/Earn';
import Wallet from './screens/Wallet';
import Profile from './screens/Profile';
import Admin from './screens/Admin';
import BrandMark from './components/BrandMark';
import Videos from './screens/Videos';
import Leaderboard from './screens/Leaderboard';
import DailyChallenge from './screens/DailyChallenge';
import MiniGames from './screens/MiniGames';
import SmartQuick from './games/smart-quick/SmartQuick';
import NumberMatch from './games/number-match/NumberMatch';
import TargetShooter from './games/target-shooter/TargetShooter';
import TrafficEscape from './games/traffic-escape/TrafficEscape';
import FishCatch from './games/fish-catch/FishCatch';
import SpaceFighter from './games/space-fighter/SpaceFighter';
import BlockBlast from './games/block-blast/BlockBlast';
import FruitSlice from './games/fruit-slice/FruitSlice';

function ProtectedLayout() {
  const location = useLocation();
  const hideNav = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <div className="flex-1 pb-20 max-w-x1 mx-auto w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/daily-challenge" element={<DailyChallenge />} />
          <Route path="/earn" element={<Earn />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/mini-games" element={<MiniGames />} />
          <Route path="/mini-games/smart-quick" element={<SmartQuick />} />
          <Route path="/mini-games/number-match" element={<NumberMatch />} />
          <Route
            path="/mini-games/target-shooter"
            element={<TargetShooter />}
          />
          <Route
            path="/mini-games/traffic-escape"
            element={<TrafficEscape />}
          />
          <Route
            path="/mini-games/fish-catch"
            element={<FishCatch />}
          />
          <Route
            path="/mini-games/space-fighter"
            element={<SpaceFighter />}
          />
          <Route
            path="/mini-games/block-blast"
            element={<BlockBlast />}
          />
          <Route
            path="/mini-games/fruit-slice"
            element={<FruitSlice />}
          />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {!hideNav && <BottomNav />}
    </div>
  );
}

function AppRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-800 to-blue-900 flex items-center justify-center px-6">
        <div className="flex flex-col items-center animate-pulse">
          <BrandMark light />
          <div className="mt-8 w-8 h-8 border-2 border-brand-200/40 border-t-white rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return <ProtectedLayout />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}
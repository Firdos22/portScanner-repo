import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ProgressProvider } from '@/context/ProgressContext';
import { AchievementToast } from '@/components/AchievementToast';
import { CyberBackground } from '@/components/CyberVisuals';
import { Loader2 } from 'lucide-react';
import Login from '@/pages/Login';
import SignUp from '@/pages/SignUp';
import DashboardLayout from '@/pages/DashboardLayout';
import Home from '@/pages/Home';
import Scanner from '@/pages/Scanner';
import Stats from '@/pages/Stats';
import Learn from '@/pages/Learn';
import Achievements from '@/pages/Achievements';
import Settings from '@/pages/Settings';
import PortDetail from '@/pages/PortDetail';
import Reports from '@/pages/Reports';
import About from '@/pages/About';
import PracticalLab from '@/pages/PracticalLab';
import LearnNmap from '@/pages/LearnNmap';
import ScanHistory from '@/pages/ScanHistory';
import SystemCheck from '@/pages/SystemCheck';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="fixed inset-0 flex items-center justify-center bg-cyber-bg"><CyberBackground /><Loader2 size={40} className="text-cyber-glow animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="fixed inset-0 flex items-center justify-center bg-cyber-bg"><CyberBackground /><Loader2 size={40} className="text-cyber-glow animate-spin" /></div>;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider><ProgressProvider><HashRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/sign-up" element={<PublicRoute><SignUp /></PublicRoute>} />
        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Home />} />
          <Route path="scanner" element={<Scanner />} />
          <Route path="practical-lab" element={<PracticalLab />} />
          <Route path="learn-nmap" element={<LearnNmap />} />
          <Route path="scan-history" element={<ScanHistory />} />
          <Route path="system-check" element={<SystemCheck />} />
          <Route path="stats" element={<Stats />} />
          <Route path="learn" element={<Learn />} />
          <Route path="achievements" element={<Achievements />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="/port/:id" element={<ProtectedRoute><PortDetail /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter><AchievementToast /></ProgressProvider></AuthProvider>
  );
}

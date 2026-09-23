import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, Radar, BarChart3, GraduationCap, Trophy, Settings as SettingsIcon, LogOut, Terminal, BookOpen, History, Activity } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { CyberBackground } from '@/components/CyberVisuals';

const TABS = [
  { to: '/', icon: Home, label: 'Dashboard', end: true },
  { to: '/scanner', icon: Radar, label: 'Scanner' },
  { to: '/practical-lab', icon: Terminal, label: 'Practical Lab' },
  { to: '/learn-nmap', icon: BookOpen, label: 'Learn Nmap' },
  { to: '/scan-history', icon: History, label: 'Scan History' },
  { to: '/system-check', icon: Activity, label: 'System Check' },
  { to: '/stats', icon: BarChart3, label: 'Stats' },
  { to: '/learn', icon: GraduationCap, label: 'Learn' },
  { to: '/achievements', icon: Trophy, label: 'Awards' },
  { to: '/settings', icon: SettingsIcon, label: 'Settings' },
];

export default function DashboardLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const handleSignOut = async () => { await signOut(); navigate('/login'); };

  return (
    <div className="min-h-screen">
      <CyberBackground />
      <div className="flex min-h-screen">
        <aside className="hidden md:flex flex-col w-64 border-r border-cyber-border bg-cyber-bg/60 backdrop-blur-md p-4 fixed h-full overflow-y-auto">
          <div className="flex items-center gap-3 px-2 py-4">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center"><Radar size={22} className="text-white" /></div>
            <div><p className="text-sm font-extrabold text-white">Port Scanner</p><p className="text-[10px] text-slate-500">Dashboard</p></div>
          </div>
          <nav className="flex-1 mt-4 space-y-1">
            {TABS.map((tab) => (
              <NavLink key={tab.to} to={tab.to} end={tab.end} className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${isActive ? 'gradient-primary text-white glow-primary' : 'text-slate-400 hover:text-white hover:bg-cyber-surface/40'}`}>
                <tab.icon size={18} />{tab.label}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-cyber-border pt-4 mt-auto">
            <div className="px-3 py-2 mb-2"><p className="text-xs text-slate-500 truncate">{user?.email}</p></div>
            <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors"><LogOut size={20} /> Sign Out</button>
          </div>
        </aside>
        <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-cyber-bg/80 backdrop-blur-md border-b border-cyber-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2"><Radar size={20} className="text-cyber-glow" /><span className="text-sm font-bold text-white">Port Scanner</span></div>
          <button onClick={handleSignOut} className="text-red-400"><LogOut size={18} /></button>
        </div>
        <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0">
          <div className="p-4 md:p-8 max-w-5xl mx-auto"><Outlet /></div>
        </main>
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-cyber-bg/90 backdrop-blur-md border-t border-cyber-border flex items-center justify-around py-2 overflow-x-auto">
          {TABS.slice(0, 7).map((tab) => (
            <NavLink key={tab.to} to={tab.to} end={tab.end} className={({ isActive }) => `flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-colors flex-shrink-0 ${isActive ? 'text-cyber-glow' : 'text-slate-500'}`}>
              <tab.icon size={18} /><span className="text-[9px] font-semibold">{tab.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}

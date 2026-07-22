import { useNavigate } from 'react-router-dom';
import { LogOut, FileText, Info, Shield, Github } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { DEVELOPER, DISCLAIMER } from '@/data/ports';
import { AnimatedShield } from '@/components/CyberVisuals';

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const handleSignOut = async () => { await signOut(); navigate('/login'); };

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-extrabold text-white mb-1">Settings</h1><p className="text-sm text-slate-400">Account and app information.</p></div>
      {user && (
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-cyber-primary/15 flex items-center justify-center"><span className="text-xl font-extrabold text-cyber-glow">{user.email?.[0]?.toUpperCase() ?? 'U'}</span></div>
          <div className="flex-1 min-w-0"><p className="text-sm font-bold text-white truncate">{user.email}</p><p className="text-xs text-slate-400">Signed in</p></div>
        </div>
      )}
      <div>
        <p className="text-xs font-extrabold tracking-widest text-slate-500 mb-3">TOOLS</p>
        <div className="space-y-2.5">
          <button onClick={() => navigate('/reports')} className="w-full glass-card p-4 flex items-center gap-3 hover:border-cyber-glow/30 transition-colors text-left"><FileText size={20} className="text-cyber-accentGlow flex-shrink-0" /><span className="flex-1 text-sm font-semibold text-white">Reports</span></button>
          <button onClick={() => navigate('/about')} className="w-full glass-card p-4 flex items-center gap-3 hover:border-cyber-glow/30 transition-colors text-left"><Info size={20} className="text-cyber-accentGlow flex-shrink-0" /><span className="flex-1 text-sm font-semibold text-white">About</span></button>
        </div>
      </div>
      <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 border border-red-500/40 rounded-xl py-3.5 text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors"><LogOut size={18} /> Sign Out</button>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4"><Shield size={16} className="text-amber-500 flex-shrink-0 mt-0.5" /><p className="text-xs text-slate-400 leading-relaxed">{DISCLAIMER}</p></motion.div>
      <div className="flex flex-col items-center gap-2 pt-4">
        <AnimatedShield size={48} />
        <p className="text-base font-extrabold text-white mt-2">{DEVELOPER.name}</p>
        <p className="text-xs text-slate-400 text-center">{DEVELOPER.role}</p>
        <a href={DEVELOPER.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 border border-cyber-border rounded-xl px-4 py-2.5 mt-2 hover:border-cyber-glow/40 transition-colors"><Github size={16} className="text-cyber-accentGlow" /><span className="text-xs font-bold text-cyber-accentGlow">{DEVELOPER.github}</span></a>
        <p className="text-xs text-slate-600 mt-3">© {new Date().getFullYear()} {DEVELOPER.name}</p>
      </div>
    </div>
  );
}

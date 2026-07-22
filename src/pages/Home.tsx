import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Radar, BookOpen, Zap, ChevronRight, Activity, Clock, GraduationCap, Shield } from 'lucide-react';
import { AnimatedShield } from '@/components/CyberVisuals';
import { useProgress } from '@/context/ProgressContext';
import { formatDuration } from '@/utils/scanner';
import { DISCLAIMER } from '@/data/ports';

const TIP = 'A "filtered" port is hidden behind a firewall — the scanner cannot tell whether a service is actually listening.';

export default function Home() {
  const navigate = useNavigate();
  const { progress } = useProgress();
  const stats = [
    { label: 'Scans Run', value: progress.scanCount, icon: Activity },
    { label: 'Ports Viewed', value: progress.viewedPorts.length, icon: BookOpen },
    { label: 'Badges', value: progress.achievements.length, icon: Zap },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-3 pt-4">
        <AnimatedShield size={64} />
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Port Scanner Dashboard</h1>
        <p className="text-sm text-slate-400 text-center px-4">Educational Network Port Scanner Simulator</p>
      </motion.div>
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }} className="glass-card p-4 flex flex-col items-center gap-1.5">
            <s.icon size={18} className="text-cyber-accentGlow" />
            <span className="text-2xl font-extrabold text-white">{s.value}</span>
            <span className="text-[10px] font-semibold text-slate-400">{s.label}</span>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3"><BookOpen size={18} className="text-cyber-accentGlow" /><h2 className="text-base font-bold text-white">Today's Learning Tip</h2></div>
        <p className="text-sm text-slate-400 leading-relaxed">{TIP}</p>
      </motion.div>
      {progress.lastScan ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3"><Radar size={18} className="text-cyber-accentGlow" /><h2 className="text-base font-bold text-white">Recent Scan</h2></div>
          <div className="flex items-center justify-between">
            <div><p className="text-lg font-extrabold text-white">{progress.lastScan.ip}</p><p className="text-xs text-slate-400 mt-1">{progress.lastScan.ports.length} ports · {formatDuration(progress.lastScan.durationMs)}</p></div>
            <Clock size={20} className="text-slate-600" />
          </div>
          <button onClick={() => navigate('/scanner')} className="mt-4 flex items-center gap-1.5 text-sm font-bold text-cyber-glow border border-cyber-border rounded-xl px-4 py-2.5 hover:bg-cyber-surface/30 transition-colors">View Results <ChevronRight size={16} /></button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3"><GraduationCap size={18} className="text-cyber-accentGlow" /><h2 className="text-base font-bold text-white">Continue Learning</h2></div>
          <p className="text-sm text-slate-400 leading-relaxed">Run your first simulated scan to unlock results, statistics, and learning notes.</p>
          <button onClick={() => navigate('/scanner')} className="mt-4 flex items-center gap-1.5 text-sm font-bold text-cyber-glow border border-cyber-border rounded-xl px-4 py-2.5 hover:bg-cyber-surface/30 transition-colors">Start a Scan <ChevronRight size={16} /></button>
        </motion.div>
      )}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
        <Shield size={16} className="text-amber-500 flex-shrink-0 mt-0.5" /><p className="text-xs text-slate-400 leading-relaxed">{DISCLAIMER}</p>
      </motion.div>
    </div>
  );
}

import { motion } from 'framer-motion';
import { Lock, RotateCcw, Rocket, Compass, Award, BookOpen, FileChartColumn, Crown, Shield } from 'lucide-react';
import { useState } from 'react';
import { ACHIEVEMENTS } from '@/data/ports';
import { useProgress } from '@/context/ProgressContext';

const ICON_MAP: Record<string, typeof Shield> = {
  rocket: Rocket, compass: Compass, award: Award, 'book-open': BookOpen,
  'file-chart-column': FileChartColumn, crown: Crown,
};

export default function Achievements() {
  const { progress, reset } = useProgress();
  const [showReset, setShowReset] = useState(false);
  const unlocked = new Set(progress.achievements);
  const count = progress.achievements.length;

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-extrabold text-white mb-1">Achievements</h1><p className="text-sm text-slate-400">Unlock badges as you learn and scan.</p></div>
      <div className="glass-card p-6 flex flex-col items-center gap-2">
        <span className="text-3xl font-extrabold text-white">{count} / {ACHIEVEMENTS.length}</span>
        <span className="text-sm text-slate-400">Badges unlocked</span>
        <div className="w-full h-1.5 bg-cyber-surface rounded-full mt-3 overflow-hidden"><div className="h-full bg-cyber-accent rounded-full transition-all" style={{ width: `${(count / ACHIEVEMENTS.length) * 100}%` }} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {ACHIEVEMENTS.map((a, i) => {
          const Icon = ICON_MAP[a.icon] ?? Shield;
          const isUnlocked = unlocked.has(a.id);
          return (
            <motion.div key={a.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="glass-card p-5 flex flex-col items-center gap-2 text-center" style={{ borderColor: isUnlocked ? 'rgba(6, 182, 212, 0.4)' : undefined }}>
              <div className={`rounded-xl flex items-center justify-center ${isUnlocked ? 'bg-cyber-accent/15' : 'bg-slate-800/30'}`} style={{ width: 52, height: 52 }}>
                {isUnlocked ? <Icon size={26} className="text-cyber-accentGlow" /> : <Lock size={22} className="text-slate-600" />}
              </div>
              <p className={`text-sm font-bold ${isUnlocked ? 'text-white' : 'text-slate-600'}`}>{a.title}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{a.description}</p>
              <span className={`text-[10px] font-extrabold tracking-widest mt-1 ${isUnlocked ? 'text-cyber-successGlow' : 'text-slate-600'}`}>{isUnlocked ? 'UNLOCKED' : 'LOCKED'}</span>
            </motion.div>
          );
        })}
      </div>
      {showReset ? (
        <div className="flex gap-3">
          <button onClick={() => { reset(); setShowReset(false); }} className="flex-1 flex items-center justify-center gap-2 border border-red-500/40 rounded-xl py-3.5 text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors"><RotateCcw size={16} /> Confirm Reset</button>
          <button onClick={() => setShowReset(false)} className="flex-1 rounded-xl py-3.5 text-sm font-bold text-slate-400 border border-cyber-border hover:text-white transition-colors">Cancel</button>
        </div>
      ) : (
        <button onClick={() => setShowReset(true)} className="w-full flex items-center justify-center gap-2 border border-red-500/40 rounded-xl py-3.5 text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors"><RotateCcw size={16} /> Reset all progress</button>
      )}
    </div>
  );
}

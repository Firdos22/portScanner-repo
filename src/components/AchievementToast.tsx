import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown } from 'lucide-react';
import { ACHIEVEMENTS } from '@/data/ports';
import { useProgress } from '@/context/ProgressContext';

export function AchievementToast() {
  const { toastId, dismissToast } = useProgress();
  const achievement = toastId ? ACHIEVEMENTS.find((a) => a.id === toastId) : null;
  useEffect(() => { if (toastId) { const t = setTimeout(dismissToast, 3000); return () => clearTimeout(t); } }, [toastId, dismissToast]);
  return (
    <AnimatePresence>
      {achievement && (
        <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass-card border-2 border-cyber-accent/50 px-6 py-4 flex items-center gap-4 max-w-sm">
          <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <Crown size={36} className="text-cyber-accentGlow" />
          </motion.div>
          <div>
            <p className="text-[10px] font-extrabold tracking-widest text-cyber-accentGlow">ACHIEVEMENT UNLOCKED</p>
            <p className="text-lg font-extrabold text-white">{achievement.title}</p>
            <p className="text-xs text-slate-400">{achievement.description}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

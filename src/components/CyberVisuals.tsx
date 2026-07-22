import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export function CyberBackground() {
  const particles = Array.from({ length: 14 }).map((_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    size: 2 + Math.random() * 4, duration: 6 + Math.random() * 6, delay: Math.random() * 4,
  }));
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-cyber-bg">
      <div className="absolute inset-0 cyber-grid-bg" />
      <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-cyber-primary opacity-[0.08] blur-[80px]" />
      {particles.map((p) => (
        <motion.div key={p.id} className="absolute rounded-full bg-cyber-glow" style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }} animate={{ y: [-20, -60], opacity: [0, 0.6, 0] }} transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }} />
      ))}
    </div>
  );
}

export function AnimatedShield({ size = 72 }: { size?: number }) {
  return (
    <motion.div className="relative flex items-center justify-center" animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}>
      <motion.div className="absolute rounded-full bg-cyber-primary" style={{ width: size * 1.6, height: size * 1.6 }} animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }} />
      <Shield size={size} className="text-cyber-glow relative z-10" strokeWidth={1.8} />
    </motion.div>
  );
}

export function RadarSweep({ size = 220 }: { size?: number }) {
  const rings = [0.33, 0.66, 1];
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {rings.map((r, i) => (
        <div key={i} className="absolute rounded-full border" style={{ width: size * r, height: size * r, borderColor: 'rgba(96, 165, 250, 0.2)' }} />
      ))}
      <div className="absolute" style={{ width: size, height: 0.5, background: 'rgba(96, 165, 250, 0.15)' }} />
      <div className="absolute" style={{ width: 0.5, height: size, background: 'rgba(96, 165, 250, 0.15)' }} />
      <div className="absolute w-1.5 h-1.5 rounded-full bg-cyber-accentGlow" />
      <motion.div className="absolute rounded-full" style={{ width: size, height: size, borderLeft: '2px solid #22D3EE', borderTop: '2px solid transparent', borderRight: '2px solid transparent', borderBottom: '2px solid transparent' }} animate={{ rotate: 360 }} transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }} />
    </div>
  );
}

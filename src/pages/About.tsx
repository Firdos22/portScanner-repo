import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Github, Shield, BookOpen, Lock, Code, Radar } from 'lucide-react';
import { DEVELOPER, DISCLAIMER } from '@/data/ports';
import { AnimatedShield } from '@/components/CyberVisuals';

export default function About() {
  const navigate = useNavigate();
  const features = [
    { icon: Radar, title: 'Real TCP Scanning', desc: 'Performs actual TCP connect scans via a serverless edge function — not simulated data.' },
    { icon: BookOpen, title: 'Learn Networking', desc: 'Explore ports, protocols, TCP vs UDP, and common security risks interactively.' },
    { icon: Lock, title: 'Security Awareness', desc: 'Understand attack surfaces and mitigation best practices for common ports.' },
    { icon: Code, title: 'Modern Stack', desc: 'Built with React, Vite, Framer Motion, Recharts, Supabase Edge Functions, and Deno.' },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 text-sm font-semibold mb-6 hover:text-white transition-colors"><ArrowLeft size={20} /> Back</button>
      <div className="flex flex-col items-center gap-3 py-8">
        <AnimatedShield size={80} />
        <h1 className="text-2xl font-extrabold text-white">Port Scanner Dashboard</h1>
        <p className="text-sm text-slate-400 text-center">Real-Time Network Port Scanner</p>
      </div>
      <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6"><Shield size={18} className="text-amber-500 flex-shrink-0 mt-0.5" /><p className="text-xs text-slate-400 leading-relaxed">{DISCLAIMER}</p></div>
      <p className="text-xs font-extrabold tracking-widest text-slate-500 mb-3">FEATURES</p>
      <div className="space-y-3 mb-6">
        {features.map((f, i) => (
          <motion.div key={f.title} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyber-accent/15 flex items-center justify-center flex-shrink-0"><f.icon size={20} className="text-cyber-accentGlow" /></div>
            <div className="flex-1"><p className="text-sm font-bold text-white">{f.title}</p><p className="text-xs text-slate-400 leading-relaxed mt-1">{f.desc}</p></div>
          </motion.div>
        ))}
      </div>
      <p className="text-xs font-extrabold tracking-widest text-slate-500 mb-3">DEVELOPER</p>
      <div className="glass-card p-4 flex items-center gap-4 mb-3">
        <div className="w-12 h-12 rounded-xl bg-cyber-primary/15 flex items-center justify-center flex-shrink-0"><span className="text-xl font-extrabold text-cyber-glow">F</span></div>
        <div className="flex-1"><p className="text-base font-extrabold text-white">{DEVELOPER.name}</p><p className="text-xs text-slate-400">{DEVELOPER.role}</p></div>
      </div>
      <a href={DEVELOPER.github} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 border border-cyber-border rounded-xl py-3.5 text-sm font-bold text-cyber-accentGlow hover:border-cyber-glow/40 transition-colors"><Github size={18} /> {DEVELOPER.github}</a>
      <p className="text-xs text-slate-600 text-center mt-8">© {new Date().getFullYear()} {DEVELOPER.name}. All rights reserved.</p>
    </div>
  );
}

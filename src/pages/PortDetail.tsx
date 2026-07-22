import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Shield, AlertTriangle, Lightbulb, BookOpen, Target, Zap } from 'lucide-react';
import { PORTS } from '@/data/ports';
import { StatusBadge } from '@/components/StatusBadge';
import { useProgress } from '@/context/ProgressContext';

export default function PortDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite, recordViewedPort } = useProgress();
  const port = PORTS.find((p) => String(p.port) === id);

  useEffect(() => {
    if (port) recordViewedPort(port.port);
  }, [port, recordViewedPort]);

  if (!port) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center"><p className="text-lg font-bold text-white mb-2">Port not found</p><button onClick={() => navigate('/scanner')} className="text-cyber-glow font-bold text-sm">Back to Scanner</button></div>
      </div>
    );
  }

  const fav = isFavorite(port.port);
  const glow = port.status === 'open' ? '#34D399' : port.status === 'closed' ? '#F87171' : '#F59E0B';

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 text-sm font-semibold mb-6 hover:text-white transition-colors"><ArrowLeft size={20} /> Back</button>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mb-4" style={{ borderColor: `${glow}33` }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl border flex items-center justify-center flex-shrink-0" style={{ borderColor: `${glow}44`, backgroundColor: `${glow}12` }}><span className="text-xl font-extrabold" style={{ color: glow }}>{port.port}</span></div>
            <div><h1 className="text-2xl font-extrabold text-white">{port.service}</h1><p className="text-sm text-slate-400 mt-1">{port.protocol} · Port {port.port}</p><div className="mt-2"><StatusBadge status={port.status} /></div></div>
          </div>
          <button onClick={() => toggleFavorite(port.port)} className="p-2 rounded-xl hover:bg-cyber-surface/40 transition-colors"><Heart size={22} className={fav ? 'text-red-400 fill-red-400' : 'text-slate-600'} /></button>
        </div>
        <p className="text-sm text-slate-400 mt-4 leading-relaxed">{port.description}</p>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 mb-4">
        <SectionTitle icon={<Target size={18} className="text-cyber-accentGlow" />} title="Purpose" />
        <p className="text-sm text-slate-400 leading-relaxed">{port.purpose}</p>
        <SectionTitle icon={<Zap size={18} className="text-cyber-accentGlow" />} title="Common Uses" />
        <ul className="space-y-1.5">{port.commonUses.map((u, i) => <li key={i} className="text-sm text-slate-400 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-cyber-glow flex-shrink-0" />{u}</li>)}</ul>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5 mb-4" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
        <SectionTitle icon={<AlertTriangle size={18} className="text-red-400" />} title="Security Risks" />
        <ul className="space-y-2">{port.securityRisks.map((r, i) => <li key={i} className="text-sm text-slate-400 flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-1.5" />{r}</li>)}</ul>
        <SectionTitle icon={<Shield size={18} className="text-red-400" />} title="Attack Examples" />
        <ul className="space-y-2">{port.attackExamples.map((a, i) => <li key={i} className="text-sm text-slate-400 flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-1.5" />{a}</li>)}</ul>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5 mb-4" style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }}>
        <SectionTitle icon={<Lightbulb size={18} className="text-cyber-successGlow" />} title="Best Practices" />
        <ul className="space-y-2">{port.bestPractices.map((b, i) => <li key={i} className="text-sm text-slate-400 flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-cyber-successGlow flex-shrink-0 mt-1.5" />{b}</li>)}</ul>
        <div className="mt-4 bg-cyber-success/10 border border-cyber-success/20 rounded-xl p-4"><p className="text-xs font-bold text-cyber-successGlow mb-1">RECOMMENDATION</p><p className="text-sm text-slate-300 leading-relaxed">{port.recommendations}</p></div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5">
        <SectionTitle icon={<BookOpen size={18} className="text-cyber-accentGlow" />} title="Educational Notes" />
        <p className="text-sm text-slate-400 leading-relaxed">{port.educationalNotes}</p>
      </motion.div>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return <div className="flex items-center gap-2 mb-3 mt-4 first:mt-0">{icon}<h2 className="text-sm font-bold text-white">{title}</h2></div>;
}

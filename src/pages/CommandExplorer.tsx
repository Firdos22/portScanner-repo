import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, X, Terminal, ArrowRight, Filter } from 'lucide-react';
import { NMAP_COMMANDS, type NmapDifficulty } from '@/data/nmapCommands';

const DIFFICULTY_COLORS: Record<NmapDifficulty, { label: string; color: string; bg: string }> = {
  beginner: { label: 'Beginner', color: 'text-green-400', bg: 'bg-green-500/15' },
  intermediate: { label: 'Intermediate', color: 'text-cyber-glow', bg: 'bg-blue-500/15' },
  advanced: { label: 'Advanced', color: 'text-amber-400', bg: 'bg-amber-500/15' },
};

export default function CommandExplorer() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<NmapDifficulty | 'all'>('all');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return NMAP_COMMANDS.filter((cmd) => {
      if (filter !== 'all' && cmd.difficulty !== filter) return false;
      if (!q) return true;
      return cmd.name.toLowerCase().includes(q) || cmd.syntax.toLowerCase().includes(q) || cmd.description.toLowerCase().includes(q) || cmd.category.toLowerCase().includes(q) || cmd.options.some((o) => o.toLowerCase().includes(q));
    });
  }, [query, filter]);

  const categories = useMemo(() => [...new Set(NMAP_COMMANDS.map((c) => c.category))], []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-white mb-1">Command Explorer</h1>
        <p className="text-sm text-slate-400">Search and explore all nmap commands by difficulty, category, or keyword.</p>
      </div>

      <div className="flex items-center gap-3 bg-cyber-surface/50 border border-cyber-border rounded-xl px-4 py-3.5">
        <Search size={18} className="text-slate-500 flex-shrink-0" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search commands, flags, categories..." className="flex-1 bg-transparent text-white text-sm font-semibold placeholder:text-slate-600" />
        {query && <button onClick={() => setQuery('')} className="text-slate-600 hover:text-slate-400"><X size={16} /></button>}
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3.5 py-2 rounded-full text-xs font-bold border transition-all ${filter === f ? 'gradient-primary text-white border-transparent' : 'bg-cyber-surface/50 text-slate-400 border-cyber-border hover:text-white'}`}>
            {f === 'all' ? 'All Levels' : DIFFICULTY_COLORS[f].label}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-500">{results.length} command{results.length !== 1 ? 's' : ''} found</p>

      <div className="space-y-3">
        {results.length === 0 ? (
          <div className="py-12 text-center"><Filter size={32} className="text-slate-600 mx-auto mb-3" /><p className="text-sm text-slate-600">No commands match your search.</p></div>
        ) : (
          results.map((cmd, i) => {
            const dc = DIFFICULTY_COLORS[cmd.difficulty];
            return (
              <motion.div key={cmd.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="glass-card p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${dc.bg}`}><Terminal size={16} className={dc.color} /></div>
                    <div><p className="text-sm font-bold text-white">{cmd.name}</p><span className={`text-[10px] font-bold ${dc.color}`}>{dc.label}</span></div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-cyber-surface/40 border border-cyber-border text-[10px] font-bold text-slate-400">{cmd.category}</span>
                </div>
                <pre className="bg-[#0a0e1a] rounded-lg p-3 text-xs font-mono text-cyber-glow border border-cyber-border/50 mb-2">{cmd.syntax}</pre>
                <p className="text-sm text-slate-400 leading-relaxed mb-3">{cmd.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {cmd.options.slice(0, 4).map((opt, oi) => (<span key={oi} className="px-2 py-1 rounded bg-cyber-surface/30 text-[10px] text-slate-500 font-mono">{opt}</span>))}
                </div>
                <button onClick={() => navigate('/practical-lab')} className="flex items-center gap-1.5 text-xs font-bold text-cyber-glow hover:text-white transition-colors">
                  Try in Lab <ArrowRight size={13} />
                </button>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

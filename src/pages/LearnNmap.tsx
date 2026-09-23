import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, BookOpen, Zap, Award, Terminal, Lightbulb, ArrowRight } from 'lucide-react';
import { NMAP_COMMANDS, type NmapDifficulty, type NmapCommand } from '@/data/nmapCommands';

const DIFFICULTIES: { key: NmapDifficulty; label: string; icon: typeof Zap; color: string; bg: string; border: string }[] = [
  { key: 'beginner', label: 'Beginner', icon: BookOpen, color: 'text-green-400', bg: 'bg-green-500/15', border: 'border-green-500/40' },
  { key: 'intermediate', label: 'Intermediate', icon: Zap, color: 'text-cyber-glow', bg: 'bg-blue-500/15', border: 'border-blue-500/40' },
  { key: 'advanced', label: 'Advanced', icon: Award, color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/40' },
];

export default function LearnNmap() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<NmapDifficulty>('beginner');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const commands = NMAP_COMMANDS.filter((c) => c.difficulty === selected);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-white mb-1">Learn Nmap</h1>
        <p className="text-sm text-slate-400">Master nmap commands from beginner to advanced, with real examples.</p>
      </div>

      {/* Difficulty selector */}
      <div className="flex gap-2">
        {DIFFICULTIES.map((d) => {
          const Icon = d.icon;
          const isActive = selected === d.key;
          return (
            <button key={d.key} onClick={() => { setSelected(d.key); setExpandedId(null); }} className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${isActive ? `${d.bg} ${d.border}` : 'bg-cyber-surface/40 border-cyber-border'}`}>
              <Icon size={18} className={isActive ? d.color : 'text-slate-500'} />
              <span className={`text-xs font-bold ${isActive ? d.color : 'text-slate-500'}`}>{d.label}</span>
            </button>
          );
        })}
      </div>

      {/* Command list */}
      <div className="space-y-3">
        {commands.map((cmd, i) => {
          const isExpanded = expandedId === cmd.id;
          return (
            <motion.div key={cmd.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card overflow-hidden">
              <button onClick={() => setExpandedId(isExpanded ? null : cmd.id)} className="w-full text-left p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${DIFFICULTIES.find((d) => d.key === cmd.difficulty)?.bg} ${DIFFICULTIES.find((d) => d.key === cmd.difficulty)?.border} border`}>
                    <Terminal size={18} className={DIFFICULTIES.find((d) => d.key === cmd.difficulty)?.color} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{cmd.name}</p>
                    <code className="text-xs text-slate-500 font-mono">{cmd.syntax}</code>
                  </div>
                </div>
                <ChevronRight size={18} className={`text-slate-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </button>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-4 space-y-4">
                      <Section label="What it does" content={cmd.description} />
                      <Section label="When to use" content={cmd.whenToUse} />
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Example</p>
                        <pre className="bg-[#0a0e1a] rounded-lg p-3 text-xs font-mono text-cyber-glow border border-cyber-border/50">{cmd.example}</pre>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Expected Output</p>
                        <pre className="bg-[#0a0e1a] rounded-lg p-3 text-xs font-mono text-green-400/80 border border-cyber-border/50 whitespace-pre-wrap">{cmd.expectedOutput}</pre>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Important Options</p>
                        <div className="flex flex-wrap gap-2">
                          {cmd.options.map((opt, oi) => (
                            <span key={oi} className="px-2.5 py-1.5 rounded-lg bg-cyber-surface/40 border border-cyber-border text-[11px] text-slate-300 font-mono">{opt}</span>
                          ))}
                        </div>
                      </div>
                      <button onClick={() => navigate('/practical-lab')} className="flex items-center gap-2 text-sm font-bold text-cyber-glow hover:text-white transition-colors">
                        <Lightbulb size={15} /> Try in Practical Lab <ArrowRight size={14} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function Section({ label, content }: { label: string; content: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</p>
      <p className="text-sm text-slate-400 leading-relaxed">{content}</p>
    </div>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, CheckCircle2, XCircle, RotateCcw, Trophy, Plug, Split, Lock, Unlock, Shield, Radar, Swords, ShieldCheck, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LEARN_TOPICS, QUIZ_QUESTIONS, PORT_DATABASE, type QuizQuestion } from '@/data/ports';
import { useProgress } from '@/context/ProgressContext';

const ICON_MAP: Record<string, typeof Shield> = {
  plug: Plug, split: Split, lock: Lock, unlock: Unlock, shield: Shield, radar: Radar,
  swords: Swords, 'shield-check': ShieldCheck, 'book-open': BookOpen,
};

type Tab = 'concepts' | 'ports' | 'quiz';

export default function Learn() {
  const [tab, setTab] = useState<Tab>('concepts');
  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-extrabold text-white mb-1">Learn</h1><p className="text-sm text-slate-400">Networking concepts, port library, and interactive quizzes.</p></div>
      <div className="flex gap-2">
        {([['concepts', 'Concepts'], ['ports', 'Port Library'], ['quiz', 'Quiz']] as [Tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${tab === key ? 'gradient-primary text-white border-transparent' : 'bg-cyber-surface/50 text-slate-400 border-cyber-border hover:text-white'}`}>{label}</button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
          {tab === 'concepts' && <ConceptsTab />}
          {tab === 'ports' && <PortsTab />}
          {tab === 'quiz' && <QuizTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ConceptsTab() {
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      {LEARN_TOPICS.map((topic, i) => {
        const Icon = ICON_MAP[topic.icon] ?? Shield;
        const isOpen = expanded === topic.id;
        return (
          <motion.div key={topic.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card overflow-hidden">
            <button onClick={() => setExpanded(isOpen ? null : topic.id)} className="w-full p-4 flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-cyber-accent/15 flex items-center justify-center flex-shrink-0"><Icon size={20} className="text-cyber-accentGlow" /></div>
              <div className="flex-1 min-w-0"><p className="text-sm font-bold text-white">{topic.title}</p><p className="text-xs text-slate-400 truncate">{topic.summary}</p></div>
              <ChevronRight size={18} className={`text-slate-600 transition-transform flex-shrink-0 ${isOpen ? 'rotate-90' : ''}`} />
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <p className="text-sm text-slate-400 leading-relaxed px-4 pb-4 pl-17">{topic.body}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

function PortsTab() {
  const navigate = useNavigate();
  return (
    <div className="space-y-3">
      {PORT_DATABASE.map((port, i) => (
        <motion.button key={port.port} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={() => navigate(`/port/${port.port}`)} className="w-full glass-card p-4 flex items-center gap-3 text-left hover:border-cyber-glow/50 transition-colors">
          <div className="w-12 h-12 rounded-xl border border-cyber-border bg-cyber-surface/50 flex items-center justify-center flex-shrink-0"><span className="text-sm font-extrabold text-cyber-glow">{port.port}</span></div>
          <div className="flex-1 min-w-0 text-left"><p className="text-sm font-bold text-white">{port.service}</p><p className="text-xs text-slate-400 truncate">{port.description}</p></div>
          <ChevronRight size={18} className="text-slate-600 flex-shrink-0" />
        </motion.button>
      ))}
    </div>
  );
}

function QuizTab() {
  const { recordQuiz, unlockAchievement } = useProgress();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const current: QuizQuestion = QUIZ_QUESTIONS[currentIdx];
  const isLast = currentIdx === QUIZ_QUESTIONS.length - 1;
  const score = QUIZ_QUESTIONS.filter((q) => answers[q.id] === q.correctIndex).length;
  const perfect = score === QUIZ_QUESTIONS.length;

  const handleSubmit = () => { setSubmitted(true); recordQuiz(perfect); unlockAchievement('cyber-learner'); if (perfect) unlockAchievement('quiz-champion'); };
  const handleReset = () => { setAnswers({}); setSubmitted(false); setCurrentIdx(0); };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 text-center">
        <Trophy size={48} className="text-cyber-accentGlow mx-auto mb-4" />
        <h3 className="text-xl font-extrabold text-white mb-2">Quiz Complete!</h3>
        <p className="text-3xl font-extrabold gradient-text mb-1">{score} / {QUIZ_QUESTIONS.length}</p>
        <p className="text-sm text-slate-400 mb-6">{perfect ? 'Perfect score!' : score >= 6 ? 'Great job!' : 'Keep learning!'}</p>
        <div className="space-y-2 text-left mb-6">
          {QUIZ_QUESTIONS.map((q) => {
            const correct = answers[q.id] === q.correctIndex;
            return (
              <div key={q.id} className="flex items-start gap-2.5 bg-cyber-surface/30 rounded-lg p-3">
                {correct ? <CheckCircle2 size={16} className="text-cyber-successGlow flex-shrink-0 mt-0.5" /> : <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />}
                <div><p className="text-xs font-semibold text-white">{q.question}</p>{!correct && <p className="text-xs text-slate-500 mt-1">Correct: {q.options[q.correctIndex]}</p>}</div>
              </div>
            );
          })}
        </div>
        <button onClick={handleReset} className="flex items-center gap-2 gradient-primary text-white font-bold px-6 py-3 rounded-xl mx-auto"><RotateCcw size={16} /> Try Again</button>
      </motion.div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-1"><span className="text-sm font-bold text-white">Question {currentIdx + 1} of {QUIZ_QUESTIONS.length}</span><span className="text-xs text-slate-500">{Object.keys(answers).length} answered</span></div>
      <div className="h-1.5 bg-cyber-surface rounded-full mb-6 overflow-hidden"><div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${((currentIdx + 1) / QUIZ_QUESTIONS.length) * 100}%` }} /></div>
      <h3 className="text-base font-bold text-white mb-4">{current.question}</h3>
      <div className="space-y-2.5">
        {current.options.map((opt, i) => {
          const selected = answers[current.id] === i;
          return <button key={i} onClick={() => setAnswers({ ...answers, [current.id]: i })} className={`w-full text-left p-3.5 rounded-xl border text-sm font-medium transition-all ${selected ? 'gradient-primary text-white border-transparent' : 'bg-cyber-surface/30 text-slate-400 border-cyber-border hover:text-white hover:border-cyber-glow/30'}`}>{opt}</button>;
        })}
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))} disabled={currentIdx === 0} className="px-4 py-3 rounded-xl text-sm font-bold text-slate-400 border border-cyber-border disabled:opacity-40 hover:text-white transition-colors">Previous</button>
        {isLast ? (
          <button onClick={handleSubmit} disabled={Object.keys(answers).length < QUIZ_QUESTIONS.length} className="flex-1 gradient-primary text-white font-bold py-3 rounded-xl disabled:opacity-60 hover:opacity-90 transition-opacity">Submit Quiz</button>
        ) : (
          <button onClick={() => setCurrentIdx((i) => Math.min(QUIZ_QUESTIONS.length - 1, i + 1))} className="flex-1 gradient-primary text-white font-bold py-3 rounded-xl">Next</button>
        )}
      </div>
    </div>
  );
}

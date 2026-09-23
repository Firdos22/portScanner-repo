import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, CheckCircle2, XCircle, RotateCcw, Trophy, ChevronRight } from 'lucide-react';
import { NMAP_QUIZ, type NmapDifficulty, type NmapQuizQuestion } from '@/data/nmapCommands';
import { useProgress } from '@/context/ProgressContext';

const DIFFICULTIES: { key: NmapDifficulty | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'beginner', label: 'Beginner' },
  { key: 'intermediate', label: 'Intermediate' },
  { key: 'advanced', label: 'Advanced' },
];

export default function NmapQuiz() {
  const { recordQuiz } = useProgress();
  const [difficulty, setDifficulty] = useState<NmapDifficulty | 'all'>('all');
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<NmapQuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const startQuiz = () => {
    let pool = NMAP_QUIZ;
    if (difficulty !== 'all') pool = NMAP_QUIZ.filter((q) => q.difficulty === difficulty);
    setQuestions(pool);
    setCurrentIdx(0);
    setSelectedIdx(null);
    setShowAnswer(false);
    setScore(0);
    setFinished(false);
    setStarted(true);
  };

  const selectAnswer = (idx: number) => {
    if (showAnswer) return;
    setSelectedIdx(idx);
    setShowAnswer(true);
    if (idx === questions[currentIdx].correctIndex) setScore((s) => s + 1);
  };

  const nextQuestion = () => {
    if (currentIdx + 1 >= questions.length) {
      setFinished(true);
      const perfect = score === questions.length;
      recordQuiz(perfect);
    } else {
      setCurrentIdx((i) => i + 1);
      setSelectedIdx(null);
      setShowAnswer(false);
    }
  };

  const reset = () => { setStarted(false); setFinished(false); setQuestions([]); setCurrentIdx(0); setSelectedIdx(null); setShowAnswer(false); setScore(0); };

  if (!started) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white mb-1">Nmap Quiz</h1>
          <p className="text-sm text-slate-400">Test your nmap command knowledge. Choose a difficulty and start.</p>
        </div>
        <div className="flex gap-2">
          {DIFFICULTIES.map((d) => (
            <button key={d.key} onClick={() => setDifficulty(d.key)} className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${difficulty === d.key ? 'gradient-primary text-white border-transparent' : 'bg-cyber-surface/50 text-slate-400 border-cyber-border hover:text-white'}`}>{d.label}</button>
          ))}
        </div>
        <div className="glass-card p-6 flex flex-col items-center gap-4">
          <Brain size={48} className="text-cyber-glow" />
          <p className="text-sm text-slate-400 text-center">{difficulty === 'all' ? `${NMAP_QUIZ.length} questions` : `${NMAP_QUIZ.filter((q) => q.difficulty === difficulty).length} questions`} covering nmap commands, flags, and scanning techniques.</p>
          <button onClick={startQuiz} className="gradient-primary text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity">Start Quiz</button>
        </div>
      </div>
    );
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="space-y-5">
        <div className="glass-card p-8 flex flex-col items-center gap-4">
          <Trophy size={48} className={pct === 100 ? 'text-amber-400' : 'text-cyber-glow'} />
          <h2 className="text-xl font-bold text-white">Quiz Complete!</h2>
          <p className="text-3xl font-extrabold gradient-text">{score} / {questions.length}</p>
          <p className="text-sm text-slate-400">{pct}% correct{pct === 100 ? ' — Perfect score!' : ''}</p>
          <button onClick={reset} className="flex items-center gap-2 text-sm font-bold text-cyber-glow border border-cyber-border rounded-xl px-5 py-3 hover:bg-cyber-surface/30 transition-colors"><RotateCcw size={16} /> Try Again</button>
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Question {currentIdx + 1} / {questions.length}</h1>
        <span className="text-sm font-bold text-cyber-glow">Score: {score}</span>
      </div>
      <div className="h-1.5 bg-cyber-surface rounded-full overflow-hidden"><div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} /></div>
      <AnimatePresence mode="wait">
        <motion.div key={currentIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-card p-5">
          <p className="text-base font-bold text-white mb-4">{q.question}</p>
          <div className="space-y-2">
            {q.options.map((opt, i) => {
              const isCorrect = i === q.correctIndex;
              const isSelected = i === selectedIdx;
              let cls = 'bg-cyber-surface/40 border-cyber-border text-slate-300 hover:border-cyber-glow/30';
              if (showAnswer && isCorrect) cls = 'bg-cyber-successGlow/15 border-cyber-successGlow text-cyber-successGlow';
              else if (showAnswer && isSelected && !isCorrect) cls = 'bg-red-500/15 border-red-500 text-red-400';
              return (
                <button key={i} onClick={() => selectAnswer(i)} disabled={showAnswer} className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${cls} ${!showAnswer ? 'hover:bg-cyber-surface/60' : ''}`}>
                  <span className="flex items-center justify-between">{opt}{showAnswer && isCorrect && <CheckCircle2 size={16} />}{showAnswer && isSelected && !isCorrect && <XCircle size={16} />}</span>
                </button>
              );
            })}
          </div>
          {showAnswer && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 bg-cyber-surface/30 rounded-xl p-3">
              <p className="text-xs text-slate-400 leading-relaxed">{q.explanation}</p>
              <button onClick={nextQuestion} className="mt-3 flex items-center gap-1.5 text-sm font-bold text-cyber-glow hover:text-white transition-colors">
                {currentIdx + 1 >= questions.length ? 'See Results' : 'Next Question'} <ChevronRight size={16} />
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

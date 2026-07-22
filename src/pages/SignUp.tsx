import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, UserPlus, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { CyberBackground, AnimatedShield } from '@/components/CyberVisuals';

export default function SignUp() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    if (!email.trim() || !password) { setError('Please enter your email and a password.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const { error } = await signUp(email.trim(), password);
    setLoading(false);
    if (error) setError(error); else navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <CyberBackground />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 25 }} className="w-full max-w-md">
        <Link to="/login" className="flex items-center gap-2 text-slate-400 text-sm font-semibold mb-4 hover:text-slate-300"><ArrowLeft size={18} /> Back to sign in</Link>
        <div className="flex flex-col items-center gap-3 mb-8">
          <AnimatedShield size={72} />
          <h1 className="text-2xl font-extrabold text-white text-center">Create your account</h1>
          <p className="text-sm text-slate-400 text-center">Start scanning in seconds.</p>
        </div>
        <div className="glass-card p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2"><Mail size={16} className="text-cyber-glow" /> Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className="w-full bg-cyber-surface/50 border border-cyber-border rounded-xl px-4 py-3.5 text-white text-sm placeholder:text-slate-600 focus:border-cyber-glow transition-colors" />
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2"><Lock size={16} className="text-cyber-glow" /> Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete="new-password" className="w-full bg-cyber-surface/50 border border-cyber-border rounded-xl px-4 py-3.5 pr-12 text-white text-sm placeholder:text-slate-600 focus:border-cyber-glow transition-colors" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">{showPass ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2"><Lock size={16} className="text-cyber-glow" /> Confirm Password</label>
              <input type={showPass ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter password" autoComplete="new-password" className="w-full bg-cyber-surface/50 border border-cyber-border rounded-xl px-4 py-3.5 text-white text-sm placeholder:text-slate-600 focus:border-cyber-glow transition-colors" />
            </div>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0" /><p className="text-sm text-red-400 font-medium">{error}</p>
              </motion.div>
            )}
            <button type="submit" disabled={loading} className="w-full gradient-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90 transition-opacity">
              {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><UserPlus size={18} /> Create Account</>}
            </button>
          </form>
          <p className="text-center text-sm text-slate-400 mt-6">Already have an account? <Link to="/login" className="text-cyber-accentGlow font-bold hover:underline">Sign in</Link></p>
        </div>
      </motion.div>
    </div>
  );
}

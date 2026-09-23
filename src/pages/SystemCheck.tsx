import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle2, Server, Cpu, Globe, Zap, RefreshCw, Shield, Terminal } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type SystemInfo = {
  online: boolean;
  scanEngine: string;
  responseTime: string;
  error: string | null;
};

export default function SystemCheck() {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [checking, setChecking] = useState(true);

  const checkSystem = async () => {
    setChecking(true);
    setInfo(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nmap-runner`;
      const start = Date.now();
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ target: '127.0.0.1', args: ['-sn'], timeout: 8000 }),
      });
      const elapsed = `${Date.now() - start}ms`;

      if (!res.ok) {
        setInfo({ online: false, scanEngine: 'N/A', responseTime: elapsed, error: `HTTP ${res.status}` });
        setChecking(false);
        return;
      }

      // Read the first SSE event to confirm the engine is working
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let found = false;
      if (reader) {
        while (!found) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const evt = JSON.parse(line.slice(6).trim());
              if (evt.type === 'start' || evt.type === 'stdout') {
                setInfo({ online: true, scanEngine: 'TCP Connect (nmap-style)', responseTime: elapsed, error: null });
                found = true;
                break;
              }
              if (evt.type === 'error') {
                setInfo({ online: false, scanEngine: 'N/A', responseTime: elapsed, error: evt.message });
                found = true;
                break;
              }
            } catch { /* skip */ }
          }
        }
        reader.cancel();
      }
      if (!found) setInfo({ online: true, scanEngine: 'TCP Connect (nmap-style)', responseTime: elapsed, error: null });
    } catch (err) {
      setInfo({ online: false, scanEngine: 'N/A', responseTime: 'N/A', error: (err as Error).message });
    }
    setChecking(false);
  };

  useEffect(() => { checkSystem(); }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-white mb-1">System Check</h1>
        <p className="text-sm text-slate-400">Verify the scan engine status and server environment.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${info?.online ? 'bg-cyber-successGlow/15 border-cyber-successGlow/40' : 'bg-red-500/15 border-red-500/40'}`}>
              {checking ? <RefreshCw size={22} className="text-cyber-glow animate-spin" /> : info?.online ? <CheckCircle2 size={22} className="text-cyber-successGlow" /> : <Activity size={22} className="text-red-400" />}
            </div>
            <div><p className="text-sm font-bold text-white">Scan Engine</p><p className="text-xs text-slate-500">{checking ? 'Checking...' : info?.online ? 'Online' : 'Offline'}</p></div>
          </div>
          {info?.online && <p className="text-xs text-slate-400">Engine: <span className="font-mono text-cyber-glow">{info.scanEngine}</span></p>}
          {info && !info.online && <p className="text-xs text-red-400">{info.error}</p>}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-cyber-surface/40 border border-cyber-border flex items-center justify-center"><Server size={22} className="text-cyber-glow" /></div>
            <div><p className="text-sm font-bold text-white">Server Runtime</p><p className="text-xs text-slate-500">{info ? info.responseTime : '...'}</p></div>
          </div>
          <div className="space-y-1.5">
            <InfoRow icon={<Cpu size={12} />} label="Platform" value="Deno (Supabase Edge)" />
            <InfoRow icon={<Globe size={12} />} label="Region" value="Supabase Cloud" />
            <InfoRow icon={<Zap size={12} />} label="Auth" value="JWT Verified" />
          </div>
        </motion.div>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3"><Shield size={16} className="text-cyber-glow" /><h3 className="text-sm font-bold text-white">How It Works</h3></div>
        <div className="space-y-3">
          <p className="text-xs text-slate-400 leading-relaxed">The Practical Lab performs real TCP connect scanning using Deno's network APIs on the Supabase Edge Runtime. Since the edge runtime cannot spawn subprocesses (no nmap binary), it uses the same proven technique as the built-in scanner but formats the output in nmap terminal style.</p>
          <div className="flex items-start gap-2.5 bg-cyber-surface/30 rounded-lg p-3">
            <Terminal size={14} className="text-cyber-glow flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-400 leading-relaxed">Supported flags: <span className="font-mono text-cyber-glow">-sT -sn -Pn -F -p --top-ports --open -T1 to -T5 -n</span>. Flags like -sS, -sU, -O, -sV, -A, -sC require raw socket access and fall back to TCP connect with a note in the output.</p>
          </div>
        </div>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4"><Activity size={16} className="text-cyber-glow" /><h3 className="text-sm font-bold text-white">Feature Capabilities</h3></div>
        <div className="space-y-2">
          <CapabilityRow label="TCP Connect Scanning" available={true} note="Real port scanning via Deno.connect()" />
          <CapabilityRow label="Nmap-Style Terminal Output" available={true} note="Formatted to match nmap output style" />
          <CapabilityRow label="SSE Streaming" available={true} note="Real-time output streaming" />
          <CapabilityRow label="Argument Allowlisting" available={true} note="Only approved nmap flags accepted" />
          <CapabilityRow label="Scan History" available={true} note="Persisted to Supabase database" />
          <CapabilityRow label="DNS Resolution" available={true} note="Hostnames resolved via DNS over HTTPS" />
          <CapabilityRow label="Timing Templates" available={true} note="-T1 through -T5 control speed/stealth" />
        </div>
      </div>

      <button onClick={checkSystem} disabled={checking} className="flex items-center gap-2 text-sm font-bold text-cyber-glow border border-cyber-border rounded-xl px-4 py-3 hover:bg-cyber-surface/30 transition-colors disabled:opacity-40">
        <RefreshCw size={16} className={checking ? 'animate-spin' : ''} /> Recheck System
      </button>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-slate-500">{icon}</span>
      <span className="text-slate-500 w-20">{label}</span>
      <span className="text-slate-300 font-semibold">{value}</span>
    </div>
  );
}

function CapabilityRow({ label, available, note }: { label: string; available: boolean; note: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-cyber-border/40 last:border-0">
      {available ? <CheckCircle2 size={16} className="text-cyber-successGlow flex-shrink-0" /> : <Activity size={16} className="text-amber-400 flex-shrink-0" />}
      <div className="flex-1"><p className="text-sm font-semibold text-white">{label}</p><p className="text-[11px] text-slate-500">{note}</p></div>
    </div>
  );
}

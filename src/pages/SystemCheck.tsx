import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle2, XCircle, Server, Cpu, Globe, Zap, RefreshCw, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type SystemInfo = {
  nmapAvailable: boolean;
  nmapVersion: string;
  serverRuntime: string;
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
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ target: '127.0.0.1', args: ['-sn'], timeout: 10000 }),
      });
      if (!res.ok) {
        setInfo({ nmapAvailable: false, nmapVersion: '', serverRuntime: 'Supabase Edge', error: `HTTP ${res.status}` });
        setChecking(false);
        return;
      }
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
              if (evt.type === 'start') {
                // Read a bit more to get version info from stdout
              }
              if (evt.type === 'stdout' && evt.data && evt.data.includes('Nmap version')) {
                const versionMatch = evt.data.match(/Nmap version ([\d.]+)/);
                setInfo({ nmapAvailable: true, nmapVersion: versionMatch ? versionMatch[1] : 'Unknown', serverRuntime: 'Supabase Edge (Deno)', error: null });
                found = true;
                break;
              }
              if (evt.type === 'status' && evt.nmapAvailable === false) {
                setInfo({ nmapAvailable: false, nmapVersion: '', serverRuntime: 'Supabase Edge (Deno)', error: evt.message });
                found = true;
                break;
              }
              if (evt.type === 'complete') {
                if (evt.nmapAvailable) {
                  // Check raw output for version
                  const versionMatch = (evt.rawOutput || '').match(/Nmap version ([\d.]+)/);
                  setInfo({ nmapAvailable: true, nmapVersion: versionMatch ? versionMatch[1] : 'Installed', serverRuntime: 'Supabase Edge (Deno)', error: null });
                } else {
                  setInfo({ nmapAvailable: false, nmapVersion: '', serverRuntime: 'Supabase Edge (Deno)', error: 'Nmap binary not found on server' });
                }
                found = true;
                break;
              }
            } catch { /* skip */ }
          }
        }
        reader.cancel();
      }
      if (!found) setInfo({ nmapAvailable: false, nmapVersion: '', serverRuntime: 'Supabase Edge (Deno)', error: 'No response from server' });
    } catch (err) {
      setInfo({ nmapAvailable: false, nmapVersion: '', serverRuntime: 'Unknown', error: (err as Error).message });
    }
    setChecking(false);
  };

  useEffect(() => { checkSystem(); }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-white mb-1">System Check</h1>
        <p className="text-sm text-slate-400">Verify nmap availability and server environment status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nmap status */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${info?.nmapAvailable ? 'bg-cyber-successGlow/15 border-cyber-successGlow/40' : 'bg-red-500/15 border-red-500/40'}`}>
              {checking ? <RefreshCw size={22} className="text-cyber-glow animate-spin" /> : info?.nmapAvailable ? <CheckCircle2 size={22} className="text-cyber-successGlow" /> : <XCircle size={22} className="text-red-400" />}
            </div>
            <div><p className="text-sm font-bold text-white">Nmap Binary</p><p className="text-xs text-slate-500">{checking ? 'Checking...' : info?.nmapAvailable ? 'Available' : 'Not Available'}</p></div>
          </div>
          {info?.nmapAvailable && <p className="text-xs text-slate-400">Version: <span className="font-mono text-cyber-glow">{info.nmapVersion}</span></p>}
          {info && !info.nmapAvailable && <p className="text-xs text-red-400">{info.error}</p>}
        </motion.div>

        {/* Server runtime */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-cyber-surface/40 border border-cyber-border flex items-center justify-center"><Server size={22} className="text-cyber-glow" /></div>
            <div><p className="text-sm font-bold text-white">Server Runtime</p><p className="text-xs text-slate-500">{info?.serverRuntime || 'Detecting...'}</p></div>
          </div>
          <div className="space-y-1.5">
            <InfoRow icon={<Cpu size={12} />} label="Platform" value="Deno (Supabase Edge)" />
            <InfoRow icon={<Globe size={12} />} label="Region" value="Supabase Cloud" />
            <InfoRow icon={<Zap size={12} />} label="Auth" value="JWT Verified" />
          </div>
        </motion.div>
      </div>

      {/* Safety fallback notice */}
      {info && !info.nmapAvailable && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5 border-amber-500/40">
          <div className="flex items-start gap-3">
            <Shield size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-400 mb-1">Nmap Not Available</p>
              <p className="text-xs text-slate-400 leading-relaxed">The nmap binary is not installed on the server. The Practical Lab and Validate Against Nmap features cannot run real nmap scans. The built-in TCP Connect scanner (Scanner tab) still works independently. No fake results are shown — this is a safe fallback. If you want real nmap scanning, nmap must be installed on the server hosting the edge function.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Capabilities */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4"><Activity size={16} className="text-cyber-glow" /><h3 className="text-sm font-bold text-white">Feature Capabilities</h3></div>
        <div className="space-y-2">
          <CapabilityRow label="Built-in TCP Scanner" available={true} note="Real TCP connect scanning via Deno.connect()" />
          <CapabilityRow label="Nmap Execution" available={info?.nmapAvailable ?? false} note={info?.nmapAvailable ? 'Real nmap binary available' : 'Requires nmap on server'} />
          <CapabilityRow label="SSE Streaming" available={true} note="Real-time terminal output streaming" />
          <CapabilityRow label="Argument Allowlisting" available={true} note="Only approved nmap flags accepted" />
          <CapabilityRow label="Scan History" available={true} note="Persisted to Supabase database" />
          <CapabilityRow label="Quiz & Learning" available={true} note="20+ nmap commands, 15 quiz questions" />
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
      {available ? <CheckCircle2 size={16} className="text-cyber-successGlow flex-shrink-0" /> : <XCircle size={16} className="text-amber-400 flex-shrink-0" />}
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-[11px] text-slate-500">{note}</p>
      </div>
    </div>
  );
}

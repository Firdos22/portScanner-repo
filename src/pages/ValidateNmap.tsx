import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompare, Play, Square, AlertCircle, CheckCircle2, XCircle, MinusCircle, Shield, Server, Clock } from 'lucide-react';
import { performRealScan, validateHost, type ScanResult as ToolScanResult } from '@/utils/scanner';
import { runNmapScan, validateNmapTarget, type NmapScanResult } from '@/utils/nmapScanner';

type CompareEntry = {
  port: number;
  toolState: string;
  nmapState: string;
  toolService: string;
  nmapService: string;
  nmapVersion: string;
  status: 'match' | 'difference' | 'not-detected';
};

export default function ValidateNmap() {
  const [target, setTarget] = useState('scanme.nmap.org');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toolResult, setToolResult] = useState<ToolScanResult | null>(null);
  const [nmapResult, setNmapResult] = useState<NmapScanResult | null>(null);
  const [toolProgress, setToolProgress] = useState(0);
  const [nmapOutput, setNmapOutput] = useState('');
  const [comparison, setComparison] = useState<CompareEntry[] | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runBoth = useCallback(async () => {
    setError(null);
    if (!validateHost(target) || !validateNmapTarget(target)) {
      setError('Enter a valid IP or hostname (e.g. scanme.nmap.org).');
      return;
    }
    setScanning(true);
    setToolResult(null);
    setNmapResult(null);
    setNmapOutput('');
    setToolProgress(0);
    setComparison(null);
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    // Run tool scan
    const toolRes = await performRealScan(target, null, {
      onStart: (_h, total) => { setToolProgress(0); },
      onPort: (p) => { setToolProgress(Math.round((p.scanned / p.total) * 100)); },
      onComplete: (res) => { setToolResult(res); },
      onError: (msg) => { setError(`Tool scan error: ${msg}`); },
    }, signal);

    // Run nmap scan with -sT -F
    const nmapRes = await runNmapScan(target, ['-sT', '-F'], {
      onStart: (cmd) => { setNmapOutput(`$ ${cmd}\n`); },
      onOutput: (chunk) => { setNmapOutput((prev) => prev + chunk); },
      onComplete: (res) => { setNmapResult(res); },
      onError: (msg) => { setError(`Nmap error: ${msg}`); },
    }, signal);

    setScanning(false);

    if (toolRes && nmapRes) {
      setComparison(buildComparison(toolRes, nmapRes));
    }
  }, [target]);

  const handleStop = () => { abortRef.current?.abort(); setScanning(false); };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-white mb-1">Validate Against Nmap</h1>
        <p className="text-sm text-slate-400">Scan the same target with both the built-in tool and real nmap, then compare results.</p>
      </div>

      <div className="flex items-center gap-3 bg-cyber-surface/50 border border-cyber-border rounded-xl px-4 py-3.5">
        <Server size={18} className="text-cyber-glow flex-shrink-0" />
        <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="IP or hostname" className="flex-1 bg-transparent text-white text-base font-semibold placeholder:text-slate-600" onKeyDown={(e) => { if (e.key === 'Enter' && !scanning) runBoth(); }} />
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0" /><p className="text-sm text-red-400 font-medium">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3">
        {scanning ? (
          <button onClick={handleStop} className="flex-1 border border-red-500/40 text-red-400 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors">
            <Square size={18} /> Stop
          </button>
        ) : (
          <button onClick={runBoth} disabled={scanning} className="flex-1 gradient-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
            <Play size={18} /> Run Comparison
          </button>
        )}
      </div>

      {scanning && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3"><GitCompare size={16} className="text-cyber-glow" /><span className="text-sm font-bold text-white">Built-in Tool</span></div>
            <div className="h-2 bg-cyber-surface rounded-full overflow-hidden"><div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${toolProgress}%` }} /></div>
            <p className="text-xs text-slate-500 mt-2">{toolProgress}% complete</p>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3"><Server size={16} className="text-cyber-glow" /><span className="text-sm font-bold text-white">Nmap</span></div>
            <pre className="bg-[#0a0e1a] rounded-lg p-3 text-xs font-mono text-green-400/80 border border-cyber-border/50 max-h-[120px] overflow-auto whitespace-pre-wrap">{nmapOutput || 'Waiting...'}</pre>
          </div>
        </div>
      )}

      {comparison && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Matches" value={comparison.filter((c) => c.status === 'match').length} icon={<CheckCircle2 size={16} className="text-cyber-successGlow" />} color="text-cyber-successGlow" />
            <StatCard label="Differences" value={comparison.filter((c) => c.status === 'difference').length} icon={<XCircle size={16} className="text-red-400" />} color="text-red-400" />
            <StatCard label="Not Detected" value={comparison.filter((c) => c.status === 'not-detected').length} icon={<MinusCircle size={16} className="text-amber-400" />} color="text-amber-400" />
          </div>

          {toolResult && nmapResult && (
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card p-3 flex items-center gap-2"><Clock size={14} className="text-slate-500" /><span className="text-xs text-slate-400">Tool: {(toolResult.durationMs / 1000).toFixed(2)}s · {toolResult.openCount} open</span></div>
              <div className="glass-card p-3 flex items-center gap-2"><Clock size={14} className="text-slate-500" /><span className="text-xs text-slate-400">Nmap: {nmapResult.duration} · {nmapResult.hosts.reduce((a, h) => a + h.ports.filter((p) => p.state === 'open').length, 0)} open</span></div>
            </div>
          )}

          <div className="glass-card p-5">
            <h3 className="text-sm font-bold text-white mb-3">Port-by-Port Comparison</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-cyber-border">
                <span className="col-span-2">Port</span><span className="col-span-3">Tool State</span><span className="col-span-3">Nmap State</span><span className="col-span-2">Service</span><span className="col-span-2">Result</span>
              </div>
              {comparison.map((c, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 text-xs py-2 border-b border-cyber-border/40 items-center">
                  <span className="col-span-2 font-mono font-bold text-white">{c.port}</span>
                  <span className={`col-span-3 ${c.toolState === 'open' ? 'text-cyber-successGlow' : 'text-slate-500'}`}>{c.toolState}</span>
                  <span className={`col-span-3 ${c.nmapState === 'open' ? 'text-cyber-successGlow' : c.nmapState === 'closed' ? 'text-red-400' : c.nmapState === 'filtered' ? 'text-amber-400' : 'text-slate-600'}`}>{c.nmapState}</span>
                  <span className="col-span-2 text-slate-400 truncate">{c.nmapService || c.toolService}</span>
                  <span className="col-span-2">
                    {c.status === 'match' ? <span className="flex items-center gap-1 text-cyber-successGlow font-bold"><CheckCircle2 size={12} /> MATCH</span>
                      : c.status === 'difference' ? <span className="flex items-center gap-1 text-red-400 font-bold"><XCircle size={12} /> DIFF</span>
                      : <span className="flex items-center gap-1 text-amber-400 font-bold"><MinusCircle size={12} /> N/A</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {nmapResult && nmapResult.hosts.some((h) => h.os) && (
            <div className="glass-card p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">OS Detection (Nmap)</p>
              <p className="text-sm text-white">{nmapResult.hosts.map((h) => h.os).filter(Boolean).join(', ')}</p>
            </div>
          )}
        </motion.div>
      )}

      <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
        <Shield size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400 leading-relaxed">Only scan systems you own or have permission to test. The tool uses TCP connect scanning while nmap uses -sT -F for a fair comparison.</p>
      </div>
    </div>
  );
}

function buildComparison(tool: ToolScanResult, nmap: NmapScanResult): CompareEntry[] {
  const nmapPorts = new Map<number, { state: string; service: string; version: string }>();
  for (const host of nmap.hosts) {
    for (const p of host.ports) {
      nmapPorts.set(p.port, { state: p.state, service: p.service, version: p.version });
    }
  }
  const allPorts = new Set<number>([...tool.ports.map((p) => p.port), ...nmapPorts.keys()]);
  const entries: CompareEntry[] = [];
  for (const port of allPorts) {
    const toolPort = tool.ports.find((p) => p.port === port);
    const nmapPort = nmapPorts.get(port);
    const toolState = toolPort?.status ?? 'not-scanned';
    const nmapState = nmapPort?.state ?? 'not-scanned';
    let status: CompareEntry['status'] = 'not-detected';
    if (toolState === nmapState) status = 'match';
    else if (toolState !== 'not-scanned' && nmapState !== 'not-scanned') status = 'difference';
    entries.push({ port, toolState, nmapState, toolService: toolPort?.service ?? '', nmapService: nmapPort?.service ?? '', nmapVersion: nmapPort?.version ?? '', status });
  }
  return entries.sort((a, b) => a.port - b.port);
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="glass-card p-4 flex flex-col items-center gap-1.5">
      {icon}
      <span className={`text-2xl font-extrabold ${color}`}>{value}</span>
      <span className="text-[10px] font-semibold text-slate-400">{label}</span>
    </div>
  );
}

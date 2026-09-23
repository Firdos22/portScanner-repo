import { useCallback, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Play, Square, Copy, Download, AlertCircle, CheckCircle2, ChevronDown, X, Shield, Server, Clock, Hash } from 'lucide-react';
import {
  NMAP_FLAGS, NMAP_GROUPS, buildNmapCommand, runNmapScan, validateNmapTarget,
  type NmapScanResult, type NmapFlagOption,
} from '@/utils/nmapScanner';
import { downloadFile } from '@/utils/scanner';
import { supabase } from '@/lib/supabase';

const QUICK_TARGETS = [
  { label: 'scanme.nmap.org', value: 'scanme.nmap.org' },
  { label: 'Localhost', value: '127.0.0.1' },
  { label: 'Google DNS', value: '8.8.8.8' },
];

export default function PracticalLab() {
  const [target, setTarget] = useState('scanme.nmap.org');
  const [selectedFlags, setSelectedFlags] = useState<Map<string, string | null>>(new Map([['-sT', null], ['-F', null]]));
  const [scanning, setScanning] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState('');
  const [result, setResult] = useState<NmapScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showFlags, setShowFlags] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const command = useMemo(() => buildNmapCommand(target, selectedFlags), [target, selectedFlags]);

  const toggleFlag = (flag: NmapFlagOption) => {
    setSelectedFlags((prev) => {
      const next = new Map(prev);
      if (next.has(flag.flag)) next.delete(flag.flag);
      else next.set(flag.flag, flag.requiresValue ? flag.valuePlaceholder ?? '' : null);
      return next;
    });
  };

  const setFlagValue = (flag: string, value: string) => {
    setSelectedFlags((prev) => {
      const next = new Map(prev);
      next.set(flag, value);
      return next;
    });
  };

  const handleScan = useCallback(async () => {
    setError(null);
    if (!validateNmapTarget(target)) {
      setError('Enter a valid IP, hostname, or CIDR (e.g. 192.168.1.0/24)');
      return;
    }
    setScanning(true);
    setTerminalOutput('');
    setResult(null);
    abortRef.current = new AbortController();

    const args: string[] = [];
    for (const [flag, val] of selectedFlags) {
      const flagDef = NMAP_FLAGS.find((f) => f.flag === flag);
      if (flagDef?.requiresValue && val) args.push(`${flag}=${val}`);
      else if (flagDef?.requiresValue) args.push(flag);
      else args.push(flag);
    }

    await runNmapScan(target, args, {
      onStart: (cmd) => { setTerminalOutput(`$ ${cmd}\n`); },
      onOutput: (chunk) => { setTerminalOutput((prev) => prev + chunk); },
      onStderr: (chunk) => { setTerminalOutput((prev) => prev + `\x1b[33m${chunk}\x1b[0m`); },
      onComplete: (res) => {
        setResult(res);
        setScanning(false);
        if (res.nmapAvailable) {
          supabase.from('nmap_scan_history').insert({
            target: target.trim(), command: res.command, exit_code: res.exitCode,
            duration: res.duration, nmap_available: res.nmapAvailable,
            raw_output: res.rawOutput, hosts: res.hosts,
          }).then(({ error: dbErr }) => { if (dbErr) console.warn('Failed to save nmap scan history:', dbErr.message); });
        }
      },
      onError: (msg) => { setError(msg); setScanning(false); },
      onTimeout: (msg) => { setError(msg); setScanning(false); },
    }, abortRef.current.signal);
  }, [target, selectedFlags]);

  const handleStop = () => { abortRef.current?.abort(); setScanning(false); };

  const copyCommand = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportResult = () => {
    if (!result) return;
    const content = `NMAP SCAN RESULT\n${'='.repeat(50)}\n\nCommand: ${result.command}\nTarget: ${target}\nDuration: ${result.duration}\nExit Code: ${result.exitCode}\nNmap Available: ${result.nmapAvailable}\n\n--- RAW OUTPUT ---\n${result.rawOutput}\n\n--- PARSED HOSTS ---\n${JSON.stringify(result.hosts, null, 2)}\n`;
    downloadFile(content, `nmap-scan-${Date.now()}.txt`, 'text/plain');
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-white mb-1">Practical Lab</h1>
        <p className="text-sm text-slate-400">Build and run real nmap commands with live terminal output.</p>
      </div>

      {/* Target input */}
      <div className="flex items-center gap-3 bg-cyber-surface/50 border border-cyber-border rounded-xl px-4 py-3.5">
        <Server size={18} className="text-cyber-glow flex-shrink-0" />
        <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="IP / hostname / CIDR" className="flex-1 bg-transparent text-white text-base font-semibold tracking-wide placeholder:text-slate-600" onKeyDown={(e) => { if (e.key === 'Enter' && !scanning) handleScan(); }} />
        {target && !scanning && <button onClick={() => setTarget('')} className="text-slate-600 hover:text-slate-400"><X size={16} /></button>}
      </div>

      <div className="flex gap-2 flex-wrap">
        {QUICK_TARGETS.map((t) => (
          <button key={t.value} onClick={() => setTarget(t.value)} disabled={scanning} className="px-3 py-2 rounded-lg text-xs font-bold bg-cyber-surface/40 border border-cyber-border text-slate-400 hover:text-white hover:border-cyber-glow/30 transition-all disabled:opacity-40">{t.label}</button>
        ))}
      </div>

      {/* Command builder */}
      <div className="glass-card p-4">
        <button onClick={() => setShowFlags((v) => !v)} className="flex items-center justify-between w-full mb-3">
          <span className="text-sm font-bold text-white">Command Builder</span>
          <ChevronDown size={18} className={`text-slate-500 transition-transform ${showFlags ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {showFlags && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="space-y-4 pb-2">
                {NMAP_GROUPS.map((group) => (
                  <div key={group}>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{group}</p>
                    <div className="flex flex-wrap gap-2">
                      {NMAP_FLAGS.filter((f) => f.group === group).map((flag) => {
                        const isSelected = selectedFlags.has(flag.flag);
                        return (
                          <div key={flag.flag} className="flex items-center gap-1">
                            <button onClick={() => toggleFlag(flag)} title={flag.description} className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${isSelected ? 'gradient-primary text-white border-transparent' : 'bg-cyber-surface/40 text-slate-400 border-cyber-border hover:text-white hover:border-cyber-glow/30'}`}>
                              {flag.flag} <span className="opacity-60 ml-1">{flag.label}</span>
                            </button>
                            {isSelected && flag.requiresValue && (
                              <input value={selectedFlags.get(flag.flag) ?? ''} onChange={(e) => setFlagValue(flag.flag, e.target.value)} placeholder={flag.valuePlaceholder} className="w-20 bg-cyber-surface/60 border border-cyber-border rounded-lg px-2 py-1.5 text-xs text-white placeholder:text-slate-600" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Generated command */}
      <div className="glass-card p-4 flex items-center gap-3">
        <Terminal size={16} className="text-cyber-glow flex-shrink-0" />
        <code className="flex-1 text-sm font-mono text-cyber-glow truncate">{command}</code>
        <button onClick={copyCommand} title="Copy command" className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white px-3 py-2 rounded-lg border border-cyber-border hover:bg-cyber-surface/30 transition-colors">
          {copied ? <CheckCircle2 size={14} className="text-cyber-successGlow" /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0" /><p className="text-sm text-red-400 font-medium">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="flex gap-3">
        {scanning ? (
          <button onClick={handleStop} className="flex-1 border border-red-500/40 text-red-400 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors">
            <Square size={18} /> Stop Scan
          </button>
        ) : (
          <button onClick={handleScan} disabled={scanning} className="flex-1 gradient-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
            <Play size={18} /> Run Nmap
          </button>
        )}
        {result && !scanning && (
          <button onClick={exportResult} className="flex items-center gap-2 bg-cyber-surface/50 border border-cyber-border rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-400 hover:text-white transition-colors">
            <Download size={16} /> Export
          </button>
        )}
      </div>

      {/* Terminal output */}
      {(terminalOutput || scanning) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl overflow-hidden border border-cyber-border">
          <div className="flex items-center gap-2 bg-cyber-surface/80 px-4 py-2.5 border-b border-cyber-border">
            <div className="flex gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500/60" /><span className="w-3 h-3 rounded-full bg-yellow-500/60" /><span className="w-3 h-3 rounded-full bg-green-500/60" /></div>
            <span className="text-xs font-mono text-slate-500 ml-2">nmap terminal</span>
            {scanning && <span className="w-3 h-3 border-2 border-cyber-glow border-t-transparent rounded-full animate-spin ml-auto" />}
          </div>
          <pre className="bg-[#0a0e1a] p-4 text-xs font-mono text-green-400/90 max-h-[400px] overflow-auto whitespace-pre-wrap">{terminalOutput}<span className={`inline-block w-2 h-4 ${scanning ? 'bg-green-400 animate-pulse' : ''}`} /></pre>
        </motion.div>
      )}

      {/* Parsed results */}
      {result && !scanning && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyber-surface/50 border border-cyber-border">
              <Hash size={14} className="text-slate-500" />
              <span className="text-xs font-bold text-slate-400">Exit Code: <span className={result.exitCode === 0 ? 'text-cyber-successGlow' : 'text-red-400'}>{result.exitCode}</span></span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyber-surface/50 border border-cyber-border">
              <Clock size={14} className="text-slate-500" />
              <span className="text-xs font-bold text-slate-400">Duration: <span className="text-white">{result.duration}</span></span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyber-surface/50 border border-cyber-border">
              <Server size={14} className="text-slate-500" />
              <span className="text-xs font-bold text-slate-400">Hosts: <span className="text-white">{result.hosts.length}</span></span>
            </div>
          </div>

          {result.hosts.map((host, hi) => (
            <div key={hi} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div><p className="text-lg font-bold text-white">{host.host || host.ip}</p><p className="text-xs text-slate-500 mt-0.5">{host.ip}</p></div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${host.state === 'up' ? 'bg-cyber-successGlow/20 text-cyber-successGlow' : 'bg-red-500/20 text-red-400'}`}>{host.state.toUpperCase()}</span>
              </div>
              {host.os && <p className="text-xs text-slate-400 mb-3">OS: {host.os}</p>}
              {host.ports.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-cyber-border">
                    <span className="col-span-2">Port</span><span className="col-span-2">Proto</span><span className="col-span-2">State</span><span className="col-span-3">Service</span><span className="col-span-3">Version</span>
                  </div>
                  {host.ports.map((p, pi) => (
                    <div key={pi} className="grid grid-cols-12 gap-2 text-xs py-2 border-b border-cyber-border/40">
                      <span className="col-span-2 font-mono font-bold text-white">{p.port}</span>
                      <span className="col-span-2 text-slate-400">{p.protocol}</span>
                      <span className={`col-span-2 font-bold ${p.state === 'open' ? 'text-cyber-successGlow' : p.state === 'closed' ? 'text-red-400' : 'text-amber-400'}`}>{p.state}</span>
                      <span className="col-span-3 text-slate-300">{p.service}</span>
                      <span className="col-span-3 text-slate-500 truncate">{p.version}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-500 py-2">No ports detected.</p>}
            </div>
          ))}
        </motion.div>
      )}

      {/* Authorization warning */}
      <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
        <Shield size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400 leading-relaxed">Only scan systems you own or have explicit written permission to test. Unauthorized scanning may be illegal. This tool enforces argument allowlisting to prevent arbitrary command execution.</p>
      </div>
    </div>
  );
}

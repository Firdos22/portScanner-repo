import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, Eraser, Search, X, AlertCircle, RefreshCw, CheckCircle2, Zap, Shield, Globe, Download } from 'lucide-react';
import { RadarSweep } from '@/components/CyberVisuals';
import { PortCard } from '@/components/PortCard';
import { useProgress } from '@/context/ProgressContext';
import {
  validateHost, performRealScan, filterPorts, sortPorts, searchPorts,
  formatDuration, getReportContent, getReportMimeType, getReportFileExtension,
  downloadFile, type ReportFormat,
  type ScanResult, type ScannedPort, type ScanProgress, type FilterType,
} from '@/utils/scanner';

const QUICK_TARGETS = [
  { label: 'Localhost', host: '127.0.0.1' },
  { label: 'Google DNS', host: '8.8.8.8' },
  { label: 'Cloudflare', host: '1.1.1.1' },
];

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' }, { key: 'open', label: 'Open' }, { key: 'closed', label: 'Closed' },
];

export default function Scanner() {
  const navigate = useNavigate();
  const { progress, recordScan, recordViewedPort } = useProgress();
  const [host, setHost] = useState('127.0.0.1');
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scannedCount, setScannedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [livePorts, setLivePorts] = useState<ScannedPort[]>([]);
  const [result, setResult] = useState<ScanResult | null>(progress.lastScan);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [reportFormat, setReportFormat] = useState<ReportFormat | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const visiblePorts = useMemo(() => {
    if (!result) return [];
    return sortPorts(filterPorts(filter, searchPorts(query, result.ports)));
  }, [result, query, filter]);

  const handleScan = useCallback(async () => {
    setError(null);
    if (!validateHost(host)) { setError('Enter a valid IP address or hostname (e.g. 127.0.0.1 or scanme.nmap.org)'); return; }
    setScanning(true); setScannedCount(0); setTotalCount(0); setLivePorts([]); setResult(null);
    abortRef.current = new AbortController();

    const res = await performRealScan(host, null, {
      onStart: (_h, total) => setTotalCount(total),
      onPort: (p: ScanProgress) => {
        setScannedCount(p.scanned);
        setLivePorts((prev) => [...prev, { port: p.port, status: p.status, service: p.service }]);
      },
      onComplete: (finalResult: ScanResult) => { setResult(finalResult); setLivePorts([]); recordScan(finalResult); },
      onError: (msg: string) => { setError(msg); },
    }, abortRef.current.signal);

    setScanning(false);
    void res;
  }, [host, recordScan]);

  const handleStop = () => { abortRef.current?.abort(); setScanning(false); };
  const clearAll = () => { setHost(''); setError(null); setResult(null); setQuery(''); setFilter('all'); setLivePorts([]); };
  const openPort = (port: number) => { recordViewedPort(port); navigate(`/port/${port}`); };
  const progressPct = totalCount > 0 ? Math.round((scannedCount / totalCount) * 100) : 0;

  const downloadFullReport = (format: ReportFormat) => {
    if (!result) return;
    const content = getReportContent(result, format);
    const safeHost = result.host.replace(/[^a-zA-Z0-9]/g, '-');
    downloadFile(content, `scan-report-${safeHost}.${getReportFileExtension(format)}`, getReportMimeType(format));
    setReportFormat(format);
    setTimeout(() => setReportFormat(null), 2000);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-white mb-1">Real-Time Scanner</h1>
        <p className="text-sm text-slate-400">Enter a host to perform a real TCP connect scan.</p>
      </div>

      <div className={`flex items-center gap-3 bg-cyber-surface/50 border rounded-xl px-4 py-3.5 ${error ? 'border-red-500/50' : 'border-cyber-border'}`}>
        <Globe size={18} className="text-cyber-glow flex-shrink-0" />
        <input value={host} onChange={(e) => setHost(e.target.value)} placeholder="127.0.0.1 or scanme.nmap.org" className="flex-1 bg-transparent text-white text-base font-semibold tracking-wide placeholder:text-slate-600" onKeyDown={(e) => { if (e.key === 'Enter' && !scanning) handleScan(); }} />
        {host && !scanning && <button onClick={() => setHost('')} className="text-slate-600 hover:text-slate-400"><X size={16} /></button>}
      </div>

      <div className="flex gap-2 flex-wrap">
        {QUICK_TARGETS.map((t) => (
          <button key={t.host} onClick={() => setHost(t.host)} disabled={scanning} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-cyber-surface/40 border border-cyber-border text-slate-400 hover:text-white hover:border-cyber-glow/30 transition-all disabled:opacity-40">
            <Zap size={12} className="text-cyber-accentGlow" /> {t.label}
          </button>
        ))}
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
            <span className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> Stop Scan
          </button>
        ) : (
          <button onClick={handleScan} className="flex-1 gradient-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
            <Radar size={18} /> Start Scan
          </button>
        )}
        <button onClick={clearAll} disabled={scanning} className="flex items-center gap-2 bg-cyber-surface/50 border border-cyber-border rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-400 hover:text-white transition-colors disabled:opacity-40">
          <Eraser size={16} /> Clear
        </button>
      </div>

      <AnimatePresence>
        {scanning && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-card p-6 flex flex-col items-center gap-6">
            <RadarSweep size={180} />
            <div className="w-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white">Scanning {host}</span>
                <span className="text-sm font-bold text-cyber-accentGlow">{scannedCount} / {totalCount}</span>
              </div>
              <div className="h-2 bg-cyber-surface rounded-full overflow-hidden">
                <motion.div className="h-full gradient-primary rounded-full" animate={{ width: `${progressPct}%` }} transition={{ ease: 'linear' }} />
              </div>
              <p className="text-xs text-slate-500 mt-2 text-center">{progressPct}% complete</p>
            </div>
            {livePorts.length > 0 && (
              <div className="w-full max-h-[200px] overflow-auto space-y-1">
                {livePorts.slice(-6).map((p, i) => (
                  <motion.div key={`${p.port}-${i}`} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 text-xs px-3 py-2 bg-cyber-surface/30 rounded-lg">
                    {p.status === 'open' ? <CheckCircle2 size={14} className="text-cyber-successGlow flex-shrink-0" /> : <X size={14} className="text-red-400 flex-shrink-0" />}
                    <span className="font-mono font-bold text-white">{p.port}</span>
                    <span className="text-slate-400">{p.service}</span>
                    <span className={`ml-auto font-bold ${p.status === 'open' ? 'text-cyber-successGlow' : 'text-red-400'}`}>{p.status.toUpperCase()}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {result && !scanning && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Results · {result.host}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{result.openCount} open · {result.closedCount} closed · {formatDuration(result.durationMs)}</p>
            </div>
            <div className="flex items-center gap-2">
              {(['text', 'json', 'csv'] as ReportFormat[]).map((fmt) => (
                <button key={fmt} onClick={() => downloadFullReport(fmt)} className={`flex items-center gap-1.5 text-xs font-bold border rounded-lg px-3 py-2 transition-all ${reportFormat === fmt ? 'border-cyber-successGlow/50 text-cyber-successGlow bg-cyber-success/10' : 'border-cyber-border text-slate-400 hover:text-white hover:border-cyber-glow/30'}`}>
                  <Download size={13} /> {reportFormat === fmt ? 'Done' : fmt.toUpperCase()}
                </button>
              ))}
              <button onClick={handleScan} className="flex items-center gap-1.5 text-sm font-bold text-cyber-glow border border-cyber-border rounded-xl px-3.5 py-2 hover:bg-cyber-surface/30 transition-colors"><RefreshCw size={14} /> Rescan</button>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-cyber-surface/50 border border-cyber-border rounded-xl px-4 py-3 mb-4">
            <Search size={16} className="text-slate-600 flex-shrink-0" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search port or service…" className="flex-1 bg-transparent text-white text-sm placeholder:text-slate-600" />
            {query && <button onClick={() => setQuery('')} className="text-slate-600 hover:text-slate-400"><X size={14} /></button>}
          </div>
          <div className="flex gap-2 mb-4">
            {FILTERS.map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)} className={`px-3.5 py-2 rounded-full text-xs font-bold border transition-all ${filter === f.key ? 'gradient-primary text-white border-transparent' : 'bg-cyber-surface/50 text-slate-400 border-cyber-border hover:text-white'}`}>{f.label}</button>
            ))}
          </div>
          <div>
            {visiblePorts.length === 0 ? (
              <div className="py-12 text-center"><p className="text-sm text-slate-600">No ports match your search or filter.</p></div>
            ) : (
              visiblePorts.map((port, index) => (
                <PortCard key={port.port} port={port} index={index} host={result.host} scanTimestamp={result.timestamp} onClick={() => openPort(port.port)} />
              ))
            )}
          </div>
        </motion.div>
      )}

      {!result && !scanning && (
        <div className="border border-dashed border-cyber-border rounded-2xl py-14 flex flex-col items-center gap-3">
          <Radar size={40} className="text-slate-600" />
          <p className="text-sm text-slate-600">Enter a host and start a real scan.</p>
        </div>
      )}

      <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mt-4">
        <Shield size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400 leading-relaxed">This tool performs real TCP connect scanning. Only scan hosts you own or have explicit permission to test. Each port result has its own download button for individual reports.</p>
      </div>
    </div>
  );
}

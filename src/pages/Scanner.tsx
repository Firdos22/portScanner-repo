import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, Eraser, ClipboardPaste, Search, X, AlertCircle, RefreshCw, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { RadarSweep } from '@/components/CyberVisuals';
import { PortCard } from '@/components/PortCard';
import { useProgress } from '@/context/ProgressContext';
import { validateIPAddress, simulateScan, searchPorts, filterPorts, sortPorts, type ScanResult, type FilterType } from '@/utils/scanner';

const SCAN_STEPS = ['Initializing Scanner…', 'Checking Target…', 'Scanning Ports…', 'Analyzing Services…', 'Generating Report…'];
const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' }, { key: 'open', label: 'Open' }, { key: 'closed', label: 'Closed' },
  { key: 'tcp', label: 'TCP' }, { key: 'udp', label: 'UDP' }, { key: 'favorites', label: 'Favorites' },
];

export default function Scanner() {
  const navigate = useNavigate();
  const { progress, toggleFavorite, recordScan, recordViewedPort } = useProgress();
  const [ip, setIp] = useState('192.168.1.10');
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(progress.lastScan);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const favorites = useMemo(() => new Set(progress.favorites), [progress.favorites]);
  const visiblePorts = useMemo(() => {
    if (!result) return [];
    return sortPorts(filterPorts(filter, searchPorts(query, result.ports), favorites));
  }, [result, query, filter, favorites]);

  const startScan = async () => {
    setError(null);
    if (!validateIPAddress(ip)) { setError('Enter a valid IPv4 address, e.g. 192.168.1.10'); return; }
    setScanning(true); setStepIndex(0); setResult(null);
    const stepTimer = setInterval(() => setStepIndex((i) => Math.min(i + 1, SCAN_STEPS.length - 1)), 440);
    const res = await simulateScan(ip);
    clearInterval(stepTimer); setStepIndex(SCAN_STEPS.length - 1); setScanning(false);
    setResult(res); recordScan(res);
  };

  const clearAll = () => { setIp(''); setError(null); setResult(null); setQuery(''); setFilter('all'); };
  const pasteIP = () => { setIp('192.168.1.10'); };
  const openPort = (port: number) => { recordViewedPort(port); navigate(`/port/${port}`); };

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-extrabold text-white mb-1">Scanner</h1><p className="text-sm text-slate-400">Enter a target IP to simulate a port scan.</p></div>
      <div className={`flex items-center gap-3 bg-cyber-surface/50 border rounded-xl px-4 py-3.5 ${error ? 'border-red-500/50' : 'border-cyber-border'}`}>
        <Radar size={18} className="text-cyber-glow flex-shrink-0" />
        <input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="192.168.1.10" inputMode="decimal" className="flex-1 bg-transparent text-white text-base font-semibold tracking-wide placeholder:text-slate-600" />
        {ip && <button onClick={() => setIp('')} className="text-slate-600 hover:text-slate-400"><X size={16} /></button>}
      </div>
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0" /><p className="text-sm text-red-400 font-medium">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex gap-3">
        <button onClick={startScan} disabled={scanning} className="flex-1 gradient-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90 transition-opacity">
          {scanning ? <Loader2 size={18} className="animate-spin" /> : <Radar size={18} />}{scanning ? 'Scanning…' : 'Scan'}
        </button>
        <button onClick={clearAll} className="flex items-center gap-2 bg-cyber-surface/50 border border-cyber-border rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-400 hover:text-white transition-colors"><Eraser size={16} /> Clear</button>
        <button onClick={pasteIP} className="flex items-center gap-2 bg-cyber-surface/50 border border-cyber-border rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-400 hover:text-white transition-colors"><ClipboardPaste size={16} /> Paste</button>
      </div>
      <AnimatePresence>
        {scanning && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-card p-6 flex flex-col items-center gap-6">
            <RadarSweep size={200} />
            <div className="w-full space-y-3">
              {SCAN_STEPS.map((s, i) => (
                <div key={s} className={`flex items-center gap-3 transition-opacity ${i <= stepIndex ? 'opacity-100' : 'opacity-40'}`}>
                  {i < stepIndex ? <CheckCircle2 size={18} className="text-cyber-successGlow flex-shrink-0" /> : i === stepIndex ? <Loader2 size={18} className="text-cyber-accentGlow animate-spin flex-shrink-0" /> : <Circle size={18} className="text-slate-600 flex-shrink-0" />}
                  <span className={`text-sm font-semibold ${i <= stepIndex ? 'text-white' : 'text-slate-600'}`}>{s}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 font-semibold">Target: {ip}</p>
          </motion.div>
        )}
      </AnimatePresence>
      {result && !scanning && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Results · {result.ip}</h2>
            <button onClick={startScan} className="flex items-center gap-1.5 text-sm font-bold text-cyber-glow border border-cyber-border rounded-xl px-3.5 py-2 hover:bg-cyber-surface/30 transition-colors"><RefreshCw size={14} /> Rescan</button>
          </div>
          <div className="flex items-center gap-3 bg-cyber-surface/50 border border-cyber-border rounded-xl px-4 py-3 mb-4">
            <Search size={16} className="text-slate-600 flex-shrink-0" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search port, service, protocol…" className="flex-1 bg-transparent text-white text-sm placeholder:text-slate-600" />
            {query && <button onClick={() => setQuery('')} className="text-slate-600 hover:text-slate-400"><X size={14} /></button>}
          </div>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {FILTERS.map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)} className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${filter === f.key ? 'gradient-primary text-white border-transparent' : 'bg-cyber-surface/50 text-slate-400 border-cyber-border hover:text-white'}`}>{f.label}</button>
            ))}
          </div>
          <div>
            {visiblePorts.length === 0 ? (
              <div className="py-12 text-center"><p className="text-sm text-slate-600">No ports match your search or filter.</p></div>
            ) : (
              visiblePorts.map((port, index) => (
                <PortCard key={port.port} port={port} index={index} isFavorite={favorites.has(port.port)} onClick={() => openPort(port.port)} onToggleFavorite={() => toggleFavorite(port.port)} />
              ))
            )}
          </div>
        </motion.div>
      )}
      {!result && !scanning && (
        <div className="border border-dashed border-cyber-border rounded-2xl py-14 flex flex-col items-center gap-3">
          <Radar size={40} className="text-slate-600" /><p className="text-sm text-slate-600">Run a scan to see simulated results.</p>
        </div>
      )}
    </div>
  );
}

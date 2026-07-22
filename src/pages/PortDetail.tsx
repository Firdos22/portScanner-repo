import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Shield, AlertTriangle, Lightbulb, BookOpen, Target, Zap } from 'lucide-react';
import { getPortInfo } from '@/data/ports';
import { useProgress } from '@/context/ProgressContext';
import {
  downloadFile, getReportMimeType, getReportFileExtension,
  getPortReportContent, type ScannedPort, type ReportFormat,
} from '@/utils/scanner';
import { useState } from 'react';

export default function PortDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { progress, recordViewedPort } = useProgress();
  const [downloading, setDownloading] = useState<string | null>(null);
  const portNum = Number(id);
  const port = getPortInfo(portNum);

  useEffect(() => { if (port) recordViewedPort(port.port); }, [port, recordViewedPort]);

  if (!port) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center"><p className="text-lg font-bold text-white mb-2">Port not found in database</p><p className="text-sm text-slate-400 mb-4">Port {id} was scanned but is not in our educational database.</p><button onClick={() => navigate('/scanner')} className="text-cyber-glow font-bold text-sm">Back to Scanner</button></div>
      </div>
    );
  }

  const glow = port.status === 'open' ? '#34D399' : '#F87171';
  const lastScan = progress.lastScan;
  const scannedPort: ScannedPort | null = lastScan?.ports.find((p) => p.port === portNum) ?? null;
  const host = lastScan?.host ?? 'unknown';
  const scanTimestamp = lastScan?.timestamp ?? Date.now();

  const handleDownload = (format: ReportFormat) => {
    if (!scannedPort) return;
    const content = getPortReportContent(scannedPort, host, scanTimestamp, format);
    const safeHost = host.replace(/[^a-zA-Z0-9]/g, '-');
    const filename = `port-${portNum}-${safeHost}.${getReportFileExtension(format)}`;
    downloadFile(content, filename, getReportMimeType(format));
    setDownloading(format);
    setTimeout(() => setDownloading(null), 2000);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 text-sm font-semibold mb-6 hover:text-white transition-colors"><ArrowLeft size={20} /> Back</button>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mb-4" style={{ borderColor: `${glow}33` }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl border flex items-center justify-center flex-shrink-0" style={{ borderColor: `${glow}44`, backgroundColor: `${glow}12` }}><span className="text-xl font-extrabold" style={{ color: glow }}>{port.port}</span></div>
            <div><h1 className="text-2xl font-extrabold text-white">{port.service}</h1><p className="text-sm text-slate-400 mt-1">TCP · Port {port.port}</p></div>
          </div>
          {scannedPort && (
            <div className="flex flex-col gap-1.5">
              {(['text', 'json', 'csv'] as ReportFormat[]).map((fmt) => (
                <button key={fmt} onClick={() => handleDownload(fmt)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${downloading === fmt ? 'border-cyber-successGlow/50 text-cyber-successGlow bg-cyber-success/10' : 'border-cyber-border text-slate-400 hover:text-white hover:border-cyber-glow/30'}`}>
                  <Download size={11} /> {downloading === fmt ? 'Done' : fmt.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="text-sm text-slate-400 mt-4 leading-relaxed">{port.description}</p>
        {scannedPort && <p className="text-xs text-cyber-accentGlow font-bold mt-2">Last scanned on {host} — Status: {scannedPort.status.toUpperCase()}</p>}
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 mb-4">
        <SectionTitle icon={<Target size={18} className="text-cyber-accentGlow" />} title="Purpose" />
        <p className="text-sm text-slate-400 leading-relaxed">{port.purpose}</p>
        <SectionTitle icon={<Zap size={18} className="text-cyber-accentGlow" />} title="Common Uses" />
        <ul className="space-y-1.5">{port.commonUses.map((u, i) => <li key={i} className="text-sm text-slate-400 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-cyber-glow flex-shrink-0" />{u}</li>)}</ul>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5 mb-4" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
        <SectionTitle icon={<AlertTriangle size={18} className="text-red-400" />} title="Security Risks" />
        <ul className="space-y-2">{port.securityRisks.map((r, i) => <li key={i} className="text-sm text-slate-400 flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-1.5" />{r}</li>)}</ul>
        <SectionTitle icon={<Shield size={18} className="text-red-400" />} title="Attack Examples" />
        <ul className="space-y-2">{port.attackExamples.map((a, i) => <li key={i} className="text-sm text-slate-400 flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-1.5" />{a}</li>)}</ul>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5 mb-4" style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }}>
        <SectionTitle icon={<Lightbulb size={18} className="text-cyber-successGlow" />} title="Best Practices" />
        <ul className="space-y-2">{port.bestPractices.map((b, i) => <li key={i} className="text-sm text-slate-400 flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-cyber-successGlow flex-shrink-0 mt-1.5" />{b}</li>)}</ul>
        <div className="mt-4 bg-cyber-success/10 border border-cyber-success/20 rounded-xl p-4"><p className="text-xs font-bold text-cyber-successGlow mb-1">RECOMMENDATION</p><p className="text-sm text-slate-300 leading-relaxed">{port.recommendations}</p></div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5">
        <SectionTitle icon={<BookOpen size={18} className="text-cyber-accentGlow" />} title="Educational Notes" />
        <p className="text-sm text-slate-400 leading-relaxed">{port.educationalNotes}</p>
      </motion.div>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return <div className="flex items-center gap-2 mb-3 mt-4 first:mt-0">{icon}<h2 className="text-sm font-bold text-white">{title}</h2></div>;
}

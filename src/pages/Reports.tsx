import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, FileJson, FileSpreadsheet, Share2, Download, CheckCircle2, Copy } from 'lucide-react';
import { useProgress } from '@/context/ProgressContext';
import {
  getReportContent, getReportMimeType, getReportFileExtension, downloadFile,
  calculateStatistics, type ReportFormat,
} from '@/utils/scanner';

const FORMAT_OPTIONS: { key: ReportFormat; label: string; icon: typeof FileText; desc: string }[] = [
  { key: 'text', label: 'Text', icon: FileText, desc: 'Human-readable plain text' },
  { key: 'json', label: 'JSON', icon: FileJson, desc: 'Structured data for APIs' },
  { key: 'csv', label: 'CSV', icon: FileSpreadsheet, desc: 'Spreadsheet-compatible' },
];

export default function Reports() {
  const navigate = useNavigate();
  const { progress, recordReport } = useProgress();
  const last = progress.lastScan;
  const [format, setFormat] = useState<ReportFormat>('text');
  const [downloaded, setDownloaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const stats = last ? calculateStatistics(last) : null;
  const content = last ? getReportContent(last, format) : '';

  const safeIp = last ? last.ip.replace(/\./g, '-') : 'scan';

  const handleDownload = () => {
    if (!last) return;
    const filename = `scan-report-${safeIp}.${getReportFileExtension(format)}`;
    downloadFile(content, filename, getReportMimeType(format));
    recordReport();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  const handleShare = async () => {
    if (!last) return;
    try {
      if (navigator.share) {
        await navigator.share({ text: content, title: 'Port Scanner Dashboard Report' });
      } else {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
      recordReport();
    } catch { /* user cancelled */ }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 text-sm font-semibold mb-6 hover:text-white transition-colors"><ArrowLeft size={20} /> Back</button>

      <h1 className="text-2xl font-extrabold text-white mb-1">Reports</h1>
      <p className="text-sm text-slate-400 mb-6">{last ? `Target ${last.ip}` : 'Run a scan first to generate a report.'}</p>

      {!last ? (
        <div className="border border-dashed border-cyber-border rounded-2xl py-14 flex flex-col items-center gap-3">
          <FileText size={40} className="text-slate-600" />
          <p className="text-sm text-slate-600">Run a scan first to generate a report.</p>
        </div>
      ) : (
        <>
          {stats && (
            <div className="glass-card p-5 mb-4">
              <h2 className="text-base font-bold text-white mb-4">Scan Summary</h2>
              <div className="grid grid-cols-3 gap-4">
                {[{ label: 'Target', value: stats.ip }, { label: 'Total', value: String(stats.total) }, { label: 'Open', value: String(stats.open) }, { label: 'Closed', value: String(stats.closed) }, { label: 'TCP', value: String(stats.tcp) }, { label: 'UDP', value: String(stats.udp) }].map((s) => (
                  <div key={s.label}><p className="text-xs font-semibold text-slate-500">{s.label}</p><p className="text-base font-extrabold text-white mt-1">{s.value}</p></div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs font-extrabold tracking-widest text-slate-500 mb-3">DOWNLOAD FORMAT</p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {FORMAT_OPTIONS.map((opt) => {
              const active = format === opt.key;
              return (
                <button key={opt.key} onClick={() => setFormat(opt.key)} className={`glass-card p-4 flex flex-col items-center gap-2 transition-all ${active ? 'border-cyber-glow/50 glow-primary' : 'hover:border-cyber-glow/30'}`}>
                  <opt.icon size={24} className={active ? 'text-cyber-glow' : 'text-slate-500'} />
                  <span className={`text-sm font-bold ${active ? 'text-white' : 'text-slate-400'}`}>{opt.label}</span>
                  <span className="text-[10px] text-slate-600 text-center">{opt.desc}</span>
                </button>
              );
            })}
          </div>

          <div className="glass-card p-4 mb-4 max-h-[400px] overflow-auto">
            <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap leading-relaxed">{content}</pre>
          </div>

          <div className="flex gap-3 mb-4">
            <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-2 gradient-primary text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity">
              {downloaded ? <><CheckCircle2 size={18} /> Downloaded!</> : <><Download size={18} /> Download {format.toUpperCase()}</>}
            </button>
            <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-2 border border-cyber-border rounded-xl py-3.5 text-sm font-bold text-cyber-glow hover:bg-cyber-surface/30 transition-colors">
              {copied ? <><CheckCircle2 size={16} /> Copied!</> : 'share' in navigator ? <><Share2 size={16} /> Share</> : <><Copy size={16} /> Copy</>}
            </button>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Reports include IP, open/closed ports, statistics, learning notes, and recommendations. Download in your preferred format or share directly. Educational simulator only — no real scanning.
          </p>
        </>
      )}
    </div>
  );
}

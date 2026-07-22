import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, ChevronDown, FileText, FileJson, FileSpreadsheet } from 'lucide-react';
import type { ScannedPort, ReportFormat } from '@/utils/scanner';
import { StatusBadge } from './StatusBadge';
import { getPortInfo } from '@/data/ports';
import {
  getPortReportContent, getReportMimeType, getReportFileExtension, downloadFile,
} from '@/utils/scanner';

const GLOW: Record<string, string> = { open: '#34D399', closed: '#F87171' };

const FORMAT_LABELS: { key: ReportFormat; label: string; icon: typeof FileText }[] = [
  { key: 'text', label: 'TXT', icon: FileText },
  { key: 'json', label: 'JSON', icon: FileJson },
  { key: 'csv', label: 'CSV', icon: FileSpreadsheet },
];

export function PortCard({ port, index, host, scanTimestamp, onClick }: {
  port: ScannedPort; index: number; host: string; scanTimestamp: number; onClick: () => void;
}) {
  const [showFormats, setShowFormats] = useState(false);
  const [justDownloaded, setJustDownloaded] = useState(false);
  const glow = GLOW[port.status] ?? '#60A5FA';
  const info = getPortInfo(port.port);
  const description = info?.description ?? 'No additional information available.';

  const handleDownload = (format: ReportFormat) => {
    const content = getPortReportContent(port, host, scanTimestamp, format);
    const safeHost = host.replace(/[^a-zA-Z0-9]/g, '-');
    const filename = `port-${port.port}-${safeHost}.${getReportFileExtension(format)}`;
    downloadFile(content, filename, getReportMimeType(format));
    setShowFormats(false);
    setJustDownloaded(true);
    setTimeout(() => setJustDownloaded(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06, type: 'spring', stiffness: 200, damping: 20 }} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="glass-card p-4 mb-3 cursor-pointer relative overflow-hidden group" style={{ borderColor: `${glow}33` }} onClick={onClick}>
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: glow }} />
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <div className="flex-shrink-0 rounded-xl border flex items-center justify-center" style={{ width: 52, height: 52, borderColor: `${glow}44`, backgroundColor: `${glow}12` }}>
            <span className="text-base font-extrabold" style={{ color: glow }}>{port.port}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-white truncate">{port.service}</p>
            <p className="text-xs text-slate-400 truncate">TCP · {description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={port.status} />
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowFormats(!showFormats)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                justDownloaded
                  ? 'border-cyber-successGlow/50 text-cyber-successGlow bg-cyber-success/10'
                  : 'border-cyber-border text-slate-400 hover:text-white hover:border-cyber-glow/30'
              }`}
            >
              {justDownloaded ? <span className="text-[10px]">Done</span> : <><Download size={13} /><ChevronDown size={11} /></>}
            </button>
            <AnimatePresence>
              {showFormats && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 z-20 glass-card p-2 min-w-[130px] shadow-xl"
                >
                  <p className="text-[9px] font-extrabold tracking-widest text-slate-500 px-2 py-1">DOWNLOAD REPORT</p>
                  {FORMAT_LABELS.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => handleDownload(f.key)}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold text-slate-300 hover:bg-cyber-surface/60 hover:text-white transition-colors"
                    >
                      <f.icon size={14} className="text-cyber-accentGlow" />
                      {f.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

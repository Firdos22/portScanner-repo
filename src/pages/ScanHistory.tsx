import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { History, Clock, Server, Hash, Trash2, Download, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { downloadFile } from '@/utils/scanner';
import type { NmapScanResult } from '@/utils/nmapScanner';

type HistoryRow = {
  id: string;
  target: string;
  command: string;
  exit_code: number;
  duration: string;
  nmap_available: boolean;
  raw_output: string;
  hosts: unknown;
  created_at: string;
};

export default function ScanHistory() {
  const { user } = useAuth();
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase.from('nmap_scan_history').select('*').order('created_at', { ascending: false }).limit(50).then(({ data, error }) => {
      if (!error && data) setRows(data as HistoryRow[]);
      setLoading(false);
    });
  }, [user]);

  const clearHistory = async () => {
    if (!user) return;
    await supabase.from('nmap_scan_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    setRows([]);
  };

  const exportRow = (row: HistoryRow) => {
    const content = `NMAP SCAN HISTORY\n${'='.repeat(50)}\n\nDate: ${new Date(row.created_at).toLocaleString()}\nCommand: ${row.command}\nTarget: ${row.target}\nExit Code: ${row.exit_code}\nDuration: ${row.duration}\nNmap Available: ${row.nmap_available}\n\n--- RAW OUTPUT ---\n${row.raw_output}\n`;
    downloadFile(content, `nmap-history-${row.id.slice(0, 8)}.txt`, 'text/plain');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white mb-1">Scan History</h1>
          <p className="text-sm text-slate-400">Your past nmap scan results, stored in the cloud.</p>
        </div>
        {rows.length > 0 && (
          <button onClick={clearHistory} className="flex items-center gap-2 text-xs font-bold text-red-400 border border-red-500/30 rounded-lg px-3 py-2 hover:bg-red-500/10 transition-colors">
            <Trash2 size={14} /> Clear All
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><RefreshCw size={24} className="text-cyber-glow animate-spin" /></div>
      ) : rows.length === 0 ? (
        <div className="border border-dashed border-cyber-border rounded-2xl py-14 flex flex-col items-center gap-3">
          <History size={40} className="text-slate-600" />
          <p className="text-sm text-slate-600">No scan history yet. Run a scan from the Practical Lab.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row, i) => (
            <motion.div key={row.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="glass-card p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyber-surface/40 border border-cyber-border flex items-center justify-center"><Server size={18} className="text-cyber-glow" /></div>
                  <div>
                    <p className="text-sm font-bold text-white">{row.target}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-[10px] text-slate-500"><Clock size={10} /> {new Date(row.created_at).toLocaleString()}</span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-500"><Hash size={10} /> Exit: <span className={row.exit_code === 0 ? 'text-cyber-successGlow' : 'text-red-400'}>{row.exit_code}</span></span>
                      <span className="text-[10px] text-slate-500">{row.duration}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => exportRow(row)} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white px-3 py-2 rounded-lg border border-cyber-border hover:bg-cyber-surface/30 transition-colors">
                  <Download size={13} /> Export
                </button>
              </div>
              <pre className="bg-[#0a0e1a] rounded-lg p-3 text-xs font-mono text-cyber-glow border border-cyber-border/50 mb-2 truncate">{row.command}</pre>
              {!row.nmap_available && <p className="text-xs text-amber-400 font-bold">Nmap was not available at scan time.</p>}
              {row.raw_output && (
                <details className="mt-2">
                  <summary className="text-xs font-bold text-slate-500 cursor-pointer hover:text-slate-300">View raw output</summary>
                  <pre className="bg-[#0a0e1a] rounded-lg p-3 text-xs font-mono text-green-400/70 border border-cyber-border/50 mt-2 max-h-[200px] overflow-auto whitespace-pre-wrap">{row.raw_output}</pre>
                </details>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

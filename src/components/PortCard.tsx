import { motion } from 'framer-motion';
import type { ScannedPort } from '@/utils/scanner';
import { StatusBadge } from './StatusBadge';
import { getPortInfo } from '@/data/ports';

const GLOW: Record<string, string> = { open: '#34D399', closed: '#F87171' };

export function PortCard({ port, index, onClick }: {
  port: ScannedPort; index: number; onClick: () => void;
}) {
  const glow = GLOW[port.status] ?? '#60A5FA';
  const info = getPortInfo(port.port);
  const description = info?.description ?? 'No additional information available.';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06, type: 'spring', stiffness: 200, damping: 20 }} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={onClick} className="glass-card p-4 mb-3 cursor-pointer relative overflow-hidden group" style={{ borderColor: `${glow}33` }}>
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
        <div className="flex-shrink-0"><StatusBadge status={port.status} /></div>
      </div>
    </motion.div>
  );
}

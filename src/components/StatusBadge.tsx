import type { PortStatus } from '@/utils/scanner';

const STATUS_CONFIG: Record<PortStatus, { label: string; color: string; bg: string; border: string }> = {
  open: { label: 'OPEN', color: '#34D399', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)' },
  closed: { label: 'CLOSED', color: '#F87171', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)' },
};

export function StatusBadge({ status }: { status: PortStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.closed;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider" style={{ color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
      {cfg.label}
    </span>
  );
}

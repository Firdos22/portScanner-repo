import { motion } from 'framer-motion';
import { Server, LockOpen, Lock, Activity, Globe, Clock, Radar } from 'lucide-react';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { DonutChart, ProtocolBarChart, WeeklyActivityChart } from '@/components/Charts';
import { useProgress } from '@/context/ProgressContext';
import { calculateStatistics, formatDuration } from '@/utils/scanner';

export default function Stats() {
  const { progress } = useProgress();
  const last = progress.lastScan;
  const stats = last ? calculateStatistics(last) : null;
  const cards = [
    { label: 'Total Ports', value: stats?.total ?? 0, icon: Server, color: '#60A5FA' },
    { label: 'Open', value: stats?.open ?? 0, icon: LockOpen, color: '#34D399' },
    { label: 'Closed', value: stats?.closed ?? 0, icon: Lock, color: '#F87171' },
    { label: 'Filtered', value: stats?.filtered ?? 0, icon: Activity, color: '#F59E0B' },
  ];
  const weeklyData = [
    { day: 'Mon', scans: 2 }, { day: 'Tue', scans: 3 }, { day: 'Wed', scans: 1 },
    { day: 'Thu', scans: 4 }, { day: 'Fri', scans: 2 }, { day: 'Sat', scans: 5 }, { day: 'Sun', scans: 3 },
  ];

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-extrabold text-white mb-1">Statistics</h1><p className="text-sm text-slate-400">{last ? `Target ${last.ip}` : 'Run a scan to see statistics.'}</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-4 flex flex-col gap-2" style={{ borderColor: `${c.color}22` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${c.color}1a` }}><c.icon size={16} style={{ color: c.color }} /></div>
            <AnimatedCounter value={c.value} className="text-2xl font-extrabold" />
            <span className="text-xs font-semibold text-slate-400">{c.label}</span>
          </motion.div>
        ))}
      </div>
      {stats && (
        <>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
            <h2 className="text-base font-bold text-white mb-4">Open vs Closed</h2>
            <div className="flex items-center gap-6 flex-wrap">
              <DonutChart data={[{ name: 'Open', value: stats.open, color: '#10B981' }, { name: 'Closed', value: stats.closed, color: '#EF4444' }, { name: 'Filtered', value: stats.filtered, color: '#F59E0B' }]} />
              <div className="space-y-3 flex-1 min-w-[140px]">
                {[{ label: 'Open', value: stats.open, color: '#10B981' }, { label: 'Closed', value: stats.closed, color: '#EF4444' }, { label: 'Filtered', value: stats.filtered, color: '#F59E0B' }].map((l) => (
                  <div key={l.label} className="flex items-center gap-2.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} /><span className="text-sm text-slate-400 flex-1">{l.label}</span><span className="text-base font-extrabold text-white">{l.value}</span></div>
                ))}
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5">
            <h2 className="text-base font-bold text-white mb-4">Protocol Distribution</h2>
            <ProtocolBarChart data={[{ label: 'TCP', value: stats.tcp, color: '#3B82F6' }, { label: 'UDP', value: stats.udp, color: '#06B6D4' }, { label: 'Open', value: stats.open, color: '#10B981' }, { label: 'Closed', value: stats.closed, color: '#EF4444' }]} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-5">
            <h2 className="text-base font-bold text-white mb-4">Scanning Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2.5"><Globe size={15} className="text-slate-500" /><span className="text-xs text-slate-400 flex-1">Target IP</span><span className="text-sm font-bold text-white">{stats.ip}</span></div>
              <div className="flex items-center gap-2.5"><Clock size={15} className="text-slate-500" /><span className="text-xs text-slate-400 flex-1">Duration</span><span className="text-sm font-bold text-white">{formatDuration(stats.durationMs)}</span></div>
              <div className="flex items-center gap-2.5"><Radar size={15} className="text-slate-500" /><span className="text-xs text-slate-400 flex-1">Total Scans</span><span className="text-sm font-bold text-white">{progress.scanCount}</span></div>
              <div className="flex items-center gap-2.5"><Server size={15} className="text-slate-500" /><span className="text-xs text-slate-400 flex-1">Ports Scanned</span><span className="text-sm font-bold text-white">{stats.total}</span></div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-5">
            <h2 className="text-base font-bold text-white mb-4">Weekly Learning</h2>
            <WeeklyActivityChart data={weeklyData} />
            <p className="text-xs text-slate-600 text-center mt-3">Simulated learning activity for the week.</p>
          </motion.div>
        </>
      )}
    </div>
  );
}

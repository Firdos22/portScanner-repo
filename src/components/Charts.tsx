import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export function DonutChart({ data, size = 200 }: { data: { name: string; value: number; color: string }[]; size?: number }) {
  const total = data.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius="65%" outerRadius="90%" paddingAngle={3} dataKey="value" stroke="none">
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-white">{total}</span>
        <span className="text-[10px] font-semibold text-slate-400">Ports</span>
      </div>
    </div>
  );
}

export function ProtocolBarChart({ data, height = 200 }: { data: { label: string; value: number; color: string }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ background: '#0A0F24', border: '1px solid rgba(80,120,220,0.3)', borderRadius: 12, color: '#F1F5F9' }} cursor={{ fill: 'rgba(59,130,246,0.1)' }} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>{data.map((entry, i) => <Cell key={i} fill={entry.color} />)}</Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

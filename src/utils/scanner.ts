import { PORTS, type PortInfo } from '@/data/ports';

export type ScanResult = { ip: string; ports: PortInfo[]; durationMs: number; timestamp: number };

export type ReportFormat = 'text' | 'json' | 'csv';

export type Statistics = {
  total: number; open: number; closed: number; filtered: number;
  tcp: number; udp: number; durationMs: number; ip: string;
};

export function validateIPAddress(ip: string): boolean {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every((p) => { if (!/^\d+$/.test(p)) return false; const n = Number(p); return n >= 0 && n <= 255; });
}

export function simulateScan(ip: string): Promise<ScanResult> {
  return new Promise((resolve) => {
    const ports = PORTS.map((p) => ({ ...p }));
    const durationMs = 2200 + Math.floor(Math.random() * 800);
    setTimeout(() => { resolve({ ip, ports, durationMs, timestamp: Date.now() }); }, durationMs);
  });
}

export function calculateStatistics(result: ScanResult): Statistics {
  return {
    total: result.ports.length,
    open: result.ports.filter((p) => p.status === 'open').length,
    closed: result.ports.filter((p) => p.status === 'closed').length,
    filtered: result.ports.filter((p) => p.status === 'filtered').length,
    tcp: result.ports.filter((p) => p.protocol === 'TCP').length,
    udp: result.ports.filter((p) => p.protocol === 'UDP').length,
    durationMs: result.durationMs, ip: result.ip,
  };
}

export function searchPorts(query: string, ports: PortInfo[] = PORTS): PortInfo[] {
  const q = query.trim().toLowerCase();
  if (!q) return ports;
  return ports.filter((p) => String(p.port).includes(q) || p.service.toLowerCase().includes(q) || p.protocol.toLowerCase().includes(q));
}

export type FilterType = 'all' | 'open' | 'closed' | 'tcp' | 'udp' | 'favorites';

export function filterPorts(filter: FilterType, ports: PortInfo[], favorites: Set<number>): PortInfo[] {
  switch (filter) {
    case 'all': return ports;
    case 'open': return ports.filter((p) => p.status === 'open');
    case 'closed': return ports.filter((p) => p.status === 'closed');
    case 'tcp': return ports.filter((p) => p.protocol === 'TCP');
    case 'udp': return ports.filter((p) => p.protocol === 'UDP');
    case 'favorites': return ports.filter((p) => favorites.has(p.port));
    default: return ports;
  }
}

export function sortPorts(ports: PortInfo[], by: 'port' | 'service' = 'port'): PortInfo[] {
  return [...ports].sort((a, b) => (by === 'port' ? a.port - b.port : a.service.localeCompare(b.service)));
}

export function generateReport(result: ScanResult): string {
  const stats = calculateStatistics(result);
  const openPorts = result.ports.filter((p) => p.status === 'open');
  const closedPorts = result.ports.filter((p) => p.status === 'closed');
  const lines: string[] = [];
  lines.push('========================================');
  lines.push('  PORT SCANNER DASHBOARD — SCAN REPORT');
  lines.push('  Educational Simulator — Not a real scan');
  lines.push('========================================');
  lines.push('');
  lines.push(`Target IP     : ${result.ip}`);
  lines.push(`Scan Duration : ${(result.durationMs / 1000).toFixed(2)}s`);
  lines.push(`Timestamp     : ${new Date(result.timestamp).toLocaleString()}`);
  lines.push('');
  lines.push('--- SUMMARY ---');
  lines.push(`Total Ports   : ${stats.total}`);
  lines.push(`Open Ports    : ${stats.open}`);
  lines.push(`Closed Ports  : ${stats.closed}`);
  lines.push(`Filtered Ports: ${stats.filtered}`);
  lines.push(`TCP           : ${stats.tcp}`);
  lines.push(`UDP           : ${stats.udp}`);
  lines.push('');
  lines.push('--- OPEN PORTS ---');
  openPorts.forEach((p) => {
    lines.push(`${p.port}/${p.protocol}  ${p.service}`);
    lines.push(`  Risk: ${p.securityRisks.join('; ')}`);
    lines.push(`  Recommendation: ${p.recommendations}`);
    lines.push('');
  });
  lines.push('--- CLOSED PORTS ---');
  closedPorts.forEach((p) => { lines.push(`${p.port}/${p.protocol}  ${p.service}`); });
  lines.push('');
  lines.push('--- LEARNING NOTES ---');
  lines.push('This simulator uses predefined data. A real scan would send packets to the target.');
  lines.push('Always scan only systems you own or have explicit permission to test.');
  lines.push('');
  lines.push('Designed & Developed by Firdos Kazi');
  lines.push('https://github.com/Firdos22');
  lines.push('========================================');
  return lines.join('\n');
}

export function generateJSON(result: ScanResult): string {
  const stats = calculateStatistics(result);
  return JSON.stringify({
    app: 'Port Scanner Dashboard', type: 'educational-simulator',
    disclaimer: 'No real network scanning was performed. Results are simulated.',
    target: { ip: result.ip },
    scan: { durationMs: result.durationMs, timestamp: new Date(result.timestamp).toISOString() },
    statistics: stats, ports: result.ports,
  }, null, 2);
}

export function generateCSV(result: ScanResult): string {
  const stats = calculateStatistics(result);
  const escapeCSV = (val: string) => `"${val.replace(/"/g, '""')}"`;
  const rows: string[] = [];
  rows.push('# Port Scanner Dashboard — Scan Report (Educational Simulator)');
  rows.push(`# Target IP,${result.ip}`);
  rows.push(`# Scan Duration,${(result.durationMs / 1000).toFixed(2)}s`);
  rows.push(`# Timestamp,${new Date(result.timestamp).toLocaleString()}`);
  rows.push(`# Total Ports,${stats.total}`);
  rows.push(`# Open,${stats.open}`);
  rows.push(`# Closed,${stats.closed}`);
  rows.push(`# Filtered,${stats.filtered}`);
  rows.push(`# TCP,${stats.tcp}`);
  rows.push(`# UDP,${stats.udp}`);
  rows.push('');
  rows.push('Port,Protocol,Service,Status,Description,Purpose,Security Risks,Attack Examples,Best Practices,Recommendation,Educational Notes');
  result.ports.forEach((p) => {
    rows.push([
      p.port, p.protocol, escapeCSV(p.service), p.status, escapeCSV(p.description),
      escapeCSV(p.purpose), escapeCSV(p.securityRisks.join('; ')),
      escapeCSV(p.attackExamples.join('; ')), escapeCSV(p.bestPractices.join('; ')),
      escapeCSV(p.recommendations), escapeCSV(p.educationalNotes),
    ].join(','));
  });
  return rows.join('\n');
}

export function getReportContent(result: ScanResult, format: ReportFormat): string {
  switch (format) {
    case 'text': return generateReport(result);
    case 'json': return generateJSON(result);
    case 'csv': return generateCSV(result);
    default: return generateReport(result);
  }
}

export function getReportMimeType(format: ReportFormat): string {
  switch (format) {
    case 'json': return 'application/json';
    case 'csv': return 'text/csv';
    default: return 'text/plain';
  }
}

export function getReportFileExtension(format: ReportFormat): string {
  switch (format) {
    case 'json': return 'json';
    case 'csv': return 'csv';
    default: return 'txt';
  }
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export function formatDuration(ms: number): string { return `${(ms / 1000).toFixed(2)}s`; }

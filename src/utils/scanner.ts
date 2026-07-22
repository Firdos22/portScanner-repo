import { supabase, EDGE_FUNCTION_URL } from '@/lib/supabase';
import { getPortInfo } from '@/data/ports';

export type PortStatus = 'open' | 'closed';

export type ScannedPort = {
  port: number;
  status: PortStatus;
  service: string;
};

export type ScanResult = {
  host: string;
  ports: ScannedPort[];
  openCount: number;
  closedCount: number;
  durationMs: number;
  timestamp: number;
};

export type Statistics = {
  total: number; open: number; closed: number; durationMs: number; host: string;
};

export type ScanProgress = {
  port: number;
  status: PortStatus;
  service: string;
  scanned: number;
  total: number;
};

export type SSEEvent =
  | { type: 'start'; host: string; totalPorts: number; ports: number[]; timestamp: number }
  | { type: 'port' } & ScanProgress
  | { type: 'complete'; host: string; totalPorts: number; openCount: number; closedCount: number; results: ScannedPort[]; timestamp: number }
  | { type: 'error'; message: string };

export type ScanCallbacks = {
  onStart?: (host: string, totalPorts: number, ports: number[]) => void;
  onPort?: (progress: ScanProgress) => void;
  onComplete?: (result: ScanResult) => void;
  onError?: (message: string) => void;
};

export function validateHost(host: string): boolean {
  const trimmed = host.trim();
  // IPv4
  const parts = trimmed.split('.');
  if (parts.length === 4 && parts.every((p) => /^\d+$/.test(p) && Number(p) >= 0 && Number(p) <= 255)) {
    return true;
  }
  // Hostname
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(trimmed);
}

export async function performRealScan(
  host: string,
  ports: number[] | null,
  callbacks: ScanCallbacks,
  signal?: AbortSignal,
): Promise<ScanResult | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    callbacks.onError?.('Authentication required. Please sign in.');
    return null;
  }

  const startTime = Date.now();

  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ host: host.trim(), ports: ports ?? undefined }),
      signal,
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({ error: `Scan failed (${response.status})` }));
      callbacks.onError?.(errBody.error || `Scan failed (${response.status})`);
      return null;
    }

    if (!response.body) {
      callbacks.onError?.('No response stream received from scanner.');
      return null;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalResult: ScanResult | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();
        if (!jsonStr) continue;

        try {
          const event = JSON.parse(jsonStr) as SSEEvent;

          if (event.type === 'start') {
            callbacks.onStart?.(event.host, event.totalPorts, event.ports);
          } else if (event.type === 'port') {
            callbacks.onPort?.({
              port: event.port,
              status: event.status,
              service: event.service,
              scanned: event.scanned,
              total: event.total,
            });
          } else if (event.type === 'complete') {
            finalResult = {
              host: event.host,
              ports: event.results,
              openCount: event.openCount,
              closedCount: event.closedCount,
              durationMs: Date.now() - startTime,
              timestamp: Date.now(),
            };
            callbacks.onComplete?.(finalResult);
          } else if (event.type === 'error') {
            callbacks.onError?.(event.message);
          }
        } catch {
          // skip malformed JSON
        }
      }
    }

    return finalResult;
  } catch (err) {
    if ((err as Error).name === 'AbortError') return null;
    callbacks.onError?.((err as Error).message || 'Network error during scan.');
    return null;
  }
}

export function calculateStatistics(result: ScanResult): Statistics {
  return {
    total: result.ports.length,
    open: result.openCount,
    closed: result.closedCount,
    durationMs: result.durationMs,
    host: result.host,
  };
}

export function formatDuration(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}

export type FilterType = 'all' | 'open' | 'closed';

export function filterPorts(filter: FilterType, ports: ScannedPort[]): ScannedPort[] {
  switch (filter) {
    case 'open': return ports.filter((p) => p.status === 'open');
    case 'closed': return ports.filter((p) => p.status === 'closed');
    default: return ports;
  }
}

export function sortPorts(ports: ScannedPort[]): ScannedPort[] {
  return [...ports].sort((a, b) => a.port - b.port);
}

export function searchPorts(query: string, ports: ScannedPort[]): ScannedPort[] {
  const q = query.trim().toLowerCase();
  if (!q) return ports;
  return ports.filter((p) => String(p.port).includes(q) || p.service.toLowerCase().includes(q));
}

// Report generation
export type ReportFormat = 'text' | 'json' | 'csv';

export function generateReport(result: ScanResult): string {
  const lines: string[] = [];
  lines.push('========================================');
  lines.push('  PORT SCANNER DASHBOARD — SCAN REPORT');
  lines.push('  REAL TCP Connect Scan');
  lines.push('========================================');
  lines.push('');
  lines.push(`Target Host   : ${result.host}`);
  lines.push(`Scan Duration : ${(result.durationMs / 1000).toFixed(2)}s`);
  lines.push(`Timestamp     : ${new Date(result.timestamp).toLocaleString()}`);
  lines.push('');
  lines.push('--- SUMMARY ---');
  lines.push(`Total Ports   : ${result.ports.length}`);
  lines.push(`Open Ports    : ${result.openCount}`);
  lines.push(`Closed Ports  : ${result.closedCount}`);
  lines.push('');
  lines.push('--- OPEN PORTS ---');
  result.ports.filter((p) => p.status === 'open').forEach((p) => {
    const info = getPortInfo(p.port);
    lines.push(`${p.port}/TCP  ${p.service}`);
    if (info) {
      lines.push(`  Description    : ${info.description}`);
      lines.push(`  Security Risks : ${info.securityRisks.join('; ')}`);
      lines.push(`  Recommendation : ${info.recommendations}`);
    }
    lines.push('');
  });
  lines.push('--- CLOSED PORTS ---');
  result.ports.filter((p) => p.status === 'closed').forEach((p) => {
    lines.push(`${p.port}/TCP  ${p.service}`);
  });
  lines.push('');
  lines.push('--- NOTES ---');
  lines.push('Only scan systems you own or have explicit permission to test.');
  lines.push('');
  lines.push('Designed & Developed by Firdos Kazi');
  lines.push('https://github.com/Firdos22');
  lines.push('========================================');
  return lines.join('\n');
}

export function generateJSON(result: ScanResult): string {
  return JSON.stringify({
    app: 'Port Scanner Dashboard',
    type: 'real-tcp-connect-scan',
    target: { host: result.host },
    scan: { durationMs: result.durationMs, timestamp: new Date(result.timestamp).toISOString() },
    summary: { total: result.ports.length, open: result.openCount, closed: result.closedCount },
    ports: result.ports,
  }, null, 2);
}

export function generateCSV(result: ScanResult): string {
  const rows: string[] = [];
  rows.push('# Port Scanner Dashboard — Real TCP Connect Scan Report');
  rows.push(`# Host,${result.host}`);
  rows.push(`# Duration,${(result.durationMs / 1000).toFixed(2)}s`);
  rows.push(`# Timestamp,${new Date(result.timestamp).toLocaleString()}`);
  rows.push(`# Total,${result.ports.length}`);
  rows.push(`# Open,${result.openCount}`);
  rows.push(`# Closed,${result.closedCount}`);
  rows.push('');
  rows.push('Port,Service,Status');
  result.ports.forEach((p) => { rows.push(`${p.port},${p.service},${p.status}`); });
  return rows.join('\n');
}

export function getReportContent(result: ScanResult, format: ReportFormat): string {
  switch (format) {
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

import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';

// ===== Types =====

export type PortStatus = 'open' | 'closed' | 'filtered';
export type Protocol = 'TCP';
export type ScanProfile = 'quick' | 'common' | 'top100' | 'full' | 'custom';

export type ScannedPort = {
  port: number;
  status: PortStatus;
  service: string;
  protocol: Protocol;
};

export type ScanResult = {
  host: string;
  ports: ScannedPort[];
  openCount: number;
  closedCount: number;
  filteredCount: number;
  durationMs: number;
  timestamp: number;
  profile: ScanProfile;
};

export type Statistics = {
  total: number;
  open: number;
  closed: number;
  filtered: number;
  tcp: number;
  udp: number;
  durationMs: number;
  host: string;
};

export type ScanProgress = {
  port: number;
  status: PortStatus;
  service: string;
  scanned: number;
  total: number;
};

export type ScanCallbacks = {
  onStart?: (host: string, totalPorts: number, ports: number[]) => void;
  onPort?: (progress: ScanProgress) => void;
  onComplete?: (result: ScanResult) => void;
  onError?: (message: string) => void;
  onCancelled?: () => void;
};

// ===== Validation =====

export function validateHost(host: string): boolean {
  const trimmed = host.trim();
  // IPv4
  const parts = trimmed.split('.');
  if (parts.length === 4 && parts.every((p) => /^\d+$/.test(p) && Number(p) >= 0 && Number(p) <= 255)) {
    return true;
  }
  // IPv6 simplified
  if (trimmed.includes(':') && /^[0-9a-fA-F:]+$/.test(trimmed)) return true;
  // Hostname
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(trimmed);
}

// Keep backwards-compat alias
export const validateIPAddress = validateHost;

// ===== Edge function URL =====

function getEdgeFunctionUrl(): string {
  const url = Platform.OS === 'web'
    ? (import.meta as any).env?.VITE_SUPABASE_URL
    : process.env.EXPO_PUBLIC_SUPABASE_URL;
  return `${url}/functions/v1/port-scanner`;
}

// ===== Real scanner via SSE =====

export async function performRealScan(
  host: string,
  profile: ScanProfile,
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
  const edgeUrl = getEdgeFunctionUrl();

  try {
    const response = await fetch(edgeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ host: host.trim(), profile }),
      signal,
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({ error: `Scan failed (${response.status})` }));
      callbacks.onError?.(errBody.error || `Scan failed (${response.status})`);
      return null;
    }

    if (!response.body) { callbacks.onError?.('No response stream received.'); return null; }

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
          const event = JSON.parse(jsonStr);
          if (event.type === 'start') {
            callbacks.onStart?.(event.host, event.totalPorts, event.ports);
          } else if (event.type === 'port') {
            callbacks.onPort?.({
              port: event.port, status: event.status, service: event.service,
              scanned: event.scanned, total: event.total,
            });
          } else if (event.type === 'complete') {
            finalResult = {
              host: event.host,
              ports: event.results.map((r: any) => ({ port: r.port, status: r.status, service: r.service, protocol: 'TCP' as Protocol })),
              openCount: event.openCount,
              closedCount: event.closedCount,
              filteredCount: event.filteredCount ?? 0,
              durationMs: Date.now() - startTime,
              timestamp: Date.now(),
              profile,
            };
            callbacks.onComplete?.(finalResult);
          } else if (event.type === 'cancelled') {
            callbacks.onCancelled?.();
          } else if (event.type === 'error') {
            callbacks.onError?.(event.message);
          }
        } catch { /* skip malformed JSON */ }
      }
    }
    return finalResult;
  } catch (err) {
    if ((err as Error).name === 'AbortError') { callbacks.onCancelled?.(); return null; }
    callbacks.onError?.((err as Error).message || 'Network error during scan.');
    return null;
  }
}

// ===== Statistics =====

export function calculateStatistics(result: ScanResult): Statistics {
  const open = result.ports.filter((p) => p.status === 'open').length;
  const closed = result.ports.filter((p) => p.status === 'closed').length;
  const filtered = result.ports.filter((p) => p.status === 'filtered').length;
  const tcp = result.ports.filter((p) => p.protocol === 'TCP').length;
  return {
    total: result.ports.length, open, closed, filtered, tcp, udp: 0,
    durationMs: result.durationMs, host: result.host,
  };
}

// ===== Port filtering / search =====

export type FilterType = 'all' | 'open' | 'closed' | 'filtered' | 'tcp' | 'favorites';

export function filterPorts(filter: FilterType, ports: ScannedPort[], favorites: Set<number>): ScannedPort[] {
  switch (filter) {
    case 'open': return ports.filter((p) => p.status === 'open');
    case 'closed': return ports.filter((p) => p.status === 'closed');
    case 'filtered': return ports.filter((p) => p.status === 'filtered');
    case 'tcp': return ports.filter((p) => p.protocol === 'TCP');
    case 'favorites': return ports.filter((p) => favorites.has(p.port));
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

// ===== Formatting =====

export function formatDuration(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}

// ===== Report generation =====

export function generateReport(result: ScanResult): string {
  const stats = calculateStatistics(result);
  const lines: string[] = [];
  lines.push('========================================');
  lines.push('  PORT SCANNER DASHBOARD — SCAN REPORT');
  lines.push('  REAL TCP Connect Scan');
  lines.push(`  Profile: ${result.profile.toUpperCase()}`);
  lines.push('========================================');
  lines.push('');
  lines.push(`Target Host   : ${result.host}`);
  lines.push(`Scan Duration : ${(result.durationMs / 1000).toFixed(2)}s`);
  lines.push(`Timestamp     : ${new Date(result.timestamp).toLocaleString()}`);
  lines.push('');
  lines.push('--- SUMMARY ---');
  lines.push(`Total Ports   : ${stats.total}`);
  lines.push(`Open Ports    : ${stats.open}`);
  lines.push(`Closed Ports  : ${stats.closed}`);
  lines.push(`Filtered Ports: ${stats.filtered}`);
  lines.push('');
  lines.push('--- OPEN PORTS ---');
  result.ports.filter((p) => p.status === 'open').forEach((p) => {
    lines.push(`${p.port}/TCP  ${p.service}`);
    lines.push('');
  });
  if (stats.filtered > 0) {
    lines.push('--- FILTERED PORTS ---');
    result.ports.filter((p) => p.status === 'filtered').forEach((p) => {
      lines.push(`${p.port}/TCP  ${p.service}  (firewall blocked or no response)`);
    });
    lines.push('');
  }
  lines.push('--- CLOSED PORTS ---');
  result.ports.filter((p) => p.status === 'closed').forEach((p) => {
    lines.push(`${p.port}/TCP  ${p.service}`);
  });
  lines.push('');
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
    profile: result.profile,
    target: { host: result.host },
    scan: { durationMs: result.durationMs, timestamp: new Date(result.timestamp).toISOString() },
    summary: {
      total: result.ports.length,
      open: result.openCount,
      closed: result.closedCount,
      filtered: result.filteredCount,
    },
    ports: result.ports,
  }, null, 2);
}

export type ReportFormat = 'text' | 'json';

export function getReportContent(result: ScanResult, format: ReportFormat): string {
  return format === 'json' ? generateJSON(result) : generateReport(result);
}

import { supabase } from '@/lib/supabase';

export const NMAP_EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nmap-runner`;

export type NmapPort = {
  port: number;
  protocol: string;
  state: string;
  service: string;
  version: string;
};

export type NmapHost = {
  host: string;
  ip: string;
  state: string;
  os: string;
  ports: NmapPort[];
};

export type NmapScanResult = {
  hosts: NmapHost[];
  rawOutput: string;
  exitCode: number;
  duration: string;
  command: string;
  nmapAvailable: boolean;
  stderr: string;
  timestamp: number;
};

export type NmapSSEEvent =
  | { type: 'start'; command: string; target: string; nmapAvailable: boolean; args: string[] }
  | { type: 'stdout'; data: string }
  | { type: 'stderr'; data: string }
  | { type: 'timeout'; message: string }
  | { type: 'status'; nmapAvailable: boolean; message: string }
  | { type: 'complete'; nmapAvailable: boolean; hosts: NmapHost[]; rawOutput: string; exitCode: number; duration: string; command: string; stderr: string }
  | { type: 'error'; message: string };

export type NmapScanCallbacks = {
  onStart?: (command: string, target: string, nmapAvailable: boolean) => void;
  onOutput?: (chunk: string) => void;
  onStderr?: (chunk: string) => void;
  onComplete?: (result: NmapScanResult) => void;
  onError?: (message: string) => void;
  onTimeout?: (message: string) => void;
};

export function validateNmapTarget(target: string): boolean {
  const t = target.trim();
  if (!t) return false;
  // IPv4 with optional CIDR
  const cidrParts = t.split('/');
  const ip = cidrParts[0];
  const cidr = cidrParts.length > 1 ? cidrParts[1] : undefined;
  const ipParts = ip.split('.');
  if (ipParts.length === 4 && ipParts.every((p) => /^\d+$/.test(p) && +p >= 0 && +p <= 255)) {
    if (cidr !== undefined) return /^\d+$/.test(cidr) && +cidr >= 0 && +cidr <= 32;
    return true;
  }
  // IPv6 simplified
  if (t.includes(':') && /^[0-9a-fA-F:\/]+$/.test(t)) return true;
  // Hostname
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(t);
}

// ─── Allowed nmap args for the command builder ───

export type NmapFlagOption = {
  flag: string;
  label: string;
  description: string;
  requiresValue?: boolean;
  valuePlaceholder?: string;
  group: string;
};

export const NMAP_FLAGS: NmapFlagOption[] = [
  // Scan Techniques
  { flag: '-sS', label: 'SYN Stealth', description: 'Half-open SYN scan (requires root)', group: 'Scan Type' },
  { flag: '-sT', label: 'TCP Connect', description: 'Full TCP handshake scan', group: 'Scan Type' },
  { flag: '-sU', label: 'UDP Scan', description: 'Scan UDP ports', group: 'Scan Type' },
  { flag: '-sn', label: 'Ping Scan', description: 'Host discovery only, no port scan', group: 'Scan Type' },
  // Detection
  { flag: '-sV', label: 'Version Detection', description: 'Probe open ports for service/version info', group: 'Detection' },
  { flag: '-O', label: 'OS Detection', description: 'Detect operating system via TCP/IP fingerprinting', group: 'Detection' },
  { flag: '-A', label: 'Aggressive', description: 'Enables -sV -O -sC --traceroute all at once', group: 'Detection' },
  { flag: '-sC', label: 'Default Scripts', description: 'Run default NSE script set', group: 'Detection' },
  // Port Selection
  { flag: '-F', label: 'Fast Scan', description: 'Scan top 100 ports instead of 1000', group: 'Ports' },
  { flag: '-p', label: 'Specific Ports', description: 'Scan specified ports (e.g. 22,80,443)', requiresValue: true, valuePlaceholder: '22,80,443', group: 'Ports' },
  { flag: '--top-ports', label: 'Top N Ports', description: 'Scan N most common ports', requiresValue: true, valuePlaceholder: '20', group: 'Ports' },
  // Host Discovery
  { flag: '-Pn', label: 'Skip Ping', description: 'Treat all hosts as online, skip discovery', group: 'Host Discovery' },
  // Timing
  { flag: '-T1', label: 'Sneaky', description: 'Very slow, evade IDS', group: 'Timing' },
  { flag: '-T2', label: 'Polite', description: 'Slow, less intrusive', group: 'Timing' },
  { flag: '-T3', label: 'Normal', description: 'Default speed (default)', group: 'Timing' },
  { flag: '-T4', label: 'Aggressive', description: 'Fast, recommended for most scans', group: 'Timing' },
  { flag: '-T5', label: 'Insane', description: 'Very fast, may miss ports', group: 'Timing' },
  // Scripting
  { flag: '--script', label: 'NSE Script', description: 'Run specified NSE script or category', requiresValue: true, valuePlaceholder: 'vuln', group: 'Scripting' },
  // Output
  { flag: '-v', label: 'Verbose', description: 'Increase output verbosity', group: 'Output' },
  { flag: '--reason', label: 'Show Reason', description: 'Show reason for port state', group: 'Output' },
  { flag: '--open', label: 'Open Only', description: 'Show only open ports', group: 'Output' },
  { flag: '-n', label: 'No DNS', description: 'Skip DNS resolution', group: 'Output' },
];

export const NMAP_GROUPS = ['Scan Type', 'Detection', 'Ports', 'Host Discovery', 'Timing', 'Scripting', 'Output'];

export function buildNmapCommand(target: string, selectedFlags: Map<string, string | null>): string {
  const parts: string[] = ['nmap'];
  for (const flag of NMAP_FLAGS) {
    if (selectedFlags.has(flag.flag)) {
      const val = selectedFlags.get(flag.flag);
      if (flag.requiresValue && val) {
        parts.push(`${flag.flag}=${val}`);
      } else if (flag.requiresValue) {
        parts.push(flag.flag);
      } else {
        parts.push(flag.flag);
      }
    }
  }
  parts.push(target.trim());
  return parts.join(' ');
}

export async function runNmapScan(
  target: string,
  args: string[],
  callbacks: NmapScanCallbacks,
  signal?: AbortSignal,
): Promise<NmapScanResult | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    callbacks.onError?.('Authentication required. Please sign in.');
    return null;
  }

  try {
    const response = await fetch(NMAP_EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ target: target.trim(), args }),
      signal,
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({ error: `Scan failed (${response.status})` }));
      callbacks.onError?.(errBody.error || `Scan failed (${response.status})`);
      return null;
    }

    if (!response.body) {
      callbacks.onError?.('No response stream received.');
      return null;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalResult: NmapScanResult | null = null;

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
          const event = JSON.parse(jsonStr) as NmapSSEEvent;
          if (event.type === 'start') callbacks.onStart?.(event.command, event.target, event.nmapAvailable);
          else if (event.type === 'stdout') callbacks.onOutput?.(event.data);
          else if (event.type === 'stderr') callbacks.onStderr?.(event.data);
          else if (event.type === 'timeout') callbacks.onTimeout?.(event.message);
          else if (event.type === 'status') {
            if (!event.nmapAvailable) callbacks.onError?.(event.message);
          } else if (event.type === 'complete') {
            finalResult = {
              hosts: event.hosts,
              rawOutput: event.rawOutput,
              exitCode: event.exitCode,
              duration: event.duration,
              command: event.command,
              nmapAvailable: event.nmapAvailable,
              stderr: event.stderr || '',
              timestamp: Date.now(),
            };
            callbacks.onComplete?.(finalResult);
          } else if (event.type === 'error') {
            callbacks.onError?.(event.message);
          }
        } catch { /* skip */ }
      }
    }
    return finalResult;
  } catch (err) {
    if ((err as Error).name === 'AbortError') return null;
    callbacks.onError?.((err as Error).message || 'Network error during nmap scan.');
    return null;
  }
}

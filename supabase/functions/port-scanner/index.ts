/*
 * Port Scanner Edge Function — Phase 2: REAL SCANNER
 *
 * Real TCP connect scanning via Deno.connect().
 * Supports: open/closed/filtered states, scan profiles, configurable ports,
 * real-time SSE streaming, server-side cancellation via abort signals.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

export type ScanProfile = "quick" | "common" | "top100" | "full" | "custom";

export type ScanPortStatus = "open" | "closed" | "filtered";

interface ScanRequest {
  host: string;
  profile?: ScanProfile;
  ports?: number[];
  timeoutMs?: number;
  concurrency?: number;
}

const QUICK_PORTS: number[] = [21, 22, 23, 25, 80, 443, 3389, 8080];
const COMMON_PORTS: number[] = [
  20, 21, 22, 23, 25, 53, 80, 110, 111, 135, 139, 143, 443, 445,
  993, 995, 1433, 1521, 1723, 3306, 3389, 5432, 5900, 8080, 8443, 8888, 9090, 27017,
];
const TOP100_PORTS: number[] = [
  7, 9, 13, 21, 22, 23, 25, 26, 37, 53, 79, 80, 81, 88, 106, 110, 111, 113, 119, 135,
  139, 143, 144, 179, 199, 389, 427, 443, 444, 445, 465, 513, 514, 515, 543, 544, 548,
  554, 587, 631, 646, 873, 990, 993, 995, 1025, 1026, 1027, 1028, 1029, 1110, 1433,
  1720, 1723, 1755, 1900, 2000, 2001, 2049, 2121, 2717, 3000, 3128, 3306, 3389, 4000,
  4001, 4045, 4899, 5000, 5009, 5051, 5060, 5432, 5900, 5901, 6000, 6001, 6646, 7070,
  8000, 8008, 8009, 8080, 8081, 8443, 8888, 9100, 9999, 10000, 32768, 32771, 32772,
  32773, 32774, 32775, 32776, 32777, 32778, 32779, 32780, 32781, 32782,
];

const SERVICE_NAMES: Record<number, string> = {
  7: "Echo", 9: "Discard", 13: "Daytime", 20: "FTP Data", 21: "FTP", 22: "SSH", 23: "Telnet",
  25: "SMTP", 26: "SMTP Alt", 37: "Time", 53: "DNS", 79: "Finger", 80: "HTTP", 81: "HTTP Alt",
  88: "Kerberos", 106: "pop3pw", 110: "POP3", 111: "RPCbind", 113: "Ident", 119: "NNTP",
  135: "MS-RPC", 139: "NetBIOS", 143: "IMAP", 144: "NeWS", 179: "BGP", 199: "smux",
  389: "LDAP", 427: "SVRLOC", 443: "HTTPS", 444: "SNPP", 445: "SMB", 465: "SMTPS",
  513: "rlogin", 514: "syslog", 515: "LPD", 543: "klogin", 544: "kshell", 548: "AFP",
  554: "RTSP", 587: "SMTP Submission", 631: "IPP", 646: "LDP", 873: "rsync", 990: "FTPS",
  993: "IMAPS", 995: "POP3S", 1025: "NFS-or-IIS", 1026: "LSA-or-nfs", 1027: "IIS",
  1028: "Unknown", 1029: "Unknown", 1110: "nfsd-keepalive", 1433: "MSSQL", 1521: "Oracle",
  1720: "H.323/Q.931", 1723: "PPTP", 1755: "MS-streaming", 1900: "UPnP", 2000: "cisco-sccp",
  2001: "Cisco", 2049: "NFS", 2121: "FTP Alt", 2717: "pnRequester", 3000: "ppp",
  3128: "Squid HTTP Proxy", 3306: "MySQL", 3389: "RDP", 4000: "Remote Anything",
  4001: "NewOak", 4045: "lockd", 4899: "Radmin", 5000: "UPnP", 5009: "airport-admin",
  5051: "ida-agent", 5060: "SIP", 5432: "PostgreSQL", 5900: "VNC", 5901: "VNC-1",
  6000: "X11", 6001: "X11-1", 6646: "Maestro Conference", 7070: "RealServer/RTSP",
  8000: "iRDMI", 8008: "HTTP Alt", 8009: "ajp13", 8080: "HTTP Proxy", 8081: "HTTP Alt",
  8443: "HTTPS Alt", 8888: "Sun Answerbook", 9100: "JetDirect", 9999: "abyss",
  10000: "snet-sensor", 32768: "Filenet-tms", 32771: "Filenet-rpc", 32772: "Filenet-cm",
  32773: "Filecom", 32774: "Filenet", 32775: "Filenet-remote", 32776: "Filenet-web",
  32777: "Filenet-webserver", 32778: "Filenet-idm", 32779: "Filenet-idm",
  32780: "Filenet-idm", 32781: "Filenet-ccm", 32782: "Filenet-tms",
};

function validateHost(host: string): boolean {
  const trimmed = host.trim();
  // IPv4
  const ipv4Parts = trimmed.split(".");
  if (ipv4Parts.length === 4 && ipv4Parts.every((p) => /^\d+$/.test(p) && Number(p) >= 0 && Number(p) <= 255)) {
    return true;
  }
  // IPv6 simplified (bracketed or plain)
  if (trimmed.includes(":") && /^[0-9a-fA-F:]+$/.test(trimmed)) return true;
  // Hostname
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(trimmed);
}

function getPortsForProfile(profile: ScanProfile, customPorts?: number[]): number[] {
  switch (profile) {
    case "quick": return QUICK_PORTS;
    case "common": return COMMON_PORTS;
    case "top100": return TOP100_PORTS;
    case "full": {
      const ports: number[] = [];
      for (let p = 1; p <= 65535; p++) ports.push(p);
      return ports;
    }
    case "custom":
      return customPorts && customPorts.length > 0 ? customPorts : COMMON_PORTS;
    default: return COMMON_PORTS;
  }
}

async function scanPort(host: string, port: number, timeoutMs: number, signal?: AbortSignal): Promise<ScanPortStatus> {
  if (signal?.aborted) return "closed";
  try {
    const connectPromise = Deno.connect({ hostname: host, port, transport: "tcp" });
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timer = setTimeout(() => reject(new Error("CONNECTION_TIMEOUT")), timeoutMs);
      if (signal) {
        signal.addEventListener("abort", () => { clearTimeout(timer); reject(new Error("ABORTED")); });
      }
    });
    const conn = await Promise.race([connectPromise, timeoutPromise]);
    conn.close();
    return "open";
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === "CONNECTION_TIMEOUT" || msg === "ABORTED" || msg.includes("timed out")) {
      return "filtered";
    }
    // Connection refused = closed
    return "closed";
  }
}

function sseData(obj: Record<string, unknown>): string {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed. Use POST." }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body: ScanRequest = await req.json();
    const host = (body.host || "").trim();

    if (!host || !validateHost(host)) {
      return new Response(JSON.stringify({ error: "Invalid host. Provide a valid IP address or hostname." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profile: ScanProfile = body.profile || "common";
    const customPorts = body.ports?.filter((p) => p > 0 && p <= 65535);
    const ports = getPortsForProfile(profile, customPorts);

    const timeoutMs = body.timeoutMs && body.timeoutMs > 0 && body.timeoutMs <= 10000
      ? Math.min(body.timeoutMs, 5000)
      : 2000;

    const concurrency = body.concurrency && body.concurrency > 0 && body.concurrency <= 50
      ? Math.min(body.concurrency, 20)
      : 10;

    const totalPorts = ports.length;
    const encoder = new TextEncoder();
    const results: { port: number; status: ScanPortStatus; service: string }[] = [];

    // Server-side abort controller for cancellation
    const abortController = new AbortController();

    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(sseData({
          type: "start", host, totalPorts, ports, profile, timeoutMs, timestamp: Date.now(),
        })));

        let scanned = 0;

        // Scan in batches with concurrency limit
        for (let i = 0; i < ports.length; i += concurrency) {
          if (abortController.signal.aborted) {
            controller.enqueue(encoder.encode(sseData({ type: "cancelled", scanned, total: totalPorts })));
            controller.close();
            return;
          }

          const batch = ports.slice(i, i + concurrency);
          const batchResults = await Promise.all(
            batch.map(async (port) => {
              const status = await scanPort(host, port, timeoutMs, abortController.signal);
              return { port, status, service: SERVICE_NAMES[port] || "Unknown" };
            })
          );

          for (const r of batchResults) {
            if (abortController.signal.aborted) break;
            results.push(r);
            scanned = results.length;
            controller.enqueue(encoder.encode(sseData({
              type: "port", port: r.port, status: r.status, service: r.service, scanned, total: totalPorts,
            })));
          }
        }

        const openCount = results.filter((r) => r.status === "open").length;
        const closedCount = results.filter((r) => r.status === "closed").length;
        const filteredCount = results.filter((r) => r.status === "filtered").length;

        controller.enqueue(encoder.encode(sseData({
          type: "complete", host, totalPorts, openCount, closedCount, filteredCount,
          profile, results, timestamp: Date.now(),
        })));

        controller.close();
      },
      cancel() {
        // Client disconnected — abort scanning
        abortController.abort();
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ScanRequest {
  host: string;
  ports?: number[];
  timeoutMs?: number;
}

const COMMON_PORTS: number[] = [
  20, 21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 993, 995,
  1433, 3306, 3389, 5432, 5900, 8080, 8443, 8888, 9090, 27017,
];

const SERVICE_NAMES: Record<number, string> = {
  20: "FTP Data", 21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP",
  53: "DNS", 80: "HTTP", 110: "POP3", 143: "IMAP", 443: "HTTPS",
  445: "SMB", 993: "IMAPS", 995: "POP3S", 1433: "MSSQL",
  3306: "MySQL", 3389: "RDP", 5432: "PostgreSQL", 5900: "VNC",
  8080: "HTTP Alt", 8443: "HTTPS Alt", 8888: "HTTP Proxy",
  9090: "Prometheus", 27017: "MongoDB",
};

function validateHost(host: string): boolean {
  const ipv4Parts = host.split(".");
  if (ipv4Parts.length === 4 && ipv4Parts.every((p) => /^\d+$/.test(p) && Number(p) >= 0 && Number(p) <= 255)) {
    return true;
  }
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(host);
}

async function scanPort(host: string, port: number, _timeoutMs: number): Promise<"open" | "closed"> {
  try {
    const conn = await Deno.connect({ hostname: host, port: port, transport: "tcp" });
    conn.close();
    return "open";
  } catch (_err) {
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
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body: ScanRequest = await req.json();
    const host = (body.host || "").trim();

    if (!host || !validateHost(host)) {
      return new Response(JSON.stringify({ error: "Invalid host. Provide a valid IP address or hostname." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ports = body.ports && Array.isArray(body.ports) && body.ports.length > 0
      ? body.ports.filter((p) => p > 0 && p <= 65535)
      : COMMON_PORTS;

    const timeoutMs = body.timeoutMs && body.timeoutMs > 0 && body.timeoutMs <= 10000
      ? Math.min(body.timeoutMs, 3000)
      : 1500;

    const totalPorts = ports.length;
    const encoder = new TextEncoder();
    const results: { port: number; status: "open" | "closed"; service: string }[] = [];

    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(sseData({
          type: "start", host, totalPorts, ports, timestamp: Date.now(),
        })));

        const BATCH_SIZE = 8;
        for (let i = 0; i < ports.length; i += BATCH_SIZE) {
          const batch = ports.slice(i, i + BATCH_SIZE);
          const batchResults = await Promise.all(
            batch.map(async (port) => {
              const status = await scanPort(host, port, timeoutMs);
              return { port, status, service: SERVICE_NAMES[port] || "Unknown" };
            })
          );

          for (const r of batchResults) {
            results.push(r);
            const scanned = results.length;
            controller.enqueue(encoder.encode(sseData({
              type: "port", port: r.port, status: r.status, service: r.service, scanned, total: totalPorts,
            })));
          }
        }

        const openCount = results.filter((r) => r.status === "open").length;
        const closedCount = results.filter((r) => r.status === "closed").length;

        controller.enqueue(encoder.encode(sseData({
          type: "complete", host, totalPorts, openCount, closedCount, durationMs: 0, results, timestamp: Date.now(),
        })));

        controller.close();
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

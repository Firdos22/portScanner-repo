/*
 * Nmap Edge Function — Real Nmap Execution Backend
 *
 * Executes the real nmap binary with strict argument allowlisting.
 * Streams terminal output via SSE. Parses results into structured JSON.
 * Supports: -sS, -sT, -sU, -sV, -O, -A, -sC, -sn, -Pn, -p, -F, --top-ports,
 * -T1-T5, --script, --version-intensity, -n, -v, --reason, --open.
 *
 * Security: Arguments are validated against an allowlist. No shell interpolation.
 * The nmap binary is invoked via Deno.Command with an array of args — never shell.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ─── Argument allowlist ───

const ALLOWED_FLAGS = new Set([
  "-sS", "-sT", "-sU", "-sV", "-O", "-A", "-sC", "-sn", "-Pn", "-F",
  "-n", "-v", "-vv", "--reason", "--open", "-T1", "-T2", "-T3", "-T4", "-T5",
  "--version-intensity", "-R", "-r", "-f", "--traceroute",
]);

const ALLOWED_PREFIXES = [
  "-p", "--top-ports", "--script", "--script-args",
  "--max-rtt-timeout", "--max-retries", "--host-timeout",
  "--scan-delay", "--max-scan-delay", "--min-rate", "--max-rate",
  "--version-intensity", "--data-length", "--source-port",
  "-S", "-e", "-g", "--exclude", "--exclude-ports",
];

function validateArg(arg: string): boolean {
  if (ALLOWED_FLAGS.has(arg)) return true;
  if (ALLOWED_PREFIXES.some((p) => arg.startsWith(p + "="))) return true;
  if (ALLOWED_PREFIXES.some((p) => arg === p)) return true;
  // Port spec without flag (shouldn't happen but safe)
  if (/^\d+(-\d+)?(,\d+(-\d+)?)*$/.test(arg)) return true;
  return false;
}

function validateTarget(target: string): boolean {
  const t = target.trim();
  if (!t) return false;
  // IPv4
  const ipv4 = t.split("/");
  const ip = ipv4[0];
  const cidr = ipv4.length > 1 ? ipv4[1] : undefined;
  const ipParts = ip.split(".");
  if (ipParts.length === 4 && ipParts.every((p) => /^\d+$/.test(p) && +p >= 0 && +p <= 255)) {
    if (cidr !== undefined) return /^\d+$/.test(cidr) && +cidr >= 0 && +cidr <= 32;
    return true;
  }
  // IPv6 simplified
  if (t.includes(":") && /^[0-9a-fA-F:\/]+$/.test(t)) return true;
  // Hostname
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(t);
}

interface NmapRequest {
  target: string;
  args?: string[];
  timeout?: number;
}

// ─── Nmap output parsing ───

interface ParsedPort {
  port: number;
  protocol: string;
  state: string;
  service: string;
  version: string;
}
interface ParsedHost {
  host: string;
  ip: string;
  state: string;
  os: string;
  ports: ParsedPort[];
}
interface PmapResult {
  hosts: ParsedHost[];
  rawOutput: string;
  exitCode: number;
  duration: string;
  command: string;
  nmapAvailable: boolean;
}

function parseNmapOutput(raw: string): ParsedHost[] {
  const hosts: ParsedHost[] = [];
  const lines = raw.split("\n");
  let currentHost: ParsedHost | null = null;
  let inPortsTable = false;

  for (const line of lines) {
    // Host line: "Nmap scan report for example.com (1.2.3.4)"
    const hostMatch = line.match(/^Nmap scan report for\s+(.+)/i);
    if (hostMatch) {
      if (currentHost) hosts.push(currentHost);
      const rest = hostMatch[1].trim();
      const ipMatch = rest.match(/\(([^)]+)\)$/);
      const ip = ipMatch ? ipMatch[1] : rest;
      const hostname = ipMatch ? rest.replace(/\s*\([^)]+\)$/, "") : "";
      currentHost = { host: hostname || ip, ip, state: "up", os: "", ports: [] };
      inPortsTable = false;
      continue;
    }

    // Host status
    if (currentHost && /Host is up/i.test(line)) currentHost.state = "up";
    if (currentHost && /Host is down/i.test(line)) currentHost.state = "down";

    // Port table header
    if (/^PORT\s+STATE\s+SERVICE/i.test(line) || /^PORT\s+STATE\s+SERVICE\s+VERSION/i.test(line)) {
      inPortsTable = true;
      continue;
    }

    if (inPortsTable && currentHost) {
      // Port line: "22/tcp   open  ssh     OpenSSH 8.9"
      const portMatch = line.match(/^(\d+)\/(tcp|udp)\s+(\w+)\s+(\S+)(?:\s+(.*))?$/i);
      if (portMatch) {
        currentHost.ports.push({
          port: parseInt(portMatch[1]),
          protocol: portMatch[2].toLowerCase(),
          state: portMatch[3].toLowerCase(),
          service: portMatch[4],
          version: portMatch[5]?.trim() || "",
        });
      } else if (line.trim() === "" || /^MAC Address/i.test(line)) {
        inPortsTable = false;
      }
    }

    // OS detection
    if (currentHost && /OS details:/i.test(line)) {
      currentHost.os = line.replace(/.*OS details:\s*/i, "").trim();
    }
    if (currentHost && /Running:/i.test(line)) {
      const osLine = line.replace(/.*Running:\s*/i, "").trim();
      if (!currentHost.os) currentHost.os = osLine;
    }
  }
  if (currentHost) hosts.push(currentHost);
  return hosts;
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
    const body: NmapRequest = await req.json();
    const target = (body.target || "").trim();
    const userArgs = body.args || [];
    const timeoutMs = body.timeout && body.timeout > 0 ? Math.min(body.timeout, 120000) : 60000;

    if (!target || !validateTarget(target)) {
      return new Response(JSON.stringify({ error: "Invalid target. Provide a valid IP, hostname, or CIDR." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate all args against allowlist
    for (const arg of userArgs) {
      if (!validateArg(arg)) {
        return new Response(JSON.stringify({ error: `Disallowed nmap argument: "${arg}". Only standard scan flags are permitted.` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Check if nmap is available
    let nmapPath = "nmap";
    const whichCheck = new Deno.Command("which", { args: ["nmap"], stdout: "piped", stderr: "piped" });
    const whichResult = await whichCheck.output();
    if (whichResult.code !== 0) {
      nmapPath = ""; // nmap not found
    } else {
      nmapPath = new TextDecoder().decode(whichResult.stdout).trim() || "nmap";
    }

    const encoder = new TextEncoder();

    if (!nmapPath) {
      // Nmap unavailable — return clear status, no fake results
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(sseData({
            type: "status", nmapAvailable: false,
            message: "Nmap is not installed on the server. Cannot perform real nmap scans.",
          })));
          controller.enqueue(encoder.encode(sseData({
            type: "complete", nmapAvailable: false, hosts: [], rawOutput: "",
            exitCode: -1, duration: "0s", command: "",
          })));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
      });
    }

    // Build nmap command
    const nmapArgs = [...userArgs, target];
    const commandStr = `nmap ${nmapArgs.join(" ")}`;

    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(sseData({
          type: "start", command: commandStr, target, nmapAvailable: true, args: nmapArgs,
        })));

        try {
          const cmd = new Deno.Command(nmapPath, {
            args: nmapArgs,
            stdout: "piped",
            stderr: "piped",
          });

          const child = cmd.spawn();
          const stdoutReader = child.stdout.getReader();
          const stderrReader = child.stderr.getReader();
          const decoder = new TextDecoder();
          let fullOutput = "";
          let fullStderr = "";
          let timedOut = false;

          const timer = setTimeout(() => {
            timedOut = true;
            try { child.kill("SIGTERM"); } catch { /* ignore */ }
          }, timeoutMs);

          // Read stdout and stderr concurrently
          const readLoop = async (reader: ReadableStreamDefaultReader<Uint8Array>, isStderr: boolean) => {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const text = decoder.decode(value, { stream: true });
              if (isStderr) {
                fullStderr += text;
              } else {
                fullOutput += text;
              }
              controller.enqueue(encoder.encode(sseData({
                type: isStderr ? "stderr" : "stdout",
                data: text,
              })));
            }
          };

          await Promise.all([readLoop(stdoutReader, false), readLoop(stderrReader, true)]);
          const status = await child.status();
          clearTimeout(timer);

          const rawOutput = fullOutput + (fullStderr ? "\n--- STDERR ---\n" + fullStderr : "");
          const hosts = parseNmapOutput(fullOutput);
          const durationMatch = fullOutput.match(/scanned in ([\d.]+s)/i);
          const duration = durationMatch ? durationMatch[1] : "unknown";

          if (timedOut) {
            controller.enqueue(encoder.encode(sseData({
              type: "timeout", message: `Scan timed out after ${timeoutMs / 1000}s.`,
            })));
          }

          controller.enqueue(encoder.encode(sseData({
            type: "complete",
            nmapAvailable: true,
            hosts,
            rawOutput,
            exitCode: status.code,
            duration,
            command: commandStr,
            stderr: fullStderr,
          })));
        } catch (err) {
          controller.enqueue(encoder.encode(sseData({
            type: "error", message: `Failed to execute nmap: ${(err as Error).message}`,
          })));
        }
        controller.close();
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

/*
 * Nmap-Style Scanner Edge Function
 *
 * Supabase Edge Runtime cannot spawn subprocesses (no Deno.Command for nmap).
 * This function performs REAL TCP connect scanning via Deno.connect() — the same
 * technique as the existing port-scanner — but formats output in nmap terminal style.
 *
 * Supports nmap-style flags: -sT, -sn, -Pn, -p, -F, --top-ports, -T1-T5, --open, -n.
 * Flags like -sS, -sU, -O, -sV, -A, -sC require raw sockets / subprocess access and
 * are noted as unsupported in this environment (real TCP connect scan still runs).
 *
 * Streams nmap-style terminal output via SSE.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ─── Port lists ───

const TOP100 = [7,9,13,21,22,23,25,26,37,53,79,80,81,88,106,110,111,113,119,135,139,143,144,179,199,389,427,443,444,445,465,513,514,515,543,544,548,554,587,631,646,873,990,993,995,1025,1026,1027,1028,1029,1110,1433,1720,1723,1755,1900,2000,2001,2049,2121,2717,3000,3128,3306,3389,4000,4001,4045,4899,5000,5009,5051,5060,5432,5900,5901,6000,6001,6646,7070,8000,8008,8009,8080,8081,8443,8888,9100,9999,10000,32768,32771,32772,32773,32774,32775,32776,32777,32778,32779,32780,32781,32782];

const TOP1000 = [
  7,9,13,21,22,23,25,26,37,53,79,80,81,82,83,84,85,88,106,110,111,113,119,135,139,143,144,179,199,389,427,443,444,445,465,513,514,515,543,544,548,554,587,631,646,873,990,993,995,1025,1026,1027,1028,1029,1110,1433,1720,1723,1755,1900,2000,2001,2049,2121,2717,3000,3128,3306,3389,4000,4001,4045,4899,5000,5009,5051,5060,5432,5900,5901,6000,6001,6646,7070,8000,8008,8009,8080,8081,8443,8888,9100,9999,10000,
  ...(() => { const r: number[] = []; for (let i = 32768; i <= 32782; i++) r.push(i); return r; })(),
  1352,1414,1431,1443,1494,1500,1503,1521,1533,1604,1641,1645,1701,1717,1720,1755,1761,1783,1801,1810,1900,2002,2049,2179,2222,2375,2376,2500,2535,2601,2604,2638,2725,2967,3000,3050,3128,3268,3269,3306,3493,3632,3690,3702,4000,4045,4321,4660,5000,5001,5051,5060,5093,5222,5269,5351,5353,5432,5500,5555,5666,5672,5673,5683,5800,5900,5984,6000,6379,6660,6661,6662,6663,6664,6665,6666,6667,6668,6669,7000,7001,7019,7070,7547,7660,7777,8000,8001,8002,8008,8009,8010,8020,8080,8081,8086,8088,8090,8161,8200,8222,8333,8443,8484,8500,8530,8531,8649,8834,8880,8888,8889,9000,9001,9002,9009,9042,9080,9090,9091,9100,9200,9300,9418,9990,9991,9998,9999,10000,10001,10050,10051,11211,15672,18080,19999,20000,22222,27015,27017,27018,27019,27036,28017,49152,49153,49154,49155,49156,49157
];

const SERVICE_NAMES: Record<number, string> = {
  7:"echo",9:"discard",13:"daytime",21:"ftp",22:"ssh",23:"telnet",25:"smtp",26:"smtp",37:"time",53:"domain",79:"finger",80:"http",81:"http",82:"http",83:"http",84:"http",85:"http",88:"kerberos-sec",106:"pop3pw",110:"pop3",111:"rpcbind",113:"ident",119:"nntp",135:"msrpc",139:"netbios-ssn",143:"imap",144:"news",179:"bgp",199:"smux",389:"ldap",427:"svrloc",443:"https",444:"snpp",445:"microsoft-ds",465:"smtps",513:"login",514:"shell",515:"printer",543:"klogin",544:"kshell",548:"afpovertcp",554:"rtsp",587:"submission",631:"ipp",646:"ldp",873:"rsync",990:"ftps",993:"imaps",995:"pop3s",1025:"NFS-or-IIS",1026:"LSA-or-nfs",1027:"IIS",1028:"unknown",1029:"unknown",1110:"nfsd-keepalive",1352:"lotusnotes",1414:"ibm-mqseries",1431:"reverse-ssh",1433:"ms-sql-s",1443:"ies-lm",1494:"ica",1500:"vlsi-lm",1503:"imtc-mcs",1521:"ncube-lm",1533:"virtual-places",1604:"icabrowser",1641:"invision",1645:"datametrics",1701:"L2TP",1717:"fj-hdnet",1720:"h323hostcall",1723:"pptp",1755:"ms-streaming",1761:"cft-0",1783:"fj-hdnet",1801:"msmq",1810:"jerand-lm",1900:"upnp",2000:"cisco-sccp",2001:"dc",2002:"globe",2049:"nfs",2121:"iprop",2179:"vmrdp",2222:"EtherNet/IP-1",2375:"docker",2376:"docker-swarm",2500:"rtsserv",2535:"madcap",2601:"zebra",2604:"ospfd",2638:"sybase",2725:"ms-olap3",2967:"symantec-av",3000:"ppp",3050:"gds_db",3128:"squid-http",3268:"msrpc",3269:"globalcatLDAP",3306:"mysql",3493:"nut",3632:"distcc",3690:"svn",3702:"ws-discovery",4000:"remoteanything",4045:"lockd",4321:"rwhois",4660:"symbian-sql-remote",5000:"upnp",5001:"commplex-link",5051:"ida-agent",5060:"sip",5093:"sentlm-srv2srv",5222:"xmpp-client",5269:"xmpp-server",5351:"nat-pmp",5353:"mdns",5432:"postgresql",5500:"fcp-addr-srvr1",5555:"freeciv",5666:"nrpe",5672:"amqp",5673:"amqps",5683:"coap",5800:"vnc-http",5900:"vnc",5984:"couchdb",6000:"X11",6379:"redis",6660:"irc",6661:"irc",6662:"irc",6663:"irc",6664:"irc",6665:"irc",6666:"irc",6667:"irc",6668:"irc",6669:"irc",7000:"afs3-fileserver",7001:"afs3-callback",7019:"doceri-ctl",7070:"realserver",7547:"cwmp",7660:"tcs-shell",7777:"cbt",8000:"irdmi",8001:"vcom-tunnel",8002:"teradataordbms",8008:"http",8009:"ajp13",8010:"xmpp",8020:"intu-ec-svcdisc",8080:"http-proxy",8081:"blackice-icecap",8086:"d-s-n",8088:"radan-http",8090:"opsmessaging",8161:"patrol",8200:"trivnet1",8222:"admin",8333:"bitcoin",8443:"https-alt",8484:"intermapper",8500:"fmtp",8530:"rome",8531:"secure-rome",8649:"gpib",8834:"aquarids-fish",8880:"cddbp-alt",8888:"ddi-tcp-1",8889:"ddi-tcp-2",9000:"cslistener",9001:"tor-orport",9002:"dbsync",9009:"pichat",9042:"tomcat",9080:"glrpc",9090:"websm",9091:"xmltec-xmlmail",9100:"jetdirect",9200:"wap-wsp",9300:"vrace",9418:"git",9990:"osm-appsrvr",9991:"osm-oev",9998:"distinct32",9999:"abyss",10000:"snet-sensor",10001:"scp-config",10050:"zabbix-agent",10051:"zabbix-trapper",11211:"memcache",15672:"unknown",18080:"unknown",19999:"dnp-sec",20000:"dnp",22222:"easyengine",27015:"steam",27017:"mongod",27018:"mongod",27019:"mongod",27036:"steam",28017:"http",49152:"unknown",49153:"unknown",49154:"unknown",49155:"unknown",49156:"unknown",49157:"unknown",
};

// ─── Timing presets ───

const TIMING: Record<string, { timeout: number; concurrency: number; delay: number }> = {
  "-T1": { timeout: 5000, concurrency: 1, delay: 300 },
  "-T2": { timeout: 3000, concurrency: 2, delay: 150 },
  "-T3": { timeout: 2000, concurrency: 5, delay: 50 },
  "-T4": { timeout: 1000, concurrency: 15, delay: 0 },
  "-T5": { timeout: 500, concurrency: 30, delay: 0 },
};

// ─── Validation ───

function validateTarget(target: string): boolean {
  const t = target.trim();
  if (!t) return false;
  const cidrParts = t.split("/");
  const ip = cidrParts[0];
  const cidr = cidrParts.length > 1 ? cidrParts[1] : undefined;
  const ipParts = ip.split(".");
  if (ipParts.length === 4 && ipParts.every((p) => /^\d+$/.test(p) && +p >= 0 && +p <= 255)) {
    if (cidr !== undefined) return /^\d+$/.test(cidr) && +cidr >= 0 && +cidr <= 32;
    return true;
  }
  if (t.includes(":") && /^[0-9a-fA-F:\/]+$/.test(t)) return true;
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(t);
}

const ALLOWED_FLAGS = new Set([
  "-sS","-sT","-sU","-sV","-O","-A","-sC","-sn","-Pn","-F","-n","-v","-vv",
  "--reason","--open","-T1","-T2","-T3","-T4","-T5","--traceroute","-R","-r","-f",
]);
const ALLOWED_PREFIXES = ["-p","--top-ports","--script","--script-args","--max-rtt-timeout","--max-retries","--host-timeout","--scan-delay","--max-scan-delay","--min-rate","--max-rate","--version-intensity","--data-length","--source-port","-S","-e","-g","--exclude","--exclude-ports"];

function validateArg(arg: string): boolean {
  if (ALLOWED_FLAGS.has(arg)) return true;
  if (ALLOWED_PREFIXES.some((p) => arg.startsWith(p + "="))) return true;
  if (ALLOWED_PREFIXES.some((p) => arg === p)) return true;
  return false;
}

// ─── Parse args into scan config ───

interface ScanConfig {
  ports: number[];
  pingOnly: boolean;
  skipPing: boolean;
  onlyOpen: boolean;
  timeout: number;
  concurrency: number;
  delay: number;
  unsupportedFlags: string[];
}

function parseArgs(args: string[]): ScanConfig {
  const config: ScanConfig = {
    ports: TOP1000, pingOnly: false, skipPing: false, onlyOpen: false,
    timeout: 1000, concurrency: 10, delay: 0, unsupportedFlags: [],
  };

  for (const arg of args) {
    if (arg === "-sn") { config.pingOnly = true; config.ports = []; }
    else if (arg === "-Pn") config.skipPing = true;
    else if (arg === "-F") config.ports = TOP100;
    else if (arg === "--open") config.onlyOpen = true;
    else if (arg.startsWith("-T")) {
      const t = TIMING[arg];
      if (t) { config.timeout = t.timeout; config.concurrency = t.concurrency; config.delay = t.delay; }
    }
    else if (arg.startsWith("-p=")) {
      const spec = arg.slice(3);
      const ports = new Set<number>();
      for (const part of spec.split(",")) {
        const range = part.split("-");
        if (range.length === 2) { const a = +range[0], b = +range[1]; for (let p = a; p <= b; p++) ports.add(p); }
        else if (range.length === 1 && /^\d+$/.test(range[0])) ports.add(+range[0]);
      }
      config.ports = [...ports].sort((a, b) => a - b);
    }
    else if (arg.startsWith("--top-ports=")) {
      const n = Math.min(Math.max(+arg.slice(12), 1), 1000);
      config.ports = TOP1000.slice(0, n);
    }
    // Flags that require raw sockets / subprocess — note as unsupported but still scan
    else if (["-sS","-sU","-O","-A","-sC","-sV"].includes(arg)) {
      config.unsupportedFlags.push(arg);
    }
  }
  return config;
}

// ─── DNS resolution ───

async function resolveHost(host: string): Promise<{ ip: string; hostname: string } | null> {
  const t = host.trim();
  // Already an IP
  const parts = t.split(".");
  if (parts.length === 4 && parts.every((p) => /^\d+$/.test(p) && +p >= 0 && +p <= 255)) {
    return { ip: t, hostname: t };
  }
  try {
    const resp = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(t)}&type=A`);
    const data = await resp.json();
    const answer = data.Answer?.find((a: { type: number }) => a.type === 1);
    if (answer) return { ip: answer.data, hostname: t };
    return null;
  } catch {
    return null;
  }
}

// ─── Real TCP connect scan ───

async function scanPort(host: string, port: number, timeoutMs: number, signal?: AbortSignal): Promise<"open" | "closed" | "filtered"> {
  if (signal?.aborted) return "closed";
  try {
    const conn = await Promise.race([
      Deno.connect({ hostname: host, port, transport: "tcp" }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), timeoutMs)),
    ]);
    (conn as Deno.Conn).close();
    return "open";
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === "timeout" || msg.includes("timed out")) return "filtered";
    return "closed";
  }
}

// ─── SSE helpers ───

function sse(obj: Record<string, unknown>): string {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

interface ParsedPort { port: number; protocol: string; state: string; service: string; version: string; }
interface ParsedHost { host: string; ip: string; state: string; os: string; ports: ParsedPort[]; }

// ─── Main handler ───

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed. Use POST." }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const target = (body.target || "").trim();
    const userArgs: string[] = body.args || [];
    const timeoutMs = body.timeout && body.timeout > 0 ? Math.min(body.timeout, 90000) : 60000;

    if (!target || !validateTarget(target)) {
      return new Response(JSON.stringify({ error: "Invalid target. Provide a valid IP, hostname, or CIDR." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const arg of userArgs) {
      if (!validateArg(arg)) {
        return new Response(JSON.stringify({ error: `Disallowed nmap argument: "${arg}".` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const config = parseArgs(userArgs);
    const commandStr = `nmap ${[...userArgs, target].join(" ")}`;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: Record<string, unknown>) => controller.enqueue(encoder.encode(sse(obj)));

        send({ type: "start", command: commandStr, target });

        const startTime = Date.now();

        // Resolve hostname
        const resolved = await resolveHost(target);
        if (!resolved) {
          send({ type: "stdout", data: `Starting Nmap scan\nFailed to resolve "${target}".\n` });
          send({ type: "error", message: `Could not resolve hostname "${target}".` });
          controller.close();
          return;
        }

        // Build nmap-style header
        let output = "";
        output += `Starting Nmap scan ( https://nmap.org )\n`;
        output += `Nmap scan report for ${resolved.hostname === resolved.ip ? resolved.ip : `${resolved.hostname} (${resolved.ip})`}\n`;

        // Ping scan only
        if (config.pingOnly) {
          // Try connecting to a common port to check if host is up
          const up = await scanPort(resolved.ip, 80, 2000);
          const isUp = up !== "closed" || (await scanPort(resolved.ip, 443, 2000)) !== "closed";
          output += `Host is ${isUp ? "up" : "down"}\n`;
          output += `Nmap done: 1 IP address (${isUp ? "1 host up" : "0 hosts up"}) scanned in ${((Date.now() - startTime) / 1000).toFixed(2)}s\n`;
          send({ type: "stdout", data: output });

          const hosts: ParsedHost[] = [{ host: resolved.hostname, ip: resolved.ip, state: isUp ? "up" : "down", os: "", ports: [] }];
          send({ type: "complete", hosts, rawOutput: output, exitCode: 0, duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`, command: commandStr });
          controller.close();
          return;
        }

        // Host discovery (unless -Pn)
        if (!config.skipPing) {
          const pingResult = await scanPort(resolved.ip, 80, 2000);
          if (pingResult === "closed") {
            const ping2 = await scanPort(resolved.ip, 443, 2000);
            if (ping2 === "closed") {
              output += `Host is down. Use -Pn to skip ping and scan anyway.\n`;
              output += `Nmap done: 1 IP address (0 hosts up) scanned in ${((Date.now() - startTime) / 1000).toFixed(2)}s\n`;
              send({ type: "stdout", data: output });
              send({ type: "complete", hosts: [], rawOutput: output, exitCode: 0, duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`, command: commandStr });
              controller.close();
              return;
            }
          }
          output += `Host is up\n`;
        } else {
          output += `Host is up\n`;
        }

        // Note unsupported flags
        if (config.unsupportedFlags.length > 0) {
          output += `\nNote: ${config.unsupportedFlags.join(", ")} require raw socket access not available in this environment.\n`;
          output += `Performing TCP connect scan instead.\n`;
        }

        output += `Scanning ${config.ports.length} ports...\n\n`;
        send({ type: "stdout", data: output });
        output = "";

        // Port table header
        const tableHeader = `PORT     STATE    SERVICE\n`;
        output += tableHeader;
        send({ type: "stdout", data: tableHeader });

        const abortController = new AbortController();
        const results: ParsedPort[] = [];
        let scanned = 0;
        const total = config.ports.length;

        // Scan in batches
        for (let i = 0; i < config.ports.length; i += config.concurrency) {
          if (abortController.signal.aborted) break;

          const batch = config.ports.slice(i, i + config.concurrency);
          const batchResults = await Promise.all(
            batch.map(async (port) => {
              const state = await scanPort(resolved.ip, port, config.timeout, abortController.signal);
              return { port, state, service: SERVICE_NAMES[port] || "unknown" };
            })
          );

          for (const r of batchResults) {
            scanned++;
            if (config.onlyOpen && r.state !== "open") continue;

            const line = `${String(r.port).padEnd(8)} ${r.state.padEnd(8)} ${r.service}\n`;
            output += line;
            send({ type: "stdout", data: line });

            results.push({ port: r.port, protocol: "tcp", state: r.state, service: r.service, version: "" });
          }

          if (config.delay > 0) await new Promise((r) => setTimeout(r, config.delay));
        }

        // Summary
        const openCount = results.filter((r) => r.state === "open").length;
        const closedCount = results.filter((r) => r.state === "closed").length;
        const filteredCount = results.filter((r) => r.state === "filtered").length;

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        const summary = `\nNmap done: 1 IP address (1 host up) scanned in ${elapsed}s\n`;
        output += summary;
        send({ type: "stdout", data: summary });

        const hosts: ParsedHost[] = [{
          host: resolved.hostname,
          ip: resolved.ip,
          state: "up",
          os: "",
          ports: results,
        }];

        send({
          type: "complete",
          hosts,
          rawOutput: output,
          exitCode: 0,
          duration: `${elapsed}s`,
          command: commandStr,
        });

        controller.close();
      },
      cancel() { /* client disconnected */ },
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

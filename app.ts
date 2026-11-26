import express from "express";
import bodyParser from "body-parser";
import { randomBytes, timingSafeEqual } from "crypto";
import * as fs from "fs";
import * as fsPromises from "fs/promises";
import path from "path";

const { getAllGroupSettings, setGroupSetting } = require("./lib/db.js");
const { getMetrics, getRecentErrors, getSuggestions } = require("./lib/admin_data.js");
const { getRecentAdminActions, recordAdminAction } = require("./lib/admin_audit.js");
const { getOperationalStatus } = require("./lib/admin_status.js");
const {
  approvePendingUser,
  createAccessBackup,
  getAccessRegistry,
  normalizeId,
  restoreAccessBackup,
  setAuthorizationMode,
  setCommandEnabled,
  setGroupEnabled,
  setGroupUserBlocked,
  updateList,
} = require("./lib/access.js");
const { renderAdminPage } = require("./lib/admin_view.js");

const getCookie = (request: express.Request, name: string) => {
  const cookies = String(request.headers.cookie || "").split(";");
  const entry = cookies.map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(`${name}=`));
  return entry ? entry.slice(name.length + 1) : "";
};

const parseMetricFilters = (query: express.Request["query"]) => {
  const today = new Date().toISOString().slice(0, 10);
  const defaultFrom = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const from = typeof query.from === "string" && query.from ? query.from : defaultFrom;
  const to = typeof query.to === "string" && query.to ? query.to : today;
  const validDate = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  if (!validDate(from) || !validDate(to) || from > to) {
    return { error: "Rango de fechas inválido." as const };
  }
  const rawGroupId = typeof query.groupId === "string" ? query.groupId.trim() : "";
  const groupId = rawGroupId.toLowerCase() === "direct" ? "direct" : normalizeId(rawGroupId);
  const command = typeof query.command === "string" ? query.command.trim().slice(0, 100) : "";
  return { filters: { from, to, groupId, command } };
};

function createApp(commandsMap: Map<string, { name: string, alias: string[], description: string }>) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", true);
  app.use((request: express.Request, response: express.Response, next: express.NextFunction) => {
    response.set("X-Content-Type-Options", "nosniff");
    response.set("X-Frame-Options", "DENY");
    response.set("Referrer-Policy", "same-origin");
    response.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    response.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
    next();
  });
  const standardJsonParser = bodyParser.json();
  const restoreJsonParser = bodyParser.json({ limit: "15mb" });
  app.use((request: express.Request, response: express.Response, next: express.NextFunction) => {
    const parser = request.path === "/admin/restore" ? restoreJsonParser : standardJsonParser;
    parser(request, response, next);
  });
  app.use(
    bodyParser.urlencoded({
      extended: true,
    }),
  );

  const adminAuth = (request: express.Request, response: express.Response, next: express.NextFunction) => {
    const expectedUser = process.env.ADMIN_PANEL_USER;
    const expectedPassword = process.env.ADMIN_PANEL_PASSWORD;
    if (!expectedUser || !expectedPassword) {
      return response.status(503).send("Panel no configurado.");
    }
    const header = request.headers.authorization || "";
    if (!header.startsWith("Basic ")) {
      response.set("WWW-Authenticate", 'Basic realm="CyopnBot Admin"');
      return response.status(401).send("Autenticacion requerida.");
    }
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    const user = separator >= 0 ? decoded.slice(0, separator) : "";
    const password = separator >= 0 ? decoded.slice(separator + 1) : "";
    if (user !== expectedUser || password !== expectedPassword) {
      response.set("WWW-Authenticate", 'Basic realm="CyopnBot Admin"');
      return response.status(401).send("Credenciales invalidas.");
    }
    response.locals.adminUser = user;
    next();
  };

  const csrfProtection = (request: express.Request, response: express.Response, next: express.NextFunction) => {
    const cookieToken = getCookie(request, "cyopn_admin_csrf");
    const bodyToken = typeof request.body?._csrf === "string"
      ? request.body._csrf
      : typeof request.body?.csrfToken === "string"
        ? request.body.csrfToken
        : "";
    if (!/^[a-f0-9]{64}$/.test(cookieToken) || !/^[a-f0-9]{64}$/.test(bodyToken)) {
      return response.status(403).send("Token CSRF inválido.");
    }
    const sameToken = timingSafeEqual(Buffer.from(cookieToken), Buffer.from(bodyToken));
    if (!sameToken) return response.status(403).send("Token CSRF inválido.");
    const origin = request.get("origin");
    if (origin) {
      try {
        if (new URL(origin).host !== request.get("host")) {
          return response.status(403).send("Origen de solicitud inválido.");
        }
      } catch (_error) {
        return response.status(403).send("Origen de solicitud inválido.");
      }
    }
    next();
  };
  app.get("/", (request: express.Request, response: express.Response) => {
    response.json({ info: "En linea" });
  });

  app.get("/access", adminAuth, async (request: express.Request, response: express.Response) => {
    try {
      response.json(await getAccessRegistry());
    } catch (error) {
      response.status(500).json({ error: String(error) });
    }
  });

  app.get("/admin/backup", adminAuth, async (request: express.Request, response: express.Response) => {
    try {
      const backup = await createAccessBackup();
      response.set("Cache-Control", "no-store");
      response.set("Content-Disposition", `attachment; filename="cyopn-access-${new Date().toISOString().slice(0, 10)}.json"`);
      response.type("application/json").send(backup);
    } catch (error) {
      response.status(500).send(String(error));
    }
  });

  app.post("/admin/restore", adminAuth, csrfProtection, async (request: express.Request, response: express.Response) => {
    let restored: { groups: number; users: number };
    try {
      restored = await restoreAccessBackup(request.body?.backup);
    } catch (error) {
      return response.status(400).json({ error: String(error) });
    }
    try {
      await recordAdminAction({
        actor: response.locals.adminUser,
        action: "access-backup-restored",
        target: `${restored.groups} grupos, ${restored.users} usuarios`,
      });
      response.json({ success: true, restored });
    } catch (error) {
      response.status(500).json({
        error: `El respaldo fue restaurado, pero no se pudo registrar la acción administrativa: ${String(error)}`,
        restored,
      });
    }
  });

  app.get("/admin/metrics.csv", adminAuth, async (request: express.Request, response: express.Response) => {
    try {
      const parsed = parseMetricFilters(request.query);
      if ("error" in parsed) return response.status(400).send(parsed.error);
      const metrics = await getMetrics(parsed.filters) as {
        messages: Record<string, { total?: number; groups?: number; direct?: number }>;
        commands: Record<string, Record<string, { total?: number }>>;
      };
      const rows: Array<Array<string | number>> = [["fecha", "tipo", "grupo", "comando", "total", "grupos", "directos"]];
      for (const [day, value] of Object.entries(metrics.messages)) {
        rows.push([day, "mensajes", parsed.filters.groupId || "todos", "", value.total || 0, value.groups || 0, value.direct || 0]);
      }
      for (const [day, dailyCommands] of Object.entries(metrics.commands)) {
        for (const [command, value] of Object.entries(dailyCommands)) {
          rows.push([day, "comando", parsed.filters.groupId || "todos", command, Number(value?.total) || 0, "", ""]);
        }
      }
      const csv = rows.map((row) => row.map((value) => {
        const cell = String(value ?? "");
        const safeCell = /^[=+\-@]/.test(cell) ? `'${cell}` : cell;
        return `"${safeCell.replace(/"/g, '""')}"`;
      }).join(",")).join("\r\n");
      response.set("Cache-Control", "no-store");
      response.set("Content-Disposition", `attachment; filename="cyopn-metricas-${parsed.filters.from}-${parsed.filters.to}.csv"`);
      response.type("text/csv; charset=utf-8").send(`\uFEFF${csv}`);
    } catch (error) {
      response.status(500).send(String(error));
    }
  });

  app.get("/admin", adminAuth, async (request: express.Request, response: express.Response) => {
    try {
      const parsed = parseMetricFilters(request.query);
      if ("error" in parsed) return response.status(400).send(parsed.error);
      let csrfToken = getCookie(request, "cyopn_admin_csrf");
      if (!/^[a-f0-9]{64}$/.test(csrfToken)) csrfToken = randomBytes(32).toString("hex");
      const secureCookie = request.secure ? "; Secure" : "";
      response.set("Set-Cookie", `cyopn_admin_csrf=${csrfToken}; Path=/admin; SameSite=Strict; HttpOnly${secureCookie}`);
      response.set("Cache-Control", "no-store");
      const registry = await getAccessRegistry();
      registry.groupSettings = await getAllGroupSettings();
      registry.groups = Object.fromEntries(Object.entries(registry.groups).map(([id, group]) => [id, { ...(group as Record<string, any>), settings: registry.groupSettings[id] || {} }]));
      registry.metrics = await getMetrics(parsed.filters);
      registry.metricsFilter = parsed.filters;
      registry.errors = await getRecentErrors();
      registry.suggestions = await getSuggestions();
      registry.audit = await getRecentAdminActions();
      registry.operationalStatus = getOperationalStatus();
      const commandList = Array.from(commandsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      response.send(renderAdminPage({ ...registry, commands: commandList, csrfToken }));
    } catch (error) {
      response.status(500).send(String(error));
    }
  });

  app.post("/admin/access", adminAuth, csrfProtection, async (request: express.Request, response: express.Response) => {
    try {
      const { action, list, value } = request.body || {};
      let auditAction = "";
      let target = "";
      if (action === "authorization-mode" && !await setAuthorizationMode(request.body.mode)) {
        return response.status(400).send("Modo de autorización inválido.");
      }
      if (action === "approve-user" && !await approvePendingUser(request.body.userId)) {
        return response.status(409).send("El usuario ya no está pendiente de autorización.");
      }
      if (action === "authorization-mode") {
        auditAction = "authorization-mode";
        target = request.body.mode;
      }
      if (action === "approve-user") {
        auditAction = "user-approved";
        target = request.body.userId;
      }
      if (action === "group") {
        await setGroupEnabled(request.body.groupId, request.body.enabled === "true");
        auditAction = request.body.enabled === "true" ? "group-allowed" : "group-blocked";
        target = request.body.groupId;
      }
      if (action === "participant") {
        await setGroupUserBlocked(request.body.groupId, request.body.userId, request.body.blocked === "true");
        auditAction = request.body.blocked === "true" ? "participant-blocked" : "participant-allowed";
        target = `${request.body.userId} @ ${request.body.groupId}`;
      }
      if (action === "group-setting") {
        await setGroupSetting(request.body.groupId, request.body.setting, request.body.value === "true");
        auditAction = "group-setting";
        target = `${request.body.groupId}: ${request.body.setting}=${request.body.value}`;
      }
      if (action === "user") {
        await updateList("blacklistUsers", request.body.userId, request.body.allowed === "true" ? "remove" : "add");
        auditAction = request.body.allowed === "true" ? "user-allowed" : "user-blocked";
        target = request.body.userId;
      }
      if (action === "add" && ["blacklistGroups", "blacklistUsers"].includes(list)) {
        await updateList(list, value, "add");
        auditAction = "blacklist-added";
        target = `${list}: ${value}`;
      }
      if (action === "remove" && ["blacklistGroups", "blacklistUsers"].includes(list)) {
        await updateList(list, value, "remove");
        auditAction = "blacklist-removed";
        target = `${list}: ${value}`;
      }
      if (auditAction) {
        await recordAdminAction({ actor: response.locals.adminUser, action: auditAction, target });
      }
      response.redirect("/admin");
    } catch (error) {
      response.status(500).send(String(error));
    }
  });

  app.post("/admin/commands", adminAuth, csrfProtection, async (request: express.Request, response: express.Response) => {
    try {
      const { command, enabled } = request.body || {};
      if (Array.from(commandsMap.values()).some((item) => item.name === command)) {
        await setCommandEnabled(command, enabled === "true");
        await recordAdminAction({
          actor: response.locals.adminUser,
          action: enabled === "true" ? "command-enabled" : "command-disabled",
          target: command,
        });
      }
      response.redirect("/admin");
    } catch (error) {
      response.status(500).send(String(error));
    }
  });

  app.use('/temp', express.static(path.join(__dirname, 'temp')));

  app.get('/yt/formats/:filename', (req: express.Request, res: express.Response) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'temp', filename);

    fs.access(filePath, fs.constants.F_OK, (err: NodeJS.ErrnoException | null) => {
      if (err) {
        return res.status(404).send('Formato de archivo no encontrado o el archivo ha expirado');
      }

      fs.readFile(filePath, 'utf8', (err: NodeJS.ErrnoException | null, data: string) => {
        if (err) {
          return res.status(500).send('Error al leer el formato de archivo');
        }

        let formatData;
        try {
          formatData = JSON.parse(data);
        } catch (e) {
          return res.status(500).send('Formato de archivo inválido');
        }

        let formats: any[] = [];
        if (formatData && formatData.formats) {
          formats = formatData.formats;
        } else if (Array.isArray(formatData)) {
          formats = formatData;
        } else {
          return res.status(500).send('Estructura de formato de archivo no reconocida');
        }

        const metadata = formatData && formatData._metadata ? formatData._metadata : {};
        const escapeHtml = (value: any) => String(value ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
        const hasAudio = (format: any) => format.acodec && format.acodec !== 'none';
        const hasVideo = (format: any) => format.vcodec && format.vcodec !== 'none';
        const hasKnownSize = (format: any) => Number(format.filesize || format.filesize_approx) > 0;
        const videoFormats = formats
          .filter((format: any) => hasVideo(format))
          .filter((format: any) => hasKnownSize(format))
          .filter((format: any, index: number, availableFormats: any[]) => availableFormats.findIndex((candidate: any) => hasKnownSize(candidate) && `${candidate.height || 0}:${candidate.fps || 0}` === `${format.height || 0}:${format.fps || 0}`) === index)
          .sort((a: any, b: any) => (Number(b.height) || 0) - (Number(a.height) || 0) || (Number(b.fps) || 0) - (Number(a.fps) || 0) || (Number(b.tbr) || 0) - (Number(a.tbr) || 0));
        const audioFormats = formats
          .filter((format: any) => hasAudio(format) && !hasVideo(format))
          .filter((format: any) => hasKnownSize(format))
          .sort((a: any, b: any) => (Number(b.abr) || Number(b.tbr) || Number(b.bitrate) || 0) - (Number(a.abr) || Number(a.tbr) || Number(a.bitrate) || 0));
        const formatRow = (format: any, type: 'video' | 'audio') => {
          const quality = type === 'video'
            ? (format.height ? `${format.height}p${format.fps ? ` · ${format.fps} fps` : ''}` : (format.format_note || 'Video'))
            : `${Math.round(Number(format.abr || format.tbr || format.bitrate / 1000) || 0)} kbps`;
          const details = type === 'video'
            ? `${format.ext || 'N/A'} · ${format.vcodec && format.vcodec !== 'none' ? format.vcodec : 'video'}${hasAudio(format) ? ` + ${format.acodec}` : ''}`
            : `MP3 · fuente ${format.ext || 'audio'} · ${format.acodec || 'audio'}`;
          return `
          <article class="format-row">
            <div class="quality"><strong>${escapeHtml(quality)}</strong><span>${escapeHtml(details)}</span></div>
            <span class="format-size">${(format.filesize || format.filesize_approx) ? `${((format.filesize || format.filesize_approx) / (1024 * 1024)).toFixed(1)} MB` : 'Tamaño variable'}</span>
            <a class="download-btn" href="/yt/download/${encodeURIComponent(filename)}?format_id=${encodeURIComponent(format.format_id)}" aria-label="Descargar ${escapeHtml(quality)}">Descargar</a>
          </article>`;
        };
        const renderSection = (title: string, type: 'video' | 'audio', availableFormats: any[]) => `
        <section class="format-section">
          <div class="section-heading"><h2>${title}</h2><span>${availableFormats.length} opciones</span></div>
          ${availableFormats.length ? availableFormats.map((format: any) => formatRow(format, type)).join('') : '<p class="empty">No hay formatos disponibles.</p>'}
        </section>`;

        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>${escapeHtml(metadata.title || 'Video de YouTube')}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
    :root { color-scheme: light; --ink: #182235; --muted: #718096; --line: #e5e9f0; --accent: #246bfd; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; background: #f5f7fb; color: var(--ink); font-family: Arial, sans-serif; }
    .page { width: min(100% - 28px, 620px); margin: 34px auto; }
    .card { overflow: hidden; background: white; border: 1px solid #e7ebf2; border-radius: 12px; box-shadow: 0 12px 35px rgba(27, 43, 72, .09); }
    .hero { padding: 22px 22px 18px; text-align: center; }
    .thumbnail { display: block; width: min(100%, 360px); aspect-ratio: 16 / 9; object-fit: cover; margin: 0 auto 18px; border-radius: 7px; background: #dfe5ee; }
    .thumbnail-fallback { display: grid; place-items: center; color: #98a5b8; font-size: 36px; }
    h1 { margin: 0; font-size: clamp(20px, 4vw, 28px); line-height: 1.2; }
    .subtitle { margin: 8px 0 0; color: var(--muted); font-size: 13px; }
    .format-section { border-top: 1px solid var(--line); }
    .section-heading { display: flex; align-items: center; justify-content: space-between; padding: 15px 20px 10px; background: #f8f9fc; }
    h2 { margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: .08em; }
    .section-heading span { color: var(--muted); font-size: 12px; }
    .format-row { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 14px; min-height: 68px; padding: 11px 20px; border-top: 1px solid var(--line); }
    .quality { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
    .quality strong { font-size: 15px; }
    .quality span, .format-size { color: var(--muted); font-size: 12px; }
    .format-size { white-space: nowrap; }
    .download-btn { display: inline-flex; align-items: center; justify-content: center; padding: 6px 12px; border: 1px solid var(--accent); border-radius: 5px; color: var(--accent); font-size: 13px; font-weight: 500; line-height: 1; text-decoration: none; white-space: nowrap; }
    .download-btn:hover { background: var(--accent); color: white; }
    .empty { margin: 0; padding: 18px 20px; color: var(--muted); font-size: 13px; }
    @media (max-width: 460px) { .page { width: min(100% - 16px, 620px); margin: 16px auto; } .hero { padding: 16px 14px; } .format-row { padding: 10px 14px; gap: 8px; } .format-size { display: none; } .download-btn { padding: 6px 10px; font-size: 12px; } }
</style>
</head>
<body>
    <main class="page"><div class="card">
      <header class="hero">
        ${metadata.thumbnail ? `<img class="thumbnail" src="${escapeHtml(metadata.thumbnail)}" alt="Miniatura del video">` : '<div class="thumbnail thumbnail-fallback" role="img" aria-label="Sin miniatura">▶</div>'}
        <h1>${escapeHtml(metadata.title || 'Video de YouTube')}</h1>
        <p class="subtitle">Selecciona la calidad que quieres descargar</p>
      </header>
      ${renderSection('Video', 'video', videoFormats)}
      ${renderSection('Audio', 'audio', audioFormats)}
    </div></main>
</body>
</html>
            `;

        res.send(html);
      });
    });
  });

  app.get('/yt/download/:filename', async (req: express.Request, res: express.Response) => {
    try {
      const filename = req.params.filename;
      const formatId = req.query.format_id as string;

      if (!formatId) {
        return res.status(400).send('Id de formato no proporcionado');
      }

      const filePath = path.join(__dirname, 'temp', filename);

      try {
        await fsPromises.access(filePath);
      } catch (err) {
        return res.status(404).send('Formato de archivo no encontrado o el archivo ha expirado');
      }

      let data: string;
      try {
        data = await fsPromises.readFile(filePath, 'utf8');
      } catch (err) {
        return res.status(500).send('Error al leer el formato de archivo');
      }

      let formatData: any;
      try {
        formatData = JSON.parse(data);
      } catch (e) {
        return res.status(500).send('Formato de archivo inválido');
      }

      let youtubeUrl = '';
      let formats: any[] = [];

      if (formatData && formatData._metadata && formatData._metadata.url) {
        youtubeUrl = formatData._metadata.url;
        formats = formatData.formats || [];
      }
      else if (Array.isArray(formatData)) {
        return res.send(`
          <p>Error: Este enlace ha expirado o es demasiado antiguo para recuperar la URL original.</p>
          <p>Por favor, use el comando !ytmp4 para descargas directas, o genere un nuevo enlace con !yt.</p>
      `);
      } else {
        return res.send(`
          <p>Error: Formato de archivo no reconocido.</p>
          <p>Por favor, use el comando !ytmp4 para descargas directas, o genere un nuevo enlace con !yt.</p>
      `);
      }

      if (!youtubeUrl) {
        return res.send(`
          <p>Error: URL de YouTube no encontrada en los metadatos.</p>
          <p>Por favor, use el comando !ytmp4 para descargas directas, o genere un nuevo enlace con !yt.</p>
      `);
      }

      const { YtDlp } = require('ytdlp-nodejs');
      const ytdlp = new YtDlp();

      const selectedFormat = formats.find((f: any) => f.format_id === formatId);
      if (!selectedFormat) {
        return res.status(400).send(`Id ${formatId} no encontrado en el archivo.`);
      }
      const isAudioOnly = selectedFormat.acodec && selectedFormat.acodec !== 'none'
        && (!selectedFormat.vcodec || selectedFormat.vcodec === 'none');

      const tempname = `yt_download_${Date.now()}`;
      const tempDir = path.join(__dirname, 'temp');

      try {
        await fsPromises.mkdir(tempDir, { recursive: true });
      } catch (err) {
      }

      let result: any;
      try {

        if (isAudioOnly) {
          result = await ytdlp.downloadAudio(youtubeUrl, 'mp3', {
            output: path.join(tempDir, `${tempname}.%(ext)s`),
            audioQuality: '0', 
            cookies: fs.readFileSync('./youtube_cookies.txt', 'utf-8')
          });
        } else if (selectedFormat.url &&
          (selectedFormat.protocol === 'http:' || selectedFormat.protocol === 'https:')) {

          const https = require('https');
          const http = require('http');

          const client = selectedFormat.url.startsWith('https://') ? https : http;
          const filePath = path.join(tempDir, `${tempname}.${selectedFormat.ext}`);

          await new Promise((resolve, reject) => {
            const file = fs.createWriteStream(filePath);
            client.get(selectedFormat.url, (response) => {
              if (response.statusCode !== 200) {
                file.close();
                fs.unlink(filePath, () => { });
                reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                return;
              }

              response.pipe(file);
              file.on('finish', () => {
                file.close(() => resolve({ filePaths: [filePath] }));
              });
            }).on('error', (err) => {
              fs.unlink(filePath, () => reject(err));
            });
          });

          result = { filePaths: [filePath] };
        } else {
            const downloadAttempts = [
            () => ytdlp.downloadVideo(youtubeUrl, formatId, { output: path.join(tempDir, `${tempname}.%(ext)s`), cookies: fs.readFileSync('./youtube_cookies.txt', 'utf-8') }),
            () => ytdlp.downloadVideo(youtubeUrl, `best[format_id=${formatId}]`, { output: path.join(tempDir, `${tempname}.%(ext)s`), cookies: fs.readFileSync('./youtube_cookies.txt', 'utf-8') }),
            () => ytdlp.downloadVideo(youtubeUrl, "best", { output: path.join(tempDir, `${tempname}.%(ext)s`), cookies: fs.readFileSync('./youtube_cookies.txt', 'utf-8') })
          ];

          let lastError: any;
          for (let i = 0; i < downloadAttempts.length; i++) {
            try {
              result = await downloadAttempts[i]();
              break;
            } catch (err: any) {
              lastError = err;
              if (i === downloadAttempts.length - 1) {
                throw lastError;
              }
            }
          }
        }
      } catch (error: any) {
        return res.status(500).send(`Error de descarga`);
      }

      let originalPath = result.filePaths[0];
      let outputPath = originalPath.replace(/\.[^/.]+$/, isAudioOnly ? ".mp3" : ".mp4");

      const { execSync } = require("child_process");
      if (originalPath !== outputPath) {
        try {
          const conversionOptions = isAudioOnly
            ? '-vn -c:a libmp3lame -q:a 0'
            : '-c:v copy -c:a aac -strict experimental';
          execSync(`ffmpeg -y -i "${originalPath}" ${conversionOptions} "${outputPath}"`);
        } catch (error: any) {
          outputPath = originalPath;
        }
      }

      const fileName = path.basename(outputPath);
      res.setHeader('Content-disposition', `attachment; filename=${fileName}`);

      if (isAudioOnly && outputPath.endsWith('.mp3')) {
        res.setHeader('Content-type', 'audio/mpeg');
      } else if (outputPath.endsWith('.mp4')) {
        res.setHeader('Content-type', 'video/mp4');
      } else if (outputPath.endsWith('.webm')) {
        res.setHeader('Content-type', 'video/webm');
      } else if (outputPath.endsWith('.mkv')) {
        res.setHeader('Content-type', 'video/x-matroska');
      } else {
        res.setHeader('Content-type', 'application/octet-stream');
      }

      const fileStream = fs.createReadStream(outputPath);
      fileStream.pipe(res);

      fileStream.on('close', () => {
        try {
          fs.unlinkSync(originalPath);
          if (outputPath !== originalPath) {
            fs.unlinkSync(outputPath);
          }
        } catch (e) {
        }
      });

      fileStream.on('error', (err: any) => {
        try {
          fs.unlinkSync(originalPath);
          if (outputPath !== originalPath) {
            fs.unlinkSync(outputPath);
          }
        } catch (e) {
        }
        if (!res.headersSent) {
          res.status(500).send('Error transfiriendo el archivo');
        }
      });
    } catch (error: any) {
      if (!res.headersSent) {
        res.status(500).send(`Error interno del servidor`);
      }
    }
  });

  return app;
}

export { createApp };
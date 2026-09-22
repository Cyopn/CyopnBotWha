import express from "express";
import bodyParser from "body-parser";
import * as fs from "fs";
import * as fsPromises from "fs/promises";
import path from "path";
import { Boom } from "@hapi/boom";
import NodeCache from '@cacheable/node-cache';
import P from 'pino';

const { getAllGroupSettings, setGroupSetting } = require("./lib/db.js");
const { getMetrics, getRecentErrors, getSuggestions } = require("./lib/admin_data.js");
const { getAccessRegistry, setCommandEnabled, setGroupEnabled, setGroupUserBlocked, updateList } = require("./lib/access.js");
const { renderAdminPage } = require("./lib/admin_view.js");

function createApp(commandsMap: Map<string, { name: string, alias: string[], description: string }>) {
  const app = express();
  app.use(bodyParser.json());
  app.use(
    bodyParser.urlencoded({
      extended: true,
    }),
  );

  const logger = P({ timestamp: () => `,"time":"${new Date().toJSON()}"` }, P.destination('./logs.txt'))
  logger.level = 'silent'

  const adminAuth = (request: express.Request, response: express.Response, next: express.NextFunction) => {
    const expectedUser = process.env.ADMIN_PANEL_USER;
    const expectedPassword = process.env.ADMIN_PANEL_PASSWORD;
    if (!expectedUser || !expectedPassword) {
      return response.status(503).send("Panel no configurado: establece ADMIN_PANEL_USER y ADMIN_PANEL_PASSWORD.");
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

  app.get("/admin", adminAuth, async (request: express.Request, response: express.Response) => {
    try {
      const registry = await getAccessRegistry();
      registry.groupSettings = await getAllGroupSettings();
      registry.groups = Object.fromEntries(Object.entries(registry.groups).map(([id, group]) => [id, { ...(group as Record<string, any>), settings: registry.groupSettings[id] || {} }]));
      registry.metrics = await getMetrics();
      registry.errors = await getRecentErrors();
      registry.suggestions = await getSuggestions();
      const commandList = Array.from(commandsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      response.send(renderAdminPage({ ...registry, commands: commandList }));
    } catch (error) {
      response.status(500).send(String(error));
    }
  });

  app.post("/admin/access", adminAuth, async (request: express.Request, response: express.Response) => {
    try {
      const { action, list, value } = request.body || {};
      if (action === "group") await setGroupEnabled(request.body.groupId, request.body.enabled === "true");
      if (action === "participant") await setGroupUserBlocked(request.body.groupId, request.body.userId, request.body.blocked === "true");
      if (action === "group-setting") await setGroupSetting(request.body.groupId, request.body.setting, request.body.value === "true");
      if (action === "user") {
        await updateList("blacklistUsers", request.body.userId, request.body.allowed === "true" ? "remove" : "add");
      }
      if (action === "add" && ["blacklistGroups", "blacklistUsers"].includes(list)) await updateList(list, value, "add");
      if (action === "remove" && ["blacklistGroups", "blacklistUsers"].includes(list)) await updateList(list, value, "remove");
      response.redirect("/admin");
    } catch (error) {
      response.status(500).send(String(error));
    }
  });

  app.post("/admin/commands", adminAuth, async (request: express.Request, response: express.Response) => {
    try {
      const { command, enabled } = request.body || {};
      if (Array.from(commandsMap.values()).some((item) => item.name === command)) await setCommandEnabled(command, enabled === "true");
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
        return res.status(404).send('Format file not found or expired');
      }

      fs.readFile(filePath, 'utf8', (err: NodeJS.ErrnoException | null, data: string) => {
        if (err) {
          return res.status(500).send('Error reading format file');
        }

        let formatData;
        try {
          formatData = JSON.parse(data);
        } catch (e) {
          return res.status(500).send('Invalid format file');
        }

        let formats: any[] = [];
        if (formatData && formatData.formats) {
          formats = formatData.formats;
        } else if (Array.isArray(formatData)) {
          formats = formatData;
        } else {
          return res.status(500).send('Invalid format file structure');
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
        const videoFormats = formats
          .filter((format: any) => hasVideo(format))
          .sort((a: any, b: any) => (Number(b.height) || 0) - (Number(a.height) || 0) || (Number(b.fps) || 0) - (Number(a.fps) || 0) || (Number(b.tbr) || 0) - (Number(a.tbr) || 0));
        const audioFormats = formats
          .filter((format: any) => hasAudio(format) && !hasVideo(format))
          .sort((a: any, b: any) => (Number(b.abr) || Number(b.tbr) || Number(b.bitrate) || 0) - (Number(a.abr) || Number(a.tbr) || Number(a.bitrate) || 0));
        const formatRow = (format: any, type: 'video' | 'audio') => {
          const quality = type === 'video'
            ? (format.height ? `${format.height}p${format.fps ? ` · ${format.fps} fps` : ''}` : (format.format_note || 'Video'))
            : `${Math.round(Number(format.abr || format.tbr || format.bitrate / 1000) || 0)} kbps`;
          const details = type === 'video'
            ? `${format.ext || 'N/A'} · ${format.vcodec && format.vcodec !== 'none' ? format.vcodec : 'video'}${hasAudio(format) ? ` + ${format.acodec}` : ''}`
            : `${format.ext || 'N/A'} · ${format.acodec || 'audio'}`;
          return `
          <article class="format-row">
            <div class="quality"><strong>${escapeHtml(quality)}</strong><span>${escapeHtml(details)}</span></div>
            <span class="format-size">${format.filesize ? `${(format.filesize / (1024 * 1024)).toFixed(1)} MB` : 'Tamaño variable'}</span>
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
        return res.status(400).send('Format ID is required');
      }

      const filePath = path.join(__dirname, 'temp', filename);

      try {
        await fsPromises.access(filePath);
      } catch (err) {
        return res.status(404).send('Format file not found or expired');
      }

      let data: string;
      try {
        data = await fsPromises.readFile(filePath, 'utf8');
      } catch (err) {
        return res.status(500).send('Error reading format file');
      }

      let formatData: any;
      try {
        formatData = JSON.parse(data);
      } catch (e) {
        return res.status(500).send('Invalid format file');
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
        return res.status(400).send(`Format ID ${formatId} not found in available formats`);
      }

      const tempname = `yt_download_${Date.now()}`;
      const tempDir = path.join(__dirname, 'temp');

      try {
        await fsPromises.mkdir(tempDir, { recursive: true });
      } catch (err) {
      }

      let result: any;
      try {
        const selectedFormat = formats.find((f: any) => f.format_id === formatId);

        if (!selectedFormat) {
          throw new Error(`Format ID ${formatId} not found`);
        }

        console.log(`Selected format:`, {
          format_id: selectedFormat.format_id,
          ext: selectedFormat.ext,
          url: selectedFormat.url ? '[URL PRESENT]' : 'No URL',
          protocol: selectedFormat.protocol,
          vcodec: selectedFormat.vcodec,
          acodec: selectedFormat.acodec
        });

        if (selectedFormat.url &&
          (selectedFormat.protocol === 'http:' || selectedFormat.protocol === 'https:')) {

          console.log(`Attempting direct download from URL: ${selectedFormat.url.substring(0, 100)}...`);

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
          console.log(`Direct download not possible, using ytdlp...`);

          const downloadAttempts = [
            () => ytdlp.downloadVideo(youtubeUrl, formatId, { output: path.join(tempDir, `${tempname}.%(ext)s`) }),
            () => ytdlp.downloadVideo(youtubeUrl, `best[format_id=${formatId}]`, { output: path.join(tempDir, `${tempname}.%(ext)s`) }),
            () => ytdlp.downloadVideo(youtubeUrl, "best", { output: path.join(tempDir, `${tempname}.%(ext)s`) })
          ];

          let lastError: any;
          for (let i = 0; i < downloadAttempts.length; i++) {
            try {
              console.log(`Trying ytdlp approach ${i + 1}...`);
              result = await downloadAttempts[i]();
              break;
            } catch (err: any) {
              console.log(`Approach ${i + 1} failed:`, err.message);
              lastError = err;
              if (i === downloadAttempts.length - 1) {
                throw lastError;
              }
            }
          }
        }
      } catch (error: any) {
        console.error('Error downloading video:', error);
        return res.status(500).send(`Error downloading video: ${error.message}`);
      }

      let originalPath = result.filePaths[0];
      let mp4Path = originalPath.replace(/\.[^/.]+$/, ".mp4");

      const { execSync } = require("child_process");
      try {
        execSync(`ffmpeg -y -i "${originalPath}" -c:v copy -c:a aac -strict experimental "${mp4Path}"`);
      } catch (error: any) {
        console.error('Error converting video:', error);
        mp4Path = originalPath;
      }

      const fileName = path.basename(mp4Path);
      res.setHeader('Content-disposition', `attachment; filename=${fileName}`);

      if (mp4Path.endsWith('.mp4')) {
        res.setHeader('Content-type', 'video/mp4');
      } else if (mp4Path.endsWith('.webm')) {
        res.setHeader('Content-type', 'video/webm');
      } else if (mp4Path.endsWith('.mkv')) {
        res.setHeader('Content-type', 'video/x-matroska');
      } else {
        res.setHeader('Content-type', 'application/octet-stream');
      }

      const fileStream = fs.createReadStream(mp4Path);
      fileStream.pipe(res);

      fileStream.on('close', () => {
        try {
          fs.unlinkSync(originalPath);
          if (mp4Path !== originalPath) {
            fs.unlinkSync(mp4Path);
          }
        } catch (e) {
          console.error('Error cleaning up files:', e);
        }
      });

      fileStream.on('error', (err: any) => {
        console.error('Error streaming file:', err);
        try {
          fs.unlinkSync(originalPath);
          if (mp4Path !== originalPath) {
            fs.unlinkSync(mp4Path);
          }
        } catch (e) {
          console.error('Error cleaning up files after stream error:', e);
        }
        if (!res.headersSent) {
          res.status(500).send('Error streaming file');
        }
      });
    } catch (error: any) {
      console.error('Unexpected error in download route:', error);
      if (!res.headersSent) {
        res.status(500).send(`Internal server error: ${error.message}`);
      }
    }
  });

  return app;
}

export { createApp };
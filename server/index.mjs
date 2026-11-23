// TAMO CREATOR · servidor local.
// Solo escucha en 127.0.0.1. No guarda llaves, no cobra nada y no llama a ninguna API de pago:
// todo lo que cuesta pasa por las herramientas donde el usuario ya inició sesión (claude, codex, higgsfield).

import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROD = process.argv.includes('--prod');
const DIR_PROYECTOS = path.join(RAIZ, 'proyectos');
const DIR_PARAMS_COLAB = path.join(RAIZ, 'colaboradores', 'jriesgo', 'parametros');
const DIR_PARAMS_BASE = path.join(RAIZ, 'src', 'data', 'parametros');

// .env mínimo (sin dependencias)
try {
  for (const linea of fs.readFileSync(path.join(RAIZ, '.env'), 'utf8').split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
} catch { /* sin .env: normal */ }
const PUERTO = Number(process.env.PUERTO || process.env.PORT || 5180);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.woff2': 'font/woff2', '.md': 'text/markdown; charset=utf-8',
};

/* ── utilidades ── */
const json = (res, codigo, datos) => {
  res.writeHead(codigo, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(datos));
};
const idSeguro = (id) => (typeof id === 'string' && /^[a-z0-9][a-z0-9-]{0,60}$/.test(id) ? id : null);
const nombreSeguro = (n) => (typeof n === 'string' && /^[A-Za-z0-9_-][A-Za-z0-9_.-]{0,80}\.(md|json|png|txt)$/.test(n) ? n : null);

async function cuerpo(req, limite = 40 * 1024 * 1024) {
  const partes = []; let total = 0;
  for await (const p of req) { total += p.length; if (total > limite) throw new Error('Cuerpo demasiado grande'); partes.push(p); }
  const texto = Buffer.concat(partes).toString('utf8');
  return texto ? JSON.parse(texto) : {};
}

/** Corre un comando corto y devuelve su salida. Nunca lanza. */
function correr(cmd, args, { ms = 12000, cwd = RAIZ } = {}) {
  return new Promise((resolve) => {
    let salida = ''; let listo = false;
    const fin = (ok) => { if (!listo) { listo = true; resolve({ ok, salida: salida.trim() }); } };
    let hijo;
    try { hijo = spawn(cmd, args, { cwd, shell: process.platform === 'win32', windowsHide: true }); }
    catch { return fin(false); }
    const reloj = setTimeout(() => { try { hijo.kill(); } catch {} fin(false); }, ms);
    hijo.stdout?.on('data', (d) => { salida += d; });
    hijo.stderr?.on('data', (d) => { salida += d; });
    hijo.on('error', () => { clearTimeout(reloj); fin(false); });
    hijo.on('close', (c) => { clearTimeout(reloj); fin(c === 0); });
  });
}
const primeraLinea = (t) => (t.split(/\r?\n/).find((l) => l.trim()) || '').trim().slice(0, 90);

/* ── estado de las conexiones ── */
let cacheEstado = null;
async function estado(forzar) {
  if (cacheEstado && !forzar && Date.now() - cacheEstado.t < 60000) return cacheEstado.v;
  const [claude, codex, hf, hfCuenta, hyper, ffmpeg] = await Promise.all([
    correr('claude', ['--version']),
    correr('codex', ['--version']),
    correr('higgsfield', ['--help'], { ms: 8000 }),
    correr('higgsfield', ['account', 'status', '--json'], { ms: 15000 }),
    correr('npm', ['ls', '-g', 'hyperframes', '--depth=0'], { ms: 20000 }),
    correr('ffmpeg', ['-version']),
  ]);
  // De la cuenta de Higgsfield solo se pasa el plan y los créditos: nunca el correo ni el token.
  let cuenta = null;
  if (hfCuenta.ok) {
    try {
      const d = JSON.parse(hfCuenta.salida);
      const plano = JSON.stringify(d);
      const cred = plano.match(/"(?:credits|balance|available_credits|credits_balance)"\s*:\s*([0-9.]+)/i);
      const plan = plano.match(/"(?:plan|plan_name|subscription_plan|plan_type)"\s*:\s*"([^"]{1,40})"/i);
      cuenta = { creditos: cred ? Number(cred[1]) : null, plan: plan ? plan[1] : null };
    } catch { cuenta = { creditos: null, plan: null }; }
  }
  const v = {
    plataforma: process.platform,
    node: process.version,
    herramientas: {
      claude: { ok: claude.ok, detalle: claude.ok ? primeraLinea(claude.salida) : null },
      codex: { ok: codex.ok, detalle: codex.ok ? primeraLinea(codex.salida) : null },
      higgsfield: { ok: hf.ok, sesion: hfCuenta.ok, cuenta, llaveEnv: Boolean(process.env.HIGGSFIELD_API_KEY) },
      hyperframes: { ok: hyper.ok && /hyperframes@/.test(hyper.salida), detalle: (hyper.salida.match(/hyperframes@[\d.]+/) || [null])[0] },
      ffmpeg: { ok: ffmpeg.ok, detalle: ffmpeg.ok ? primeraLinea(ffmpeg.salida).replace(/ Copyright.*/, '') : null },
    },
  };
  cacheEstado = { t: Date.now(), v };
  return v;
}

/* ── parámetros de corrección (los aporta jriesgo; hay un ejemplo de respaldo) ── */
async function parametros() {
  const leer = async (dir) => {
    let archivos = [];
    try { archivos = (await fsp.readdir(dir)).filter((a) => a.endsWith('.json')).sort(); } catch { return []; }
    const grupos = [];
    for (const a of archivos) {
      try {
        const d = JSON.parse(await fsp.readFile(path.join(dir, a), 'utf8'));
        for (const g of Array.isArray(d.grupos) ? d.grupos : []) grupos.push({ ...g, archivo: a });
      } catch (e) { grupos.push({ id: a, titulo: a, error: `No se pudo leer: ${e.message}`, controles: [], archivo: a }); }
    }
    return grupos;
  };
  const colab = await leer(DIR_PARAMS_COLAB);
  if (colab.length) return { origen: 'colaboradores/jriesgo/parametros', esEjemplo: false, grupos: colab };
  return { origen: 'src/data/parametros', esEjemplo: true, grupos: await leer(DIR_PARAMS_BASE) };
}

/* ── proyectos ── */
async function listarProyectos() {
  let dirs = [];
  try { dirs = await fsp.readdir(DIR_PROYECTOS, { withFileTypes: true }); } catch { return []; }
  const lista = [];
  for (const d of dirs) {
    if (!d.isDirectory() || !idSeguro(d.name)) continue;
    try {
      const p = JSON.parse(await fsp.readFile(path.join(DIR_PROYECTOS, d.name, 'proyecto.json'), 'utf8'));
      lista.push({ id: d.name, nombre: p.nombre || d.name, tipo: p.tipo, actualizado: p.actualizado, etapa: p.etapa || 'brief' });
    } catch { /* carpeta sin proyecto.json */ }
  }
  return lista.sort((a, b) => String(b.actualizado).localeCompare(String(a.actualizado)));
}

async function videosDe(id) {
  const dir = path.join(DIR_PROYECTOS, id, 'exports');
  try {
    const archivos = await fsp.readdir(dir);
    return archivos.filter((a) => /\.(mp4|webm|mov)$/i.test(a)).sort().map((a) => ({ nombre: a, url: `/media/${id}/${encodeURIComponent(a)}` }));
  } catch { return []; }
}

/** Sirve un archivo con soporte de rangos (necesario para moverse en el video). */
function servirArchivo(req, res, ruta) {
  fs.stat(ruta, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('No encontrado'); }
    const tipo = MIME[path.extname(ruta).toLowerCase()] || 'application/octet-stream';
    const rango = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (rango) {
      const ini = rango[1] ? Number(rango[1]) : 0;
      const fin = rango[2] ? Math.min(Number(rango[2]), st.size - 1) : st.size - 1;
      if (ini > fin || ini >= st.size) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }); return res.end(); }
      res.writeHead(206, { 'Content-Type': tipo, 'Content-Range': `bytes ${ini}-${fin}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': fin - ini + 1 });
      return fs.createReadStream(ruta, { start: ini, end: fin }).pipe(res);
    }
    res.writeHead(200, { 'Content-Type': tipo, 'Content-Length': st.size, 'Accept-Ranges': 'bytes' });
    fs.createReadStream(ruta).pipe(res);
  });
}

/* ── ejecución con la cuenta del usuario ── */
const MODELOS_CLAUDE = new Set(['claude-fable-5-2', 'claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5']);
const ESFUERZOS = new Set(['low', 'medium', 'high', 'xhigh', 'max']);
let enCurso = null;

async function ejecutar(req, res) {
  const { id, archivo, modelo, esfuerzo, confirmado } = await cuerpo(req);
  const pid = idSeguro(id); const arch = nombreSeguro(archivo);
  if (!pid || !arch) return json(res, 400, { error: 'Proyecto o archivo inválido' });
  if (!MODELOS_CLAUDE.has(modelo) || !ESFUERZOS.has(esfuerzo)) return json(res, 400, { error: 'Modelo o esfuerzo no reconocido' });
  if (confirmado !== true) return json(res, 400, { error: 'Falta confirmar: esta acción consume uso de tu cuenta de Claude.' });
  if (enCurso) return json(res, 409, { error: 'Ya hay una generación en curso.' });
  const dir = path.join(DIR_PROYECTOS, pid);
  let prompt;
  try { prompt = await fsp.readFile(path.join(dir, arch), 'utf8'); } catch { return json(res, 404, { error: 'No existe ese archivo en el proyecto' }); }

  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' });
  res.write(`[TAMO CREATOR] claude --model ${modelo} --effort ${esfuerzo}  (carpeta: proyectos/${pid})\n\n`);
  // El prompt entra por la entrada estándar: nada de lo que escribe el usuario toca la línea de comandos.
  const hijo = spawn('claude', ['-p', '--model', modelo, '--effort', esfuerzo, '--permission-mode', 'acceptEdits'],
    { cwd: dir, shell: process.platform === 'win32', windowsHide: true });
  enCurso = hijo;
  hijo.stdin.end(prompt);
  hijo.stdout.on('data', (d) => res.write(d));
  hijo.stderr.on('data', (d) => res.write(d));
  hijo.on('error', (e) => { res.write(`\n[error] ${e.message}\n`); });
  hijo.on('close', (c) => { enCurso = null; res.end(`\n[TAMO CREATOR] Terminó con código ${c}.\n`); });
  req.on('close', () => { if (enCurso === hijo && !res.writableEnded) { try { hijo.kill(); } catch {} enCurso = null; } });
}

/* ── API ── */
async function api(req, res, url) {
  const ruta = url.pathname;
  if (req.method === 'GET' && ruta === '/api/estado') return json(res, 200, await estado(url.searchParams.has('forzar')));
  if (req.method === 'GET' && ruta === '/api/parametros') return json(res, 200, await parametros());
  if (req.method === 'GET' && ruta === '/api/proyectos') return json(res, 200, await listarProyectos());

  const m = ruta.match(/^\/api\/proyectos\/([^/]+)(\/[a-z]+)?$/);
  if (m) {
    const id = idSeguro(m[1]);
    if (!id) return json(res, 400, { error: 'Identificador inválido' });
    const dir = path.join(DIR_PROYECTOS, id);
    if (req.method === 'GET' && !m[2]) {
      try {
        const p = JSON.parse(await fsp.readFile(path.join(dir, 'proyecto.json'), 'utf8'));
        return json(res, 200, { ...p, id, videos: await videosDe(id), carpeta: dir });
      } catch { return json(res, 404, { error: 'No existe el proyecto' }); }
    }
    if (req.method === 'POST' && !m[2]) {
      // Guarda proyecto.json y los documentos que arma la interfaz (BRIEF.md, PROMPT.md, CORRECCIONES.md…)
      const { proyecto, archivos = {}, imagenes = {} } = await cuerpo(req);
      await fsp.mkdir(path.join(dir, 'exports'), { recursive: true });
      await fsp.mkdir(path.join(dir, 'assets'), { recursive: true });
      if (proyecto) await fsp.writeFile(path.join(dir, 'proyecto.json'), JSON.stringify({ ...proyecto, id, actualizado: new Date().toISOString() }, null, 2));
      for (const [nombre, texto] of Object.entries(archivos)) {
        const n = nombreSeguro(nombre);
        if (n && typeof texto === 'string') await fsp.writeFile(path.join(dir, n), texto);
      }
      const escritas = [];
      if (Object.keys(imagenes).length) await fsp.mkdir(path.join(dir, 'correcciones'), { recursive: true });
      for (const [nombre, dataUrl] of Object.entries(imagenes)) {
        const n = nombreSeguro(nombre);
        const b = typeof dataUrl === 'string' && dataUrl.match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/);
        if (n && b) { await fsp.writeFile(path.join(dir, 'correcciones', n), Buffer.from(b[1], 'base64')); escritas.push(n); }
      }
      return json(res, 200, { ok: true, id, carpeta: dir, imagenes: escritas });
    }
  }
  if (req.method === 'POST' && ruta === '/api/ejecutar') return ejecutar(req, res);
  if (req.method === 'POST' && ruta === '/api/detener') { if (enCurso) { try { enCurso.kill(); } catch {} enCurso = null; } return json(res, 200, { ok: true }); }
  return json(res, 404, { error: 'Ruta desconocida' });
}

/* ── arranque ── */
let vite = null;
if (!PROD) {
  const { createServer } = await import('vite');
  vite = await createServer({ root: RAIZ, server: { middlewareMode: true, hmr: { port: PUERTO + 1 } }, appType: 'spa' });
}

const servidor = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    // Solo peticiones de esta misma máquina y de esta misma página (evita que otro sitio dispare acciones).
    const origen = req.headers.origin;
    if (origen && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origen)) { res.writeHead(403); return res.end('Origen no permitido'); }
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    if (url.pathname.startsWith('/media/')) {
      const [, , id, ...resto] = url.pathname.split('/');
      const nombre = decodeURIComponent(resto.join('/'));
      if (!idSeguro(id) || !/^[^/\\]+\.(mp4|webm|mov)$/i.test(nombre) || nombre.includes('..')) { res.writeHead(400); return res.end('Ruta inválida'); }
      return servirArchivo(req, res, path.join(DIR_PROYECTOS, id, 'exports', nombre));
    }
    if (vite) return vite.middlewares(req, res, () => { res.writeHead(404); res.end('No encontrado'); });
    const dist = path.join(RAIZ, 'dist');
    let archivo = path.normalize(path.join(dist, decodeURIComponent(url.pathname)));
    if (!archivo.startsWith(dist)) { res.writeHead(400); return res.end(); }
    if (!fs.existsSync(archivo) || fs.statSync(archivo).isDirectory()) archivo = path.join(dist, 'index.html');
    return servirArchivo(req, res, archivo);
  } catch (e) {
    if (!res.headersSent) json(res, 500, { error: e.message });
    else res.end();
  }
});

servidor.listen(PUERTO, '127.0.0.1', () => {
  console.log(`\n  TAMO CREATOR listo en  http://localhost:${PUERTO}\n  (solo esta computadora; Ctrl+C para cerrar)\n`);
});

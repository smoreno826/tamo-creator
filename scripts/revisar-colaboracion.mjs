// Revisión rápida de la colaboración: qué subió cada quien y qué está repetido.
// No cambia nada: solo reporta. La decisión de qué fusionar se toma al integrar (protocolo en CLAUDE.md).
//
// Uso:  npm run revisar            (últimos 30 días)
//       npm run revisar -- 7       (últimos 7 días)

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIAS = Number(process.argv[2]) || 30;
const git = (...a) => { try { return execFileSync('git', a, { cwd: RAIZ, encoding: 'utf8' }).trim(); } catch { return ''; } };

console.log(`# Revisión de colaboración · últimos ${DIAS} días\n`);

/* 1. Quién subió qué */
const log = git('log', `--since=${DIAS} days ago`, '--name-only', '--pretty=format:@@%an|%ad|%s', '--date=short');
const porAutor = {};
let actual = null;
for (const l of log.split('\n')) {
  if (l.startsWith('@@')) { const [autor, fecha, asunto] = l.slice(2).split('|'); actual = { fecha, asunto, archivos: [] }; (porAutor[autor] ||= []).push(actual); }
  else if (l.trim() && actual) actual.archivos.push(l.trim());
}
console.log('## Commits por persona');
if (!Object.keys(porAutor).length) console.log('_Sin commits en el periodo._');
for (const [autor, commits] of Object.entries(porAutor)) {
  console.log(`\n### ${autor} (${commits.length})`);
  for (const c of commits) console.log(`- ${c.fecha} · ${c.asunto} · ${c.archivos.length} archivo(s)${c.archivos.some((a) => !a.startsWith('colaboradores/')) ? ' · toca la app integrada' : ''}`);
}

/* 2. Archivos idénticos en más de un lugar */
const IGNORAR = /^(node_modules|dist|\.git|proyectos|skills)([\\/]|$)/;
const hashes = new Map();
(function recorrer(dir) {
  for (const n of fs.readdirSync(dir, { withFileTypes: true })) {
    const ruta = path.join(dir, n.name); const rel = path.relative(RAIZ, ruta).replace(/\\/g, '/');
    if (IGNORAR.test(rel)) continue;
    if (n.isDirectory()) recorrer(ruta);
    else if (n.isFile() && fs.statSync(ruta).size > 200 && !/\.gitkeep$|package-lock\.json$/.test(rel)) {
      const h = crypto.createHash('sha1').update(fs.readFileSync(ruta)).digest('hex');
      hashes.set(h, [...(hashes.get(h) || []), rel]);
    }
  }
})(RAIZ);
const repetidos = [...hashes.values()].filter((l) => l.length > 1);
console.log('\n## Archivos idénticos en varios lugares');
console.log(repetidos.length ? repetidos.map((l) => `- ${l.join('  =  ')}`).join('\n') : '_Ninguno._');

/* 3. Parámetros repetidos o que chocan */
const dirParams = [path.join(RAIZ, 'colaboradores', 'jriesgo', 'parametros'), path.join(RAIZ, 'src', 'data', 'parametros')];
const controles = new Map(); const problemas = [];
for (const dir of dirParams) {
  let archivos = []; try { archivos = fs.readdirSync(dir).filter((a) => a.endsWith('.json')); } catch { continue; }
  for (const a of archivos) {
    const rel = path.relative(RAIZ, path.join(dir, a)).replace(/\\/g, '/');
    let d; try { d = JSON.parse(fs.readFileSync(path.join(dir, a), 'utf8')); } catch (e) { problemas.push(`- \`${rel}\` no es JSON válido: ${e.message}`); continue; }
    for (const g of d.grupos || []) for (const c of g.controles || []) {
      for (const falta of ['id', 'titulo', 'tipo', 'base'].filter((k) => c[k] === undefined)) problemas.push(`- \`${rel}\` · ${g.id}.${c.id || '?'}: falta \`${falta}\``);
      if (c.tipo === 'rango' && !(c.min < c.max)) problemas.push(`- \`${rel}\` · ${g.id}.${c.id}: \`min\` debe ser menor que \`max\``);
      const clave = (c.titulo || c.id || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      controles.set(clave, [...(controles.get(clave) || []), `${rel} → ${g.id}.${c.id}`]);
    }
  }
}
const dobles = [...controles.entries()].filter(([, l]) => l.length > 1);
console.log('\n## Parámetros con el mismo nombre en más de un archivo');
console.log(dobles.length ? dobles.map(([k, l]) => `- **${k}**: ${l.join('  ·  ')}`).join('\n') : '_Ninguno._');
console.log('\n## Problemas de formato en parámetros');
console.log(problemas.length ? problemas.join('\n') : '_Ninguno._');

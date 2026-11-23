// Copia las skills instaladas en esta computadora a la carpeta del proyecto.
//
//   skills/local/   TODAS las skills (no se sube a GitHub: está en .gitignore).
//   skills/vendor/  Solo las que traen una licencia que permite redistribuir (MIT, Apache, BSD, ISC).
//   skills/MANIFEST.md  La lista completa, con licencia y de dónde sale cada una.
//
// Por qué dos carpetas: el repositorio es público. Varias skills son de pago o privadas y su licencia
// prohíbe publicarlas (por ejemplo motion-video-director). Esas se quedan solo en tu computadora.
//
// Uso:  npm run skills

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = path.join(RAIZ, 'skills');
const ORIGENES = [
  { dir: path.join(os.homedir(), '.claude', 'skills'), nombre: '~/.claude/skills' },
  { dir: path.join(os.homedir(), '.agents', 'skills'), nombre: '~/.agents/skills' },
];
const ABIERTAS = /MIT License|Apache License|BSD \d-Clause|ISC License|Permission is hereby granted, free of charge/i;
const CERRADAS = /All rights reserved|Commercial|Single-User|Proprietary|may not (share|redistribute|publish)/i;

function esSkill(dir) { try { return fs.existsSync(path.join(dir, 'SKILL.md')); } catch { return false; } }

function licenciaDe(dir) {
  let archivos = []; try { archivos = fs.readdirSync(dir); } catch { return { tipo: 'sin archivo de licencia', abierta: false }; }
  const lic = archivos.find((a) => /^licen[sc]e(\.|$)/i.test(a));
  if (lic) {
    const t = fs.readFileSync(path.join(dir, lic), 'utf8').slice(0, 1500);
    if (CERRADAS.test(t) && !/MIT License|Apache License/i.test(t)) return { tipo: 'comercial / todos los derechos reservados', abierta: false };
    const m = t.match(ABIERTAS);
    if (m) return { tipo: /Permission is hereby/i.test(m[0]) ? 'MIT' : m[0].replace(' License', ''), abierta: true };
    return { tipo: `ver ${lic}`, abierta: false };
  }
  try { // algunas declaran la licencia en el encabezado de SKILL.md
    const m = fs.readFileSync(path.join(dir, 'SKILL.md'), 'utf8').slice(0, 1200).match(/^license:\s*(.+)$/im);
    if (m) return { tipo: m[1].trim().slice(0, 60), abierta: /apache|mit|bsd|isc/i.test(m[1]) && !/see|complete terms/i.test(m[1]) };
  } catch { /* sin SKILL.md legible */ }
  return { tipo: 'sin archivo de licencia', abierta: false };
}

function listar(origen) {
  const salida = [];
  const recorrer = (dir, prefijo, nivel) => {
    let entradas = []; try { entradas = fs.readdirSync(dir); } catch { return; }
    for (const n of entradas) {
      const ruta = path.join(dir, n);
      let st; try { st = fs.statSync(ruta); } catch { continue; } // enlaces rotos
      if (!st.isDirectory()) continue;
      if (esSkill(ruta)) salida.push({ nombre: n, ruta, origen: `${origen.nombre}${prefijo}` });
      else if (nivel < 2) recorrer(ruta, /^[0-9a-f-]{20,}/i.test(n) ? prefijo : `${prefijo}/${n}`, nivel + 1); // sin identificadores de cuenta // p. ej. skills/synced/<id>/<skill>
    }
  };
  recorrer(origen.dir, '', 0);
  return salida;
}

const vistas = new Map();
for (const o of ORIGENES) for (const s of listar(o)) if (!vistas.has(s.nombre)) vistas.set(s.nombre, s);
const skills = [...vistas.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
if (!skills.length) { console.log('No se encontraron skills instaladas en', ORIGENES.map((o) => o.nombre).join(' ni en ')); process.exit(0); }

for (const sub of ['local', 'vendor']) fs.rmSync(path.join(DESTINO, sub), { recursive: true, force: true });
const copiar = (de, a) => fs.cpSync(de, a, { recursive: true, dereference: true, filter: (f) => !/[\\/](node_modules|\.git|__pycache__)([\\/]|$)/.test(f) });

const filas = []; let publicadas = 0;
for (const s of skills) {
  const lic = licenciaDe(s.ruta);
  try {
    copiar(s.ruta, path.join(DESTINO, 'local', s.nombre));
    if (lic.abierta) { copiar(s.ruta, path.join(DESTINO, 'vendor', s.nombre)); publicadas++; }
    filas.push(`| \`${s.nombre}\` | ${lic.tipo} | ${lic.abierta ? 'Sí, en `skills/vendor/`' : 'No, solo copia local'} | ${s.origen} |`);
  } catch (e) { filas.push(`| \`${s.nombre}\` | — | Error al copiar: ${e.message.slice(0, 60)} | ${s.origen} |`); }
}

fs.writeFileSync(path.join(DESTINO, 'MANIFEST.md'), `# Skills incluidas

Generado con \`npm run skills\`. No lo edites a mano.

- **${skills.length}** skills encontradas en esta computadora, todas copiadas a \`skills/local/\` (carpeta que no se sube a GitHub).
- **${publicadas}** tienen licencia abierta y también están en \`skills/vendor/\`, que sí forma parte del repositorio.

Las que dicen "solo copia local" no se publican porque su licencia no lo permite o no declara permiso de redistribución.
Quien clone el repositorio debe instalarlas con su propia licencia.

| Skill | Licencia | ¿Se publica? | Origen |
| --- | --- | --- | --- |
${filas.join('\n')}
`);
console.log(`Listo: ${skills.length} skills en skills/local/, ${publicadas} publicables en skills/vendor/. Detalle en skills/MANIFEST.md`);

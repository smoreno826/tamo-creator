import './styles.css';
import { PROYECTO_NUEVO } from './data/opciones.js';
import * as inicio from './views/inicio.js';
import * as asistente from './views/asistente.js';
import * as storyboard from './views/storyboard.js';
import * as revision from './views/revision.js';
import * as conexiones from './views/conexiones.js';

/* ── utilidades compartidas ── */
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export async function api(ruta, datos) {
  const r = await fetch(ruta, datos ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) } : undefined);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `Error ${r.status}`);
  return j;
}
let relojAviso;
export function avisar(texto, malo = false) {
  const el = document.getElementById('aviso');
  el.textContent = texto; el.className = `aviso is-on${malo ? ' aviso--malo' : ''}`;
  clearTimeout(relojAviso); relojAviso = setTimeout(() => { el.className = 'aviso'; }, 4200);
}
export async function copiar(texto) {
  try { await navigator.clipboard.writeText(texto); avisar('Copiado al portapapeles.'); }
  catch { avisar('No se pudo copiar: selecciona el texto y cópialo a mano.', true); }
}
const guardarLocal = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento: la app sigue */ } };
const leerLocal = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };

/* ── estado ── */
export const app = {
  proyecto: { ...PROYECTO_NUEVO(), ...(leerLocal('tamo.borrador') || {}) },
  paso: 0,
  conexiones: null,
  parametros: null,
  calibracion: Number(leerLocal('tamo.calibracion')) || 1,
  guardarBorrador() { const { _grupos, ...p } = this.proyecto; guardarLocal('tamo.borrador', p); },
  setCalibracion(v) { this.calibracion = v; guardarLocal('tamo.calibracion', v); },
  nuevo() { this.proyecto = PROYECTO_NUEVO(); this.paso = 0; this.guardarBorrador(); },
  async cargarConexiones(forzar) {
    try { this.conexiones = await api(`/api/estado${forzar ? '?forzar' : ''}`); } catch { this.conexiones = { error: true, herramientas: {} }; }
    pintarNav(); return this.conexiones;
  },
  async cargarParametros() {
    try { this.parametros = await api('/api/parametros'); } catch { this.parametros = { grupos: [], esEjemplo: true }; }
    this.proyecto._grupos = this.parametros.grupos; return this.parametros;
  },
  /** Guarda el proyecto y sus documentos en proyectos/<id>/ */
  async guardar(archivos = {}, imagenes = {}) {
    const { _grupos, ...p } = this.proyecto;
    if (!p.id) { const { slug } = await import('./lib/brief.js'); p.id = `${slug(p.nombre)}-${Date.now().toString(36).slice(-4)}`; this.proyecto.id = p.id; }
    const r = await api(`/api/proyectos/${p.id}`, { proyecto: p, archivos, imagenes });
    this.proyecto.carpeta = r.carpeta; this.guardarBorrador();
    return r;
  },
  async abrir(id) {
    const p = await api(`/api/proyectos/${id}`);
    this.proyecto = { ...PROYECTO_NUEVO(), ...p, _grupos: this.parametros?.grupos || [] };
    this.guardarBorrador();
  },
};

/* ── navegación ── */
const VISTAS = {
  inicio: { vista: inicio, titulo: 'Inicio' },
  nuevo: { vista: asistente, titulo: 'Crear' },
  storyboard: { vista: storyboard, titulo: 'Preview' },
  revision: { vista: revision, titulo: 'Revisión' },
  conexiones: { vista: conexiones, titulo: 'Conexiones' },
};
export const ir = (ruta) => { if (location.hash === `#/${ruta}`) pintar(); else location.hash = `#/${ruta}`; };

function pintarNav() {
  const actual = (location.hash.replace('#/', '') || 'inicio').split('?')[0];
  const h = app.conexiones?.herramientas || {};
  const punto = (ok, n) => `<span class="pill ${ok ? 'pill--ok' : ''}" title="${ok ? 'Conectado' : 'Sin conectar'}"><i></i>${n}</span>`;
  document.getElementById('nav').innerHTML = `
    <a class="nav__brand" href="#/inicio" aria-label="TAMO CREATOR, inicio">
      <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M14 11h36v6.4H35.2V42h-6.4V17.4H14z"/><rect x="14" y="48" width="36" height="3.3"/></svg>
      <span>TAMO <b>CREATOR</b></span>
    </a>
    <nav class="nav__links" aria-label="Secciones">
      ${Object.entries(VISTAS).map(([k, v]) => `<a class="nav__link ${k === actual ? 'is-here' : ''}" href="#/${k}" ${k === actual ? 'aria-current="page"' : ''}>${v.titulo}</a>`).join('')}
    </nav>
    <a class="nav__estado" href="#/conexiones" aria-label="Estado de las conexiones">
      ${app.conexiones ? punto(h.claude?.ok, 'Claude') + punto(h.codex?.ok, 'Codex') + punto(h.higgsfield?.sesion, 'Higgsfield') : '<span class="pill">Revisando…</span>'}
    </a>`;
}

let desmontar = null;
function pintar() {
  const clave = (location.hash.replace('#/', '') || 'inicio').split('?')[0];
  const { vista } = VISTAS[clave] || VISTAS.inicio;
  if (typeof desmontar === 'function') desmontar();
  const el = document.getElementById('contenido');
  el.innerHTML = vista.render(app);
  desmontar = vista.montar?.(el, app) || null;
  pintarNav();
  window.scrollTo(0, 0);
}
export const repintar = pintar;

window.addEventListener('hashchange', pintar);
pintar();
app.cargarConexiones();
app.cargarParametros();

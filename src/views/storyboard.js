import { esc, ir, avisar, copiar, api } from '../main.js';
import { ESTILOS, FORMATOS, PLATAFORMAS, ESFUERZOS } from '../data/opciones.js';
import { estimar, fmtPct, fmtK } from '../lib/estimador.js';
import { briefMd, promptMd, comando, tc, storyboardBase } from '../lib/brief.js';
import { dibujarEstilo } from '../previews/previews.js';

const total = (p) => p.escenas.reduce((s, e) => s + (Number(e.duracion) || 0), 0);

function tarjeta(e, i, n) {
  return `<li class="escena" data-i="${i}">
    <header><span class="mono">${String(i + 1).padStart(2, '0')}</span>
      <input class="escena__papel" data-k="papel" value="${esc(e.papel)}" aria-label="Papel de la escena ${i + 1}" />
      <label class="escena__dur mono"><input type="number" min="0.5" max="60" step="0.5" data-k="duracion" value="${e.duracion}" aria-label="Duración en segundos" /> s</label>
    </header>
    <textarea data-k="descripcion" rows="3" aria-label="Qué se ve" placeholder="Qué se ve y qué se mueve">${esc(e.descripcion)}</textarea>
    <input data-k="texto" value="${esc(e.texto)}" placeholder="Texto en pantalla (opcional)" aria-label="Texto en pantalla" />
    <footer>
      <button class="enlace" data-ver>Ver</button>
      <button class="enlace" data-mover="-1" ${i === 0 ? 'disabled' : ''}>Subir</button>
      <button class="enlace" data-mover="1" ${i === n - 1 ? 'disabled' : ''}>Bajar</button>
      <button class="enlace enlace--malo" data-borrar ${n <= 1 ? 'disabled' : ''}>Quitar</button>
    </footer>
  </li>`;
}

export function render(app) {
  const p = app.proyecto;
  if (!p.tipo || !p.estilo) return `<section class="bloque"><h1>Preview</h1><p class="intro">Primero responde el asistente para tener algo que previsualizar.</p><button class="btn" id="ir-nuevo">Ir al asistente</button></section>`;
  if (!p.escenas?.length) p.escenas = storyboardBase(p);
  const f = FORMATOS.find((x) => x.id === p.formato);
  const plat = PLATAFORMAS[p.plataforma];
  return `
  <section class="bloque sb">
    <div class="cinta" role="note"><strong>PREVIEW</strong> Esto no es tu video final. Es un storyboard interactivo para decidir orden, tiempos y texto <b>antes</b> de gastar uso de tu cuenta. El movimiento real lo produce tu agente.</div>
    <div class="bloque__cab"><div><p class="sobre mono">${esc(p.formato)} · ${p.fps} fps</p><h1>${esc(p.nombre || 'Storyboard')}</h1></div>
      <span class="mono" id="sb-total"></span></div>

    <div class="sb__cuerpo">
      <div class="sb__visor">
        <div class="visor" style="aspect-ratio:${f.w}/${f.h};--ar:${(f.w / f.h).toFixed(4)}">
          <canvas id="sb-canvas"></canvas>
          <span class="sello mono">PREVIEW · NO FINAL</span>
        </div>
        <div class="transporte">
          <button class="btn btn--redondo" id="sb-play" aria-label="Reproducir"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></button>
          <span class="mono" id="sb-tc">00:00:00</span>
          <div class="pista" id="sb-pista" role="slider" tabindex="0" aria-label="Posición en el storyboard" aria-valuemin="0"></div>
        </div>
      </div>
      <ol class="escenas" id="sb-escenas">${p.escenas.map((e, i) => tarjeta(e, i, p.escenas.length)).join('')}</ol>
    </div>
    <div class="fila"><button class="btn btn--linea" id="sb-agregar">Agregar escena</button><button class="btn btn--linea" id="sb-guardar">Guardar storyboard</button></div>
  </section>

  <section class="bloque producir">
    <p class="sobre mono">Cuando el storyboard te convenza</p>
    <h2>Producir el video</h2>
    <div class="dos dos--ancha">
      <div>
        <p>Se usará <b>${esc(plat.titulo)}</b> con <b>${esc(plat.modelos.find((m) => m.id === p.modelo)?.titulo)}</b> a esfuerzo <b>${ESFUERZOS.find((e) => e.id === p.esfuerzo)?.titulo.toLowerCase()}</b>. <button class="enlace" id="cambiar-motor">Cambiar</button></p>
        <p class="tenue">Opción A, tú lo corres: abre una terminal en la carpeta del proyecto y pega este comando. Ves todo lo que hace el agente.</p>
        <div class="cmd"><code id="sb-carpeta">${esc(p.carpeta ? `cd "${p.carpeta}"` : 'Guarda el storyboard para crear la carpeta')}</code><button class="btn btn--mini btn--linea" data-copiar-de="sb-carpeta">Copiar</button></div>
        <div class="cmd"><code id="sb-cmd">${esc(comando(p))}</code><button class="btn btn--mini btn--linea" data-copiar-de="sb-cmd">Copiar</button></div>
        ${p.plataforma === 'claude' ? `
        <p class="tenue">Opción B, desde aquí: TAMO CREATOR lanza Claude Code por ti con tu sesión. Puede editar archivos solo dentro de la carpeta del proyecto.</p>
        <label class="check"><input type="checkbox" id="sb-ok" /> <span>Entiendo que esto consume uso de <b>mi</b> cuenta de Claude (ver estimado).</span></label>
        <div class="fila"><button class="btn" id="sb-lanzar" disabled>Producir ahora</button><button class="btn btn--linea" id="sb-detener" hidden>Detener</button></div>` : '<p class="tenue">Con Codex, por ahora, el lanzamiento es manual con el comando de arriba.</p>'}
        <pre class="bitacora" id="sb-log" hidden></pre>
      </div>
      <aside class="estimado" id="sb-estimado"></aside>
    </div>
    <p class="tenue">Cuando el agente termine, el video aparece en <code>exports/</code> y lo revisas en <a class="enlace" href="#/revision">Revisión</a>.</p>
  </section>`;
}

export function montar(el, app) {
  const p = app.proyecto;
  el.querySelector('#ir-nuevo')?.addEventListener('click', () => ir('nuevo'));
  const canvas = el.querySelector('#sb-canvas'); if (!canvas) return;
  const estilo = ESTILOS.find((e) => e.id === p.estilo) || ESTILOS[0];
  const f = FORMATOS.find((x) => x.id === p.formato);
  const W = 960, H = Math.round((960 * f.h) / f.w);
  canvas.width = W; canvas.height = H;
  const g = canvas.getContext('2d');
  const pista = el.querySelector('#sb-pista');
  let t = 0, sonando = false, ultimo = 0, vivo = true;

  const escenaEn = (seg) => { let a = 0; for (let i = 0; i < p.escenas.length; i++) { const d = Number(p.escenas[i].duracion) || 0; if (seg < a + d) return { i, local: seg - a, d }; a += d; } return { i: p.escenas.length - 1, local: 0, d: 1 }; };

  function pintarPista() {
    const T = total(p) || 1; let a = 0;
    pista.innerHTML = p.escenas.map((e, i) => { const w = ((Number(e.duracion) || 0) / T) * 100; const h = `<i style="left:${(a / T) * 100}%;width:${w}%"><span class="mono">${i + 1}</span></i>`; a += Number(e.duracion) || 0; return h; }).join('') + '<b id="sb-cabezal"></b>';
    pista.setAttribute('aria-valuemax', T.toFixed(1));
    const dif = Math.abs(T - p.duracion);
    el.querySelector('#sb-total').innerHTML = `${T.toFixed(1)} s en ${p.escenas.length} escenas${dif > 0.6 ? ` <span class="ojo-txt">(pediste ${p.duracion} s)</span>` : ''}`;
  }
  function cuadro(ms) {
    if (!vivo || !canvas.isConnected) return;
    const T = total(p) || 1;
    if (sonando) { t += (ms - ultimo) / 1000; if (t >= T) { t = 0; sonando = false; boton(); } }
    ultimo = ms;
    const { i, local, d } = escenaEn(t); const e = p.escenas[i];
    dibujarEstilo(g, local + i * 3, estilo, i, W, H);
    // rótulo de la escena y su texto en pantalla, encima del dibujo
    g.fillStyle = 'rgba(27,29,26,.78)'; g.fillRect(0, H - 92, W, 92);
    g.fillStyle = '#ffb700'; g.font = '500 20px "IBM Plex Mono", monospace'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText(`${String(i + 1).padStart(2, '0')} · ${(e.papel || '').toUpperCase()}`, 28, H - 62);
    g.fillStyle = '#fff8ef'; g.font = '600 26px Poppins, sans-serif';
    g.fillText((e.texto || e.descripcion || '').slice(0, 58), 28, H - 28);
    const alfa = Math.min(1, local / 0.25, (d - local) / 0.25); // corte suave entre escenas
    if (alfa < 1) { g.fillStyle = `rgba(27,29,26,${1 - Math.max(0, alfa)})`; g.fillRect(0, 0, W, H); }
    el.querySelector('#sb-tc').textContent = tc(t, p.fps);
    const cab = el.querySelector('#sb-cabezal'); if (cab) cab.style.left = `${(t / T) * 100}%`;
    pista.setAttribute('aria-valuenow', t.toFixed(1));
    el.querySelectorAll('.escena').forEach((li, k) => li.classList.toggle('is-on', k === i));
    requestAnimationFrame(cuadro);
  }
  const boton = () => { const b = el.querySelector('#sb-play'); b.setAttribute('aria-label', sonando ? 'Pausar' : 'Reproducir'); b.innerHTML = sonando ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>'; };
  el.querySelector('#sb-play').addEventListener('click', () => { sonando = !sonando; boton(); });
  const buscar = (ev) => { const r = pista.getBoundingClientRect(); t = Math.max(0, Math.min(0.999, (ev.clientX - r.left) / r.width)) * total(p); };
  pista.addEventListener('pointerdown', (ev) => { pista.setPointerCapture(ev.pointerId); buscar(ev); pista.onpointermove = buscar; });
  pista.addEventListener('pointerup', () => { pista.onpointermove = null; });
  pista.addEventListener('keydown', (ev) => { if (ev.key === 'ArrowRight') t = Math.min(total(p) - 0.01, t + 0.5); if (ev.key === 'ArrowLeft') t = Math.max(0, t - 0.5); });

  /* edición de escenas */
  const lista = el.querySelector('#sb-escenas');
  const relistar = () => { lista.innerHTML = p.escenas.map((e, i) => tarjeta(e, i, p.escenas.length)).join(''); pintarPista(); pintarEstimado(); app.guardarBorrador(); };
  lista.addEventListener('input', (ev) => {
    const li = ev.target.closest('.escena'); const k = ev.target.dataset.k; if (!li || !k) return;
    p.escenas[li.dataset.i][k] = k === 'duracion' ? Math.max(0.5, Number(ev.target.value) || 0.5) : ev.target.value;
    if (k === 'duracion') pintarPista();
    app.guardarBorrador();
  });
  lista.addEventListener('click', (ev) => {
    const li = ev.target.closest('.escena'); if (!li) return; const i = Number(li.dataset.i);
    if ('ver' in ev.target.dataset) { let a = 0; for (let k = 0; k < i; k++) a += Number(p.escenas[k].duracion) || 0; t = a + 0.3; }
    if (ev.target.dataset.mover) { const j = i + Number(ev.target.dataset.mover); [p.escenas[i], p.escenas[j]] = [p.escenas[j], p.escenas[i]]; relistar(); }
    if ('borrar' in ev.target.dataset) { p.escenas.splice(i, 1); t = 0; relistar(); }
  });
  el.querySelector('#sb-agregar').addEventListener('click', () => { p.escenas.splice(Math.max(1, p.escenas.length - 1), 0, { papel: 'Nueva escena', duracion: 3, descripcion: '', texto: '' }); relistar(); });

  const guardar = async () => {
    await app.guardar({ 'BRIEF.md': briefMd(p), 'PROMPT.md': promptMd(p) });
    el.querySelector('#sb-carpeta').textContent = `cd "${p.carpeta}"`;
  };
  el.querySelector('#sb-guardar').addEventListener('click', async () => { try { await guardar(); avisar('Storyboard guardado en BRIEF.md.'); } catch (e) { avisar(e.message, true); } });
  el.querySelectorAll('[data-copiar-de]').forEach((b) => b.addEventListener('click', () => copiar(el.querySelector(`#${b.dataset.copiarDe}`).textContent)));
  el.querySelector('#cambiar-motor').addEventListener('click', () => { app.paso = 5; ir('nuevo'); });

  function pintarEstimado() {
    const e = estimar(p, app.calibracion);
    el.querySelector('#sb-estimado').innerHTML = `<p class="sobre mono">Estimado honesto</p>
      <div class="estimado__nivel estimado__nivel--${e.nivel}"><strong>${e.pct == null ? 'Pago por uso' : `≈ ${fmtPct(e.pct)}`}</strong><span>${e.pct == null ? '' : `de una ventana de 5 h (${esc(e.plan.titulo)}), con ${p.rondas} rondas de corrección`}</span></div>
      ${e.pctPrimera == null ? '' : `<p class="mono tenue">Solo la primera pasada: ≈ ${fmtPct(e.pctPrimera)} · ${fmtK(e.tokens.primera)} tokens</p>`}
      <p>${e.texto}</p>${e.avisos.map((a) => `<p class="ojo">${esc(a)}</p>`).join('')}
      <p class="tenue">Estimación propia, no dato oficial. Se afina en el paso «Cuenta, modelo y costo».</p>`;
  }

  /* lanzar desde la app */
  const ok = el.querySelector('#sb-ok'), lanzar = el.querySelector('#sb-lanzar'), detener = el.querySelector('#sb-detener'), log = el.querySelector('#sb-log');
  ok?.addEventListener('change', () => { lanzar.disabled = !ok.checked; });
  lanzar?.addEventListener('click', async () => {
    try {
      await guardar();
      lanzar.disabled = true; detener.hidden = false; log.hidden = false; log.textContent = '';
      const r = await fetch('/api/ejecutar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id, archivo: 'PROMPT.md', modelo: p.modelo, esfuerzo: p.esfuerzo, confirmado: true }) });
      if (!r.ok) throw new Error((await r.json()).error);
      const lector = r.body.getReader(); const dec = new TextDecoder();
      for (;;) { const { done, value } = await lector.read(); if (done) break; log.textContent += dec.decode(value, { stream: true }); log.scrollTop = log.scrollHeight; }
      avisar('El agente terminó. Revisa el resultado en Revisión.');
    } catch (e) { avisar(e.message, true); }
    detener.hidden = true; ok.checked = false;
  });
  detener?.addEventListener('click', () => api('/api/detener', {}).then(() => avisar('Generación detenida.')));

  pintarPista(); pintarEstimado(); requestAnimationFrame((ms) => { ultimo = ms; cuadro(ms); });
  return () => { vivo = false; };
}

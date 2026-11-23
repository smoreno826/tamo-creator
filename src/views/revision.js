import { esc, avisar, copiar, api } from '../main.js';
import { correccionesMd, comando, tc } from '../lib/brief.js';
import { estimar, fmtPct } from '../lib/estimador.js';

const VERDE = '#5fe08a';
const HERRAMIENTAS = [
  { id: 'circulo', titulo: 'Círculo', icono: '<circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" stroke-width="2"/>' },
  { id: 'lapiz', titulo: 'Trazo libre', icono: '<path d="M4 18c3-9 5 3 8-4s4-6 8-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' },
  { id: 'flecha', titulo: 'Flecha', icono: '<path d="M5 19 18 6M9 6h9v9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' },
];

/* ── geometría del trazo (todo en coordenadas 0–1 del cuadro) ── */
function cajaDe(c) {
  const xs = c.puntos.map((q) => q[0]), ys = c.puntos.map((q) => q[1]);
  const x = Math.max(0, Math.min(...xs)), y = Math.max(0, Math.min(...ys));
  return { x, y, w: Math.min(1, Math.max(...xs)) - x, h: Math.min(1, Math.max(...ys)) - y };
}
function trazar(g, c, W, H, grosor) {
  g.strokeStyle = VERDE; g.lineWidth = grosor; g.lineCap = 'round'; g.lineJoin = 'round';
  const P = c.puntos.map(([x, y]) => [x * W, y * H]);
  if (P.length < 2) return;
  g.beginPath();
  if (c.forma === 'circulo') {
    const [a, b] = [P[0], P[P.length - 1]];
    g.ellipse((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.abs(b[0] - a[0]) / 2, Math.abs(b[1] - a[1]) / 2, 0, 0, Math.PI * 2);
  } else if (c.forma === 'flecha') {
    const [a, b] = [P[0], P[P.length - 1]]; const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = grosor * 5;
    g.moveTo(...a); g.lineTo(...b);
    g.moveTo(b[0] - L * Math.cos(ang - 0.45), b[1] - L * Math.sin(ang - 0.45)); g.lineTo(...b); g.lineTo(b[0] - L * Math.cos(ang + 0.45), b[1] - L * Math.sin(ang + 0.45));
  } else { g.moveTo(...P[0]); for (const q of P.slice(1)) g.lineTo(...q); }
  g.stroke();
}

function panelParametros(app) {
  const pr = app.parametros; if (!pr?.grupos?.length) return '<p class="tenue">Sin parámetros cargados.</p>';
  const p = app.proyecto;
  return `${pr.esEjemplo ? '<p class="ojo">Estos controles son un ejemplo. Los parámetros definitivos se cargan desde <code>colaboradores/jriesgo/parametros/</code>.</p>' : ''}
  ${pr.grupos.map((g) => `<fieldset class="grupo"><legend>${esc(g.titulo)}</legend>
    ${g.error ? `<p class="alerta">${esc(g.error)}</p>` : ''}
    ${(g.controles || []).map((c) => {
      const k = `${g.id}.${c.id}`; const v = p.ajustes?.[k] ?? c.base;
      if (c.tipo === 'opciones') return `<label class="campo"><span>${esc(c.titulo)}</span><select data-ajuste="${esc(k)}">${c.opciones.map((o) => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`;
      return `<label class="campo campo--rango"><span>${esc(c.titulo)} <b class="mono" data-valor-de="${esc(k)}">${v}${esc(c.unidad ? ` ${c.unidad}` : '')}</b></span>
        <input type="range" min="${c.min}" max="${c.max}" step="${c.paso}" value="${v}" data-ajuste="${esc(k)}" data-unidad="${esc(c.unidad || '')}" data-base="${c.base}" /></label>`;
    }).join('')}</fieldset>`).join('')}
  <button class="enlace" id="rv-restablecer">Restablecer ajustes</button>`;
}

export function render(app) {
  const p = app.proyecto;
  return `
  <section class="bloque rv">
    <div class="bloque__cab"><div><p class="sobre mono">Revisión</p><h1>${esc(p.nombre || 'Marca lo que no te gustó')}</h1></div>
      <div class="fila">
        <select id="rv-fuente" aria-label="Versión a revisar"><option value="">Versiones del proyecto…</option></select>
        <label class="btn btn--linea btn--archivo">Abrir un video<input type="file" id="rv-archivo" accept="video/*" /></label>
      </div></div>
    <p class="intro">Pausa donde algo no te convence, encierra la zona y escribe qué cambiar. Tu agente recibe el segundo exacto, la zona marcada y una captura: ya no tienes que describir dónde está el problema.</p>

    <div class="rv__cuerpo">
      <div class="rv__izq">
        <div class="escenario" id="rv-escenario">
          <video id="rv-video" playsinline preload="metadata"></video>
          <canvas id="rv-lienzo" aria-label="Zona de dibujo sobre el video"></canvas>
          <div class="llamada" id="rv-llamada" hidden>
            <label for="rv-texto" class="mono">Corrección es:</label>
            <textarea id="rv-texto" rows="3" placeholder="Ej. Esta silueta se ve recortada, suaviza el borde."></textarea>
            <div class="fila"><button class="btn btn--mini" id="rv-listo">Listo</button><button class="enlace enlace--malo" id="rv-quitar">Quitar</button></div>
          </div>
          <p class="vacio" id="rv-vacio">Elige una versión del proyecto o abre un video de tu computadora.<br /><span class="tenue">El video no se sube a ningún lado.</span></p>
        </div>

        <div class="herramientas" role="toolbar" aria-label="Herramientas de marcado">
          ${HERRAMIENTAS.map((h, i) => `<button class="herr ${i === 0 ? 'is-on' : ''}" data-herr="${h.id}" aria-pressed="${i === 0}" title="${h.titulo}"><svg viewBox="0 0 24 24" aria-hidden="true">${h.icono}</svg><span>${h.titulo}</span></button>`).join('')}
          <span class="sep"></span>
          <button class="btn btn--redondo" id="rv-play" aria-label="Reproducir"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></button>
          <button class="herr" id="rv-atras" title="Un cuadro atrás (←)"><span>−1 cuadro</span></button>
          <button class="herr" id="rv-adelante" title="Un cuadro adelante (→)"><span>+1 cuadro</span></button>
          <span class="mono rv__tc"><b id="rv-tc">00:00:00</b> / <span id="rv-dur">00:00:00</span></span>
        </div>
        <div class="linea" id="rv-linea" role="slider" tabindex="0" aria-label="Línea de tiempo" aria-valuemin="0"><i id="rv-avance"></i><b id="rv-cabezal"></b><div id="rv-marcas"></div></div>
        <p class="mono tenue atajos">Espacio: reproducir · ← →: un cuadro · Shift + ← →: un segundo · arrastra sobre el video para marcar</p>
      </div>

      <aside class="rv__der">
        <h2 class="sub">Correcciones <span class="mono tenue" id="rv-cuenta"></span></h2>
        <ol class="notas" id="rv-notas"></ol>
        <details class="plegable" open><summary>Parámetros de corrección</summary><div id="rv-params">${panelParametros(app)}</div></details>
        <div class="rv__enviar">
          <p class="mono tenue" id="rv-costo"></p>
          <button class="btn" id="rv-guardar">Guardar correcciones</button>
          <div class="cmd" id="rv-cmd-caja" hidden><code id="rv-cmd"></code><button class="btn btn--mini btn--linea" id="rv-copiar">Copiar</button></div>
        </div>
      </aside>
    </div>
  </section>`;
}

export function montar(el, app) {
  const p = app.proyecto; p.correcciones ||= []; p.ajustes ||= {};
  const $ = (s) => el.querySelector(s);
  const video = $('#rv-video'), lienzo = $('#rv-lienzo'), escenario = $('#rv-escenario'), llamada = $('#rv-llamada'), texto = $('#rv-texto'), linea = $('#rv-linea');
  const g = lienzo.getContext('2d');
  let herr = 'circulo', dibujando = null, sel = null, nombreVideo = '', vivo = true, urlLocal = null;
  const fps = () => p.fps || 30;
  const dur = () => (Number.isFinite(video.duration) ? video.duration : 0);

  /* ── fuente del video ── */
  function cargar(url, nombre) {
    video.src = url; nombreVideo = nombre; $('#rv-vacio').hidden = true; sel = null; llamada.hidden = true;
  }
  if (p.id) api(`/api/proyectos/${p.id}`).then((d) => {
    const s = $('#rv-fuente');
    s.innerHTML = (d.videos.length ? '' : '<option value="">Aún no hay videos en exports/</option>') + d.videos.map((v) => `<option value="${esc(v.url)}">${esc(v.nombre)}</option>`).join('');
    if (d.videos.length) { const u = d.videos[d.videos.length - 1]; s.value = u.url; cargar(u.url, u.nombre); }
  }).catch(() => {});
  $('#rv-fuente').addEventListener('change', (e) => { if (e.target.value) cargar(e.target.value, e.target.selectedOptions[0].textContent); });
  $('#rv-archivo').addEventListener('change', (e) => {
    const f = e.target.files[0]; if (!f) return;
    if (urlLocal) URL.revokeObjectURL(urlLocal);
    urlLocal = URL.createObjectURL(f); cargar(urlLocal, f.name);
  });
  video.addEventListener('loadedmetadata', () => {
    escenario.style.aspectRatio = `${video.videoWidth}/${video.videoHeight}`; escenario.style.setProperty("--ar", (video.videoWidth / video.videoHeight).toFixed(4));
    $('#rv-dur').textContent = tc(dur(), fps()); linea.setAttribute('aria-valuemax', dur().toFixed(2));
    requestAnimationFrame(() => { medir(); pintarMarcas(); });
  });
  video.addEventListener('error', () => { if (video.src) avisar('El navegador no pudo abrir ese video. Prueba con un MP4 (H.264).', true); });

  /* ── lienzo ── */
  function medir() {
    const r = escenario.getBoundingClientRect(); const dpr = Math.min(2, window.devicePixelRatio || 1);
    lienzo.width = Math.max(1, Math.round(r.width * dpr)); lienzo.height = Math.max(1, Math.round(r.height * dpr));
  }
  const ro = new ResizeObserver(medir); ro.observe(escenario);
  const visibles = () => p.correcciones.filter((c) => c === sel || (video.currentTime >= c.t - 0.04 && video.currentTime <= c.t + (c.dur || 2)));

  function cuadro() {
    if (!vivo || !lienzo.isConnected) return;
    const W = lienzo.width, H = lienzo.height, grosor = Math.max(2.5, W / 320);
    g.clearRect(0, 0, W, H);
    for (const c of visibles()) { g.globalAlpha = c === sel ? 1 : 0.75; trazar(g, c, W, H, grosor); }
    g.globalAlpha = 1;
    if (dibujando) trazar(g, dibujando, W, H, grosor);
    if (sel && !llamada.hidden) { // la línea verde que une la marca con su nota
      const b = sel.caja, r = escenario.getBoundingClientRect(), l = llamada.getBoundingClientRect();
      const aDer = l.left > r.left + (b.x + b.w / 2) * r.width;
      const x1 = (aDer ? b.x + b.w : b.x) * W, y1 = (b.y + b.h / 2) * H;
      const x2 = ((aDer ? l.left : l.right) - r.left) / r.width * W, y2 = ((l.top + 18) - r.top) / r.height * H;
      g.strokeStyle = VERDE; g.lineWidth = grosor * 0.7; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      g.fillStyle = VERDE; g.beginPath(); g.arc(x1, y1, grosor * 1.6, 0, 7); g.fill();
    }
    const d = dur();
    $('#rv-tc').textContent = tc(video.currentTime || 0, fps());
    if (d) { const f = `${(video.currentTime / d) * 100}%`; $('#rv-avance').style.width = f; $('#rv-cabezal').style.left = f; linea.setAttribute('aria-valuenow', video.currentTime.toFixed(2)); }
    requestAnimationFrame(cuadro);
  }

  const punto = (ev) => { const r = lienzo.getBoundingClientRect(); return [Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)), Math.max(0, Math.min(1, (ev.clientY - r.top) / r.height))]; };
  lienzo.addEventListener('pointerdown', (ev) => {
    if (!dur()) return avisar('Primero abre un video.', true);
    video.pause(); lienzo.setPointerCapture(ev.pointerId);
    dibujando = { forma: herr, puntos: [punto(ev)] };
  });
  lienzo.addEventListener('pointermove', (ev) => {
    if (!dibujando) return; const q = punto(ev);
    if (dibujando.forma === 'lapiz') dibujando.puntos.push(q); else dibujando.puntos[1] = q;
  });
  lienzo.addEventListener('pointerup', () => {
    if (!dibujando) return; const c = dibujando; dibujando = null;
    if (c.puntos.length < 2) return;
    const caja = cajaDe(c); if (caja.w < 0.012 && caja.h < 0.012) return; // un clic sin arrastre no es una marca
    Object.assign(c, { id: Date.now().toString(36), t: Math.round(video.currentTime * 1000) / 1000, dur: 2, texto: '', caja });
    p.correcciones.push(c); elegir(c, true); pintarNotas(); app.guardarBorrador();
  });

  /* ── nota junto a la marca ── */
  function elegir(c, enfocar) {
    sel = c;
    if (!c) { llamada.hidden = true; pintarNotas(); return; }
    if (Math.abs(video.currentTime - c.t) > 0.02) video.currentTime = c.t;
    video.pause();
    const b = c.caja, aDer = b.x + b.w / 2 < 0.55; // la nota se abre hacia el lado con más espacio
    llamada.hidden = false;
    llamada.style.left = aDer ? `${Math.min(70, (b.x + b.w) * 100 + 5)}%` : 'auto';
    llamada.style.right = aDer ? 'auto' : `${Math.min(70, (1 - b.x) * 100 + 5)}%`;
    llamada.style.top = `${Math.max(3, Math.min(58, (b.y + b.h / 2) * 100 - 14))}%`;
    texto.value = c.texto || '';
    if (enfocar) texto.focus();
    pintarNotas();
  }
  texto.addEventListener('input', () => { if (!sel) return; sel.texto = texto.value; const t = el.querySelector(`.nota[data-id="${sel.id}"] textarea`); if (t) t.value = texto.value; app.guardarBorrador(); });
  $('#rv-listo').addEventListener('click', () => elegir(null));
  $('#rv-quitar').addEventListener('click', () => { p.correcciones = p.correcciones.filter((c) => c !== sel); elegir(null); pintarMarcas(); app.guardarBorrador(); });

  /* ── lista y marcas en la línea de tiempo ── */
  function pintarNotas() {
    const orden = [...p.correcciones].sort((a, b) => a.t - b.t);
    $('#rv-cuenta').textContent = orden.length ? `· ${orden.length}` : '';
    $('#rv-notas').innerHTML = orden.length ? orden.map((c, i) => `
      <li class="nota ${c === sel ? 'is-on' : ''}" data-id="${c.id}">
        <header><button class="enlace mono" data-ir-a>${String(i + 1).padStart(2, '0')} · ${tc(c.t, fps())}</button>
          <label class="mono tenue">durante <input type="number" min="0" max="60" step="0.5" value="${c.dur}" data-dur aria-label="Segundos que aplica" /> s</label>
          <button class="enlace enlace--malo" data-borrar aria-label="Quitar corrección">Quitar</button></header>
        <textarea rows="2" placeholder="Corrección es…" aria-label="Texto de la corrección">${esc(c.texto)}</textarea>
      </li>`).join('') : '<li class="tenue">Todavía no marcas nada. Arrastra sobre el video para encerrar lo que no te gustó.</li>';
    pintarMarcas(); pintarCosto();
  }
  function pintarMarcas() {
    const d = dur(); if (!d) { $('#rv-marcas').innerHTML = ''; return; }
    $('#rv-marcas').innerHTML = [...p.correcciones].sort((a, b) => a.t - b.t).map((c, i) => `<button class="marca ${c === sel ? 'is-on' : ''}" style="left:${(c.t / d) * 100}%;--ancho:${((c.dur || 0) / d) * 100}%" data-id="${c.id}" aria-label="Corrección ${i + 1} en ${tc(c.t, fps())}"></button>`).join('');
  }
  const porId = (id) => p.correcciones.find((c) => c.id === id);
  $('#rv-notas').addEventListener('click', (ev) => {
    const li = ev.target.closest('.nota'); if (!li) return; const c = porId(li.dataset.id);
    if ('borrar' in ev.target.dataset) { p.correcciones = p.correcciones.filter((x) => x !== c); if (sel === c) elegir(null); else pintarNotas(); app.guardarBorrador(); }
    else if ('irA' in ev.target.dataset) elegir(c);
  });
  $('#rv-notas').addEventListener('input', (ev) => {
    const li = ev.target.closest('.nota'); if (!li) return; const c = porId(li.dataset.id);
    if ('dur' in ev.target.dataset) { c.dur = Math.max(0, Number(ev.target.value) || 0); pintarMarcas(); }
    else { c.texto = ev.target.value; if (c === sel) texto.value = c.texto; }
    app.guardarBorrador();
  });
  $('#rv-marcas').addEventListener('click', (ev) => { const c = porId(ev.target.dataset.id); if (c) { ev.stopPropagation(); elegir(c); } });

  /* ── transporte ── */
  const iconoPlay = () => { $('#rv-play').innerHTML = video.paused ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>'; $('#rv-play').setAttribute('aria-label', video.paused ? 'Reproducir' : 'Pausar'); };
  const alternar = () => { if (!dur()) return; if (video.paused) { elegir(null); video.play(); } else video.pause(); };
  const paso = (seg) => { video.pause(); video.currentTime = Math.max(0, Math.min(dur(), video.currentTime + seg)); };
  video.addEventListener('play', iconoPlay); video.addEventListener('pause', iconoPlay);
  $('#rv-play').addEventListener('click', alternar);
  $('#rv-atras').addEventListener('click', () => paso(-1 / fps()));
  $('#rv-adelante').addEventListener('click', () => paso(1 / fps()));
  const buscar = (ev) => { const r = linea.getBoundingClientRect(); video.currentTime = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)) * dur(); };
  linea.addEventListener('pointerdown', (ev) => { if (ev.target.classList.contains('marca') || !dur()) return; linea.setPointerCapture(ev.pointerId); elegir(null); buscar(ev); linea.onpointermove = buscar; });
  linea.addEventListener('pointerup', () => { linea.onpointermove = null; });
  const teclas = (ev) => {
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName)) return;
    if (ev.code === 'Space') { ev.preventDefault(); alternar(); }
    if (ev.key === 'ArrowRight') { ev.preventDefault(); paso(ev.shiftKey ? 1 : 1 / fps()); }
    if (ev.key === 'ArrowLeft') { ev.preventDefault(); paso(ev.shiftKey ? -1 : -1 / fps()); }
    if (ev.key === 'Escape') elegir(null);
  };
  document.addEventListener('keydown', teclas);
  el.querySelectorAll('[data-herr]').forEach((b) => b.addEventListener('click', () => { herr = b.dataset.herr; el.querySelectorAll('[data-herr]').forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', x === b); }); }));

  /* ── parámetros ── */
  const params = $('#rv-params');
  params.addEventListener('input', (ev) => {
    const k = ev.target.dataset.ajuste; if (!k) return;
    const v = ev.target.type === 'range' ? Number(ev.target.value) : ev.target.value; p.ajustes[k] = v;
    const b = params.querySelector(`[data-valor-de="${k}"]`); if (b) b.textContent = `${v}${ev.target.dataset.unidad ? ` ${ev.target.dataset.unidad}` : ''}`;
    app.guardarBorrador();
  });
  params.addEventListener('click', (ev) => { if (ev.target.id === 'rv-restablecer') { p.ajustes = {}; params.innerHTML = panelParametros(app); app.guardarBorrador(); } });
  if (!app.parametros) app.cargarParametros().then(() => { if (vivo) params.innerHTML = panelParametros(app); });

  /* ── guardar: documento + capturas para el agente ── */
  function pintarCosto() {
    const e = estimar({ ...p, rondas: 1 }, app.calibracion);
    const ronda = e.pct == null ? null : e.pct - e.pctPrimera;
    $('#rv-costo').textContent = ronda == null ? 'Cada ronda de corrección se paga por uso en tu API.' : `Mandar esta ronda: ≈ ${fmtPct(ronda)} de una ventana de 5 h (estimado).`;
  }
  const irA = (t) => new Promise((ok) => { if (Math.abs(video.currentTime - t) < 0.001) return ok(); video.addEventListener('seeked', ok, { once: true }); video.currentTime = t; });
  async function capturas() {
    const img = {}; const orden = [...p.correcciones].sort((a, b) => a.t - b.t);
    const W = Math.min(1280, video.videoWidth), H = Math.round(W * video.videoHeight / video.videoWidth);
    const c2 = document.createElement('canvas'); c2.width = W; c2.height = H; const g2 = c2.getContext('2d');
    for (let i = 0; i < orden.length; i++) {
      await irA(orden[i].t);
      g2.drawImage(video, 0, 0, W, H); trazar(g2, orden[i], W, H, Math.max(3, W / 300));
      orden[i].imagen = `c${String(i + 1).padStart(2, '0')}.png`;
      img[orden[i].imagen] = c2.toDataURL('image/png');
    }
    return img;
  }
  $('#rv-guardar').addEventListener('click', async (ev) => {
    const hayAjustes = Object.keys(p.ajustes).length > 0;
    if (!p.correcciones.length && !hayAjustes) return avisar('No hay nada que guardar: marca algo o mueve un parámetro.', true);
    if (!p.id) return avisar('Este video no pertenece a un proyecto. Crea uno en «Crear» para guardar las correcciones.', true);
    const sinTexto = p.correcciones.filter((c) => !c.texto?.trim()).length;
    const boton = ev.currentTarget; boton.disabled = true;
    try {
      elegir(null);
      const img = dur() ? await capturas() : {};
      p.etapa = 'correccion';
      await app.guardar({ 'CORRECCIONES.md': correccionesMd(p, nombreVideo) }, img);
      $('#rv-cmd-caja').hidden = false; $('#rv-cmd').textContent = comando(p, 'CORRECCIONES.md');
      avisar(sinTexto ? `Guardado. Ojo: ${sinTexto} marca(s) no tienen texto.` : `Guardado: CORRECCIONES.md y ${Object.keys(img).length} captura(s).`, Boolean(sinTexto));
    } catch (e) { avisar(`No se pudo guardar: ${e.message}`, true); }
    boton.disabled = false;
  });
  $('#rv-copiar').addEventListener('click', () => copiar($('#rv-cmd').textContent));

  medir(); pintarNotas(); requestAnimationFrame(cuadro);
  return () => { vivo = false; ro.disconnect(); document.removeEventListener('keydown', teclas); video.pause(); if (urlLocal) URL.revokeObjectURL(urlLocal); };
}

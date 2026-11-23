import { esc, ir, avisar } from '../main.js';
import { TIPOS, FORMATOS, ESTILOS, AUDIO, PLATAFORMAS, ESFUERZOS, MOTORES, PASOS } from '../data/opciones.js';
import { estimar, fmtK, fmtPct } from '../lib/estimador.js';
import { storyboardBase, briefMd, promptMd } from '../lib/brief.js';
import { montarPreviews } from '../previews/previews.js';

const campo = (id, etiqueta, valor, extra = '') => `<label class="campo"><span>${etiqueta}</span><input type="text" data-campo="${id}" value="${esc(valor)}" ${extra} /></label>`;
const area = (id, etiqueta, valor, ph = '', filas = 3) => `<label class="campo"><span>${etiqueta}</span><textarea data-campo="${id}" rows="${filas}" placeholder="${esc(ph)}">${esc(valor)}</textarea></label>`;
const opcion = (grupo, id, activo, cuerpo, extra = '') => `<button type="button" class="opcion ${activo ? 'is-on' : ''} ${extra}" data-elige="${grupo}" data-valor="${esc(id)}" aria-pressed="${activo}">${cuerpo}</button>`;

/* ── cada paso ── */
const PASO = {
  tipo: (p) => `
    <h1>¿Qué tipo de video quieres hacer?</h1>
    <p class="intro">Si no estás seguro, mira los ejemplos: cada miniatura muestra cómo se ve ese camino. Puedes cambiarlo después.</p>
    <div class="rejilla rejilla--tipos">
      ${TIPOS.map((t) => opcion('tipo', t.id, p.tipo === t.id, `
        <canvas data-preview="${t.preview}" aria-hidden="true"></canvas>
        <span class="opcion__cuerpo">
          <strong>${esc(t.titulo)}</strong>
          <span>${esc(t.resumen)}</span>
          <span class="mono tenue">Ideal para: ${esc(t.ideal)}</span>
          <span class="chips">${t.necesita.map((n) => `<i class="chip">${{ agente: 'Claude o Codex', higgsfield: 'Higgsfield', material: 'Tu material' }[n]}</i>`).join('')}</span>
        </span>`, 'opcion--tipo')).join('')}
    </div>`,

  formato: (p) => `
    <h1>Formato y duración</h1>
    <p class="intro">Elige según dónde se va a publicar. Un video más largo no es más caro por segundo, pero sí son más escenas que producir y corregir.</p>
    <div class="rejilla rejilla--formatos">
      ${FORMATOS.map((f) => opcion('formato', f.id, p.formato === f.id, `
        <span class="marco"><i style="aspect-ratio:${f.w}/${f.h}"></i></span>
        <span class="opcion__cuerpo"><strong>${f.titulo} · ${f.id}</strong><span>${esc(f.uso)}</span><span class="mono tenue">${f.w}×${f.h}</span></span>`)).join('')}
    </div>
    <div class="dos">
      <label class="campo"><span>Duración: <b id="dur-valor" class="mono">${p.duracion} s</b></span>
        <input type="range" min="6" max="90" step="1" value="${p.duracion}" data-campo="duracion" data-num />
        <small class="tenue">Menos de 15 s: un solo mensaje. 15 a 40 s: lo normal en redes. Más de 60 s: planéalo por partes.</small></label>
      <div class="campo"><span>Cuadros por segundo</span>
        <div class="segmento">${[24, 30, 60].map((f) => opcion('fps', f, p.fps === f, `${f} fps`, 'opcion--seg')).join('')}</div>
        <small class="tenue">30 es lo estándar. 60 se ve más fluido y tarda el doble en renderizar.</small></div>
    </div>`,

  estilo: (p) => `
    <h1>¿Qué estilo visual te gusta más?</h1>
    <p class="intro">Este es el punto que casi ninguna herramienta te pregunta. Elige el que más se acerque; el color y la tipografía se ajustan después a tu marca.</p>
    <div class="rejilla rejilla--estilos">
      ${ESTILOS.map((e, i) => opcion('estilo', e.id, p.estilo === e.id, `
        <canvas data-estilo="${e.id}" data-semilla="${i}" aria-hidden="true"></canvas>
        <span class="opcion__cuerpo"><strong>${esc(e.titulo)}</strong><span>${esc(e.nota)}</span></span>`)).join('')}
    </div>`,

  contenido: (p) => {
    const tipo = TIPOS.find((t) => t.id === p.tipo);
    return `
    <h1>¿Qué tiene que decir?</h1>
    <p class="intro">Entre más claro seas aquí, menos rondas de corrección vas a gastar. Un agente no adivina: sigue lo que está escrito.</p>
    ${campo('nombre', 'Nombre del proyecto', p.nombre, 'placeholder="Ej. Lanzamiento colección otoño"')}
    ${area('mensaje', 'El mensaje, en una frase', p.mensaje, 'Qué debe recordar quien lo vea.', 2)}
    ${campo('audiencia', '¿Para quién es?', p.audiencia, 'placeholder="Ej. Clientes nuevos en Instagram"')}
    ${area('textoPantalla', 'Texto que debe aparecer en pantalla (una línea por texto)', p.textoPantalla, 'Título\nDato o beneficio\nLlamado a la acción', 4)}
    ${area('referencias', 'Referencias (enlaces o descripción)', p.referencias, 'Pega enlaces a videos que te gusten y di qué te gusta de cada uno.', 3)}
    ${tipo?.necesita.includes('material') ? campo('carpetaMaterial', 'Carpeta con tu material grabado', p.carpetaMaterial, 'placeholder="D:\\Videos\\mi-grabacion"') + '<small class="tenue">Tu material no se sube a ningún lado: el agente lo lee desde esa carpeta en tu computadora.</small>' : ''}`;
  },

  audio: (p) => `
    <h1>Audio</h1>
    <div class="franco">
      <strong>Para que lo sepas antes de decidir</strong>
      <p>La IA todavía no genera buen sonido. Música y efectos generados suenan genéricos y se repiten. Lo que mejor funciona es que uses <b>tus propios sonidos</b> y dejes que tu agente te diga cómo editarlos: qué pista, dónde cortar, a qué volumen.</p>
    </div>
    <div class="rejilla rejilla--audio">
      ${AUDIO.map((a) => opcion('audio', a.id, p.audio === a.id, `
        <span class="opcion__cuerpo"><strong>${esc(a.titulo)}</strong>
        ${a.recomendado ? '<i class="chip chip--ok">Recomendado</i>' : ''}${a.aviso ? '<i class="chip chip--ojo">Calidad limitada</i>' : ''}
        <span>${esc(a.texto)}</span></span>`)).join('')}
    </div>
    ${p.audio === 'carpeta' ? `${campo('carpetaAudio', 'Carpeta con tu música y efectos', p.carpetaAudio, 'placeholder="D:\\Sonidos\\biblioteca"')}
      <small class="tenue">Sirven WAV, MP3 y AIFF. El agente arma un inventario (nombre, duración, tipo) y propone la mezcla escena por escena. Asegúrate de tener derecho a usar esos sonidos.</small>` : ''}`,

  motor: (p) => {
    const plat = PLATAFORMAS[p.plataforma];
    return `
    <h1>Cuenta, modelo y costo</h1>
    <p class="intro">Aquí se decide cuánto de tu plan se gasta. Te decimos lo que casi nadie dice: <b>elegir el modelo más caro no garantiza un buen video</b>. Lo que más cambia el resultado es el esfuerzo con el que lo pones a trabajar.</p>
    <div class="dos dos--ancha">
      <div>
        <h2 class="sub">1. ¿Con qué cuenta trabajas?</h2>
        <div class="segmento">${Object.entries(PLATAFORMAS).map(([k, v]) => opcion('plataforma', k, p.plataforma === k, v.titulo, 'opcion--seg')).join('')}</div>

        <h2 class="sub">2. ¿Quién hace los motion graphics?</h2>
        <div class="rejilla rejilla--dos">${plat.motores.map((m) => opcion('motor', m, p.motor === m, `<span class="opcion__cuerpo"><strong>${MOTORES[m].titulo}</strong><span>${MOTORES[m].texto}</span></span>`)).join('')}</div>
        ${p.plataforma === 'codex' ? '<small class="tenue">Con Codex el motor es Hyperframes, siempre.</small>' : ''}

        <h2 class="sub">3. Modelo</h2>
        <div class="lista">${plat.modelos.map((m) => opcion('modelo', m.id, p.modelo === m.id, `
          <span class="opcion__cuerpo"><strong>${m.titulo}</strong><span>${m.para}</span></span>
          <span class="medidor" title="Gasto relativo"><span class="mono tenue">gasto</span>${'<i></i>'.repeat(4).replace(/<i><\/i>/g, (_, o) => `<i class="${o / 7 < m.nivel ? 'on' : ''}"></i>`)}</span>`, 'opcion--fila')).join('')}</div>

        <h2 class="sub">4. Esfuerzo</h2>
        <div class="lista">${ESFUERZOS.map((e) => opcion('esfuerzo', e.id, p.esfuerzo === e.id, `
          <span class="opcion__cuerpo"><strong>${e.titulo}</strong><span>${e.resultado}</span></span>
          <span class="mono tenue">×${e.mult}</span>`, 'opcion--fila')).join('')}</div>

        <h2 class="sub">5. Tu plan y cuántas veces vas a corregir</h2>
        <div class="segmento">${plat.planes.map((x) => opcion('plan', x.id, p.plan === x.id, x.titulo, 'opcion--seg')).join('')}</div>
        <label class="campo"><span>Rondas de corrección previstas: <b id="rondas-valor" class="mono">${p.rondas}</b></span>
          <input type="range" min="0" max="6" step="1" value="${p.rondas}" data-campo="rondas" data-num />
          <small class="tenue">Casi ningún video queda a la primera. Planea al menos 2 rondas: es lo que evita que te quedes sin uso a medio camino.</small></label>
      </div>
      <aside class="estimado" id="estimado" aria-live="polite"></aside>
    </div>`;
  },

  resumen: (p) => {
    const d = (l, id) => l.find((x) => x.id === id);
    const faltan = [!p.tipo && 'tipo de video', !p.estilo && 'estilo visual', !p.nombre.trim() && 'nombre del proyecto', !p.mensaje.trim() && 'mensaje'].filter(Boolean);
    const plat = PLATAFORMAS[p.plataforma];
    const fila = (k, v, paso) => `<div class="dato"><dt class="mono">${k}</dt><dd>${v || '<span class="tenue">Sin definir</span>'}</dd><button class="enlace" data-paso="${paso}">Cambiar</button></div>`;
    return `
    <h1>Resumen</h1>
    <p class="intro">Revisa que todo esté como quieres. Al continuar se crea la carpeta del proyecto y pasas al preview. Todavía no se gasta nada de tu cuenta.</p>
    ${faltan.length ? `<p class="alerta">Falta definir: ${faltan.join(', ')}.</p>` : ''}
    <dl class="datos">
      ${fila('Proyecto', esc(p.nombre), 3)}
      ${fila('Tipo', esc(d(TIPOS, p.tipo)?.titulo), 0)}
      ${fila('Formato', `${p.formato} · ${p.duracion} s · ${p.fps} fps`, 1)}
      ${fila('Estilo', esc(d(ESTILOS, p.estilo)?.titulo), 2)}
      ${fila('Mensaje', esc(p.mensaje), 3)}
      ${fila('Audio', esc(d(AUDIO, p.audio)?.titulo), 4)}
      ${fila('Producción', `${plat.titulo} · ${esc(d(plat.modelos, p.modelo)?.titulo)} · esfuerzo ${d(ESFUERZOS, p.esfuerzo)?.titulo.toLowerCase()} · ${MOTORES[p.motor].titulo}`, 5)}
    </dl>
    <aside class="estimado estimado--ancho" id="estimado"></aside>`;
  },
};

function pintarEstimado(el, app) {
  const caja = el.querySelector('#estimado'); if (!caja) return;
  const e = estimar(app.proyecto, app.calibracion);
  const ancho = e.pct == null ? 0 : Math.min(100, e.pct * 100);
  caja.innerHTML = `
    <p class="sobre mono">Estimado honesto</p>
    <div class="estimado__nivel estimado__nivel--${e.nivel}">
      <strong>${e.pct == null ? 'Pago por uso' : `≈ ${fmtPct(e.pct)}`}</strong>
      <span>${e.pct == null ? 'sin tope de plan' : `de una ventana de 5 h de tu plan ${esc(e.plan.titulo)}`}</span>
    </div>
    ${e.pct == null ? '' : `<div class="barra" role="img" aria-label="Uso estimado de la ventana"><i style="width:${ancho}%"></i></div>
      <p class="mono tenue">Rango probable: ${fmtPct(e.rango[0])} a ${fmtPct(e.rango[1])}</p>`}
    <p>${e.texto}</p>
    <dl class="mini">
      <div><dt>Escenas</dt><dd class="mono">${e.escenas}</dd></div>
      <div><dt>Primera pasada</dt><dd class="mono">≈ ${fmtK(e.tokens.primera)} tokens</dd></div>
      <div><dt>${app.proyecto.rondas} rondas de corrección</dt><dd class="mono">≈ ${fmtK(e.tokens.correcciones)} tokens</dd></div>
      <div><dt>Total</dt><dd class="mono">${fmtK(e.tokens.min)} a ${fmtK(e.tokens.max)}</dd></div>
    </dl>
    ${e.avisos.map((a) => `<p class="ojo">${esc(a)}</p>`).join('')}
    <details><summary>¿De dónde sale este número?</summary>
      <p>Es una estimación de TAMO CREATOR, no un dato oficial: ningún proveedor publica cuántos tokens exactos da cada plan, y cambia con el tiempo. Calculamos escenas × trabajo típico por escena × esfuerzo × gasto relativo del modelo.</p>
      <p>Después de tu primer video, compara con tu uso real (<code>/usage</code> en Claude Code) y ajusta aquí:</p>
      <label class="campo"><span>Mi gasto real fue <b class="mono" id="cal-valor">×${app.calibracion.toFixed(1)}</b> del estimado</span>
        <input type="range" min="0.3" max="3" step="0.1" value="${app.calibracion}" id="calibracion" /></label>
    </details>`;
  caja.querySelector('#calibracion')?.addEventListener('input', (ev) => { app.setCalibracion(Number(ev.target.value)); caja.querySelector('#cal-valor').textContent = `×${app.calibracion.toFixed(1)}`; });
  caja.querySelector('#calibracion')?.addEventListener('change', () => pintarEstimado(el, app));
}

export function render(app) {
  const paso = PASOS[app.paso];
  return `
  <section class="asistente">
    <ol class="progreso" aria-label="Pasos">
      ${PASOS.map((x, i) => `<li class="${i === app.paso ? 'is-on' : i < app.paso ? 'is-hecho' : ''}"><button data-paso="${i}" ${i === app.paso ? 'aria-current="step"' : ''}><span class="mono">${String(i + 1).padStart(2, '0')}</span>${x.titulo}</button></li>`).join('')}
    </ol>
    <div class="paso">${PASO[paso.id](app.proyecto)}</div>
    <footer class="pie">
      <button class="btn btn--linea" id="atras" ${app.paso === 0 ? 'disabled' : ''}>Atrás</button>
      <span class="mono tenue">Paso ${app.paso + 1} de ${PASOS.length}</span>
      <button class="btn" id="sigue">${app.paso === PASOS.length - 1 ? 'Crear proyecto y ver preview' : 'Continuar'}</button>
    </footer>
  </section>`;
}

export function montar(el, app) {
  const p = app.proyecto;
  const repinta = () => { el.innerHTML = render(app); montar(el, app); };
  const mover = (n) => { app.paso = Math.max(0, Math.min(PASOS.length - 1, n)); repinta(); window.scrollTo(0, 0); };
  montarPreviews(el, ESTILOS);
  pintarEstimado(el, app);

  el.querySelectorAll('[data-elige]').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.elige; let v = b.dataset.valor; if (k === 'fps') v = Number(v);
    p[k] = v;
    if (k === 'plataforma') { // cada plataforma tiene sus modelos, planes y motores
      const plat = PLATAFORMAS[v];
      p.modelo = plat.modelos[Math.min(1, plat.modelos.length - 1)].id; p.plan = plat.planes[0].id;
      if (!plat.motores.includes(p.motor)) p.motor = plat.motores[0];
    }
    app.guardarBorrador(); repinta();
  }));
  el.querySelectorAll('[data-campo]').forEach((c) => c.addEventListener('input', () => {
    p[c.dataset.campo] = 'num' in c.dataset ? Number(c.value) : c.value;
    if (c.dataset.campo === 'duracion') { el.querySelector('#dur-valor').textContent = `${c.value} s`; p.escenas = []; }
    if (c.dataset.campo === 'rondas') { el.querySelector('#rondas-valor').textContent = c.value; pintarEstimado(el, app); }
    app.guardarBorrador();
  }));
  el.querySelectorAll('[data-paso]').forEach((b) => b.addEventListener('click', () => mover(Number(b.dataset.paso))));
  el.querySelector('#atras').addEventListener('click', () => mover(app.paso - 1));
  el.querySelector('#sigue').addEventListener('click', async (ev) => {
    const id = PASOS[app.paso].id;
    if (id === 'tipo' && !p.tipo) return avisar('Elige un tipo de video para continuar.', true);
    if (id === 'estilo' && !p.estilo) return avisar('Elige un estilo para continuar.', true);
    if (app.paso < PASOS.length - 1) return mover(app.paso + 1);
    if (!p.tipo || !p.estilo || !p.nombre.trim() || !p.mensaje.trim()) return avisar('Completa lo que falta antes de crear el proyecto.', true);
    const boton = ev.currentTarget; boton.disabled = true;
    try {
      if (!p.escenas?.length) p.escenas = storyboardBase(p);
      p.etapa = 'preview';
      await app.guardar({ 'BRIEF.md': briefMd(p), 'PROMPT.md': promptMd(p) });
      ir('storyboard');
    } catch (e) { avisar(`No se pudo guardar: ${e.message}`, true); boton.disabled = false; }
  });
}

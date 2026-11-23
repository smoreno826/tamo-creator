import { esc, api, ir, avisar } from '../main.js';
import { TIPOS } from '../data/opciones.js';
import { montarPreviews } from '../previews/previews.js';

export function render(app) {
  const borrador = app.proyecto?.tipo;
  return `
  <section class="hero">
    <div class="hero__texto">
      <p class="sobre mono">Dirección de video con tu propia IA</p>
      <h1>Tú diriges.<br />Tu agente <em>produce</em>.</h1>
      <p class="hero__sub">TAMO CREATOR te hace las preguntas correctas, arma el brief y el storyboard, y deja que tu cuenta de Claude Code o Codex haga el video. Marcas en pantalla lo que no te gustó y se corrige solo eso.</p>
      <div class="fila">
        <button class="btn" data-ir="nuevo" data-nuevo>Crear un video</button>
        ${borrador ? '<button class="btn btn--linea" data-ir="nuevo">Seguir con mi borrador</button>' : ''}
      </div>
      <ul class="promesas mono">
        <li>Sin cobros de la app</li><li>Tus cuentas, tus límites</li><li>Costo estimado antes de lanzar</li>
      </ul>
    </div>
    <div class="hero__muestra" aria-hidden="true">
      ${TIPOS.slice(0, 6).map((t) => `<figure><canvas data-preview="${t.preview}"></canvas><figcaption class="mono">${esc(t.titulo)}</figcaption></figure>`).join('')}
    </div>
  </section>

  <section class="bloque">
    <h2>Cómo se trabaja</h2>
    <ol class="pasos">
      <li><span class="mono">01</span><h3>Responde</h3><p>Qué tipo de video, formato, estilo, audio. Con ejemplos a la vista, sin tecnicismos.</p></li>
      <li><span class="mono">02</span><h3>Revisa el preview</h3><p>Un storyboard interactivo. No es tu video final: es para decidir antes de gastar.</p></li>
      <li><span class="mono">03</span><h3>Produce</h3><p>Sabes qué modelo y esfuerzo usas y cuánto de tu plan se va. Tú lanzas.</p></li>
      <li><span class="mono">04</span><h3>Corrige</h3><p>Encierra en el cuadro lo que no te gustó y escribe el cambio. Se manda solo eso.</p></li>
    </ol>
  </section>

  <section class="bloque">
    <div class="bloque__cab"><h2>Tus proyectos</h2><span class="mono tenue">Se guardan en esta computadora, en la carpeta <code>proyectos/</code></span></div>
    <div id="lista-proyectos" class="proyectos"><p class="tenue">Cargando…</p></div>
  </section>`;
}

export function montar(el, app) {
  montarPreviews(el);
  el.querySelectorAll('[data-ir]').forEach((b) => b.addEventListener('click', () => { if ('nuevo' in b.dataset) app.nuevo(); ir(b.dataset.ir); }));
  const lista = el.querySelector('#lista-proyectos');
  api('/api/proyectos').then((ps) => {
    if (!ps.length) { lista.innerHTML = '<p class="tenue">Todavía no hay proyectos. El primero aparece aquí en cuanto guardes un brief.</p>'; return; }
    lista.innerHTML = ps.map((p) => `
      <button class="proyecto" data-id="${esc(p.id)}">
        <span class="mono tenue">${esc(TIPOS.find((t) => t.id === p.tipo)?.titulo || 'Sin tipo')}</span>
        <strong>${esc(p.nombre)}</strong>
        <span class="mono tenue">${p.actualizado ? new Date(p.actualizado).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
      </button>`).join('');
    lista.querySelectorAll('.proyecto').forEach((b) => b.addEventListener('click', async () => {
      try { await app.abrir(b.dataset.id); ir('storyboard'); } catch (e) { avisar(e.message, true); }
    }));
  }).catch(() => { lista.innerHTML = '<p class="tenue">No se pudo leer la carpeta de proyectos. ¿Está corriendo el servidor local?</p>'; });
}

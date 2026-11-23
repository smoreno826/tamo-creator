import { esc, copiar, repintar, avisar } from '../main.js';

const cmd = (c) => `<div class="cmd"><code>${esc(c)}</code><button class="btn btn--mini btn--linea" data-copiar="${esc(c)}">Copiar</button></div>`;

function tarjeta({ titulo, ok, estado, cuerpo, pasos = [] }) {
  return `<article class="conexion ${ok ? 'is-ok' : ''}">
    <header><h3>${titulo}</h3><span class="pill ${ok ? 'pill--ok' : ''}"><i></i>${estado}</span></header>
    <p>${cuerpo}</p>
    ${ok ? '' : pasos.map(cmd).join('')}
  </article>`;
}

export function render(app) {
  const c = app.conexiones;
  if (!c) return '<section class="bloque"><h1>Conexiones</h1><p class="tenue">Revisando qué tienes instalado…</p></section>';
  const h = c.herramientas || {};
  const cuenta = h.higgsfield?.cuenta;
  return `
  <section class="bloque">
    <p class="sobre mono">Tus cuentas</p>
    <h1>Conexiones</h1>
    <p class="intro">TAMO CREATOR no tiene cuenta propia, no cobra y no guarda contraseñas ni llaves. Usa las herramientas donde <strong>tú</strong> ya iniciaste sesión en esta computadora. Lo que se gasta, se gasta de tu plan, y siempre te lo decimos antes.</p>
    ${c.error ? '<p class="alerta">No hay respuesta del servidor local. Abre la app con <code>npm run dev</code>.</p>' : ''}

    <h2 class="sub">Agente (necesitas al menos uno)</h2>
    <div class="conexiones">
      ${tarjeta({
        titulo: 'Claude Code', ok: h.claude?.ok, estado: h.claude?.ok ? esc(h.claude.detalle) : 'No instalado',
        cuerpo: 'Puede animar por su cuenta o usar Hyperframes. Usa tu suscripción Pro o Max, o tu llave de API.',
        pasos: ['npm install -g @anthropic-ai/claude-code', 'claude'],
      })}
      ${tarjeta({
        titulo: 'Codex', ok: h.codex?.ok, estado: h.codex?.ok ? esc(h.codex.detalle) : 'No instalado',
        cuerpo: 'Con Codex los motion graphics se hacen siempre con Hyperframes. Usa tu plan de ChatGPT o tu llave de API.',
        pasos: ['npm install -g @openai/codex', 'codex'],
      })}
    </div>

    <h2 class="sub">IA generativa (opcional)</h2>
    <div class="conexiones">
      ${tarjeta({
        titulo: 'Higgsfield', ok: h.higgsfield?.sesion,
        estado: h.higgsfield?.sesion ? `Sesión activa${cuenta?.creditos != null ? ` · ${cuenta.creditos} créditos` : ''}` : h.higgsfield?.ok ? 'Instalado, sin sesión' : 'No instalado',
        cuerpo: 'Solo hace falta si tu video lleva tomas generadas. Cada generación cuesta créditos de tu cuenta: verás el costo antes de confirmar.',
        pasos: h.higgsfield?.ok ? ['higgsfield auth login'] : ['npm install -g @higgsfield/cli', 'higgsfield auth login'],
      })}
    </div>

    <h2 class="sub">Motores de render</h2>
    <div class="conexiones">
      ${tarjeta({
        titulo: 'Hyperframes', ok: h.hyperframes?.ok, estado: h.hyperframes?.ok ? esc(h.hyperframes.detalle) : 'No instalado',
        cuerpo: 'Convierte composiciones HTML en video, siempre igual. Obligatorio con Codex, opcional con Claude.',
        pasos: ['npm install -g hyperframes'],
      })}
      ${tarjeta({
        titulo: 'FFmpeg', ok: h.ffmpeg?.ok, estado: h.ffmpeg?.ok ? esc(h.ffmpeg.detalle) : 'No instalado',
        cuerpo: 'Une escenas, mezcla audio y exporta. Lo usan todos los flujos.',
        pasos: c.plataforma === 'win32' ? ['winget install Gyan.FFmpeg'] : c.plataforma === 'darwin' ? ['brew install ffmpeg'] : ['sudo apt install ffmpeg'],
      })}
    </div>
    <div class="fila"><button class="btn btn--linea" id="revisar">Volver a revisar</button><span class="mono tenue">Node ${esc(c.node || '')}</span></div>
  </section>`;
}

export function montar(el, app) {
  if (!app.conexiones) app.cargarConexiones().then(repintar);
  el.querySelectorAll('[data-copiar]').forEach((b) => b.addEventListener('click', () => copiar(b.dataset.copiar)));
  el.querySelector('#revisar')?.addEventListener('click', async (e) => {
    e.currentTarget.disabled = true; e.currentTarget.textContent = 'Revisando…';
    await app.cargarConexiones(true); avisar('Conexiones actualizadas.'); repintar();
  });
}

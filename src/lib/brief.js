// Convierte las respuestas del asistente en documentos que un agente (Claude Code o Codex) puede seguir.
import { TIPOS, FORMATOS, ESTILOS, AUDIO, PLATAFORMAS, ESFUERZOS, MOTORES } from '../data/opciones.js';
import { escenasPara } from './estimador.js';

export const slug = (t) => (t || 'video').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'video';
export const tc = (s, fps = 30) => {
  const m = Math.floor(s / 60), seg = Math.floor(s % 60), f = Math.round((s % 1) * fps);
  return `${String(m).padStart(2, '0')}:${String(seg).padStart(2, '0')}:${String(Math.min(f, fps - 1)).padStart(2, '0')}`;
};
const de = (lista, id) => lista.find((x) => x.id === id);

/** Storyboard inicial, armado con una plantilla local (no gasta uso de ninguna cuenta). */
export function storyboardBase(p) {
  const n = escenasPara(p.duracion);
  const dur = Math.round((p.duracion / n) * 10) / 10;
  const mensaje = p.mensaje?.trim() || 'tu mensaje principal';
  const papeles = ['Gancho', ...Array.from({ length: n - 2 }, (_, i) => `Desarrollo ${i + 1}`), 'Cierre'];
  return papeles.map((papel, i) => ({
    papel,
    duracion: dur,
    descripcion: i === 0 ? `Abre fuerte: lo primero que se ve debe detener el scroll. Presenta "${mensaje}".`
      : i === n - 1 ? 'Cierra con el logotipo o el llamado a la acción y deja un respiro al final.'
      : 'Describe aquí qué se ve y qué se mueve en esta escena.',
    texto: i === 0 ? (p.textoPantalla?.split('\n')[0] || '') : '',
  }));
}

export function briefMd(p) {
  const tipo = de(TIPOS, p.tipo), formato = de(FORMATOS, p.formato), estilo = de(ESTILOS, p.estilo), audio = de(AUDIO, p.audio);
  const plat = PLATAFORMAS[p.plataforma]; const modelo = de(plat.modelos, p.modelo); const esf = de(ESFUERZOS, p.esfuerzo);
  let t = 0;
  const filas = (p.escenas || []).map((e, i) => {
    const ini = t; t += Number(e.duracion) || 0;
    return `| ${i + 1} | ${tc(ini, p.fps)} – ${tc(t, p.fps)} | ${e.papel} | ${(e.descripcion || '').replace(/\|/g, '/').replace(/\n/g, ' ')} | ${(e.texto || '—').replace(/\|/g, '/').replace(/\n/g, ' ')} |`;
  });
  return `# ${p.nombre || 'Video sin título'} · brief

> Generado por TAMO CREATOR. Este archivo es la fuente de verdad del proyecto: el agente no cambia el orden, ni agrega o quita escenas, sin que el usuario edite este documento.

## Qué se va a hacer
- **Tipo:** ${tipo?.titulo} — ${tipo?.resumen}
- **Formato:** ${formato?.id} (${formato?.w}×${formato?.h}) · ${p.fps} fps · ${p.duracion} s
- **Estilo visual:** ${estilo ? `${estilo.titulo} — ${estilo.nota} Fondo ${estilo.fondo}, color principal ${estilo.a}, secundario ${estilo.b}.` : 'Sin definir'}
- **Mensaje:** ${p.mensaje || 'Sin definir'}
- **Para quién:** ${p.audiencia || 'Sin definir'}

## Texto en pantalla
${p.textoPantalla?.trim() || '_Sin texto definido._'}

## Referencias
${p.referencias?.trim() || '_Sin referencias._'}

## Material del usuario
${p.carpetaMaterial ? `Carpeta: \`${p.carpetaMaterial}\`` : '_No aplica o sin definir._'}

## Audio
- **Decisión:** ${audio?.titulo}
${p.audio === 'carpeta' ? `- **Carpeta de sonidos:** \`${p.carpetaAudio || 'PENDIENTE: el usuario debe indicarla'}\`` : ''}
${p.audio === 'generado' ? '- El usuario fue avisado de que el audio generado suena genérico y repetitivo. Tratarlo como referencia.' : ''}

## Producción
- **Plataforma:** ${plat.titulo} · **Modelo:** ${modelo?.titulo} · **Esfuerzo:** ${esf?.titulo}
- **Motor de motion graphics:** ${MOTORES[p.motor]?.titulo}

## Storyboard aprobado
| # | Tiempo | Papel | Qué se ve | Texto en pantalla |
| --- | --- | --- | --- | --- |
${filas.join('\n') || '| – | – | – | Sin escenas todavía | – |'}
`;
}

export function promptMd(p) {
  const tipo = de(TIPOS, p.tipo), formato = de(FORMATOS, p.formato);
  const usaIA = tipo?.necesita.includes('higgsfield');
  const motor = p.motor === 'hyperframes'
    ? 'Usa **Hyperframes** (skill `hyperframes` y `hyperframes-cli`): una composición HTML por escena y render determinista a MP4. Si la skill no está instalada, detente y dilo; no improvises otro motor.'
    : 'Elige tú la técnica (HTML/CSS, canvas o three.js) y arma un render reproducible a MP4. Explica en una línea qué elegiste y por qué antes de empezar.';
  const tres = p.tipo === '3d' ? '\n- Es una pieza 3D: usa three.js (skills `threejs-*`). Cuida luces, materiales y movimiento de cámara; nada de cámara estática sin intención.' : '';
  const audio = p.audio === 'carpeta'
    ? `- Audio: haz un inventario de \`${p.carpetaAudio || '<carpeta de sonidos del usuario>'}\` (nombre, duración, tipo: música / efecto / ambiente). Propón qué pista usar en cada escena, dónde cortarla y niveles de mezcla (música bajo la voz, efectos en los golpes de animación). No generes audio con IA.`
    : p.audio === 'generado'
      ? '- Audio: puedes generarlo, pero avisa en tu reporte que es una pista de referencia. No lo presentes como sonido final.'
      : '- Audio: entrega el video sin audio.';
  return `Eres director de motion graphics y editor. Trabaja en esta carpeta de proyecto.

Lee primero \`BRIEF.md\` completo. Es la fuente de verdad: respeta el orden, los tiempos y el texto del storyboard.

## Encargo
Produce el video descrito en el brief: ${tipo?.titulo}, ${formato?.w}×${formato?.h}, ${p.fps} fps, ${p.duracion} s.

## Reglas
- ${motor}${tres}
${usaIA ? '- IA generativa: usa la CLI `higgsfield` con la sesión del usuario. ANTES de cada generación corre `higgsfield generate cost …`, muestra los créditos que costará y espera su confirmación. Nunca generes sin ese visto bueno.\n' : ''}${audio}
- Deja el resultado en \`exports/\` con nombre \`v01.mp4\` (y sube el número en cada versión: v02, v03…). No sobrescribas versiones anteriores.
- Antes de renderizar todo, renderiza un cuadro por escena y revísalo tú: texto dentro de márgenes seguros, nada cortado, contraste legible.
- Si algo del brief no se puede hacer con código, dilo y propón una alternativa; no lo sustituyas en silencio.
- Al terminar, escribe en \`REPORTE.md\`: qué hiciste, qué quedó distinto al brief y por qué, y qué revisarías primero.
${ajustesTexto(p)}`;
}

/** Instrucciones que salen de los parámetros de corrección (los controles que define jriesgo). */
export function ajustesTexto(p, grupos = p._grupos || []) {
  const lineas = [];
  for (const g of grupos) for (const c of g.controles || []) {
    const v = p.ajustes?.[`${g.id}.${c.id}`];
    if (v == null || v === c.base) continue;
    const valor = c.tipo === 'rango' ? `${v > 0 && c.min < 0 ? '+' : ''}${v}` : v;
    lineas.push(`- ${(c.instruccion || `${c.titulo}: {valor}`).replace('{valor}', valor)}`);
  }
  return lineas.length ? `\n## Ajustes globales pedidos por el usuario\n${lineas.join('\n')}\n` : '';
}

const FORMA = { lapiz: 'trazo libre', circulo: 'círculo', flecha: 'flecha' };

export function correccionesMd(p, video) {
  const lista = [...(p.correcciones || [])].sort((a, b) => a.t - b.t);
  const items = lista.map((c, i) => {
    const b = c.caja;
    const zona = b ? `zona marcada con ${FORMA[c.forma] || 'trazo'}: del ${Math.round(b.x * 100)} % al ${Math.round((b.x + b.w) * 100)} % del ancho y del ${Math.round(b.y * 100)} % al ${Math.round((b.y + b.h) * 100)} % del alto` : 'cuadro completo';
    return `### ${i + 1}. ${tc(c.t, p.fps)} (segundo ${c.t.toFixed(2)}${c.dur ? `, aplica durante ${c.dur} s` : ''})
- **Dónde:** ${zona}
- **Corrección:** ${c.texto?.trim() || '_(sin texto: pregunta al usuario antes de tocar esto)_'}
- **Captura:** \`correcciones/${c.imagen || `c${String(i + 1).padStart(2, '0')}.png`}\` (el trazo verde marca la zona)`;
  });
  return `# Correcciones · ${p.nombre || 'video'}

Versión revisada: \`${video || 'sin indicar'}\`

Aplica SOLO lo que se pide aquí. Lo que no aparece en esta lista está aprobado: no lo cambies.
Abre cada captura para ver exactamente qué marcó el usuario. Entrega una versión nueva en \`exports/\` sin sobrescribir la anterior.

${items.join('\n\n') || '_Sin correcciones puntuales._'}
${ajustesTexto(p)}`;
}

export function comando(p, archivo = 'PROMPT.md') {
  if (p.plataforma === 'codex') return `codex exec "Lee ${archivo} y sigue sus instrucciones al pie de la letra."`;
  return `Get-Content ${archivo} | claude -p --model ${p.modelo} --effort ${p.esfuerzo} --permission-mode acceptEdits`;
}

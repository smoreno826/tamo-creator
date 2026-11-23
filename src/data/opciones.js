// Todo lo que el asistente pregunta sale de aquí. Cambiar un texto o agregar una opción es editar este archivo.

/** Tipos de video. `trabajo` = miles de tokens aproximados por escena a esfuerzo medio (estimación propia, ver estimador.js). */
export const TIPOS = [
  {
    id: 'motion', titulo: 'Full motion graphics', preview: 'motion',
    resumen: 'Todo se dibuja con código: tipografía, formas, gráficas, transiciones.',
    ideal: 'Explicativos, anuncios de producto, títulos, reels con texto.',
    necesita: ['agente'], trabajo: 38,
  },
  {
    id: 'motion-ia', titulo: 'Motion graphics + IA generativa', preview: 'motion-ia',
    resumen: 'Motion graphics encima o intercalado con tomas generadas por IA.',
    ideal: 'Piezas de marca con fondos o personajes que el código no puede dibujar.',
    necesita: ['agente', 'higgsfield'], trabajo: 44,
  },
  {
    id: 'video-motion', titulo: 'Tu video + motion graphics', preview: 'video-motion',
    resumen: 'Subes tu material grabado y le agregamos títulos, rótulos y gráficos.',
    ideal: 'Entrevistas, vlogs, tutoriales, videos de producto ya grabados.',
    necesita: ['agente', 'material'], trabajo: 30,
  },
  {
    id: 'video-ia', titulo: 'Tu video editado con IA', preview: 'video-ia',
    resumen: 'Tu material grabado, con tomas extendidas, reemplazadas o estilizadas con IA.',
    ideal: 'Cambiar fondos, extender planos, estilizar una toma real.',
    necesita: ['agente', 'higgsfield', 'material'], trabajo: 26,
  },
  {
    id: 'ia', titulo: 'Full IA generativa', preview: 'ia',
    resumen: 'Todas las tomas se generan con IA; el agente escribe los prompts y arma el corte.',
    ideal: 'Cortos cinematográficos, conceptos, mood films.',
    necesita: ['agente', 'higgsfield'], trabajo: 18,
  },
  {
    id: '3d', titulo: 'Motion graphics 3D', preview: '3d',
    resumen: 'Escenas 3D en tiempo real con three.js: objetos, cámara, luces y materiales.',
    ideal: 'Logos 3D, producto girando, tipografía con profundidad.',
    necesita: ['agente'], trabajo: 52,
  },
];

export const FORMATOS = [
  { id: '16:9', titulo: 'Horizontal', uso: 'YouTube, presentaciones, web', w: 1920, h: 1080 },
  { id: '9:16', titulo: 'Vertical', uso: 'Reels, TikTok, Shorts', w: 1080, h: 1920 },
  { id: '1:1', titulo: 'Cuadrado', uso: 'Feed, anuncios', w: 1080, h: 1080 },
  { id: '4:5', titulo: 'Retrato', uso: 'Feed de Instagram', w: 1080, h: 1350 },
];

/** Estilos visuales propios de TAMO CREATOR. `motion` decide cómo se mueve la miniatura. */
export const ESTILOS = [
  { id: 'cinetico', titulo: 'Tipografía cinética', nota: 'Palabras grandes que entran al ritmo.', fondo: '#1b1d1a', a: '#ffb700', b: '#fff8ef', motion: 'tipo' },
  { id: 'editorial', titulo: 'Editorial limpio', nota: 'Retícula, mucho aire, líneas finas.', fondo: '#fff8ef', a: '#252525', b: '#ffb700', motion: 'lineas' },
  { id: 'neon', titulo: 'Neón', nota: 'Trazos brillantes sobre negro.', fondo: '#07080c', a: '#39f0c0', b: '#ff3d8b', motion: 'trazo' },
  { id: 'bauhaus', titulo: 'Geométrico', nota: 'Círculos, barras y colores planos.', fondo: '#efe6d5', a: '#d8352a', b: '#1f4fa8', motion: 'formas' },
  { id: 'blueprint', titulo: 'Plano técnico', nota: 'Cuadrícula, cotas y trazos de dibujo.', fondo: '#0f2f57', a: '#dce9ff', b: '#7fb2ff', motion: 'lineas' },
  { id: 'retro', titulo: 'Retro VHS', nota: 'Scanlines, desfase de color, ruido.', fondo: '#17121f', a: '#ff5fa2', b: '#5ff2ff', motion: 'vhs' },
  { id: 'gradiente', titulo: 'Gradiente líquido', nota: 'Manchas suaves de color en movimiento.', fondo: '#120f24', a: '#7b5cff', b: '#ff8a5c', motion: 'blobs' },
  { id: 'particulas', titulo: 'Partículas', nota: 'Puntos que forman y deshacen figuras.', fondo: '#101211', a: '#ffb700', b: '#8a8778', motion: 'puntos' },
];

export const AUDIO = [
  {
    id: 'carpeta', titulo: 'Usar mi carpeta de sonidos y música', recomendado: true,
    texto: 'Indicas tu carpeta. TAMO CREATOR hace un inventario y le dice a tu agente qué pista usar, dónde cortar y cómo mezclar.',
  },
  {
    id: 'generado', titulo: 'Generar el audio con IA', aviso: true,
    texto: 'Se puede, pero hoy el audio generado suena genérico y repetitivo. Sirve como referencia, rara vez como entrega final.',
  },
  { id: 'sin', titulo: 'Sin audio por ahora', texto: 'Entregamos el video mudo y tú haces el sonido en tu editor.' },
];

/**
 * Modelos. `peso` = cuánto gasta de tu plan frente a Haiku por la misma cantidad de trabajo (estimación propia;
 * los proveedores no publican una cifra fija y cambia con el tiempo). Ajusta aquí si tu experiencia es otra.
 */
export const PLATAFORMAS = {
  claude: {
    titulo: 'Claude Code', comando: 'claude',
    motores: ['libre', 'hyperframes'],
    modelos: [
      { id: 'claude-haiku-5-5', titulo: 'Haiku 5.5', peso: 1, nivel: 1, para: 'Cambios pequeños y pruebas rápidas. Composición simple; se le escapan detalles de ritmo.' },
      { id: 'claude-sonnet-5-5', titulo: 'Sonnet 5.5', peso: 3, nivel: 2, para: 'Buen equilibrio para la mayoría de los videos y para rondas de corrección.' },
      { id: 'claude-opus-5-5', titulo: 'Opus 5.5', peso: 5, nivel: 3, para: 'Dirección más cuidada: mejor composición, transiciones y consistencia entre escenas.' },
      { id: 'claude-fable-5-2', titulo: 'Fable 5.2', peso: 8, nivel: 4, para: 'El más capaz. Para piezas complejas o 3D donde el detalle importa. El que más gasta.' },
    ],
    planes: [
      { id: 'pro', titulo: 'Pro', capacidad: 1 },
      { id: 'max5', titulo: 'Max 5x', capacidad: 5 },
      { id: 'max20', titulo: 'Max 20x', capacidad: 20 },
      { id: 'api', titulo: 'API (pago por uso)', capacidad: null },
    ],
  },
  codex: {
    titulo: 'Codex', comando: 'codex',
    motores: ['hyperframes'],
    modelos: [
      { id: 'codex-default', titulo: 'Modelo por defecto de tu Codex', peso: 3, nivel: 3, para: 'Usa el modelo que tengas configurado en Codex. El esfuerzo de razonamiento es lo que más cambia el resultado.' },
    ],
    planes: [
      { id: 'plus', titulo: 'Plus', capacidad: 1 },
      { id: 'pro', titulo: 'Pro', capacidad: 10 },
      { id: 'api', titulo: 'API (pago por uso)', capacidad: null },
    ],
  },
};

/** Esfuerzo: es lo que más mueve la calidad dentro de un mismo modelo. `mult` = cuánto más trabajo (y gasto) implica. */
export const ESFUERZOS = [
  { id: 'low', titulo: 'Bajo', mult: 0.5, resultado: 'Rápido y barato. Resuelve lo literal: suele verse plano, con tiempos uniformes.' },
  { id: 'medium', titulo: 'Medio', mult: 1, resultado: 'Correcto. Sigue el storyboard pero revisa poco su propio trabajo.' },
  { id: 'high', titulo: 'Alto', mult: 1.9, resultado: 'Planea antes de escribir y revisa: mejor ritmo, menos errores visuales. Recomendado para entregar.' },
  { id: 'xhigh', titulo: 'Muy alto', mult: 3, resultado: 'Itera más sobre cada escena. Para piezas importantes; gasta rápido.' },
  { id: 'max', titulo: 'Máximo', mult: 4.5, resultado: 'Todo lo que el modelo puede dar. Solo si tu plan lo aguanta: puede agotar tu ventana de uso.' },
];

export const MOTORES = {
  libre: { titulo: 'Dejárselo a Claude', texto: 'Claude elige la técnica (HTML/CSS, canvas, three.js) y arma su propio render. Más libertad, menos predecible.' },
  hyperframes: { titulo: 'Hyperframes', texto: 'Composiciones HTML que se renderizan a MP4 de forma determinista. Mismo resultado cada vez; es el motor para Codex.' },
};

export const PASOS = [
  { id: 'tipo', titulo: 'Tipo de video' },
  { id: 'formato', titulo: 'Formato y duración' },
  { id: 'estilo', titulo: 'Estilo visual' },
  { id: 'contenido', titulo: 'Contenido' },
  { id: 'audio', titulo: 'Audio' },
  { id: 'motor', titulo: 'Cuenta, modelo y costo' },
  { id: 'resumen', titulo: 'Resumen' },
];

export const PROYECTO_NUEVO = () => ({
  nombre: '', tipo: null, formato: '16:9', duracion: 20, fps: 30,
  estilo: null, mensaje: '', audiencia: '', textoPantalla: '', referencias: '', carpetaMaterial: '',
  audio: 'carpeta', carpetaAudio: '',
  plataforma: 'claude', motor: 'hyperframes', modelo: 'claude-sonnet-5-5', esfuerzo: 'high', plan: 'pro', rondas: 2,
  escenas: [], ajustes: {}, correcciones: [], etapa: 'brief',
});

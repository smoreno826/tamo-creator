// Miniaturas animadas. Todas son dibujo en vivo (canvas 2D o three.js): no hay videos descargados ni material de terceros.
// Un solo ciclo de animación para todas; cada miniatura se apaga sola cuando sale de la página o de la vista.

const activos = new Set();
let corriendo = false;
const suave = window.matchMedia('(prefers-reduced-motion: reduce)');

function ciclo(ms) {
  const t = ms / 1000;
  for (const a of activos) {
    if (!a.canvas.isConnected) { a.fin?.(); activos.delete(a); continue; }
    if (!a.visible) continue;
    a.dibujar(suave.matches ? a.fijo : t + a.desfase);
  }
  if (activos.size) requestAnimationFrame(ciclo); else corriendo = false;
}
const observador = new IntersectionObserver((entradas) => {
  for (const e of entradas) for (const a of activos) if (a.canvas === e.target) a.visible = e.isIntersecting;
});
function registrar(a) {
  a.visible = true; a.desfase = a.desfase || 0; a.fijo = a.fijo ?? 1.4;
  activos.add(a); observador.observe(a.canvas);
  if (!corriendo) { corriendo = true; requestAnimationFrame(ciclo); }
}

const AMBAR = '#ffb700', CREMA = '#fff8ef', CARBON = '#1b1d1a', C2 = '#2c2e29';
const eo = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3); // ease-out
const fase = (t, dur) => (t % dur) / dur;

function lienzo(canvas, w = 320, h = 180) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = w * dpr; canvas.height = h * dpr;
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  return g;
}
function texto(g, s, x, y, tam, color, peso = 700, alinear = 'left') {
  g.font = `${peso} ${tam}px Poppins, "Segoe UI", sans-serif`; g.fillStyle = color; g.textAlign = alinear; g.textBaseline = 'middle';
  g.fillText(s, x, y);
}
function etiqueta(g, s, x, y) {
  g.font = '500 8px "IBM Plex Mono", Consolas, monospace'; g.textAlign = 'left'; g.textBaseline = 'middle';
  const w = g.measureText(s).width + 10;
  g.fillStyle = 'rgba(27,29,26,.82)'; g.fillRect(x, y - 7, w, 14);
  g.fillStyle = AMBAR; g.fillText(s, x + 5, y + 0.5);
}

/* ── piezas reutilizables ── */
// "Material grabado": una persona a cuadro, hecha con formas, para representar el video del usuario.
function grabado(g, t, w, h, tono = 0) {
  const cielo = g.createLinearGradient(0, 0, 0, h);
  cielo.addColorStop(0, tono ? '#3a2456' : '#5b6b74'); cielo.addColorStop(1, tono ? '#ff7a59' : '#2f3a40');
  g.fillStyle = cielo; g.fillRect(0, 0, w, h);
  g.fillStyle = tono ? 'rgba(255,220,120,.5)' : 'rgba(255,255,255,.12)';
  g.fillRect(w * 0.62, h * 0.12, w * 0.3, h * 0.42); // ventana
  const dx = Math.sin(t * 0.9) * 3, dy = Math.sin(t * 1.7) * 1.5;
  g.fillStyle = tono ? '#1a1030' : '#1d2326';
  g.beginPath(); g.ellipse(w * 0.4 + dx, h * 0.42 + dy, h * 0.15, h * 0.18, 0, 0, 7); g.fill();
  g.beginPath(); g.ellipse(w * 0.4 + dx * 0.6, h * 1.02, h * 0.38, h * 0.36, 0, 0, 7); g.fill();
}
// "Toma generada": paisaje cinematográfico sintético.
function generado(g, t, w, h) {
  const c = g.createLinearGradient(0, 0, 0, h);
  c.addColorStop(0, '#1c1436'); c.addColorStop(0.55, '#c2456b'); c.addColorStop(1, '#ffb36b');
  g.fillStyle = c; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,236,180,.9)'; g.beginPath(); g.arc(w * 0.68, h * 0.5, h * 0.16, 0, 7); g.fill();
  for (let k = 0; k < 3; k++) {
    g.fillStyle = ['#3d2350', '#2a183d', '#170d26'][k];
    g.beginPath(); g.moveTo(0, h);
    for (let x = 0; x <= w; x += 8) g.lineTo(x, h * (0.6 + k * 0.1) + Math.sin(x * 0.02 * (k + 1) + t * (0.25 + k * 0.2) + k * 2) * h * 0.07);
    g.lineTo(w, h); g.fill();
  }
}

/* ── una miniatura por tipo de video ── */
const TIPO = {
  motion(g, t, w, h) {
    g.fillStyle = CARBON; g.fillRect(0, 0, w, h);
    const f = fase(t, 4);
    for (let i = 0; i < 5; i++) {
      const p = eo((f - i * 0.05) * 3.5) * (1 - eo((f - 0.82) * 6));
      g.fillStyle = i === 2 ? AMBAR : C2;
      g.fillRect(28 + i * 22, h - 34 - p * (30 + i * 13), 14, p * (30 + i * 13));
    }
    const p2 = eo((f - 0.18) * 3) * (1 - eo((f - 0.85) * 7));
    g.save(); g.beginPath(); g.rect(150, 50, 170, 40); g.clip();
    texto(g, 'MOTION', 152, 70 + (1 - p2) * 44, 30, CREMA, 700); g.restore();
    g.fillStyle = AMBAR; g.fillRect(152, 96, 120 * eo((f - 0.3) * 3) * (1 - eo((f - 0.85) * 7)), 3);
    g.strokeStyle = AMBAR; g.lineWidth = 2; g.beginPath(); g.arc(262, 132, 14, -1.57, -1.57 + 6.28 * eo((f - 0.4) * 2.4)); g.stroke();
  },
  'motion-ia'(g, t, w, h) {
    generado(g, t, w, h);
    const f = fase(t, 4.5), p = eo((f - 0.15) * 3) * (1 - eo((f - 0.86) * 7));
    g.fillStyle = 'rgba(27,29,26,.55)'; g.fillRect(0, 0, w * p, h);
    g.save(); g.beginPath(); g.rect(22, 60, 280, 60); g.clip();
    texto(g, 'NUEVA', 24, 78 + (1 - p) * 50, 26, CREMA); texto(g, 'COLECCIÓN', 24, 106 + (1 - p) * 70, 26, AMBAR); g.restore();
    etiqueta(g, 'FONDO · IA', 22, 18); etiqueta(g, 'TEXTO · MOTION', 22, h - 18);
  },
  'video-motion'(g, t, w, h) {
    grabado(g, t, w, h);
    const f = fase(t, 4.5), p = eo((f - 0.2) * 3.2) * (1 - eo((f - 0.84) * 7));
    g.fillStyle = AMBAR; g.fillRect(22, h - 56, 4, 34 * p);
    g.save(); g.beginPath(); g.rect(32, h - 60, 200, 44); g.clip();
    texto(g, 'Ana Torres', 34 - (1 - p) * 180, h - 48, 15, CREMA, 600); texto(g, 'DIRECTORA DE FOTO', 34 - (1 - p) * 240, h - 30, 8.5, AMBAR, 500); g.restore();
    etiqueta(g, 'TU VIDEO', 22, 18);
  },
  'video-ia'(g, t, w, h) {
    grabado(g, t, w, h, 0);
    const x = w * (0.5 + Math.sin(t * 0.8) * 0.32);
    g.save(); g.beginPath(); g.rect(x, 0, w - x, h); g.clip(); grabado(g, t, w, h, 1); g.restore();
    g.fillStyle = CREMA; g.fillRect(x - 1, 0, 2, h);
    g.fillStyle = AMBAR; g.beginPath(); g.arc(x, h / 2, 6, 0, 7); g.fill();
    etiqueta(g, 'ORIGINAL', 12, 18); g.textAlign = 'left'; etiqueta(g, 'CON IA', w - 58, 18);
  },
  ia(g, t, w, h) {
    generado(g, t * 1.4, w, h);
    g.fillStyle = '#000'; g.fillRect(0, 0, w, 16); g.fillRect(0, h - 16, w, 16);
    const f = fase(t, 5);
    g.fillStyle = `rgba(0,0,0,${f > 0.92 ? (f - 0.92) * 12 : f < 0.06 ? 1 - f * 16 : 0})`; g.fillRect(0, 0, w, h);
    etiqueta(g, 'TOMA GENERADA', 14, 30);
  },
};

/* ── una miniatura por estilo visual ── */
const ESTILO = {
  tipo(g, t, w, h, e, s) {
    const pal = ['RITMO', 'IDEA', 'CORTE', 'AHORA'], f = fase(t + s, 3.6), i = Math.floor(f * 4), p = eo(((f * 4) % 1) * 2.4);
    g.save(); g.translate(w / 2, h / 2); g.scale(0.7 + p * 0.3, 0.7 + p * 0.3);
    texto(g, pal[(i + s) % 4], 0, 0, 44, i % 2 ? e.a : e.b, 700, 'center'); g.restore();
  },
  lineas(g, t, w, h, e, s) {
    const f = fase(t + s * 0.7, 4); g.strokeStyle = e.a; g.lineWidth = 1;
    for (let i = 0; i < 6; i++) { const p = eo((f - i * 0.06) * 3); g.globalAlpha = 0.35; g.beginPath(); g.moveTo(24, 28 + i * 25); g.lineTo(24 + (w - 48) * p, 28 + i * 25); g.stroke(); }
    g.globalAlpha = 1; g.fillStyle = e.b; g.fillRect(24, 53, 90 * eo((f - 0.3) * 3), 50);
    texto(g, 'Título', 130, 70, 22, e.a, 600); g.fillStyle = e.a; g.globalAlpha = 0.5; g.fillRect(130, 92, 120 * eo((f - 0.4) * 3), 4); g.globalAlpha = 1;
  },
  trazo(g, t, w, h, e, s) {
    g.lineWidth = 3; g.lineCap = 'round'; g.shadowBlur = 14;
    for (let k = 0; k < 2; k++) {
      g.strokeStyle = g.shadowColor = k ? e.b : e.a; g.beginPath();
      const n = 60 * fase(t + k * 1.3 + s, 3.2) + 6;
      for (let i = 0; i < n; i++) { const a = i * 0.16 + k * 2 + s; const r = 34 + k * 22 + Math.sin(i * 0.4) * 8; g.lineTo(w / 2 + Math.cos(a) * r * 1.6, h / 2 + Math.sin(a) * r); }
      g.stroke();
    }
    g.shadowBlur = 0;
  },
  formas(g, t, w, h, e, s) {
    const f = fase(t + s, 4), p = eo(f * 2.5);
    g.fillStyle = e.a; g.beginPath(); g.arc(90, h / 2, 46 * p, 0, 7); g.fill();
    g.fillStyle = e.b; g.fillRect(160, h / 2 - 46, 46, 92 * eo((f - 0.15) * 2.5));
    g.fillStyle = '#1b1d1a'; g.save(); g.translate(262, h / 2); g.rotate(t * 0.6 + s); g.fillRect(-26, -26, 52, 52); g.restore();
  },
  vhs(g, t, w, h, e, s) {
    const d = Math.sin(t * 9 + s) * 2 + 3;
    texto(g, 'PLAY ▶', w / 2 - d, h / 2, 36, e.b, 700, 'center'); g.globalCompositeOperation = 'screen';
    texto(g, 'PLAY ▶', w / 2 + d, h / 2, 36, e.a, 700, 'center'); g.globalCompositeOperation = 'source-over';
    g.fillStyle = 'rgba(0,0,0,.28)'; for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1.5);
    g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(0, ((t * 50 + s * 40) % (h + 30)) - 30, w, 18);
  },
  blobs(g, t, w, h, e, s) {
    g.filter = 'blur(22px)';
    for (let k = 0; k < 4; k++) { g.fillStyle = k % 2 ? e.a : e.b; g.beginPath(); g.arc(w / 2 + Math.sin(t * 0.5 + k * 1.7 + s) * 90, h / 2 + Math.cos(t * 0.7 + k * 2.3 + s) * 45, 52, 0, 7); g.fill(); }
    g.filter = 'none';
  },
  puntos(g, t, w, h, e, s) {
    const m = (Math.sin(t * 0.8 + s) + 1) / 2;
    for (let i = 0; i < 140; i++) {
      const a = i * 2.39996, r = Math.sqrt(i) * 6.2; // disco
      const cx = (i % 14) * 20 + 30, cy = Math.floor(i / 14) * 16 + 18; // retícula
      const x = (w / 2 + Math.cos(a) * r * 1.2) * m + cx * (1 - m), y = (h / 2 + Math.sin(a) * r * 0.9) * m + cy * (1 - m);
      g.fillStyle = i % 5 ? e.b : e.a; g.fillRect(x - 1.5, y - 1.5, 3, 3);
    }
  },
};

/* ── tipo 3D: three.js de verdad, cargado solo cuando hace falta ── */
async function montar3D(canvas) {
  const THREE = await import('three');
  if (!canvas.isConnected) return;
  let rnd;
  try { rnd = new THREE.WebGLRenderer({ canvas, antialias: true }); } catch { return montarTipo2D(canvas, 'motion'); }
  rnd.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); rnd.setSize(320, 180, false);
  const escena = new THREE.Scene(); escena.background = new THREE.Color(CARBON);
  const cam = new THREE.PerspectiveCamera(38, 16 / 9, 0.1, 50); cam.position.set(0, 0.6, 6.2);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffb700, metalness: 0.55, roughness: 0.32 });
  // El isotipo: la T y su barra, con volumen.
  const grupo = new THREE.Group();
  const pieza = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.5), mat); m.position.set(x, y, 0); grupo.add(m); };
  pieza(2.6, 0.5, 0, 1.05); pieza(0.5, 1.9, 0, 0.1); pieza(2.6, 0.24, 0, -1.25);
  escena.add(grupo);
  const piso = new THREE.GridHelper(14, 28, 0x55574f, 0x33352f); piso.position.y = -1.6; escena.add(piso);
  escena.add(new THREE.HemisphereLight(0xfff8ef, 0x1b1d1a, 0.9));
  const luz = new THREE.DirectionalLight(0xffffff, 2.6); luz.position.set(3, 4, 5); escena.add(luz);
  registrar({
    canvas, fijo: 0.6,
    dibujar(t) { grupo.rotation.y = t * 0.7; grupo.rotation.x = Math.sin(t * 0.5) * 0.18; grupo.position.y = Math.sin(t * 1.1) * 0.12; cam.position.x = Math.sin(t * 0.25) * 1.2; cam.lookAt(0, 0, 0); rnd.render(escena, cam); },
    fin() { rnd.dispose(); mat.dispose(); grupo.children.forEach((m) => m.geometry.dispose()); },
  });
}

function montarTipo2D(canvas, id) {
  const g = lienzo(canvas); const fn = TIPO[id] || TIPO.motion;
  registrar({ canvas, dibujar: (t) => { g.save(); fn(g, t, 320, 180); g.restore(); } });
}

export function previewTipo(canvas, id) { if (id === '3d') montar3D(canvas); else montarTipo2D(canvas, id); }

export function previewEstilo(canvas, estilo, semilla = 0) {
  const g = lienzo(canvas); const fn = ESTILO[estilo.motion] || ESTILO.formas;
  registrar({ canvas, desfase: semilla * 0.9, dibujar: (t) => { g.save(); g.fillStyle = estilo.fondo; g.fillRect(0, 0, 320, 180); fn(g, t, 320, 180, estilo, semilla); g.restore(); } });
}

/** Dibuja un cuadro del estilo en un contexto ya preparado (lo usa el reproductor del storyboard). */
export function dibujarEstilo(g, t, estilo, semilla, W, H) {
  const k = Math.max(W / 320, H / 180);
  g.save(); g.fillStyle = estilo.fondo; g.fillRect(0, 0, W, H);
  g.translate((W - 320 * k) / 2, (H - 180 * k) / 2); g.scale(k, k);
  (ESTILO[estilo.motion] || ESTILO.formas)(g, t, 320, 180, estilo, semilla);
  g.restore();
}

/** Monta todas las miniaturas declaradas en el HTML con data-preview / data-estilo. */
export function montarPreviews(raiz, estilos = []) {
  raiz.querySelectorAll('canvas[data-preview]').forEach((c) => { if (!c.dataset.listo) { c.dataset.listo = '1'; previewTipo(c, c.dataset.preview); } });
  raiz.querySelectorAll('canvas[data-estilo]').forEach((c) => {
    if (c.dataset.listo) return; c.dataset.listo = '1';
    const e = estilos.find((x) => x.id === c.dataset.estilo); if (e) previewEstilo(c, e, Number(c.dataset.semilla || 0));
  });
}

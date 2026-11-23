// Estimador de gasto. Regla de la casa: honestidad.
//
// NADIE publica una cifra exacta de cuántos tokens da cada suscripción, y cambia con el tiempo. Por eso:
//   · todo lo de aquí es una estimación de TAMO CREATOR, no un dato oficial;
//   · se muestra como rango, no como número único;
//   · se puede calibrar con tu uso real (`calibracion`): tras tu primer video miras cuánto gastaste
//     (/usage en Claude Code) y ajustas el factor.
//
// Supuestos, todos editables:
//   VENTANA_PRO  = miles de "tokens-Haiku" que caben, a ojo, en una ventana de 5 horas del plan más chico.
//   trabajo/escena (opciones.js) = miles de tokens que suele pedir una escena a esfuerzo medio.
//   RONDA = cada ronda de correcciones cuesta alrededor de un tercio de la primera pasada.

import { TIPOS, PLATAFORMAS, ESFUERZOS } from '../data/opciones.js';

export const VENTANA_PRO = 2200; // miles de tokens-Haiku por ventana de 5 h (supuesto)
const RONDA = 0.35;
const MOTOR = { libre: 1.2, hyperframes: 1 }; // sin motor fijo, el agente además inventa su render

export function escenasPara(duracion) {
  return Math.max(2, Math.min(14, Math.round(duracion / 4.5)));
}

export function estimar(p, calibracion = 1) {
  const tipo = TIPOS.find((t) => t.id === p.tipo) || TIPOS[0];
  const plat = PLATAFORMAS[p.plataforma] || PLATAFORMAS.claude;
  const modelo = plat.modelos.find((m) => m.id === p.modelo) || plat.modelos[0];
  const esfuerzo = ESFUERZOS.find((e) => e.id === p.esfuerzo) || ESFUERZOS[1];
  const plan = plat.planes.find((x) => x.id === p.plan) || plat.planes[0];
  const escenas = p.escenas?.length || escenasPara(p.duracion);

  const primera = escenas * tipo.trabajo * esfuerzo.mult * (MOTOR[p.motor] || 1) * calibracion; // miles de tokens
  const correcciones = primera * RONDA * (p.rondas || 0);
  const total = primera + correcciones;
  const carga = total * modelo.peso; // en "tokens-Haiku"

  const fraccion = (k) => (plan.capacidad ? (k * modelo.peso) / (VENTANA_PRO * plan.capacidad) : null);
  const pct = fraccion(total);
  const pctPrimera = fraccion(primera);

  let nivel = 'api';
  if (pct != null) nivel = pct < 0.2 ? 'ligero' : pct < 0.5 ? 'moderado' : pct < 0.9 ? 'pesado' : 'agota';

  const TEXTO = {
    ligero: 'Ligero. Te queda margen para seguir trabajando en la misma ventana.',
    moderado: 'Moderado. Cabe en una ventana, pero cuida las rondas de corrección.',
    pesado: 'Pesado. Puede llevarse casi toda una ventana de 5 horas.',
    agota: 'Es probable que NO quepa en una sola ventana: tendrías que esperar al reinicio o repartirlo en varias.',
    api: 'Con API pagas por token: revisa el precio vigente del modelo antes de lanzar.',
  };

  return {
    escenas, modelo, esfuerzo, plan, tipo,
    tokens: { primera: Math.round(primera), correcciones: Math.round(correcciones), total: Math.round(total), min: Math.round(total * 0.6), max: Math.round(total * 1.6) },
    carga: Math.round(carga),
    pct, pctPrimera, rango: pct == null ? null : [pct * 0.6, pct * 1.6],
    nivel, texto: TEXTO[nivel],
    // Lo que el usuario debe saber sí o sí
    avisos: [
      esfuerzo.mult >= 3 && plan.capacidad === 1 ? 'Con el plan más chico, este esfuerzo puede acabarse tu ventana en la primera pasada, sin dejar uso para corregir.' : null,
      pctPrimera != null && pct > 0.9 && pctPrimera < 0.9 ? 'La primera pasada cabe; son las rondas de corrección las que te sacan del límite.' : null,
      modelo.nivel >= 3 && esfuerzo.mult <= 0.5 ? 'Un modelo caro a esfuerzo bajo suele rendir menos que uno medio a esfuerzo alto. El esfuerzo pesa más que el nombre del modelo.' : null,
      tipo.necesita.includes('higgsfield') ? 'La IA generativa se paga aparte, con tus créditos de Higgsfield. TAMO CREATOR te muestra el costo en créditos antes de generar.' : null,
    ].filter(Boolean),
  };
}

export const fmtK = (k) => (k >= 1000 ? `${(k / 1000).toFixed(1)} M` : `${Math.round(k)} k`);
export const fmtPct = (f) => (f >= 3 ? `${f.toFixed(1)}×` : `${Math.round(f * 100)} %`);

# TAMO CREATOR · guía para agentes

Proyecto final de Inteligencia Artificial. Dos personas: **Santiago** (dueño del repositorio, identidad TAMO STUDIO, app e integración) y **jriesgo** (`jriesgo-stack`, parámetros de corrección para creadores).

## Qué es
App local (Node + Vite + JS sin framework + three.js) que guía a un creador para producir motion graphics, video con IA generativa y animación 3D usando **sus propias cuentas**: Claude Code o Codex como agente, Higgsfield para IA generativa. La app no cobra, no guarda llaves y no llama APIs de pago por su cuenta.

## Reglas del producto (no negociables)
- **Honestidad ante todo.** Costos como estimado con rango, nunca como dato oficial. Decir cuándo algo consume uso de la cuenta, antes de que ocurra, y pedir confirmación.
- **Audio:** avisar que el audio generado por IA suena genérico; recomendar la carpeta de sonidos del usuario.
- **Modelos:** explicar que el esfuerzo pesa más que el nombre del modelo.
- **Preview:** todo storyboard lleva la etiqueta de que no es el video final.
- **Motor:** con Codex siempre Hyperframes; con Claude, Hyperframes o libre.
- Interfaz en español de México, tono amable y directo, sin tecnicismos innecesarios.

## Identidad visual
La de TAMO STUDIO (tamostudio.mx): carbón `#1b1d1a`, ámbar `#ffb700`, crema `#fff8ef`, Poppins + IBM Plex Mono, esquinas rectas (el único círculo es el botón de reproducir), grano sutil. El verde `#5fe08a` significa solo "corrección". Tokens en `src/styles.css`.

## Mapa
| Ruta | Qué hay |
| --- | --- |
| `server/index.mjs` | Servidor local (solo 127.0.0.1): estado de conexiones, proyectos, lanzar `claude -p` |
| `src/data/opciones.js` | Todo lo que pregunta el asistente: tipos, estilos, modelos, esfuerzos, planes |
| `src/lib/estimador.js` | Estimado de gasto y sus supuestos |
| `src/lib/brief.js` | Genera `BRIEF.md`, `PROMPT.md` y `CORRECCIONES.md` |
| `src/views/` | Pantallas: inicio, asistente, storyboard (preview), revisión, conexiones |
| `src/previews/previews.js` | Miniaturas animadas (canvas y three.js), todas dibujadas en vivo |
| `colaboradores/santiago/` · `colaboradores/jriesgo/` | Trabajo en bruto de cada quien |
| `colaboradores/jriesgo/parametros/*.json` | Parámetros de corrección; la app los carga sola |
| `docs/BITACORA.md` | Registro del proceso (requisito del proyecto) |
| `skills/` | `vendor/` publicable, `local/` solo en la máquina de cada quien |

## Protocolo cuando jriesgo sube algo
Cada vez que haya commits nuevos de jriesgo (o Santiago lo pida):
1. `git pull` y `npm run revisar` para ver qué cambió y qué se repite.
2. Su trabajo en bruto vive en `colaboradores/jriesgo/`. Lo que sea de Santiago, en `colaboradores/santiago/`. Si subió algo fuera de su carpeta, moverlo ahí o integrarlo, según corresponda.
3. **Integrar** a la app lo que esté listo: parámetros válidos se quedan en `colaboradores/jriesgo/parametros/` (la app ya los lee); código reutilizable pasa a `src/`.
4. **Duplicados:** si repite un proceso o una idea que ya existe (mismo control con otro nombre, mismo paso del flujo, misma función), decirlo con claridad, corregirlo con criterio propio (conservar la versión más completa y clara, unificar nombres) y explicar por qué.
5. Anotar en `docs/BITACORA.md`: fecha, qué subió, qué se integró, qué se repetía y cómo se resolvió.
6. Reportar a Santiago en pocas líneas. No reescribir el trabajo de jriesgo sin dejar constancia en la bitácora.

## Cuidado
- El repositorio es **público**. Nunca subir `.env`, `proyectos/`, `skills/local/` ni nada con llaves o datos personales.
- Skills con licencia comercial o privadas (motion-video-director, las de `synced/`) no se publican.
- No lanzar `claude -p` ni generaciones de Higgsfield para "probar": consumen la cuenta del usuario.

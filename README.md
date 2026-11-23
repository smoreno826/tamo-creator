# TAMO CREATOR

**Tú diriges. Tu agente produce.**

App local para crear motion graphics, video con IA generativa y animación 3D con **tus propias cuentas**. TAMO CREATOR no cobra, no tiene cuenta propia y no guarda llaves: usa las herramientas donde tú ya iniciaste sesión.

| Para | Usa |
| --- | --- |
| Dirigir y producir | Claude Code **o** Codex |
| Motion graphics | Hyperframes (obligatorio con Codex, opcional con Claude) |
| IA generativa | Tu cuenta de Higgsfield |
| 3D | three.js |

Proyecto final de Inteligencia Artificial. Identidad visual de [TAMO STUDIO](https://tamostudio.mx).

## El problema que resuelve
Las skills para crear video existen, pero casi nadie sabe qué hay dentro ni qué opciones tenían. Un agente rara vez te pregunta qué estilo prefieres, y cuando algo no te gusta tienes que describir con palabras dónde está el problema.

TAMO CREATOR hace tres cosas:

1. **Pregunta antes de producir.** Qué tipo de video, formato, estilo y audio, con ejemplos animados junto a cada opción.
2. **Te deja ver antes de gastar.** Un storyboard interactivo que dice claramente que no es el video final.
3. **Corrige señalando.** Te mueves por el video, encierras lo que no te gustó y escribes el cambio. El agente recibe el segundo exacto, la zona y una captura.

## Lo que te decimos y otros no
- **El audio generado por IA suena genérico y repetitivo.** Recomendamos tu carpeta de sonidos; tu agente te dice cómo editarlos.
- **El modelo más caro no garantiza un buen video.** Lo que más cambia el resultado es el esfuerzo con el que trabaja.
- **Cuánto de tu plan se va.** Un estimado con rango antes de lanzar, incluidas las rondas de corrección. Es una estimación nuestra, no un dato oficial, y se calibra con tu uso real.

## Instalación

Necesitas [Node.js 20+](https://nodejs.org) y Git.

**Windows**
```powershell
git clone https://github.com/smoreno826/tamo-creator.git
cd tamo-creator
powershell -ExecutionPolicy Bypass -File scripts\instalar.ps1 -Todo -Skills
```

**macOS / Linux**
```bash
git clone https://github.com/smoreno826/tamo-creator.git
cd tamo-creator
bash scripts/instalar.sh --todo --skills
```

El instalador revisa tu equipo, instala las dependencias de la app y, con `-Todo`, las herramientas que falten (Claude Code, Codex, Higgsfield, Hyperframes, FFmpeg en Windows). Con `-Skills` copia las skills abiertas a tu Claude Code sin tocar las que ya tengas.

Después inicia sesión **con tus cuentas** (una sola vez):

```
claude                  # y dentro: /login
codex                   # si usas Codex
higgsfield auth login   # si vas a usar IA generativa
```

## Uso

```
npm run dev
```

Abre <http://localhost:5180>. La app solo escucha en tu computadora.

### Abrirla como cualquier programa (Windows)

```powershell
powershell -ExecutionPolicy Bypass -File scriptscrear-acceso.ps1
```

Crea un acceso con el logotipo en el menú Inicio y en el escritorio. Después basta presionar la tecla Windows, escribir **TAMO CREATOR** y dar Enter: enciende el servidor si hace falta y abre la app en su propia ventana. Para quitarlo, el mismo comando con `-Quitar`.

| Pantalla | Qué haces |
| --- | --- |
| **Crear** | Respondes 7 pasos: tipo, formato, estilo, contenido, audio, cuenta/modelo/costo, resumen |
| **Preview** | Editas el storyboard y lo reproduces. Desde aquí lanzas la producción |
| **Revisión** | Marcas correcciones sobre el video y ajustas parámetros |
| **Conexiones** | Ves qué tienes instalado y con sesión, y cómo instalar lo que falta |

Cada proyecto vive en `proyectos/<nombre>/` (no se sube a GitHub):

```
BRIEF.md           fuente de verdad: qué se hace y el storyboard aprobado
PROMPT.md          el encargo para el agente
CORRECCIONES.md    lo que marcaste, con tiempos y zonas
correcciones/      una captura por corrección, con tu trazo
exports/           v01.mp4, v02.mp4… (el agente nunca sobrescribe)
```

## Estructura del repositorio

```
server/            servidor local
src/               la app (datos, pantallas, miniaturas, estimador)
colaboradores/
  santiago/        trabajo en bruto de Santiago
  jriesgo/         trabajo en bruto de jriesgo
    parametros/    parámetros de corrección: la app los carga sola
docs/BITACORA.md   registro del proceso
skills/            skills para Claude Code (ver skills/README.md)
scripts/           instalación, copia de skills, revisión de colaboración
```

## Colaboración
- Cada quien trabaja en su carpeta dentro de `colaboradores/`.
- `npm run revisar` reporta qué subió cada persona, archivos idénticos y parámetros repetidos o mal formados.
- La integración y la resolución de duplicados se documentan en [`docs/BITACORA.md`](docs/BITACORA.md). El protocolo está en [`CLAUDE.md`](CLAUDE.md).

## Skills
`npm run skills` copia las skills instaladas en tu equipo a `skills/local/` (privado) y las de licencia abierta a `skills/vendor/` (público). Detalle en [`skills/README.md`](skills/README.md).

## Estado
Versión 0.1. Probado: asistente completo, preview, revisión con trazo y capturas, detección de conexiones. El lanzamiento de Claude Code desde la app está implementado pero aún sin una corrida real de punta a punta; el lanzamiento con Codex es manual.

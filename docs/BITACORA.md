# Bitácora del proyecto

Registro del proceso de TAMO CREATOR. Lo más reciente va arriba. Cada entrada dice qué se hizo, quién, y qué se decidió.

---

## 2026-11-23 · Repositorio público y acceso directo (Santiago, con Claude Code)

- Repositorio publicado en github.com/smoreno826/tamo-creator. Se invitó a `jriesgo-stack` con permiso de escritura; nadie más puede editar.
- Los commits usan la dirección privada de GitHub para no exponer el correo personal en un repo público.
- `scripts/crear-acceso.ps1` genera el icono (la T y su barra) y crea el acceso en el menú Inicio y el escritorio. `scripts/abrir.ps1` enciende el servidor si no está corriendo y abre la app en ventana propia.
- Detalle encontrado al probar: en Windows PowerShell, `localhost` tarda unos 2 s en resolverse; el lanzador revisa el servidor por `127.0.0.1` para no dar un falso "apagado".

---

## 2026-11-23 · Primera versión de la app (Santiago, con Claude Code)

**Qué se construyó**
- Servidor local y app web con la identidad de TAMO STUDIO (carbón, ámbar, crema, Poppins, IBM Plex Mono, esquinas rectas). Los tokens se tomaron del sitio tamostudio.mx.
- **Asistente de 7 pasos**: tipo de video (6 caminos con miniatura animada), formato y duración, estilo visual (8 estilos), contenido, audio, cuenta/modelo/costo, resumen.
- **Preview**: storyboard interactivo con reproductor, marcado en pantalla como "no es tu video final". Se arma con una plantilla local, sin gastar uso de ninguna cuenta.
- **Revisión**: línea de tiempo, avance cuadro por cuadro, trazo sobre el video (círculo, trazo libre, flecha), nota "Corrección es:" unida a la marca con una línea verde. Al guardar se generan `CORRECCIONES.md` y una captura por corrección.
- **Estimador de gasto** por modelo, esfuerzo, plan y rondas de corrección, con rango y calibración.
- **Conexiones**: detecta Claude Code, Codex, Higgsfield, Hyperframes y FFmpeg.
- Instaladores para Windows y macOS/Linux, y copia de skills.

**Decisiones**
- La app no guarda llaves ni llama APIs de pago. Todo pasa por las herramientas con sesión del usuario.
- Las miniaturas de ejemplo son animaciones dibujadas en vivo (canvas y three.js). No se usó video de internet para no depender de material de terceros.
- El estimado de gasto se presenta como estimación propia con rango. Ningún proveedor publica cuántos tokens da cada plan; los supuestos están escritos en `src/lib/estimador.js`.
- **Skills:** el repositorio es público, así que solo se publican las de licencia abierta (`skills/vendor/`). Todas las demás quedan en `skills/local/`, fuera de GitHub. Motivo: `motion-video-director` tiene licencia comercial de un solo usuario que prohíbe redistribuirla, y varias más no declaran permiso.
- Los parámetros de corrección se cargan desde archivos JSON en `colaboradores/jriesgo/parametros/`, para que jriesgo los aporte sin tocar la interfaz. Mientras no haya ninguno, la app muestra un ejemplo marcado como tal.

**Pendiente**
- Parámetros definitivos de jriesgo.
- Una corrida real de punta a punta lanzando Claude Code desde la app.
- Lanzamiento automático con Codex (hoy es manual, con el comando que da la app).
- Mostrar el costo en créditos de Higgsfield dentro de la app (hoy lo pide el agente antes de generar).

---

## Plantilla para integraciones

```
## AAAA-MM-DD · Integración de lo que subió <persona>

**Qué subió:** archivos y propósito.
**Qué se integró:** a dónde fue cada cosa.
**Qué se repetía:** con qué chocaba y cómo se resolvió (qué versión se conservó y por qué).
**Pendiente / preguntas para la otra persona:**
```

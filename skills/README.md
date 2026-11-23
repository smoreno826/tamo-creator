# Skills

Las skills son instrucciones empaquetadas que Claude Code (y Codex) cargan para tareas concretas: Hyperframes, three.js, diseño de interfaz, etc.

| Carpeta | Qué contiene | ¿En GitHub? |
| --- | --- | --- |
| `vendor/` | Skills con licencia abierta (MIT, Apache) | Sí |
| `local/` | **Todas** las skills instaladas en tu computadora | No (`.gitignore`) |
| `MANIFEST.md` | La lista completa con licencia y origen | Sí |

## Por qué no están todas en GitHub
El repositorio es público. Algunas skills son de pago o privadas y su licencia prohíbe compartirlas (por ejemplo `motion-video-director`, licencia comercial de un solo usuario). Otras no declaran ninguna licencia, y sin permiso explícito no se pueden redistribuir. Publicarlas expondría al dueño del repositorio.

Quien clone el proyecto instala esas skills con su propia licencia o cuenta.

## Comandos
```
npm run skills                                   # vuelve a copiar desde tu equipo y regenera MANIFEST.md
scripts\instalar.ps1 -Skills                     # instala las de vendor/ en tu Claude Code (no sobrescribe)
```

## Las que usa TAMO CREATOR
- `hyperframes`, `hyperframes-cli`: motor de motion graphics. No declaran licencia, así que están solo en `local/`; cada quien las instala desde su fuente oficial.
- `threejs-*`: para los videos 3D. Incluidas en `vendor/`.
- `higgsfield-generate`: IA generativa. Solo en `local/`; cada quien la instala desde Higgsfield.

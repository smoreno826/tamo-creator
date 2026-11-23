# Carpeta de jriesgo

Aquí va todo tu trabajo en bruto. Tu parte del proyecto: **los parámetros de corrección** que usan los creadores en la pantalla de Revisión.

## Cómo se conectan tus parámetros a la app
No tienes que tocar el código de la interfaz. Deja uno o varios archivos `.json` en `colaboradores/jriesgo/parametros/` y la app los muestra sola. En cuanto exista un archivo ahí, el ejemplo de respaldo (`src/data/parametros/ejemplo.json`) deja de usarse.

```json
{
  "grupos": [
    {
      "id": "color",
      "titulo": "Color",
      "controles": [
        {
          "id": "exposicion",
          "titulo": "Exposición",
          "tipo": "rango",
          "min": -2, "max": 2, "paso": 0.1, "base": 0, "unidad": "EV",
          "instruccion": "Ajusta la exposición general {valor} EV."
        },
        {
          "id": "curva",
          "titulo": "Curva de animación",
          "tipo": "opciones",
          "opciones": ["Sin cambio", "Más suave", "Con rebote"],
          "base": "Sin cambio",
          "instruccion": "Usa esta curva en entradas y salidas: {valor}."
        }
      ]
    }
  ]
}
```

| Campo | Para qué |
| --- | --- |
| `id` | Nombre interno, sin espacios ni acentos. No lo cambies después: los proyectos guardados lo usan. |
| `titulo` | Lo que lee el creador. |
| `tipo` | `rango` (deslizador) u `opciones` (lista). |
| `min`, `max`, `paso`, `unidad` | Solo para `rango`. Rangos realistas: que el extremo siga siendo usable. |
| `base` | Valor que significa "sin cambio". Si el usuario lo deja ahí, no se manda ninguna instrucción. |
| `instruccion` | La frase exacta que recibe el agente. `{valor}` se reemplaza por lo que eligió el usuario. Que sea precisa y medible. |

Lo más importante es `instruccion`: un agente sigue lo que está escrito. "Más contraste" es vago; "Cambia el contraste +15 %" se puede cumplir.

## Antes de subir
```
npm run revisar
```
Te dice si un JSON está mal formado, si falta un campo o si un parámetro ya existe con el mismo nombre.

## Flujo de trabajo
1. `git pull`
2. Trabaja dentro de `colaboradores/jriesgo/`.
3. `git add`, `git commit -m "parametros: …"`, `git push`.
4. Santiago integra con Claude Code: lo que se repita con algo existente se unifica y queda anotado en `docs/BITACORA.md`.

Si quieres cambiar algo fuera de esta carpeta (la app, los textos), avisa en el commit qué y por qué.

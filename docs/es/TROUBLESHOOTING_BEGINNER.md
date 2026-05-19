# Solucion de problemas para principiantes

> Idioma: Espanol
> Language: [English](../TROUBLESHOOTING_BEGINNER.md)

Usa esta guia cuando `open-context-map` no se comporte como esperas.

## `opencode` no ve la herramienta

Revisa estos puntos en orden:

1. Ejecuta `init` desde la raiz del proyecto.

```bash
pnpm dlx @juliodiazru/open-context-map@0.1.3 init .
```

2. Reinicia `opencode`.

`opencode` carga `opencode.json` y `.opencode/` al arrancar.

3. Confirma que existen estos archivos:

- `opencode.json`
- `.opencode/skills/open-context-map-first/SKILL.md`
- `.opencode/commands/bug-context.md`
- `.opencode/commands/explain-flow.md`
- `.opencode/agents/context-first.md`

4. Si estas revisando una rama no confiable, recuerda que `OPENCODE_DISABLE_PROJECT_CONFIG=1` desactiva a proposito la configuracion del proyecto.

## No se encuentra el comando `open-context-map`

Puede que estes usando el paquete publicado sin una instalacion global.

Eso es normal.

Igualmente puedes usar la herramienta con:

```bash
pnpm dlx @juliodiazru/open-context-map@0.1.3 init .
```

Si quieres acceso directo a la CLI despues de clonar este repositorio, ejecuta:

```bash
pnpm install
node src/cli.js --help
```

## La busqueda no devuelve nada

Prueba este orden:

1. Reconstruye el indice.

```bash
open-context-map index .
```

2. Busca un nombre mas simple.

```bash
open-context-map search "initProject" .
```

3. Revisa si la extension de archivo es compatible.

Las extensiones compatibles incluyen JavaScript, TypeScript, Python, Go, Java, C#, PHP, Ruby, Rust, Kotlin y Swift.

4. Revisa si el archivo es demasiado grande.

Los archivos mayores a `350000` bytes se omiten.

## El repositorio es grande y los resultados parecen incompletos

Hay limites incorporados.

- los archivos mayores a `350000` bytes se omiten
- el escaneo se detiene despues de `5000` archivos
- se omiten directorios generados como `node_modules`, `dist`, `build` y `coverage`

Si tu repositorio es muy grande, empieza por un simbolo mas simple y verifica el resultado en archivos reales.

## El grafo parece incorrecto

El analizador es heuristico.

Eso significa que algunos patrones dinamicos pueden no resolverse correctamente.

Usa esta regla:

- confia en el grafo para encontrar un punto de partida
- confia en los archivos reales para la respuesta final

## `opencode.json` o `opencode.jsonc` es invalido

`init` espera JSON o JSONC validos.

Si el archivo ya existe y tiene un error de sintaxis, arreglalo primero y vuelve a ejecutar `init`.

Causas comunes:

- falta una coma
- sobra un caracter al final
- hay comentarios rotos en JSONC

## Cambiaste configuracion pero no paso nada

Reinicia `opencode`.

Esto importa despues de:

- `init`
- `uninstall`
- editar `opencode.json`
- editar archivos dentro de `.opencode/`

## Quieres quitar la configuracion

Ejecuta:

```bash
pnpm dlx @juliodiazru/open-context-map@0.1.3 uninstall .
```

Eso elimina la configuracion MCP generada y el indice local.

## Estas contribuyendo a este repositorio

Ejecuta la verificacion completa del proyecto:

```bash
pnpm run check
```

Eso ejecuta tests y una auditoria de dependencias.

## Cuando pedir ayuda

Si el problema sigue sin estar claro, reune primero estos datos:

- el comando que ejecutaste
- el mensaje de error exacto
- si reiniciaste `opencode`
- si el tipo de archivo objetivo es compatible
- si el repositorio es inusualmente grande

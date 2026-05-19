# @juliodiazru/open-context-map

> Idioma: Espanol
> Language: [English](README.md)

`@juliodiazru/open-context-map` construye un mapa local de tu repositorio y lo expone como un servidor MCP para `opencode`.

En pocas palabras:

- lee tu proyecto como texto
- encuentra archivos, clases, funciones, metodos, importaciones y llamadas
- guarda esas relaciones en un indice local
- `opencode` puede pedir ese contexto antes de editar codigo

Este proyecto sigue una regla simple: primero da estructura util y despues lee los archivos reales.

Documentacion util en espanol:

- `docs/es/README.md`
- `docs/es/MANUAL_BEGINNER.md`
- `docs/es/TROUBLESHOOTING_BEGINNER.md`
- `docs/es/SECURITY_BEGINNER.md`
- `docs/es/GITHUB_SECURITY_SETUP_BEGINNER.md`
- `docs/es/RELEASE_PROCESS.md`

## Por que existe

Cuando quieres corregir un bug o cambiar una funcionalidad, casi nunca basta con leer un solo archivo.

Normalmente necesitas responder preguntas como estas:

- donde empieza este flujo
- quien llama esta funcion
- que llama despues
- que se podria romper si la cambio

`open-context-map` intenta responder esas preguntas rapido con un grafo local.

## Inicio rapido

Este es el camino mas facil si ya usas `opencode`.

### 1. Revisa los requisitos

- Node.js `20` o superior
- `pnpm`
- `opencode` si quieres la integracion MCP

### 2. Ejecuta el comando de instalacion fijado

Desde la raiz del proyecto que quieres analizar:

```bash
pnpm dlx @juliodiazru/open-context-map@0.1.3 init .
```

Mantener la version fijada es mas seguro que ejecutar un paquete sin una version explicita.

### 3. Reinicia `opencode`

`opencode` lee `opencode.json` y `.opencode/` al arrancar. Cierra y vuelve a abrirlo cuando termine `init`.

### 4. Pide contexto

Ejemplos:

- `use open-context-map to explain the flow of initProject`
- `use open-context-map to analyze the impact of changing indexRepository`
- `use open-context-map to build bug context for UserService`

## Que crea `init`

El comando `init` prepara tu proyecto para que no tengas que copiar archivos a mano.

- `opencode.json` con un MCP local llamado `open-context-map`
- `.opencode/skills/open-context-map-first/SKILL.md`
- `.opencode/commands/bug-context.md`
- `.opencode/commands/explain-flow.md`
- `.opencode/agents/context-first.md`
- `.gitignore` con `.open-context-map/`
- `.open-context-map/index.json`

## Como funciona de un vistazo

```text
tu repositorio
  -> open-context-map lee archivos fuente como texto
  -> construye .open-context-map/index.json
  -> opencode llama al MCP
  -> el agente obtiene quien llama a cada simbolo, a que llama, flujo e impacto antes de editar
```

## Primeros ejemplos de CLI

Crea o actualiza el indice local:

```bash
open-context-map index .
```

La salida esperada se ve asi:

```json
{
  "ok": true,
  "message": "Index created",
  "stats": {
    "files": 12,
    "nodes": 176,
    "edges": 530
  }
}
```

Busca un simbolo:

```bash
open-context-map search "initProject" .
```

Ejemplo de salida:

```json
[
  {
    "score": 90,
    "node": {
      "name": "initProject",
      "file": "src/init.js",
      "line": 12,
      "kind": "function"
    }
  }
]
```

Si el indice todavia no existe, los comandos de consulta lo crean automaticamente.

## Tareas comunes

| Quiero... | Comando |
| --- | --- |
| construir o refrescar el mapa | `open-context-map index .` |
| observar cambios locales en forma manual | `open-context-map watch .` |
| buscar un simbolo o archivo | `open-context-map search "initProject" .` |
| ver quien usa un simbolo | `open-context-map callers "initProject" .` |
| ver a que llama un simbolo | `open-context-map callees "initProject" .` |
| seguir el flujo hacia adelante | `open-context-map trace "initProject" . --depth 3` |
| estimar que podria afectar un cambio | `open-context-map impact "initProject" . --depth 3` |
| construir un paquete de contexto para una tarea de IA | `open-context-map context "initProject" . --type feature` |
| ejecutar directamente el servidor MCP local | `open-context-map mcp .` |
| quitar los archivos generados de un proyecto | `open-context-map uninstall .` |

Tipos de contexto disponibles:

- `bug`
- `refactor`
- `feature`
- `general`

## Indexacion automatica

No necesitas una base de datos aparte ni un servicio en segundo plano.

- `init` deja el proyecto listo
- el servidor MCP arranca un monitor nativo de archivos
- solo se reindexan los archivos que cambian
- el indice se mantiene local en `.open-context-map/index.json`

## Archivos fuente compatibles

El analizador actual lee estas extensiones:

- `.js`, `.mjs`, `.cjs`, `.jsx`
- `.ts`, `.tsx`
- `.py`
- `.go`
- `.java`
- `.cs`
- `.php`
- `.rb`
- `.rs`
- `.kt`
- `.swift`

## Limites honestos

La herramienta es util, pero no hace magia.

- no reemplaza el LSP de tu editor
- el analizador es heuristico, asi que algunos patrones dinamicos pueden escaparse
- solo lee texto y no ejecuta el codigo del repositorio
- omite archivos grandes de mas de `350000` bytes
- se detiene despues de `5000` archivos por defecto
- omite directorios pesados como `node_modules`, `.git`, `dist`, `build`, `coverage`, `.next`, `.cache` y `target`

El grafo es una ayuda. Los archivos fuente siguen siendo la verdad final.

## Resumen de seguridad

Este README solo da la version corta. Lee `docs/es/SECURITY_BEGINNER.md` y `SECURITY.es.md` para ver el detalle.

- el runtime usa solo APIs nativas de Node.js
- la herramienta no ejecuta el codigo que analiza
- se bloquean rutas fuera del repositorio seleccionado
- el texto que parece secreto se redacta antes de guardarse en el indice local
- la configuracion MCP sigue el formato oficial de servidor local de `opencode`
- `opencode.json` y `.opencode/` son configuracion del proyecto, asi que deben tratarse como codigo de confianza

Si estas revisando una rama o PR no confiable, inicia `opencode` asi:

```bash
OPENCODE_DISABLE_PROJECT_CONFIG=1 opencode
```

## Desinstalacion

Para quitar la configuracion generada del proyecto:

```bash
pnpm dlx @juliodiazru/open-context-map@0.1.3 uninstall .
```

Eso elimina la entrada MCP generada, los archivos auxiliares y el directorio del indice local.

## Mapa de documentacion

- `docs/es/README.md`: indice de documentacion en espanol
- `docs/es/MANUAL_BEGINNER.md`: tutorial inicial en lenguaje simple
- `docs/es/TROUBLESHOOTING_BEGINNER.md`: problemas comunes y soluciones rapidas
- `docs/es/SECURITY_BEGINNER.md`: explicacion de seguridad para principiantes
- `docs/es/GITHUB_SECURITY_SETUP_BEGINNER.md`: guia de endurecimiento en GitHub
- `docs/es/RELEASE_PROCESS.md`: flujo de publicacion para PR, tag, release y npm
- `docs/es/HOW_IT_WAS_BUILT.md`: explicacion de implementacion para personas que contribuyen
- `docs/es/OPENCODE_ALIGNMENT.md`: por que la configuracion generada coincide con `opencode`
- `docs/es/PLAN.md`: plan actual y siguientes pasos
- `SECURITY.es.md`: politica formal de seguridad y modelo de confianza

## Verificacion

Si estas contribuyendo a este repositorio, ejecuta:

```bash
pnpm run check
```

Eso ejecuta:

- `pnpm test`
- `pnpm audit --audit-level moderate`

## Estado del proyecto

La version actual valida este flujo:

1. construir un mapa local del codigo
2. consultarlo desde la CLI
3. exponerlo por MCP
4. usarlo desde `opencode` antes de editar codigo
5. analizar impacto de cambios antes de editar

La idea se apoya en trabajo conocido sobre comprension de programas y cambio de codigo, incluyendo a Weiser sobre program slicing, LaToza, Venolia y DeLine sobre modelos mentales, Maalej et al. sobre navegacion estructural y RepoCoder sobre recuperacion estructurada para tareas de codigo.

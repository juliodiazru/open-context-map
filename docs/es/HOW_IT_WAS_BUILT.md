# Como se construyo

> Idioma: Espanol
> Language: [English](../HOW_IT_WAS_BUILT.md)

Este documento es para personas que contribuyen y quieren una explicacion simple de la implementacion.

Si eres nuevo en el proyecto, lee primero `../../README.es.md` y `MANUAL_BEGINNER.md`.

## Objetivo de diseno

El proyecto intenta ser util sin volverse pesado.

La idea principal es:

```text
leer archivos fuente como texto
  -> detectar simbolos y relaciones
  -> guardar un indice JSON local
  -> responder preguntas de contexto desde CLI o MCP
```

## 1. Nombre del paquete y de la CLI

- paquete publicado: `@juliodiazru/open-context-map`
- comando CLI: `open-context-map`

Esto mantiene el alcance del paquete npm, pero deja corto el comando de terminal.

## 2. Eleccion de dependencias de ejecucion

La parte de ejecucion usa APIs nativas de Node.js.

Motivos:

- historia de instalacion mas simple
- menor superficie de cadena de suministro en la ejecucion
- revision mas facil en un proyecto temprano

El desarrollo sigue usando herramientas normales cuando las personas que contribuyen ejecutan `pnpm install`.

## 3. Controles de seguridad

Archivo principal: `src/security.js`

Este archivo define los limites basicos que hacen predecible al indexador:

- que directorios se omiten
- que extensiones de archivo estan permitidas
- tamano maximo de archivo
- cantidad maxima de archivos
- resolucion de rutas dentro de la raiz del repo
- ubicacion del indice local

El codigo tambien omite enlaces simbolicos y rechaza rutas fuera de la raiz del repositorio.

## 4. Analisis heuristico

Archivo principal: `src/parser.js`

El analizador usa expresiones regulares y analisis simple por lineas para detectar:

- clases
- interfaces y declaraciones de tipo similares
- funciones y metodos
- imports
- llamadas

Tambien elimina comentarios y strings antes de detectar llamadas para reducir falsos positivos obvios.

El analizador es intencionalmente liviano. Su objetivo es orientar, no comportarse como un compilador completo o un servidor de lenguaje.

## 5. Construccion del indice local

Archivo principal: `src/indexer.js`

El indexador hace este trabajo:

1. recorre archivos fuente permitidos
2. lee cada archivo de forma segura
3. parsea simbolos y relaciones
4. crea nodos y aristas del grafo
5. guarda `.open-context-map/index.json`

El indice es JSON local a proposito.

Eso evita requerir una base de datos externa solo para probar la herramienta.

## 6. Consultas al grafo

Archivo principal: `src/graph.js`

Esta capa impulsa las preguntas principales del usuario:

- busqueda
- quien llama a un simbolo
- a que llama un simbolo
- trazado de flujo
- analisis de impacto
- paquetes de contexto

Dos decisiones de diseno son especialmente importantes:

- los paquetes de contexto intentan empezar desde un metodo util cuando el usuario pregunta por una clase
- el analisis de impacto recorre llamadas hacia atras para responder `que podria romperse si cambio esto`

## 7. Comandos CLI

Archivo principal: `src/cli.js`

La CLI existe por dos razones:

- las personas pueden probar el motor sin `opencode`
- el mismo motor puede exponerse despues por MCP

Comandos importantes:

- `index`
- `watch`
- `search`
- `callers`
- `callees`
- `trace`
- `impact`
- `context`
- `init`
- `uninstall`
- `mcp`

## 8. Generacion de la configuracion inicial del proyecto

Archivo principal: `src/init.js`

`init` escribe los archivos de proyecto que necesita `opencode`.

Crea:

- `opencode.json`
- `.opencode/skills/open-context-map-first/SKILL.md`
- `.opencode/commands/bug-context.md`
- `.opencode/commands/explain-flow.md`
- `.opencode/agents/context-first.md`
- entrada en `.gitignore` para `.open-context-map/`
- el primer indice local

`uninstall` elimina despues esa configuracion generada.

La meta es tener una instalacion con un solo comando y una desinstalacion con un solo comando.

## 9. Mantener actualizado el indice

Archivo principal: `src/watcher.js`

Cuando el servidor MCP esta activo, un monitor nativo de archivos detecta cambios y reindexa solo los archivos modificados.

Eso mantiene util el mapa durante el trabajo normal sin pedirle al usuario comandos extra de sincronizacion.

## 10. Servidor MCP

Archivo principal: `src/mcp-server.js`

El servidor habla JSON-RPC sobre `stdio` para que `opencode` pueda iniciarlo como un servidor MCP local.

Eso da al agente herramientas estructuradas en lugar de obligarlo a adivinar la estructura del repositorio desde texto sin procesar.

## 11. Por que los archivos generados se ven asi

Rutas generadas relevantes:

- `opencode.json`
- `.opencode/skills/open-context-map-first/SKILL.md`
- `.opencode/commands/bug-context.md`
- `.opencode/commands/explain-flow.md`
- `.opencode/agents/context-first.md`

Se definieron siguiendo la documentacion oficial de `opencode` sobre:

- configuracion
- servidores MCP
- archivos auxiliares de `.opencode/` (`skills`, `commands` y `agents`)

Reglas importantes confirmadas desde la documentacion:

- `mcp` vive en `opencode.json`
- un MCP local usa `type: "local"`
- `command` es un array de strings
- `timeout` esta en milisegundos
- las skills viven en `.opencode/skills/<name>/SKILL.md`
- los comandos auxiliares viven en `.opencode/commands/`
- los agentes viven en `.opencode/agents/`

El comando generado sigue el patron oficial de MCP local:

```json
["pnpm", "dlx", "@juliodiazru/open-context-map@0.1.3", "mcp", "."]
```

## 12. Limites honestos

Este proyecto no intenta competir con un LSP completo ni con analizadores profundos especificos por lenguaje.

La meta es otra:

- contexto util rapido
- instalacion y desinstalacion locales
- indice JSON portable
- suficiente estructura para mejorar la comprension del repositorio antes de editar

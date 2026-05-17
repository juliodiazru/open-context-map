# Como se hizo

Este documento explica la implementacion en lenguaje simple.

## Paso 1: nombre y estructura del proyecto

El nombre elegido fue `open-context-map` porque describe mejor la idea del producto y no aparecio un repositorio publico exacto con ese nombre en GitHub al momento de validar.

## Paso 2: evitar dependencias runtime externas

Se uso Node.js con librerias nativas.

La razon principal fue reducir riesgo de supply chain en esta etapa temprana.

## Paso 3: crear controles de seguridad

Archivo principal: `src/security.js`

Aqui se define:

- que carpetas ignorar
- que extensiones leer
- tamano maximo de archivo
- rutas seguras dentro del repo
- ruta del indice local

## Paso 4: crear parser heuristico

Archivo principal: `src/parser.js`

El parser usa expresiones regulares para detectar:

- clases
- funciones
- metodos
- imports
- llamadas

Tambien se mejoro para ignorar llamadas falsas dentro de strings y comentarios, porque eso ensuciaba el grafo.

Tambien detecta metodos Java sin `public`, `private` o `protected`. Esto importa en pruebas JUnit, porque muchos metodos de test son package-private.

## Paso 5: crear indexador

Archivo principal: `src/indexer.js`

El indexador:

1. recorre archivos fuente
2. lee texto de forma segura
3. parsea el contenido
4. crea nodos y relaciones
5. guarda `.open-context-map/index.json`

El indice vive en JSON local a proposito.

Asi no hace falta instalar una base de datos externa para empezar a usar la herramienta.

## Paso 6: crear consultas de grafo

Archivo principal: `src/graph.js`

Desde ahi salen consultas como:

- busqueda general
- callers
- callees
- flujos
- analisis de impacto
- paquetes de contexto

Cuando una persona pregunta por una clase, el paquete de contexto intenta iniciar el flujo en un metodo real con llamadas salientes. Asi evita quedarse parado solo en el nombre de la clase.

El analisis de impacto recorre el grafo hacia atras: dado un simbolo, encuentra todos los que lo llaman directa o indirectamente. Eso responde la pregunta real de un senior: "si cambio esto, que se rompe".

## Paso 7: crear CLI

Archivo principal: `src/cli.js`

La CLI permite probar todo sin depender todavia de `opencode`.

Tambien se agrego `open-context-map init`, que prepara un proyecto usuario de forma automatica.

Ese comando genera la configuracion de `opencode`, los archivos `.opencode`, el `.gitignore` y el indice inicial.

`open-context-map uninstall` hace el proceso inverso: limpia todo lo que `init` agrego.

La idea es mantener un flujo de un solo comando para instalar y otro para desinstalar.

## Paso 8: mantener el indice actualizado

Archivo principal: `src/watcher.js`

Cuando el MCP esta activo, se usa un watcher nativo.

Ese watcher vuelve a indexar solo los archivos que cambian.

Asi la herramienta se comporta de forma automatica mientras trabajas en el repositorio.

## Paso 9: crear servidor MCP

Archivo principal: `src/mcp-server.js`

Ese archivo implementa JSON-RPC por `stdio` para que `opencode` vea las herramientas como MCP local.

## Paso 10: integrar con opencode

Archivos relevantes:

- `opencode.json`
- `.opencode/skills/open-context-map-first/SKILL.md`
- `.opencode/commands/bug-context.md`
- `.opencode/commands/explain-flow.md`
- `.opencode/agents/context-first.md`

Esto se ajusto siguiendo la documentacion oficial de:

- config
- skills
- commands
- agents
- mcp servers

Tambien se comparo con repositorios publicos del ecosistema para respetar los patrones mas conocidos de `opencode`.

Validacion importante de la documentacion oficial de `opencode`:

- `mcp` vive dentro de `opencode.json`
- un MCP local usa `type: "local"`
- `command` debe ser una lista de strings
- `enabled` activa o desactiva el MCP
- `timeout` se expresa en milisegundos
- las skills viven en `.opencode/skills/<nombre>/SKILL.md`
- los commands viven en `.opencode/commands/`
- los agents viven en `.opencode/agents/`

La forma objetivo de instalacion sigue el patron oficial de MCP local:

```text
npx -y open-context-map@0.1.0 init .
```

Y dentro de `opencode.json` queda un MCP local con comando tipo:

```json
["npx", "-y", "open-context-map@0.1.0", "mcp", "."]
```

## Paso 11: mantener limites honestos

El parser sigue siendo heuristico.

Eso significa que no intenta competir con un LSP completo ni con analizadores por lenguaje mucho mas pesados.

La meta aqui es otra: dar un mapa util rapido, portable y facil de instalar.

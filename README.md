# open-context-map

`open-context-map` crea un mapa local del codigo y lo expone por MCP para `opencode`.

La idea es simple:

- primero se lee el repositorio como texto
- despues se detectan archivos, clases, funciones, metodos e importaciones simples
- luego se guardan relaciones utiles, por ejemplo quien llama a quien
- al final `opencode` puede pedir ese contexto antes de editar codigo

El motor esta hecho con **Node.js puro** y **sin dependencias runtime externas**.

Eso reduce mucho el riesgo inicial de supply chain en NPM.

## Que hace

- crea un indice local en `.open-context-map/index.json`
- busca simbolos y archivos relacionados
- calcula callers, callees y flujos simples
- analiza el impacto de cambiar un simbolo: que otros lo llaman directa o indirectamente
- arma paquetes de contexto para `bug`, `refactor`, `feature` y `general`
- cuando preguntas por una clase, intenta iniciar el flujo en el metodo mas util
- expone herramientas MCP para `opencode`
- incluye ejemplos reales de `skills`, `commands` y `agents` para `opencode`
- mientras el MCP esta activo, actualiza el indice en segundo plano cuando cambian archivos

## Como intenta pensar el problema

La herramienta intenta ayudarte como lo hace una persona cuando quiere entender una feature o un bug:

- si conoces una clase o función, puedes mirar quien la llama y seguir el camino hacia atrás hasta el origen
- si ya estas en la pieza objetivo, puedes mirar que llama despues y seguir el flujo hacia adelante hasta el final
- si vas a cambiar algo, puedes revisar el impacto para ver que otras piezas dependen de eso

## Que no hace todavia

- no intenta reemplazar el LSP de tu editor: se enfoca en darte contexto estructural rapido y puede convivir con un LSP real
- no resuelve todos los casos dinamicos de cada lenguaje
- no necesita embeddings para seguir relaciones estructurales principales
- no requiere una base de datos externa o avanzada: guarda un indice local simple para que instalar y desinstalar sea facil

El parser todavia es simple, pero el flujo de instalacion, desinstalacion y actualizacion automatica ya esta pensado para uso real.

## Requisitos

- Node.js 20 o superior
- npm
- `opencode` si quieres probar la integracion MCP

## Instalacion en un proyecto

La idea para una persona usuaria es que no copie carpetas ni scripts a mano.

Cuando el paquete este publicado, desde la raiz de cualquier proyecto que use `opencode` bastara con:

```bash
npx -y open-context-map@0.1.0 init .
```

Ese comando prepara:

- `opencode.json` con un MCP local llamado `open-context-map`
- `.opencode/skills/open-context-map-first/SKILL.md`
- `.opencode/commands/bug-context.md`
- `.opencode/commands/explain-flow.md`
- `.opencode/agents/context-first.md`
- `.gitignore` con `.open-context-map/`
- `.open-context-map/index.json` como indice local

Despues de correr `init`, cierra y vuelve a abrir `opencode` en ese proyecto. Desde ese momento la herramienta queda disponible y el MCP mantiene el indice al dia de forma automatica mientras trabajas.

### Desinstalar

Para quitar `open-context-map` de un proyecto:

```bash
npx -y open-context-map@0.1.0 uninstall .
```

Ese comando limpia:

- el directorio `.open-context-map/`
- la entrada MCP en `opencode.json`
- los archivos `.opencode/` que genero `init`
- la entrada `.open-context-map/` del `.gitignore`

## Comandos principales

Crear indice:

```bash
open-context-map index .
```

Buscar simbolos o archivos:

```bash
open-context-map search "InterestCalculator"
```

Ver quien llama a un simbolo:

```bash
open-context-map callers "calculateSimpleInterest"
```

Ver que llama un simbolo:

```bash
open-context-map callees "calculateSchedule"
```

Seguir un flujo hacia adelante:

```bash
open-context-map trace "InterestReportService.buildAnnualReport" --depth 4
```

Analizar el impacto de cambiar un simbolo:

```bash
open-context-map impact "calculateSimpleInterest" --depth 4
```

Crear un paquete de contexto:

```bash
open-context-map context "InterestController" --type feature
```

Tipos disponibles:

- `bug`
- `refactor`
- `feature`
- `general`

Desinstalar del proyecto actual:

```bash
open-context-map uninstall .
```

## Usar con opencode

`opencode` reconoce configuracion por proyecto en `opencode.json` y tambien carga archivos dentro de `.opencode/`.

`open-context-map init` usa ese mecanismo oficial y registra un MCP local llamado `open-context-map`.

Tambien incluye:

- skill: `.opencode/skills/open-context-map-first/SKILL.md`
- commands: `.opencode/commands/bug-context.md` y `.opencode/commands/explain-flow.md`
- subagent: `.opencode/agents/context-first.md`

## Indexacion automatica

No hace falta correr un servicio aparte.

- `init` deja el proyecto listo
- el servidor MCP arranca un watcher nativo
- cuando cambias archivos, se reindexan solo los archivos afectados
- el indice sigue guardado de forma local en `.open-context-map/index.json`

## Herramientas MCP

- `index_repo`
- `search_code_graph`
- `get_symbol`
- `find_callers`
- `find_callees`
- `trace_flow`
- `analyze_impact`
- `build_context_pack`

## Seguridad

Decisiones importantes:

- sin dependencias runtime externas
- no ejecuta codigo del repositorio analizado
- solo lee extensiones permitidas
- ignora carpetas pesadas o peligrosas
- limita el tamano de archivo
- limita profundidad de trazas y cantidad de resultados
- valida tipos de contexto conocidos
- restringe rutas fuera del repo configurado
- guarda el indice local en `.open-context-map/`

La integracion de `opencode` se reviso contra repositorios publicos y fuentes conocidas del ecosistema:

- `anomalyco/opencode` en GitHub, sobre todo su `README`
- `Kilo-Org/kilocode`, que mantiene el esquema de configuracion usado por `opencode` para MCP, skills, commands y agents
- `charmbracelet/crush`, como referencia del formato abierto de skills y agentes en herramientas cercanas del ecosistema

Lee tambien:

- `docs/MANUAL_BEGINNER.md`
- `docs/SECURITY_BEGINNER.md`
- `docs/HOW_IT_WAS_BUILT.md`
- `docs/OPENCODE_ALIGNMENT.md`

## Verificacion

Ejecuta:

```bash
npm run check
```

Eso corre:

- pruebas automaticas
- `npm audit --audit-level=moderate`

## Estado del proyecto

El objetivo de esta version es validar este flujo:

1. crear un mapa local del codigo
2. consultarlo desde CLI
3. exponerlo por MCP
4. usarlo desde `opencode` antes de editar codigo
5. analizar el impacto de cambiar un simbolo

La base de este enfoque coincide con estudios sobre comprension de programas y cambio de codigo: Weiser (program slicing, IEEE TSE 1984), LaToza/Venolia/DeLine (mental models, ICSE 2006), Maalej et al. (TOSEM 2014) y RepoCoder (EMNLP 2023).

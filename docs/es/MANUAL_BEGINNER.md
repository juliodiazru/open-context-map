# Manual para principiantes

> Idioma: Espanol
> Language: [English](../MANUAL_BEGINNER.md)

Esta guia es para personas que quieren usar `@juliodiazru/open-context-map` sin tener que leer primero la implementacion.

Esta escrita en lenguaje simple a proposito.

## Primero, identifica que camino necesitas

Hay dos formas comunes de usar este proyecto.

### Camino A: usar la herramienta publicada dentro de otro proyecto

Elige este camino si quieres analizar un repositorio con `opencode`.

No necesitas clonar este repositorio.

### Camino B: contribuir a este repositorio

Elige este camino si quieres cambiar el codigo de `open-context-map`.

En ese caso trabajas en este repositorio y ejecutas:

```bash
pnpm install
```

Eso instala dependencias de desarrollo para contribuidores. No es el paso normal para usuarios finales.

## Que es esta herramienta

Crea un mapa local de tu codigo.

Ese mapa ayuda a una persona o a una IA a responder preguntas como estas:

- donde empieza este flujo
- quien llama a esta funcion
- a que llama despues
- que se podria romper si la cambio

## Palabras importantes

**Repositorio**: la carpeta donde vive un proyecto.

**Indice**: el archivo generado que guarda el mapa.

**Nodo**: una pieza del mapa, como un archivo, clase, funcion o metodo.

**Relacion**: una conexion entre nodos. Ejemplo: una funcion llama a otra.

**Grafo**: el conjunto completo de nodos y relaciones.

**MCP**: una forma estandar para que una herramienta de IA llame a herramientas externas.

**opencode**: la herramienta de IA que puede cargar este MCP.

## Camino mas rapido para la mayoria de usuarios

Desde la raiz del proyecto que quieres analizar:

```bash
pnpm dlx @juliodiazru/open-context-map@0.1.3 init .
```

Despues:

1. espera a que el comando termine
2. reinicia `opencode`
3. pide contexto en lenguaje natural

Ejemplos de prompts:

- `use open-context-map to explain the flow of initProject`
- `use open-context-map to analyze the impact of changing UserService`
- `use open-context-map to build bug context for PaymentController`

## Que hace `init`

Crea los archivos de proyecto que necesita `opencode`.

- `opencode.json`
- `.opencode/skills/open-context-map-first/SKILL.md`
- `.opencode/commands/bug-context.md`
- `.opencode/commands/explain-flow.md`
- `.opencode/agents/context-first.md`
- `.open-context-map/index.json`
- entrada en `.gitignore` para `.open-context-map/`

Despues de eso, no deberias tener que copiar archivos de configuracion a mano.

## Uso paso a paso de la CLI

Tambien puedes usar la CLI directamente.

### Paso 1: entra al repositorio que quieres analizar

```bash
cd your-project-name
```

### Paso 2: crea o actualiza el mapa

```bash
open-context-map index .
```

El punto `.` significa `usa la carpeta actual`.

Esto crea:

```text
.open-context-map/index.json
```

### Paso 3: busca un simbolo o archivo

```bash
open-context-map search "initProject" .
```

Usa esto cuando necesites un punto de partida.

### Paso 4: mira quien llama a un simbolo

```bash
open-context-map callers "initProject" .
```

Piensalo como: `quien usa esto`.

### Paso 5: mira a que llama un simbolo

```bash
open-context-map callees "initProject" .
```

Piensalo como: `a que llama esto a continuacion`.

### Paso 6: sigue un flujo hacia adelante

```bash
open-context-map trace "initProject" . --depth 3
```

Usalo para seguir los siguientes pasos de la cadena de llamadas.

### Paso 7: estima el impacto de un cambio

```bash
open-context-map impact "initProject" . --depth 3
```

Piensalo como: `si cambio esto, que podria afectar`.

### Paso 8: construye contexto para una tarea

Para un bug:

```bash
open-context-map context "initProject" . --type bug
```

Para un refactor:

```bash
open-context-map context "initProject" . --type refactor
```

Para una nueva funcionalidad:

```bash
open-context-map context "initProject" . --type feature
```

Cuando preguntas por una clase, la herramienta intenta arrancar desde un metodo util en vez de quedarse solo con el nombre de la clase.

## Usalo con `opencode`

1. Ejecuta `init` en el proyecto.
2. Reinicia `opencode`.
3. Pide contexto antes de editar codigo.

Mientras el MCP este activo, el indice se actualiza automaticamente cuando cambian archivos.

No necesitas una base de datos externa.

## Archivos auxiliares utiles generados para `opencode`

`init` crea instrucciones simples:

- una skill que indica `usa el mapa antes de editar`
- un comando `/bug-context`
- un comando `/explain-flow`
- un subagente `context-first`

## Si algo falla

Prueba estas comprobaciones en este orden.

### 1. Reconstruye el indice

```bash
open-context-map index .
```

### 2. Prueba una busqueda simple

```bash
open-context-map search "initProject" .
```

### 3. Reinicia `opencode`

Esto importa despues de `init`, `uninstall` o cambios manuales en `opencode.json`.

### 4. Revisa si el tipo de archivo es compatible

El analizador actualmente lee estas extensiones:

- `.js`, `.mjs`, `.cjs`, `.jsx`
- `.ts`, `.tsx`
- `.py`, `.go`, `.java`, `.cs`, `.php`, `.rb`, `.rs`, `.kt`, `.swift`

### 5. Revisa si el repositorio es demasiado grande para los limites actuales

- se omiten archivos mayores a `350000` bytes
- despues de `5000` archivos, el escaneo se detiene

### 6. Si estas contribuyendo a este repositorio, ejecuta la verificacion completa

```bash
pnpm run check
```

Para mas ejemplos, lee `docs/es/TROUBLESHOOTING_BEGINNER.md`.

## Quitar la configuracion de un proyecto

```bash
pnpm dlx @juliodiazru/open-context-map@0.1.3 uninstall .
```

Eso elimina la entrada MCP generada, los archivos auxiliares y el indice local.

## Idea importante

`open-context-map` no intenta reemplazar el LSP de tu editor.

Su trabajo es distinto: construir un mapa simple del repositorio para ayudarte a decidir que leer primero y que podria verse afectado por un cambio.

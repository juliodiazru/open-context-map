# Manual para principiantes

Este manual explica el proyecto paso a paso, sin asumir experiencia avanzada.

## Que es open-context-map

Es una herramienta que crea un mapa de tu codigo.

Ese mapa ayuda a una IA o a una persona a entender mejor el proyecto antes de cambiar archivos.

## Palabras importantes

**Repositorio**: carpeta donde vive un proyecto.

**Indice**: archivo que guarda el mapa ya procesado.

**Nodo**: una pieza del mapa. Puede ser un archivo, una clase o una funcion.

**Relacion**: conexion entre nodos. Por ejemplo: una funcion llama a otra.

**Grafo**: conjunto completo de nodos y relaciones.

**MCP**: forma estandar para que una IA use herramientas externas.

**opencode**: la herramienta donde un agente puede usar este MCP.

## Paso 1: entrar a la carpeta del proyecto

```bash
cd nombre-de-tu-proyecto
```

## Paso 2: instalar

```bash
npm install
```

Como el proyecto no tiene dependencias runtime externas, esto debe ser rapido.

## Instalar open-context-map en otro proyecto

La forma pensada para una persona usuaria es un solo comando:

```bash
npx -y open-context-map@0.1.0 init .
```

Ese comando crea la configuracion de `opencode`, la skill, los commands, el agent y el indice inicial.

La idea es que despues no tengas que hacer pasos extra: reinicias `opencode` y la herramienta queda lista.

## Desinstalar open-context-map de un proyecto

```bash
npx -y open-context-map@0.1.0 uninstall .
```

Ese comando limpia todo lo que `init` agrego:

- el directorio `.open-context-map/`
- la entrada MCP en `opencode.json`
- los archivos `.opencode/` generados
- la entrada del `.gitignore`

## Paso 3: crear o actualizar el mapa

```bash
open-context-map index .
```

El punto `.` significa: `usa esta carpeta actual`.

Ese comando crea:

```text
.open-context-map/index.json
```

## Paso 4: buscar algo

```bash
open-context-map search "indexRepository"
```

Esto sirve para encontrar una clase, una funcion o un archivo relacionado con ese texto.

## Paso 5: ver quien llama a una funcion

```bash
open-context-map callers "indexRepository"
```

Piensalo asi: `quien usa esto`.

## Paso 6: ver que llama una funcion

```bash
open-context-map callees "indexRepository"
```

Piensalo asi: `que hace esto despues`.

## Paso 7: seguir un flujo hacia adelante

```bash
open-context-map trace "indexRepository" --depth 3
```

Esto intenta seguir la cadena de llamadas varios pasos hacia adelante.

## Paso 8: analizar el impacto de cambiar un simbolo

```bash
open-context-map impact "indexRepository" --depth 3
```

Piensalo asi: `si cambio esto, que se rompe`.

El resultado muestra todos los simbolos que llaman a `indexRepository` directa o indirectamente.

## Paso 9: crear contexto para una tarea

Para un bug:

```bash
open-context-map context "indexRepository" --type bug
```

Para un refactor:

```bash
open-context-map context "indexRepository" --type refactor
```

Para una feature:

```bash
open-context-map context "indexRepository" --type feature
```

Cuando preguntas por una clase, la herramienta intenta buscar el metodo mas util para empezar el flujo.

## Paso 10: usarlo con opencode

1. Instala en tu proyecto con `init`.
2. Abre o reinicia `opencode` en ese proyecto.
3. Pide algo como: `usa open-context-map para explicar el flujo de indexRepository`.

Mientras el MCP esta activo, el indice se actualiza solo cuando cambias archivos. No necesitas levantar otra herramienta ni una base de datos externa.

## Comandos utiles de opencode incluidos en el proyecto

En el motor hay ejemplos reales de configuracion:

- skill: usar primero el mapa antes de editar
- command `/bug-context`
- command `/explain-flow`
- subagent `context-first`

En un proyecto usuario esos archivos no se copian manualmente: los genera `open-context-map init`.

## Si algo falla

1. Vuelve a crear el indice.

```bash
open-context-map index .
```

2. Prueba una busqueda simple.

```bash
open-context-map search "indexRepository"
```

3. Ejecuta las pruebas.

```bash
npm test
```

4. Si cambiaste `opencode.json`, cierra y vuelve a abrir `opencode`.

## Idea importante

`open-context-map` no intenta reemplazar el LSP de tu editor.

Su trabajo es otro: darte un mapa sencillo del repositorio para entender de donde viene un flujo, a quien impacta un cambio y que piezas conviene leer primero.

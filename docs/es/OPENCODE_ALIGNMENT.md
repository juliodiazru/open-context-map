# Alineacion con opencode

> Idioma: Espanol
> Language: [English](../OPENCODE_ALIGNMENT.md)

Este documento explica por que `open-context-map` esta configurado de esta forma para `opencode`.

## Que se reviso

La configuracion se comprobo contra referencias publicas de `opencode` y ejemplos cercanos del ecosistema, especialmente:

- la documentacion oficial de `opencode`
- el esquema publicado de configuracion de `opencode`
- repositorios publicos que muestran la estructura esperada de archivos en `.opencode/`

La meta fue simple: seguir el formato oficial en lugar de inventar uno propio.

## Que escribe `init`

`open-context-map init` crea una entrada en `opencode.json` para un servidor MCP local.

Forma de ejemplo:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "open-context-map": {
      "type": "local",
      "command": ["pnpm", "dlx", "@juliodiazru/open-context-map@0.1.3", "mcp", "."],
      "enabled": true,
      "timeout": 15000
    }
  }
}
```

## Detalles importantes de alineacion

- `type` es `local`
- `command` es un array de strings
- `enabled` le dice a `opencode` que cargue el MCP
- `timeout` se expresa en milisegundos
- `watcher.ignore` se usa para reducir ruido de indexacion en directorios generados
- las skills viven en `.opencode/skills/<name>/SKILL.md`
- los comandos auxiliares viven en `.opencode/commands/`
- los agentes viven en `.opencode/agents/`

Estos detalles coinciden con la estructura oficial descrita en la documentacion de `opencode`.

## Por que las instrucciones generadas son cortas

La skill, los comandos auxiliares y el subagente generados son intencionalmente pequenos.

Su trabajo no es reemplazar el razonamiento.

Su trabajo es recordar al agente que haga esto en orden:

1. usar primero el mapa
2. leer los archivos reales a los que apunta el mapa
3. solo entonces tomar decisiones o editar

Eso mantiene la herramienta util sin fomentar confianza ciega en el grafo.

## Por que hace falta reiniciar

`opencode` carga la configuracion del proyecto al arrancar.

Por eso, despues de `init`, `uninstall` o cambios manuales en `opencode.json` o `.opencode/`, hace falta reiniciar.

Esto es normal en herramientas guiadas por configuracion.

## Angulo de seguridad de la integracion

La configuracion MCP generada se mantiene local.

Eso importa porque:

- no se agrega por defecto ninguna URL remota de MCP
- el comando generado no necesita pipelines de shell
- el nombre del paquete va fijado en el comando generado

Incluso asi, `opencode.json` y `.opencode/` siguen siendo configuracion de proyecto de confianza y deben revisarse como codigo.

## Que ve el usuario despues de `init`

Despues de una configuracion exitosa:

- `opencode` puede cargar el servidor MCP local
- la skill y los comandos auxiliares pasan a estar disponibles
- el servidor MCP arranca el monitor nativo de archivos
- el indice local se mantiene actualizado mientras el MCP este activo

## Limite honesto

`open-context-map` no intenta reemplazar el LSP del editor.

El LSP sigue siendo mejor para diagnosticos de lenguaje, autocompletado y navegacion exacta de simbolos.

Este proyecto resuelve otro problema: darle a `opencode` un mapa local del repositorio con llamadas entrantes, llamadas salientes, flujo e impacto.

El grafo es una ayuda, no la verdad final.

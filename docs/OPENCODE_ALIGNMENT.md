# Alineacion con opencode

Este documento explica por que `open-context-map` sigue la linea de `opencode` y buenas practicas publicas del ecosistema.

## Que se reviso

Se revisaron repositorios publicos y conocidos para confirmar el formato:

- `anomalyco/opencode` en GitHub, sobre todo su `README`, porque es la referencia publica mas visible del producto
- `Kilo-Org/kilocode`, en especial `packages/opencode/src/config/`, porque ahi esta el esquema que valida `mcp`, `watcher`, `commands` y `agents`
- `Kilo-Org/kilocode/packages/opencode/test/skill/skill.test.ts`, para confirmar la carga de skills desde `.opencode/skills/`
- `charmbracelet/crush`, como referencia cercana del formato abierto de skills y agentes

## Como queda alineado

`open-context-map init` crea un `opencode.json` con un MCP local.

Eso sigue la forma oficial:

```json
{
  "mcp": {
    "open-context-map": {
      "type": "local",
      "command": ["node", "src/cli.js", "mcp", "."],
      "enabled": true,
      "timeout": 15000
    }
  }
}
```

Puntos importantes:

- `type` es `local`
- `command` es una lista de textos
- `enabled` activa el MCP
- `timeout` evita esperas largas
- `watcher.ignore` evita ruido del indice y carpetas pesadas
- `.opencode/skills/`, `.opencode/commands/` y `.opencode/agents/` usan las rutas que `opencode` ya conoce

## Buenas practicas que se respetan

- un solo archivo `opencode.json` por proyecto
- un MCP local con comando simple y portable
- archivos de `skills`, `commands` y `agents` dentro de `.opencode/`
- instrucciones cortas y enfocadas para que el agente pida contexto antes de editar
- instalacion y desinstalacion con un solo comando
- comportamiento automatico despues de reiniciar `opencode`

## Como se ve en la practica

`open-context-map init` deja listo el proyecto para que la persona usuaria no tenga que copiar archivos a mano.

Despues:

- `opencode` carga el MCP local
- `opencode` ve la skill, los commands y el subagent
- el servidor MCP arranca el watcher nativo
- la indexacion incremental mantiene actualizado el mapa mientras trabajas

## Por que esto ayuda al problema original

El problema original dice que un LLM suele leer texto lineal y pierde el mapa mental del sistema.

Esta herramienta intenta reducir ese problema creando un grafo simple antes de editar.

En vez de mandar todo el repo al agente, entrega:

- simbolos principales
- archivos importantes
- quien llama a quien
- que se llama despues
- flujo probable
- pruebas relacionadas

## Limites honestos

Esta herramienta no compite con el LSP del editor.

El LSP sirve muy bien para autocompletado, navegacion del editor y diagnosticos por lenguaje.

`open-context-map` resuelve otro problema: dar un mapa local del repositorio, con callers, callees, impacto y flujo, sin obligarte a instalar una base de datos externa ni servicios extra.

El grafo es una ayuda, no una verdad absoluta.

Por eso la skill generada le dice al agente que use el mapa primero, pero que luego lea los archivos reales antes de editar.

## Base de conocimiento

Tambien se revisaron estudios conocidos sobre comprension de codigo para no prometer cosas irreales:

- Weiser, *Program Slicing* (IEEE TSE, 1984): respalda mirar impacto hacia atrás
- LaToza, Venolia y DeLine (ICSE, 2006): respalda seguir callers y callees para entender comportamiento
- Maalej et al. (TOSEM, 2014): respalda que la gente no entiende repositorios leyendo todo en linea
- RepoCoder (EMNLP, 2023): respalda entregar contexto estructurado en vez de tirar archivos completos al modelo

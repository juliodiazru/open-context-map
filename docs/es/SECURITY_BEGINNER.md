# Seguridad para principiantes

> Idioma: Espanol
> Language: [English](../SECURITY_BEGINNER.md)

Este documento explica el modelo de seguridad en lenguaje simple.

Se centra en una pregunta:

**Que deberias confiar, y que deberias verificar, antes de usar esta herramienta?**

## Que revisamos antes de escribir esta guia

Esta guia se alineo con documentacion publica de:

- la documentacion oficial de MCP de `opencode`
- la documentacion de npm sobre amenazas comunes del registro y mitigaciones
- la documentacion de GitHub sobre funciones de seguridad de repositorios

Estas fuentes importan porque este proyecto vive en la interseccion de tres areas sensibles: instalacion de paquetes, herramientas de IA y automatizacion de repositorios.

## Version corta

`open-context-map` esta disenado para ser una herramienta local.

- lee archivos del repositorio como texto
- no ejecuta el codigo del repositorio que analiza
- guarda su indice localmente en `.open-context-map/index.json`
- bloquea rutas fuera de la raiz seleccionada del repositorio
- intenta redactar secretos obvios antes de guardar fragmentos

Ese es un buen punto de partida, pero no elimina todo el riesgo.

## Lo que todavia necesitas confiar

Hay tres decisiones de confianza distintas.

### 1. El paquete que instalas

Usa el nombre exacto del paquete y una version fijada:

```bash
pnpm dlx @juliodiazru/open-context-map@0.1.3 init .
```

Por que importa:

- fijar la version reduce actualizaciones inesperadas
- el nombre exacto ayuda a evitar errores de typosquatting
- el comando `init` solo acepta `@juliodiazru/open-context-map` o el mismo paquete con una version explicita

### 2. El repositorio que abres en `opencode`

`opencode.json` y `.opencode/` son configuracion del proyecto.

Eso significa que deben tratarse como codigo de confianza.

Si quieres inspeccionar primero una rama o PR no confiable, desactiva la configuracion del proyecto:

```bash
OPENCODE_DISABLE_PROJECT_CONFIG=1 opencode
```

### 3. El cliente de IA que conectas

`open-context-map` mantiene el indice en local.

Sin embargo, un cliente de IA puede seguir enviando resultados de herramientas a un proveedor de modelos cuando haces una pregunta. Eso depende del cliente y del proveedor que uses, no del analizador.

## Configuraciones seguras por defecto en este proyecto

### El runtime usa solo APIs nativas de Node.js

La ruta de runtime actual evita dependencias externas en tiempo de ejecucion.

Eso reduce la superficie de cadena de suministro durante la ejecucion real de la herramienta.

Nota: los contribuidores siguen instalando dependencias de desarrollo cuando trabajan en este repositorio.

### La herramienta lee texto, no ejecuta codigo

No hace `import`, `require`, compilacion ni ejecucion del codigo que analiza.

Solo lee archivos compatibles como texto UTF-8.

### Las extensiones compatibles son explicitas

El escaner solo lee ciertos tipos de archivo fuente:

- JavaScript y TypeScript
- Python
- Go
- Java
- C#
- PHP
- Ruby
- Rust
- Kotlin
- Swift

Los archivos fuera de esa lista se omiten.

### Se omiten directorios pesados o riesgosos

Ejemplos:

- `node_modules`
- `.git`
- `dist`
- `build`
- `coverage`
- `.next`
- `.cache`
- `target`

Esto reduce ruido y tambien evita escanear directorios que normalmente son grandes o generados.

### Los archivos grandes y repos enormes tienen limites

Valores por defecto actuales:

- los archivos mayores a `350000` bytes se omiten
- el escaneo se detiene despues de `5000` archivos

Esto ayuda a evitar trabajo descontrolado y salidas demasiado grandes.

### Las rutas fuera del repo se bloquean

La herramienta resuelve rutas dentro de la raiz configurada del repositorio y rechaza rutas que intenten salir de ella.

Eso ayuda a evitar lecturas accidentales de otro proyecto o de una carpeta sensible del sistema.

### El texto que parece secreto se redacta antes de guardar fragmentos

Antes de guardar firmas y detalles de llamadas en el indice local, el analizador redacta patrones comunes como:

- `Bearer ...`
- `ghp_...`
- `github_pat_...`
- `AKIA...`
- asignaciones con nombres como `token`, `secret`, `password` o `apiKey`

Esto ayuda, pero no equivale a un secret scanning completo ni a una prevencion completa de fuga de datos.

## Que guarda la herramienta en local

El archivo principal generado es:

```text
.open-context-map/index.json
```

Ese archivo puede contener:

- nombres de simbolos
- rutas de archivos
- firmas cortas
- relaciones de llamadas entrantes y salientes
- fragmentos redactados

Ese archivo esta pensado para quedarse en local y `init` lo agrega a `.gitignore`.

## Buenos habitos para usuarios

### Prefiere comandos fijados

Bueno:

```bash
pnpm dlx @juliodiazru/open-context-map@0.1.3 init .
```

Menos seguro:

```bash
pnpm dlx @juliodiazru/open-context-map init .
```

### Revisa la configuracion generada

Despues de `init`, es razonable inspeccionar:

- `opencode.json`
- `.opencode/skills/open-context-map-first/SKILL.md`
- `.opencode/commands/bug-context.md`
- `.opencode/commands/explain-flow.md`
- `.opencode/agents/context-first.md`

### Ten mas cuidado con PRs no confiables

- usa flujos de trabajo `pull_request` para PRs no confiables
- evita `pull_request_target` si el flujo de trabajo hace checkout y ejecuta codigo del PR
- evita permisos amplios de `GITHUB_TOKEN` sin una necesidad real

## Buenos habitos para mantenedores

Como el paquete ya esta publicado, vale la pena mantener o reforzar estas medidas con el tiempo:

- npm 2FA en las cuentas mantenedoras
- revision cuidadosa de cada nueva dependencia
- `trusted publishing` y `provenance` cuando se agregue automatizacion de publicaciones
- CodeQL o un escaneo similar de codigo
- Dependabot alerts y security updates
- proteccion de ramas y revision por `CODEOWNERS` en archivos sensibles

## Comando de revision para contribuidores

Desde este repositorio, ejecuta:

```bash
pnpm run check
```

Eso ejecuta tests y una auditoria de dependencias.

## Fuentes usadas

- OpenCode MCP servers: https://opencode.ai/docs/mcp-servers/
- OpenCode config schema: https://opencode.ai/config.json
- OpenCode skills: https://opencode.ai/docs/skills/
- OpenCode commands: https://opencode.ai/docs/commands/
- OpenCode agents: https://opencode.ai/docs/agents/
- npm threats and mitigations: https://docs.npmjs.com/threats-and-mitigations
- npm registry signatures: https://docs.npmjs.com/about-registry-signatures
- npm audit documentation: https://docs.npmjs.com/auditing-package-dependencies-for-security-vulnerabilities/
- npm provenance documentation: https://docs.npmjs.com/generating-provenance-statements
- GitHub security features overview: https://docs.github.com/en/code-security/getting-started/github-security-features
- GitHub supply chain security: https://github.blog/security/supply-chain-security/

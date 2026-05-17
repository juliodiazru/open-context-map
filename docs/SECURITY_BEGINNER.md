# Seguridad para principiantes

Este proyecto nacio con seguridad como prioridad.

## Por que importa

En el ecosistema NPM han ocurrido ataques de supply chain.

Eso significa que un problema en paquetes, scripts de instalacion, tokens o CI puede terminar afectando tu proyecto.

## Decisiones de seguridad de este POC

### Sin dependencias runtime externas

La parte principal del motor usa solo APIs nativas de Node.js.

Eso no elimina todo riesgo, pero baja mucho la superficie de ataque inicial.

### Instalacion simple pero revisable

La forma objetivo sera:

```bash
npx -y open-context-map@0.1.0 init .
```

Eso sigue el patron oficial de `opencode` para MCP locales con comandos tipo `npx`, pero se recomienda fijar version y revisar el paquete antes de adoptarlo.

### No ejecuta codigo del repo analizado

El motor solo lee archivos como texto.

No hace `import` ni `require` del codigo que analiza.

### Ignora carpetas pesadas o peligrosas

No analiza por defecto carpetas como:

- `node_modules`
- `.git`
- `dist`
- `build`
- `coverage`
- `.cache`
- `target`

### Limita archivos grandes

Si un archivo supera el tamano permitido, se omite.

### Bloquea rutas fuera del repo

El MCP no deberia aceptar rutas arbitrarias fuera de la raiz configurada.

Esto evita que una llamada al MCP lea otro proyecto o una carpeta sensible por accidente.

### Limita entradas del usuario

El comando `trace` limita la profundidad maxima.

La busqueda limita la cantidad maxima de resultados.

El tipo de contexto solo acepta valores conocidos: `bug`, `refactor`, `feature` y `general`.

Esto ayuda a evitar respuestas enormes y consumo innecesario de memoria.

### Indice local separado

El resultado se guarda en:

```text
.open-context-map/index.json
```

Ese archivo esta ignorado por git.

La razon es simple: para este flujo no hace falta una base de datos externa.

Menos piezas externas tambien significa menos superficie operativa y menos pasos para instalar o desinstalar.

## Comandos de revision

Ejecuta:

```bash
npm run check
```

Eso corre pruebas y auditoria basica.

## Si un dia se publica en NPM

Conviene agregar o reforzar:

- 2FA
- trusted publishing con OIDC
- provenance
- revision de cada dependencia nueva
- CodeQL o Semgrep
- Dependabot o Renovate
- OpenSSF Scorecard

## Fuentes usadas

- OpenCode MCP servers: https://opencode.ai/docs/mcp-servers/
- OpenCode config schema: https://opencode.ai/config.json
- OpenCode skills: https://opencode.ai/docs/skills/
- OpenCode commands: https://opencode.ai/docs/commands/
- OpenCode agents: https://opencode.ai/docs/agents/
- Node.js security releases: https://nodejs.org/en/blog/vulnerability/
- NPM threats and mitigations: https://docs.npmjs.com/threats-and-mitigations
- NPM registry signatures: https://docs.npmjs.com/about-registry-signatures
- NPM audit: https://docs.npmjs.com/auditing-package-dependencies-for-security-vulnerabilities/
- NPM provenance: https://docs.npmjs.com/generating-provenance-statements
- GitHub supply chain security: https://github.blog/security/supply-chain-security/
- SLSA: https://slsa.dev/spec/v1.0/
- OpenSSF Scorecard: https://github.com/ossf/scorecard

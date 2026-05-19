# Proceso de publicacion

> Idioma: Espanol
> Language: [English](../RELEASE_PROCESS.md)

Esta guia describe un flujo practico para sacar una nueva version de este repositorio:

1. preparar la version en una rama
2. abrir y fusionar un pull request
3. crear el tag de Git
4. crear la release en GitHub
5. publicar el paquete en npm con `pnpm`

Esta escrita para el estado actual del repositorio, donde la publicacion sigue siendo manual.

## Referencias oficiales usadas

- las releases de GitHub se construyen a partir de tags y pueden crearse desde la interfaz web o con `gh release create`
- GitHub recomienda crear primero releases en borrador cuando las releases inmutables estan habilitadas
- npm exige `npm publish --access public` para paquetes publicos con scope
- `pnpm publish` soporta `--access public`, `--dry-run`, `--otp` y `--provenance`

Fuentes:

- https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases
- https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository
- https://docs.npmjs.com/creating-and-publishing-scoped-public-packages
- https://pnpm.io/cli/publish

## Antes de empezar

Asegurate de que todo esto sea cierto:

- estas trabajando desde una rama actualizada basada en `main`
- puedes abrir PRs y crear tags y releases en GitHub
- puedes publicar el paquete en npm
- `pnpm run check` pasa en local
- ya sabes cual es la siguiente version semantica que quieres publicar

## Detalle importante especifico de este repositorio

Este repositorio fija la version actual del paquete en mas de un lugar.

Como minimo, cada release debe mantener alineados estos archivos:

- `package.json`
- `src/init.js`
- `src/mcp-server.js`
- `src/cli.js`
- `test/indexer.test.js`
- los ejemplos de documentacion que mencionan la version fijada del paquete

Hoy, `src/init.js` contiene `PACKAGE_VERSION`, `src/mcp-server.js` expone `serverInfo.version`, y `src/cli.js` incluye la version en el texto de ayuda. Si cambias solo `package.json`, la configuracion generada para `opencode` y los tests quedaran desalineados.

## Flujo recomendado

## 1. Crea una rama de release

Ejemplo:

```bash
git switch -c release/v0.1.3
```

## 2. Actualiza la version en todos los lugares donde esta fijada

Actualiza la version objetivo de forma consistente en:

- `package.json`
- `src/init.js`
- `src/mcp-server.js`
- `src/cli.js`
- `test/indexer.test.js`
- los ejemplos de documentacion que fijan intencionalmente el comando de instalacion

En este proyecto, no conviene tratar la documentacion como si fuera metadato secundario del release. Forma parte directa del flujo de instalacion para usuarios.

## 3. Ejecuta las verificaciones

Ejecuta:

```bash
pnpm run check
pnpm test
```

Comprobacion extra recomendada:

```bash
pnpm pack --pack-destination /tmp/opencode-release-check
```

Despues, inspecciona lo que se publicaria.

Esto importa porque npm recomienda revisar el contenido del paquete antes de publicarlo para evitar archivos sensibles o innecesarios.

## 4. Abre el pull request

Abre un PR que contenga solo el trabajo de preparacion del release.

Ese PR deberia incluir:

- el cambio de version
- los ejemplos de documentacion sincronizados
- cualquier cambio visible para usuarios que merezca aparecer en las notas

Titulo sugerido del PR:

```text
release: v0.1.3
```

Antes de fusionarlo, confirma:

- CI en verde
- `Dependency Review` en verde
- version consistente entre codigo y documentacion
- ausencia de secretos y archivos temporales

## 5. Fusiona el PR en `main`

Fusiona solo despues de que las comprobaciones pasen.

Despues de fusionar, trae `main` actualizado a tu entorno local.

## 6. Crea el tag de Git desde `main`

Usa un tag anotado:

```bash
git switch main
git pull --ff-only
git tag -a v0.1.3 -m "v0.1.3"
git push origin v0.1.3
```

Las releases de GitHub se basan en tags, asi que el tag debe apuntar exactamente al commit que quieres publicar.

## 7. Crea la release en GitHub

Puedes hacerlo desde la interfaz web de GitHub o con `gh`.

Ejemplo con `gh`:

```bash
gh release create v0.1.3 --title "v0.1.3" --generate-notes
```

Si en el futuro el repositorio habilita releases inmutables, crea primero la release como borrador, adjunta todo lo necesario y publicala al final.

Contenido sugerido para las notas de release:

- resumen corto de cambios visibles para usuarios
- cambios de seguridad, si los hay
- cambios de documentacion, si afectan setup o modelo de confianza

## 8. Publica en npm con `pnpm`

Como este paquete tiene scope y es publico, publicalo con acceso publico explicito.

Desde la raiz del repositorio:

```bash
pnpm publish --access public
```

Variantes utiles:

```bash
pnpm publish --access public --dry-run
pnpm publish --access public --otp <codigo>
pnpm publish --access public --provenance
```

Notas:

- `--dry-run` es la comprobacion inicial mas segura
- `--otp` es util si npm exige 2FA y quieres evitar el flujo interactivo
- `--provenance` es util cuando publicas desde sistemas CI/CD compatibles

Si publicas manualmente desde tu equipo, la provenance puede no estar disponible de la misma forma que en un publish desde una CI compatible.

## 9. Verifica el paquete publicado

Despues de publicar, comprueba:

- la pagina de npm de la nueva version
- la pagina de la release en GitHub
- la lista de tags en GitHub

Comandos practicos de verificacion:

```bash
npm view @juliodiazru/open-context-map version
npm view @juliodiazru/open-context-map dist-tags
pnpm dlx @juliodiazru/open-context-map@0.1.3 init . --no-index
```

El ultimo comando es una prueba real del flujo de instalacion que vera el usuario.

## Lista minima de release

- [ ] version actualizada en `package.json`
- [ ] version actualizada en `src/init.js`
- [ ] version actualizada en `src/mcp-server.js`
- [ ] version actualizada en `src/cli.js`
- [ ] tests sensibles a la version actualizados
- [ ] ejemplos de documentacion actualizados cuando haga falta
- [ ] `pnpm run check` completo
- [ ] PR fusionado en `main`
- [ ] tag enviado al remoto
- [ ] release creada en GitHub
- [ ] `pnpm publish --access public` completado
- [ ] pagina del paquete en npm y prueba de instalacion verificadas

## Mejora sugerida a futuro

Este repo se beneficiaria de documentar o automatizar una de estas opciones:

1. un script `scripts/release-check.mjs` que valide cada lugar donde la version esta fijada
2. una checklist de release en plantillas de PR o issues
3. `trusted publishing` desde GitHub Actions con `provenance`

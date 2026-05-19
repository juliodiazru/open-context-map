# Configuracion de seguridad de GitHub para principiantes

> Idioma: Espanol
> Language: [English](../GITHUB_SECURITY_SETUP_BEGINNER.md)

Esta guia explica que ajustes de GitHub conviene activar ademas de los archivos que ya estan versionados en el repositorio.

## Lo que ya esta versionado en este repo

Estos controles ya existen dentro del repositorio:

- `CODEOWNERS` para rutas sensibles como `.github/`, `opencode.json` y `.opencode/`
- un flujo de trabajo de CI con permisos minimos y actions fijadas por SHA
- un flujo de trabajo de `dependency-review`
- `dependabot.yml`
- una plantilla de pull request con lista de verificacion de seguridad

Ese ya es un buen punto de partida, pero algunos controles importantes solo pueden activarse en la interfaz web de GitHub.

## Orden recomendado

Si quieres un orden simple, haz esto:

1. activa `Dependency graph`, `Dependabot alerts` y `Dependabot security updates`
2. activa la configuracion predeterminada de CodeQL (`CodeQL default setup`)
3. activa secret scanning y push protection si tu repo o plan lo permiten
4. protege `main`
5. revisa las politicas de GitHub Actions

## Paso 1: activa visibilidad de dependencias y alertas automaticas

Abre:

1. `Settings`
2. `Security and analysis`

Activa estas funciones si estan disponibles:

- `Dependency graph`
- `Dependabot alerts`
- `Dependabot security updates`

Por que importa:

- GitHub puede avisarte cuando una dependencia es vulnerable
- GitHub puede abrir PRs de actualizacion automaticamente
- el dependency graph ayuda a entender que hay dentro del repo

## Paso 2: activa la configuracion predeterminada de CodeQL

Para un proyecto como este, la configuracion predeterminada de GitHub (`default setup`) suele ser el punto de entrada mas simple.

Haz esto:

1. Abre el repositorio en GitHub.
2. Abre `Settings`.
3. Abre `Security and analysis` o `Advanced Security`, segun la interfaz actual de GitHub.
4. Busca `CodeQL analysis`.
5. Haz clic en `Set up`.
6. Elige `Default`.
7. Confirma.

Si la opcion no aparece, las causas mas comunes son:

- el repositorio es privado y tu plan no incluye GitHub Code Security
- GitHub Actions esta desactivado
- no tienes permisos de admin
- la organizacion gestiona este ajuste por encima del repositorio

En repositorios publicos, CodeQL suele estar disponible sin costo extra.

## Paso 3: activa secret scanning y push protection cuando esten disponibles

La documentacion de seguridad de GitHub deja un punto claro: detener secretos antes de que entren al repositorio es mejor que limpiarlos despues.

En `Settings` -> `Security and analysis`, busca funciones como:

- `Secret scanning`
- `Push protection`

Notas importantes:

- en repositorios publicos, algunas protecciones de secretos estan disponibles por defecto o gratis
- en repositorios privados, la disponibilidad puede depender de tu plan
- si tu organizacion controla estos ajustes, puede que necesites a un administrador

## Paso 4: protege la rama `main`

Si tu plan de GitHub soporta `Rulesets`, usa eso. Si no, la branch protection clasica tambien sirve.

### Opcion A: Rulesets

1. Abre `Settings`.
2. Abre `Rules`.
3. Abre `Rulesets`.
4. Crea un `Branch ruleset`.
5. Rama objetivo: `main`.

Reglas recomendadas:

- requerir pull request antes de hacer merge
- requerir al menos 1 aprobacion
- requerir revision de code owners
- requerir que pasen las comprobaciones de estado (`status checks`)
- requerir resolucion de conversaciones antes del merge
- bloquear force pushes
- bloquear eliminaciones

Reglas opcionales utiles:

- requerir commits firmados
- requerir historial lineal

### Opcion B: Branch protection clasica

1. Abre `Settings`.
2. Abre `Branches`.
3. Haz clic en `Add branch protection rule`.
4. Usa `main` como patron de rama.

Ajustes recomendados:

- requerir pull request antes de hacer merge
- requerir aprobaciones
- requerir revision de code owners
- requerir que pasen las comprobaciones de estado (`status checks`) antes del merge
- requerir resolucion de conversaciones antes del merge
- no habilitar force pushes
- no habilitar deletions

## Paso 5: revisa la politica de GitHub Actions

Abre `Settings` -> `Actions` -> `General`.

Revisa estos puntos:

1. permite solo GitHub Actions y actions de creadores confiables, si tu politica lo permite
2. exige que las actions esten fijadas a un SHA completo, si esa opcion existe
3. manten restringidos por defecto los permisos de `GITHUB_TOKEN`
4. no dejes que GitHub Actions cree o apruebe PRs salvo que haya una necesidad real
5. evita runners autoalojados (`self-hosted runners`) para PRs no confiables
6. en repos publicos, exige aprobacion al menos para contribuyentes de forks que participan por primera vez

Si no ves exactamente las mismas opciones, las razones mas comunes son:

- tu organizacion las controla a un nivel superior
- no tienes permisos de admin
- GitHub movio la opcion en la UI
- la funcion depende del plan

## Como verificar la configuracion

Despues de activar los ajustes:

1. abre un PR pequeno
2. confirma que aparecen comprobaciones como `CI` y `Dependency Review`
3. si CodeQL esta activo, confirma que tambien aparece su check
4. cambia un archivo dentro de `.github/` o `.opencode/` en un PR de prueba
5. confirma que GitHub pide revision al owner listado en `CODEOWNERS`

## Lista minima de verificacion si quieres el camino mas corto y seguro

Si no quieres activar muchas cosas a la vez, empieza por estas:

1. `Dependabot alerts` y `Dependabot security updates`
2. la configuracion predeterminada de CodeQL (`CodeQL default setup`)
3. branch protection para `main`
4. secret scanning o push protection, si estan disponibles

Con eso ya mejoras bastante la postura de seguridad del repositorio.

# Politica de seguridad

> Idioma: Espanol
> Language: [English](SECURITY.md)

## Versiones soportadas

Este proyecto todavia esta en una etapa temprana.

Se espera que las correcciones de seguridad lleguen primero a la rama actual `main`.

Para el uso empaquetado, la ultima version publicada en npm es la linea soportada.

## Como reportar una vulnerabilidad

Si este proyecto esta alojado en GitHub, reporta vulnerabilidades mediante un advisory privado de GitHub.

No publiques detalles de explotacion antes de que haya tiempo para investigar y responder.

## Diseno de seguridad

- El runtime usa solo APIs nativas de Node.js.
- El repositorio analizado se lee solo como texto UTF-8.
- La herramienta no ejecuta, importa ni requiere el codigo analizado.
- Solo se analizan extensiones fuente permitidas.
- Se omiten directorios generados o pesados comunes.
- Los enlaces simbolicos se omiten durante el recorrido del repositorio.
- Los archivos por encima del limite de tamano configurado se omiten.
- El escaneo del repositorio tiene un limite maximo de archivos.
- Las rutas fuera de la raiz configurada del repositorio se rechazan.
- Los fragmentos que parecen secretos se redactan antes de guardar firmas y detalles en el indice local.
- Los indices locales se guardan en `.open-context-map/` y git los ignora.

## Limites actuales por defecto

- extensiones fuente permitidas: `.js`, `.mjs`, `.cjs`, `.jsx`, `.ts`, `.tsx`, `.py`, `.go`, `.java`, `.cs`, `.php`, `.rb`, `.rs`, `.kt`, `.swift`
- los directorios omitidos incluyen `.git`, `node_modules`, `vendor`, `dist`, `build`, `.gradle`, `coverage`, `.next`, `.nuxt`, `.turbo`, `.cache`, `target` y `__pycache__`
- tamano maximo de archivo: `350000` bytes
- maximo de archivos analizados: `5000`

## Riesgos operativos conocidos

- `opencode.json` y `.opencode/` son superficies de configuracion del proyecto y deben tratarse como codigo de confianza.
- Para revisar una rama o PR no confiable en `opencode`, usa `OPENCODE_DISABLE_PROJECT_CONFIG=1`.
- El indice local queda guardado en disco; tratalo como datos locales generados de analisis.
- Los clientes de IA todavia pueden enviar resultados de herramientas a proveedores de modelos segun su configuracion.
- En CI, evita combinar `pull_request_target` con checkout y ejecucion de codigo del PR.

## Endurecimiento del repositorio

- Los flujos de trabajo usan `pull_request`, permisos minimos y `persist-credentials: false`.
- Las actions de los flujos de trabajo estan fijadas por SHA para reducir el riesgo de cambios inesperados en dependencias externas.
- Existe un flujo de trabajo de `dependency-review` para detectar dependencias vulnerables introducidas en PRs.
- El repositorio incluye `CODEOWNERS` para rutas sensibles como `.github/`, `opencode.json` y `.opencode/`.
- Se recomienda la configuracion predeterminada de CodeQL (`CodeQL default setup`) cuando este disponible.
- Se recomiendan Dependabot alerts y security updates.
- Se recomiendan secret scanning y push protection cuando el repositorio y el plan lo soporten.
- Hay una guia paso a paso en `docs/es/GITHUB_SECURITY_SETUP_BEGINNER.md` para aplicar esas opciones manualmente.

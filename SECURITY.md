# Politica de seguridad

## Versiones soportadas

Este proyecto sigue en etapa temprana.

Solo la rama `main` actual se considera soportada.

## Reportar una vulnerabilidad

Si este proyecto esta alojado en GitHub, abre un advisory privado de seguridad.

No publiques detalles de explotacion antes de dar tiempo a responder.

## Diseno de seguridad

- Sin dependencias runtime de NPM en este POC.
- El repositorio analizado se lee solo como texto.
- La herramienta no ejecuta el codigo analizado.
- Se omiten archivos grandes y carpetas comunes de dependencias o build.
- Los indices locales se ignoran por git.

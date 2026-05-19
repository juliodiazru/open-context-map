# Plan del proyecto

> Idioma: Espanol
> Language: [English](../PLAN.md)

Este documento explica el plan en lenguaje simple.

## Problema

Cuando una persona o una IA edita codigo, leer un solo archivo casi nunca es suficiente.

Tambien necesitas entender:

- donde empieza un flujo
- quien llama a que
- que archivos estan relacionados
- que tests pueden verse afectados
- que depende del codigo que quieres cambiar

## Objetivo

Construir una herramienta local que cree un mapa estructural del repositorio antes de editar.

Ese mapa deberia estar disponible desde:

- la terminal
- `opencode` a traves de MCP

La meta no es reemplazar la lectura normal del codigo.

La meta es hacer mas facil encontrar la estructura del repositorio.

## Que ya esta implementado

### Motor base

- proyecto Node.js
- runtime basado en APIs nativas
- CLI local
- servidor MCP local

### Grafo local

- nodos para archivos y simbolos
- relaciones de imports y llamadas
- indice local en `.open-context-map/index.json`
- reindexacion incremental cuando cambian archivos

### Funciones de analisis

- busqueda de simbolos y archivos
- quien llama a un simbolo
- a que llama un simbolo
- trazado hacia adelante
- analisis de impacto hacia atras
- paquetes de contexto para `bug`, `refactor`, `feature` y `general`

### Integracion con `opencode`

- entrada generada en `opencode.json`
- skill, comandos y subagente generados
- comando `init` para crear todo en un proyecto de usuario
- comando `uninstall` para quitar la configuracion generada

## Siguientes pasos

### Mejorar la calidad del analizador

Seguir mejorando la deteccion de simbolos y llamadas sin convertir la instalacion en una configuracion pesada.

### Mejorar la resolucion de simbolos

Distinguir mejor los metodos que comparten el mismo nombre corto en diferentes clases o archivos.

### Agregar senales de grafo de nivel mas alto

Posibles chequeos futuros utiles:

- candidatos a codigo muerto
- ciclos en el grafo de llamadas
- clases con demasiadas llamadas salientes

### Endurecer el proceso de publicaciones

El paquete ya esta publicado. El siguiente paso de madurez es reforzar el endurecimiento del proceso de publicacion, por ejemplo con:

- proteccion de cuentas mantenedoras
- trusted publishing
- provenance
- comprobaciones automaticas mas fuertes alrededor de cada publicacion

El proceso manual actual de publicacion esta documentado en `docs/es/RELEASE_PROCESS.md`.

### Mejorar con cuidado la experiencia de `opencode`

Agregar mas comandos o agentes solo cuando resuelvan un problema repetido real.

### Evaluar en repositorios reales

Probar la herramienta en mas repositorios y medir si el contexto generado realmente ayuda en tareas de edicion y revision.

## Base de conocimiento

La idea del proyecto se apoya en trabajo conocido sobre comprension de programas:

- Weiser (IEEE TSE, 1984): slicing para analisis de impacto
- LaToza, Venolia y DeLine (ICSE, 2006): seguir cadenas de llamadas ayuda a mantener el modelo mental
- Maalej et al. (TOSEM, 2014): la navegacion estructural ayuda a entender mejor el codigo que una lectura puramente lineal
- RepoCoder (EMNLP, 2023): la recuperacion estructurada puede ayudar mas en tareas de IA sobre codigo que volcar archivos completos

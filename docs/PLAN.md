# Plan del proyecto

Este documento explica el plan con lenguaje simple.

## Problema

Cuando una IA o una persona cambia codigo, no alcanza con leer un solo archivo.

Hace falta entender:

- donde empieza un flujo
- quien llama a quien
- que archivos estan relacionados
- que pruebas podrian romperse
- que pasa si cambio una pieza: que otros dependen de ella

## Objetivo

Crear una herramienta local que arme un mapa estructural del codigo antes de editar.

Ese mapa debe poder consultarse desde terminal y tambien desde `opencode` por MCP.

El LLM no deberia descubrir la arquitectura leyendo texto lineal.

El sistema deberia entregarle el camino relevante, el impacto y las relaciones reales.

Tambien debe dejar claro dos recorridos mentales muy comunes:

- ir hacia atrás desde una pieza para encontrar el origen del flujo
- ir hacia adelante desde una pieza para entender todo lo que desencadena

## Lo que ya esta implementado

### Base del motor

- proyecto Node.js minimalista
- sin dependencias runtime externas
- CLI local
- servidor MCP

### Mapa local

- nodos para archivos y simbolos
- relaciones de imports y llamadas
- indice persistido en `.open-context-map/index.json`
- reindexacion incremental cuando cambian archivos

### Analisis de grafo

- busqueda de simbolos y archivos
- callers: quien llama a un simbolo
- callees: que llama un simbolo
- trace: flujo hacia adelante desde un simbolo
- impact: flujo hacia atras, que se rompe si cambio un simbolo

### Integracion con opencode

- `opencode.json`
- skill local
- commands de ejemplo
- subagent de ejemplo
- comando `init` para generar todo en un proyecto usuario
- comando `uninstall` para limpiar todo lo que `init` agrego
- comportamiento automatico despues de reiniciar `opencode`

## Proximos pasos recomendados

### Mejor parser

Seguir mejorando el parser sin romper el principio de instalacion simple.

Si algun dia se agrega un parser mas profundo o apoyo de LSP, deberia ser transparente para la persona usuaria y no exigir pasos manuales extra.

### Mejor resolucion de simbolos

Resolver mejor metodos con el mismo nombre en clases distintas.

### Deteccion de anomalias arquitectonicas

Detectar:

- clases con demasiados metodos y demasiadas llamadas salientes
- simbolos sin callers (dead code)
- ciclos en el grafo de llamadas

### Publicacion abierta

Publicar manualmente el paquete cuando este listo, para que el uso sea:

```bash
npx -y open-context-map@0.1.0 init .
```

### Mejor experiencia en opencode

Agregar mas commands y agents especializados solo si resuelven casos repetidos reales.

### Evaluacion

Probar el proyecto con varios repos de ejemplo y medir si el contexto que genera realmente ayuda a editar mejor.

## Base de conocimiento

La idea del proyecto no sale solo de intuicion.

Se apoya en trabajos conocidos sobre comprension de programas:

- Weiser (IEEE TSE, 1984): slicing para analizar impacto
- LaToza, Venolia y DeLine (ICSE, 2006): seguir cadenas de llamadas ayuda a mantener el modelo mental
- Maalej et al. (TOSEM, 2014): la gente entiende mejor con navegacion estructural que con lectura lineal
- RepoCoder (EMNLP, 2023): para modelos de IA funciona mejor recuperar contexto estructurado que meter archivos completos

---
fase: specs
area: MATE
depende: [mate-cierre]
toca: [features/material.feature]
estado: abierto
---
# La app enseña qué partes del material no cita ninguna pieza aprobada

**Qué:** el progreso se mide por objetivos dominados, y nada mide cuánto del material se ha convertido en piezas. Si la IA saca pocos objetivos de un documento largo, la persona los domina y la app da el dominio por terminado aunque muchas páginas no tengan ninguna pieza. Cada pieza aprobada ya guarda su fuente (documento, página y fragmento), así que la cobertura sale de ahí sin juicio de la IA: por documento, qué páginas no cita ninguna pieza aprobada.

**Hecho cuando:** los escenarios dicen dónde ve la persona la cobertura de cada documento, qué cuenta como página cubierta, que las páginas sin texto (ver specs-paginas-sin-texto) se distinguen de las no cubiertas, y que la persona puede descartar a conciencia una página (índice, bibliografía, portada) para que no cuente como hueco; y `make check-specs` está en verde.

**Leer primero:** features/material.feature (regla «Lo aprobado conserva su fuente», MATE-2.1 y la cabecera: «Las sesiones solo leen contenido/<dominio>.json»); docs/investigacion.md §4 (Fase 1: medir con pruebas, no con autoevaluación).

## Decisiones de partida (extrapolación del autor)

- **Solo cuentan las piezas aprobadas.** Un borrador no cubre nada, igual que no entra en las sesiones.
- **La cobertura no cambia el progreso.** Es información para la persona y para decidir si pedir más borradores; el dominio y la fase los siguen decidiendo las pruebas, como la confianza en CALI.

## Por decidir

- **Granularidad.** ¿Página entera cubierta con una sola cita, o se mira qué parte de la página citan los fragmentos? La página es más simple y probablemente suficiente para ver huecos grandes.
- **Qué piezas cuentan.** ¿Solo ítems, o también objetivos, ejemplos resueltos y tareas?
- **Material escrito a mano.** No lleva fuente (MATE): no cubre ni deja huecos.

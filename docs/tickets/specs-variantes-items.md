---
fase: specs
area: MATE
depende: [mate-cierre]
toca: [features/material.feature, features/planificador.feature, features/dominio.feature, config/peticion-ia.md]
estado: abierto
---
# Los problemas se repasan con variantes, no siempre con el mismo enunciado

**Qué:** hoy un problema se repasa siempre con el mismo ítem, y con formatos cerrados es fácil memorizar la respuesta («la C») en vez del procedimiento. Especificar variantes de un mismo ítem (mismo objetivo y procedimiento, otros datos o contexto), redactadas por la IA desde el material y aprobadas una a una como el resto, que roten en los repasos. Los hechos no cambian: FSRS repite el mismo ítem a propósito.

**Hecho cuando:** los escenarios dicen cómo se piden las variantes, cómo se aprueban, cómo rotan en los repasos y cómo cuentan para el criterio de dominio (último intento de la familia, no de cada variante), y `make check-specs` está en verde.

**Leer primero:** features/material.feature (MATE-2, «Pedir más reservados» MAST-6.12/6.13, revisión una a una); features/planificador.feature (repaso por «fracción × horizonte»); features/dominio.feature («Un objetivo no se evalúa hasta que todos sus ítems no reservados tienen un intento»).

## Dato que lo justifica (plan §1, principio 7)

Antes de especificarlo, mirar en los CSV la diferencia entre el acierto en ítems practicados y en reservados del mismo objetivo. Si los practicados están dominados y los reservados fallan, es señal de memorización de respuestas. Sin ese dato, el ticket queda en `[DECISIÓN PENDIENTE]`.

## Preguntas abiertas

- ¿Las variantes se piden por lotes (al dominar el objetivo, o cuando el dato anterior lo pida) o se generan siempre? La revisión una a una no escala con generación continua.
- ¿Una variante nueva de un objetivo dominado le quita el dominio hasta que se responde?
- ¿Cómo se distingue una variante de un reservado, que también es variante de un ítem (MATE-2)?

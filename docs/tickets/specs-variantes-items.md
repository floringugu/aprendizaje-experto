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

## Cada variante lleva su propio historial (añadido el 13-11-2026)

La idea sale de LearnHarness (github.com/amosblomqvist/learnharness, AGPL-3.0; se toma la idea, no el código). Su plugin de tarjetas ordena el contenido como proposición → pista → tarjeta: cada forma distinta de preguntar lo mismo es una tarjeta aparte, «para que sus resultados se puedan distinguir», y todas comparten la proposición, no la identidad.

Aplicado aquí: una familia de variantes comparte el objetivo y el procedimiento, pero cada variante guarda sus propios intentos.

- **Registro.** Los CSV dicen qué variante se respondió, además de la familia. Sin eso no se puede ver si una variante concreta se falla siempre (mal redactada, o un contexto que la persona no domina).
- **Dominio.** Sigue contando el último intento de la familia, como dice «Hecho cuando».
- **Repaso.** Por decidir abajo: un solo calendario por familia o uno por variante.

Si este ticket cambia los CSV, `features/instrumentacion.feature` se añade a su `toca` en el mismo PR.

## Preguntas abiertas

- ¿El repaso espaciado lleva un calendario por familia (la variante que toca rota) o uno por variante? Uno por variante multiplica los repasos; uno por familia no distingue la variante que flojea.

- ¿Las variantes se piden por lotes (al dominar el objetivo, o cuando el dato anterior lo pida) o se generan siempre? La revisión una a una no escala con generación continua.
- ¿Una variante nueva de un objetivo dominado le quita el dominio hasta que se responde?
- ¿Cómo se distingue una variante de un reservado, que también es variante de un ítem (MATE-2)?

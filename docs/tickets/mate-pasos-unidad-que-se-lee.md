---
fase: aceptacion
area: MATE
depende: [specs-unidad-que-se-lee]
toca: [tests/aceptacion/pasos/redaccion-rechazos.ts, tests/aceptacion/soporte/escenario-material.ts, tests/aceptacion/soporte/contenido.ts, config/alcance.json]
estado: abierto
---
# El escenario de la unidad ilegible del borrador de MATE tiene pasos y falla en rojo

**Qué:** escribe los pasos de MATE-2.14: que la IA entregue un ítem numérico de O1 con unidades que, sin espacios, empiezan por dígito, coma o punto («1/s», «.5 m», «,5 m»), o con una forma buena y otra mala, y que el borrador no lo tenga y la aplicación diga que ha apartado 1 pieza porque sus unidades no se pueden leer detrás de un número. Reutiliza los pasos de MATE-2.12 y las constructoras de `contenido.ts`.

**Hecho cuando:** MATE-2.14 falla por una comprobación y no por un paso sin definir; los demás escenarios de MATE siguen en verde; `escenarios_en_rojo.MATE` de `config/alcance.json` lista MATE-2.14 y `make check-aceptacion` da verde.

**Leer primero:** `features/material.feature` (MATE-2.12 a 2.14); `tests/aceptacion/pasos/redaccion-rechazos.ts`; `tests/aceptacion/soporte/escenario-material.ts` y `contenido.ts`; el plan §6, «Pendientes de un área cerrada»; el ticket `docs/tickets/mate-pasos-num-borrador.md`, que hizo lo mismo para MATE-2.12 y 2.13.

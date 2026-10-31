---
fase: impl
area: TARE
depende: [PANT, HORA]
toca: [src/aplicacion/tareas.ts, src/aplicacion/orden-de-las-tareas.ts, src/aplicacion/nivel-experto.ts, src/aplicacion/sesiones.ts, src/aplicacion/aplicacion.ts, src/dominio/tareas.ts, src/interfaz/, tests/unidad/tareas*.test.ts, tests/unidad/orden-de-las-tareas.test.ts, config/alcance.json, docs/areas/TARE.md, docs/deuda-diseno.md]
estado: abierto
---
# TARE: tareas representativas

**Qué:** grueso: la primera conversación lo divide en tickets (plan §6, «Tickets») y este se estrecha o pasa a `descartado`. Implementa `pedirTarea`, `consultarTareas`, `registrarEvaluacionExterna` y `consultarEvaluacionTarea`, hoy `sinImplementar` (`src/aplicacion/aplicacion.ts:71-74`), y sus pantallas sobre las de PANT. Incluye el escenario que era MATE-6.3 (ticket `mate-tarea-a-tare`). Depende también de HORA, que la tabla de partida no ponía: TARE-3.4 (`features/tareas.feature:130`) usa «que la persona ha registrado 20000 horas de práctica focalizada», de `tests/aceptacion/pasos/horas.ts:130`, que llama a `registrarHoras`, de HORA.

**Hecho cuando:** `make cerrar-area A=TARE` da verde y el área está cerrada (plan §16), con `make check` en verde.

**Leer primero:** `features/tareas.feature`; la fila «Evaluación externa» del plan §0 (`docs/plan.md:43`); `tests/aceptacion/pasos/tareas.ts`, `nivel-experto.ts` y `borradores-en-sesiones.ts`; `tests/aceptacion/soporte/evaluaciones.ts`; `src/aplicacion/tareas.ts`; `docs/areas/PANT.md`.

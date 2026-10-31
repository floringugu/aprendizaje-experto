---
fase: impl
area: INTE
depende: [PANT]
toca: [src/aplicacion/sesiones.ts, src/aplicacion/respuestas.ts, src/aplicacion/practica.ts, src/aplicacion/intercalado.ts, src/dominio/intercalado.ts, src/interfaz/, tests/unidad/intercalado*.test.ts, config/alcance.json, docs/areas/INTE.md, docs/deuda-diseno.md]
estado: abierto
---
# INTE: intercalado

**Qué:** grueso: la primera conversación lo divide en tickets (plan §6, «Tickets») y este se estrecha o pasa a `descartado`. El intercalado de las sesiones, y sus pantallas sobre las de PANT. Comparte `src/interfaz/` con AYUD, CALI, HORA y TARE, y `sesiones.ts` o `respuestas.ts` con algunas: el solape de `toca` pone esas áreas en serie.

**Hecho cuando:** `make cerrar-area A=INTE` da verde y el área está cerrada (plan §16), con `make check` en verde.

**Leer primero:** `features/intercalado.feature`; la fila «Lo que entra del informe» del plan §0 (`docs/plan.md:70`, «Intercalado de un objetivo nuevo»); `tests/aceptacion/pasos/intercalado.ts`; `src/dominio/turnos.ts`; `docs/areas/PANT.md`.

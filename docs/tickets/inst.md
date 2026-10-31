---
fase: impl
area: INST
depende: [AYUD, INTE, CALI, HORA, TARE, BUCL]
toca: [src/aplicacion/exportacion.ts, src/aplicacion/csv.ts, src/aplicacion/aplicacion.ts, src/interfaz/, tests/unidad/exportacion*.test.ts, tests/unidad/csv*.test.ts, config/alcance.json, docs/areas/INST.md, docs/deuda-diseno.md]
estado: abierto
---
# INST: instrumentación y exportación a CSV

**Qué:** grueso: la primera conversación lo divide en tickets (plan §6, «Tickets») y este se estrecha o pasa a `descartado`. Es el último: exporta los eventos de todas las áreas. Implementa `listarExportaciones`, hoy `sinImplementar` (`src/aplicacion/aplicacion.ts:77`), y su pantalla sobre las de PANT. Depende también de INTE, que la tabla de partida no ponía: `features/instrumentacion.feature:51-54` exporta el contexto de los ítems de una sesión intercalada.

**Hecho cuando:** `make cerrar-area A=INST` da verde y el área está cerrada (plan §16), con `make check` en verde.

**Leer primero:** `features/instrumentacion.feature`; `tests/aceptacion/pasos/instrumentacion.ts`; `src/aplicacion/exportacion.ts` y `csv.ts`; `docs/areas/PANT.md`.

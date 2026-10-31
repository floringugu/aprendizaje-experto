---
fase: impl
area: CALI
depende: [PANT, BUCL]
toca: [src/aplicacion/respuestas.ts, src/aplicacion/calibracion.ts, src/dominio/calibracion.ts, src/interfaz/, tests/unidad/calibracion*.test.ts, config/alcance.json, docs/areas/CALI.md, docs/deuda-diseno.md]
estado: abierto
---
# CALI: calibración

**Qué:** grueso: la primera conversación lo divide en tickets (plan §6, «Tickets») y este se estrecha o pasa a `descartado`. La calibración de la confianza, y sus pantallas sobre las de PANT. Depende también de BUCL, que la tabla de partida no ponía: la regla CALI-2, «El bucle semanal compara la confianza con el acierto» (`features/calibracion.feature:40`), ejecuta el bucle semanal con `ejecutarBucle` (`tests/aceptacion/soporte/acciones.ts:196-197`), que es `sinImplementar` (`src/aplicacion/aplicacion.ts:67`) y de BUCL, y `tests/aceptacion/pasos/calibracion.ts:19-21` lee su resultado. La alternativa es que CALI implemente esa parte de `ejecutarBucle` (`src/aplicacion/bucle.ts`): entonces se quita BUCL de `depende`, `bucl` pasa a depender de CALI y los dos tickets añaden `src/aplicacion/bucle.ts` y `aplicacion.ts` a `toca`. Lo decide el dueño al abrir este ticket.

**Hecho cuando:** `make cerrar-area A=CALI` da verde y el área está cerrada (plan §16), con `make check` en verde.

**Leer primero:** `features/calibracion.feature`; `tests/aceptacion/pasos/calibracion.ts`; `tests/aceptacion/soporte/acciones.ts` (`ejecutarBucleSemanal`); `src/aplicacion/bucle.ts`; `docs/areas/PANT.md`.

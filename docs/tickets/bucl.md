---
fase: impl
area: BUCL
depende: [PANT, TARE]
toca: [src/aplicacion/bucle.ts, src/dominio/bucle.ts, src/aplicacion/aplicacion.ts, src/interfaz/, tests/unidad/bucle*.test.ts, config/alcance.json, docs/areas/BUCL.md, docs/deuda-diseno.md]
estado: abierto
---
# BUCL: bucle semanal

**Qué:** grueso: la primera conversación lo divide en tickets (plan §6, «Tickets») y este se estrecha o pasa a `descartado`. Implementa `abrirSesion`, `ejecutarBucle` y `terminarBucle`, hoy `sinImplementar` (`src/aplicacion/aplicacion.ts:66-68`), y sus pantallas sobre las de PANT. Sigue el orden de partida del plan (fila «Orden de la etapa 4», `docs/plan.md:48`). CALI depende de este ticket por `ejecutarBucle` (ver `docs/tickets/cali.md`).

**Hecho cuando:** `make cerrar-area A=BUCL` da verde y el área está cerrada (plan §16), con `make check` en verde.

**Leer primero:** `features/bucle.feature`; las filas «Ayuda adaptativa» y «Reintroducir la ayuda» del plan §0 (`docs/plan.md:27` y `:38`); `tests/aceptacion/pasos/bucle.ts`; `tests/aceptacion/soporte/acciones.ts` (`ejecutarBucleSemanal` y `cerrarBucleSemanal`); `src/aplicacion/bucle.ts`; `docs/areas/PANT.md`.

---
fase: impl
area: AYUD
depende: [PANT]
toca: [src/aplicacion/sesiones.ts, src/aplicacion/respuestas.ts, src/aplicacion/practica.ts, src/aplicacion/aplicacion.ts, src/aplicacion/ayuda.ts, src/dominio/ayuda.ts, src/interfaz/, tests/unidad/ayuda*.test.ts, config/alcance.json, docs/areas/AYUD.md, docs/deuda-diseno.md]
estado: abierto
---
# AYUD: ayuda adaptativa y su retirada

**Qué:** grueso: la primera conversación lo divide en tickets (plan §6, «Tickets») y este se estrecha o pasa a `descartado`. Implementa `estudiarEjemplo`, hoy `sinImplementar` (`src/aplicacion/aplicacion.ts:60`), y añade sus pantallas a las de PANT. Comparte `src/interfaz/` con INTE, CALI, HORA y TARE, y `sesiones.ts` o `respuestas.ts` con algunas: el solape de `toca` pone esas áreas en serie.

**Hecho cuando:** `make cerrar-area A=AYUD` da verde y el área está cerrada (plan §16), con `make check` en verde.

**Leer primero:** `features/ayuda.feature`; las filas «Ayuda adaptativa» y «Reintroducir la ayuda» del plan §0 (`docs/plan.md:27` y `:38`); `tests/aceptacion/pasos/ayuda.ts`; `docs/areas/PANT.md`.

---
fase: impl
area: HORA
depende: [PANT]
toca: [src/aplicacion/horas.ts, src/dominio/horas.ts, src/aplicacion/aplicacion.ts, src/interfaz/, tests/unidad/horas*.test.ts, config/alcance.json, docs/areas/HORA.md, docs/deuda-diseno.md]
estado: abierto
---
# HORA: registro de horas

**Qué:** grueso: la primera conversación lo divide en tickets (plan §6, «Tickets») y este se estrecha o pasa a `descartado`. Implementa `registrarHoras` y `consultarHoras`, hoy `sinImplementar` (`src/aplicacion/aplicacion.ts:69-70`), y sus pantallas sobre las de PANT. Comparte `src/interfaz/` con AYUD, INTE, CALI y TARE: el solape de `toca` pone esas áreas en serie.

**Hecho cuando:** `make cerrar-area A=HORA` da verde y el área está cerrada (plan §16), con `make check` en verde.

**Leer primero:** `features/horas.feature`; `tests/aceptacion/pasos/horas.ts`; `src/aplicacion/horas.ts`; `docs/areas/PANT.md`.

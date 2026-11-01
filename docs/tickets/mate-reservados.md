---
fase: impl
area: MATE
depende: [mate-pasos-reservados]
toca: [src/aplicacion/formato-contenido.ts, src/aplicacion/contenido.ts, src/aplicacion/puertos.ts, src/aplicacion/material.ts, src/aplicacion/material-guardado.ts, src/aplicacion/mesa-guardada.ts, src/aplicacion/redaccion*.ts, src/aplicacion/avisos-de-reservados.ts, src/aplicacion/revision.ts, src/aplicacion/revision-del-material.ts, src/aplicacion/aplicacion.ts, tests/unidad/formato-contenido*.ts, tests/unidad/redaccion*.ts, tests/unidad/avisos-de-reservados*.ts, tests/unidad/revision*.ts, tests/unidad/material.test.ts, tests/unidad/material-guardado.test.ts, tests/unidad/material-dominio.test.ts, config/alcance.json, docs/areas/MATE.md]
estado: hecho
---
# Los reservados en MATE, con la redacción del borrador

**Qué:** el campo `reservado` de un ítem, `pedirMasReservados` y los avisos de la revisión, con la firma aprobada en «### Reservados (etapa 3)» de `docs/areas/MATE.md`. Incluye `redactarBorrador`, que sigue `sinImplementar` (`src/aplicacion/aplicacion.ts:42`): MATE-2.8 y 2.9 redactan un borrador, y `pedirMasReservados` comparte cuerpo con él. La tabla de partida no lo nombraba; si sale grande, divide el ticket y haz `redactarBorrador` primero.

**Hecho cuando:** MATE-2.8 a 2.11, 3.6, 3.7 y 4.12 pasan, y los demás de MATE que fallaban por `redactarBorrador`; sus IDs salen de `escenarios_en_rojo` en `config/alcance.json`, y `make check` da verde.

**Leer primero:** «### Reservados (etapa 3)» y «Cómo funciona por dentro» (el paso 4, «Redactar»), en `docs/areas/MATE.md`; `features/material.feature` (las reglas MATE-2 y MATE-3, y 4.12); `tests/aceptacion/pasos/reservados.ts`, del ticket `mate-pasos-reservados`; `src/aplicacion/formato-contenido.ts` y `revision.ts`.

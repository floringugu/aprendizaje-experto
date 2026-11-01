---
fase: aceptacion
area: MATE
depende: [mate-reservados]
toca: [tests/aceptacion/soporte/escenario-material.ts]
estado: hecho
---
# Los pasos de los reservados usan los tipos de `src/`

**Qué:** los pasos de MATE declaran como opcionales en `tests/aceptacion/soporte/escenario-material.ts` lo que la aplicación no tenía (`RevisionConAvisos`, `PiezaConReservado`, `PedirMasReservados`, `AplicacionConReservados`) y lo comprueban en tiempo de ejecución con `!== undefined`. Desde el carril `mate-reservados`, `src/` trae `Revision.avisos`, `PiezaPendiente.reservado` y `Aplicacion.pedirMasReservados` obligatorios; el PR #24 los dejó opcionales con `Pick` y `Omit` para que el lint pasara antes y después de ese carril. Este ticket cambia esos tipos por los de `src/` y quita las comprobaciones que ya garantiza el tipo, como pedía «Cómo los steps van por delante de la interfaz» en `docs/areas/MATE.md`.

**Hecho cuando:** `escenario-material.ts` no declara ninguno de esos cuatro tipos ni comprueba `avisos`, `reservado` o `pedirMasReservados` contra `undefined`; MATE-2.10, 2.11, 3.6, 3.7 y 4.12 siguen pasando, y `make check-aceptacion` da verde.

**Leer primero:** `tests/aceptacion/soporte/escenario-material.ts:40-60` y `:285-315`; `Revision` y `PiezaPendiente` en `src/aplicacion/revision.ts`; `pedirMasReservados` en `src/aplicacion/material.ts`.

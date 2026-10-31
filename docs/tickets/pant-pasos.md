---
fase: aceptacion
area: PANT
depende: [pant-mecanismo]
toca: [tests/aceptacion/pasos/pantallas.ts, tests/aceptacion/soporte/, config/alcance.json, docs/areas/PANT.md]
estado: abierto
---
# Pasos de PANT

**Qué:** los pasos de `features/pantallas.feature`, que hoy no tiene ninguno, con la forma de probar las pantallas que fija el «Mecanismo» de `docs/areas/PANT.md`. Si esa forma pide una dependencia nueva, entra aquí, con `package.json` y `package-lock.json` en `toca`.

**Hecho cuando:** todos los escenarios de PANT fallan de verdad (ni pendientes, ni saltados, ni en verde) y `make check-aceptacion` da verde.

**Leer primero:** el «Mecanismo» de `docs/areas/PANT.md`; `features/pantallas.feature`; `tests/aceptacion/soporte/mundo.ts`.

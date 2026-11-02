---
fase: aceptacion
area: MAST
depende: [mast-cierre, specs-reaprendizaje-sucesivo]
toca: [tests/aceptacion/pasos/dominio.ts, tests/aceptacion/soporte/, config/alcance.json, docs/areas/MAST.md]
estado: abierto
---
# Pasos de los reintentos en MAST (MAST-1.2, 1.8 y 4.2)

**Qué:** los pasos de MAST-1.8 y MAST-4.2, que hoy no tienen ninguno, y el cambio de MAST-1.2 («acertó I1 en su segundo intento, en una sesión posterior»): el dominio cuenta el primer intento de cada sesión y no los reintentos de la misma (RECU-6). Esos tres IDs son los de `escenarios_en_rojo.MAST` en `config/alcance.json`; el resto de MAST sigue en verde. Depende de `mast-cierre` para que el área esté cerrada antes de abrirle pendientes.

**Hecho cuando:** MAST-1.2, 1.8 y 4.2 fallan de verdad (ni pendientes, ni saltados, ni en verde), los demás escenarios de MAST siguen en verde y `make check-aceptacion` da verde.

**Leer primero:** `features/dominio.feature` (cabecera, MAST-1.2, MAST-1.8 y MAST-4.2); `docs/areas/MAST.md`; `tests/aceptacion/pasos/dominio.ts`.

## Detalle

- MAST-1.2 ya pasaba: el paso nuevo «en una sesión posterior» obliga a distinguir las sesiones en el soporte de los pasos.
- Un reintento se registra con el contexto `reintento` (RECU-6, INST-1.3): el paso de MAST-1.8 y el de MAST-4.2 pueden apoyarse en el soporte de `recu-pasos-reintentos` si se hizo antes.

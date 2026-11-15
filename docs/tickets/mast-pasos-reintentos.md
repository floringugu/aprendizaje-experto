---
fase: aceptacion
area: MAST
depende: [specs-reaprendizaje-sucesivo]
toca: [tests/aceptacion/pasos/dominio.ts, tests/aceptacion/soporte/acciones.ts, config/alcance.json, docs/areas/MAST.md, docs/tickets/mast-reintentos.md]
estado: hecho
---
# Pasos de los reintentos en MAST (MAST-1.2, 1.8 y 4.2)

**Qué:** los pasos de MAST-1.8 y MAST-4.2, que hoy no tienen ninguno, y el cambio de MAST-1.2 («acertó I1 en su segundo intento, en una sesión posterior»): el dominio cuenta el primer intento de cada sesión y no los reintentos de la misma (RECU-6). Esos tres IDs son los de `escenarios_en_rojo.MAST` en `config/alcance.json`; el resto de MAST sigue en verde.

**Hecho cuando:** MAST-1.8 y 4.2 fallan de verdad (ni pendientes, ni saltados, ni en verde), MAST-1.2 tiene todos sus pasos y pasa (ver «Detalle»), los demás escenarios de MAST siguen en verde y `make check-aceptacion` da verde.

**Leer primero:** `features/dominio.feature` (cabecera, MAST-1.2, MAST-1.8 y MAST-4.2); `docs/areas/MAST.md`; `tests/aceptacion/pasos/dominio.ts`.

## Detalle

- MAST-1.2 ya pasaba: el paso nuevo «en una sesión posterior» obliga a distinguir las sesiones en el soporte de los pasos.
- Un reintento se registra con el contexto `reintento` (RECU-6, INST-1.3): el paso de MAST-1.8 y el de MAST-4.2 pueden apoyarse en el soporte de `recu-pasos-reintentos` si se hizo antes.
- **MAST-1.2 pasa y sale de `escenarios_en_rojo` (15-11-2026).** El criterio pedía que fallara, pero con su paso nuevo no puede fallar de verdad: el intento de la sesión posterior es el primero de su sesión y a la vez el último del ítem, y la aplicación ya cuenta el último. Sus «Entonces» sí comprueban algo (el 85 % y el dominio; fallarían si contara el primer intento), así que queda en verde como regresión. Hacerlo fallar habría exigido un fallo inventado en los pasos.
- **Sin `mast-cierre` (decisión del dueño, 15-11-2026):** se hizo en el carril de `mast-pasos-fase-avanzada`, en el mismo PR, antes de cerrar el área. El `toca` se estrechó a los ficheros que cambian, para no solaparse con `recu-aceptacion-item-numerico`.
- El soporte del reintento (`reintentar`, en `tests/aceptacion/soporte/acciones.ts`) queda para `recu-pasos-reintentos`.

---
fase: impl
area: MAST
depende: [mast-pasos-transferencia, mast-pasos-borrador, mate-reservados]
toca: [src/dominio/fases.ts, src/dominio/criterio-dominio.ts, src/dominio/transferencia.ts, src/aplicacion/criterio-dominio.ts, src/aplicacion/practica.ts, src/aplicacion/respuestas.ts, tests/unidad/fases.test.ts, tests/unidad/criterio-dominio.test.ts, tests/unidad/transferencia.test.ts, config/alcance.json, docs/areas/MAST.md]
estado: abierto
---
# La transferencia y los casos nuevos en MAST

**Qué:** la transferencia (MAST-6.7 a 6.14), la prueba de retención sin ítems del borrador (MAST-7.4, que llegó de MATE-6.1 con el ticket `mate-sesiones-a-plan-inte`: la sesión de tipo `retencion` es de este ticket) y los casos nuevos (MAST-8.1 a 8.6), con el campo `reservado` del formato del contenido, que añade el ticket `mate-reservados`: un ítem reservado se presenta una sola vez, sin respuesta ni feedback, y sirve para pasar a la fase avanzada.

**Hecho cuando:** los 15 escenarios pasan, salen de `escenarios_en_rojo` en `config/alcance.json` y `make check` da verde.

**Leer primero:** `features/dominio.feature` (MAST-6.7 a 6.14, MAST-7.4 y MAST-8); `docs/areas/MAST.md`; los pasos del ticket `mast-pasos-transferencia`; `src/dominio/fases.ts` y `src/aplicacion/criterio-dominio.ts`.

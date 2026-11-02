---
fase: aceptacion
area: MAST
depende: []
toca: [tests/aceptacion/pasos/prepreguntas.ts, tests/aceptacion/pasos/exploracion.ts, tests/aceptacion/soporte/contenido.ts, config/alcance.json, docs/areas/MAST.md]
estado: abierto
---
# Pasos de las prepreguntas en MAST (MAST-1.6 y 1.7)

**Qué:** los pasos de MAST-1.6 y 1.7: una prepregunta no cuenta como intento del ítem, y el intento posterior sí cuenta. Los añadió a `features/dominio.feature` el ticket `specs-prepreguntas-intermedio` (AYUD-8) y ningún ticket les dio pasos, así que `make cerrar-area A=MAST` falla con dos escenarios sin definir. También va aquí `escenarios_en_rojo` de MAST en `config/alcance.json`, con esos dos IDs.

**Hecho cuando:** MAST-1.6 y 1.7 fallan de verdad (ni pendientes, ni saltados, ni en verde), `escenarios_en_rojo` de MAST lista justo esos dos IDs, el resto de MAST sigue pasando y `make check-aceptacion` da verde.

**Leer primero:** `features/dominio.feature:77-94` (MAST-1.6 y 1.7) y `:59-75` (MAST-1.4 y 1.5, el intento de exploración); `tests/aceptacion/pasos/exploracion.ts`, el modelo de estos pasos; `features/ayuda.feature:475` (regla AYUD-8); `docs/areas/MAST.md`, «Transferencia y exploración».

## Detalle

- Lo encontró la conversación de `mast-cierre` (02-11-2026): `make cerrar-area A=MAST` da 66 escenarios en verde y 2 sin definir, MAST-1.6 y 1.7.
- Con la exploración, los pasos responden con el contexto `exploracion` de `ContextoRespuesta`. Aquí hace falta un contexto de prepregunta que aún no existe en `src/aplicacion/sesiones.ts`. Se declara en los pasos y se apunta en `docs/areas/MAST.md` como interfaz que piden los pasos, igual que hizo `mast-pasos-transferencia` con `exploracion`.
- «20 ítems de tipo «hecho» con opciones» son los H1 a H20 de O4. AYUD-8 pregunta como prepreguntas los hechos con opciones (`features/ayuda.feature:231`). El formato del contenido ya admite `opciones` (`src/aplicacion/contenido.ts:19`).
- Los pasos de las prepreguntas de AYUD-8, BUCL-2.7, CALI-2.5 y CALI-4.9 no son de este ticket. Si alguno comparte frase con estos, que la reutilice cuando le toque.

---
fase: impl
area: MAST
depende: [mast-pasos-prepreguntas]
toca: [src/aplicacion/sesiones.ts, src/aplicacion/estado.ts, src/aplicacion/respuestas.ts, config/alcance.json, docs/areas/MAST.md]
estado: abierto
---
# Una prepregunta no cuenta como intento del ítem en MAST (MAST-1.6 y 1.7)

**Qué:** que la respuesta a una prepregunta no cuente como intento del ítem para el dominio, como ya pasa con el intento de exploración (MAST-1.4 y 1.5), y que el intento posterior sí cuente como el primero. Solo la parte de MAST: presentar las prepreguntas es de AYUD (AYUD-8).

**Hecho cuando:** MAST-1.6 y 1.7 pasan, salen de `escenarios_en_rojo` en `config/alcance.json` y `make check` da verde.

**Leer primero:** `features/dominio.feature:77-94` (MAST-1.6 y 1.7); los pasos del ticket `mast-pasos-prepreguntas` y lo que apuntó en `docs/areas/MAST.md`; `src/aplicacion/estado.ts:115-125` (`ultimoIntentoDeCadaItem`, que ya deja fuera la exploración); `src/aplicacion/sesiones.ts:9` (`ContextoRespuesta`).

## Detalle

- Lo encontró la conversación de `mast-cierre` (02-11-2026), que no puede cerrar MAST con estos dos escenarios sin definir.
- Probablemente baste con añadir el contexto a `ContextoRespuesta` y dejarlo fuera, junto a `exploracion`, en `ultimoIntentoDeCadaItem` sin contexto. Si los pasos piden más (`respuestas.ts`, por ejemplo), se añade a `toca` en el mismo PR.
- Hoy ningún test unitario prueba que la exploración no cuente: solo la aceptación lo hace. Si se añade un test unitario, su fichero va a `toca`.

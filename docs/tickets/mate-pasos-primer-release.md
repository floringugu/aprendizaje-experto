---
fase: aceptacion
area: MATE
depende: [specs-mate-primer-release]
toca: [tests/aceptacion/pasos/material.ts, tests/aceptacion/pasos/redaccion.ts, tests/aceptacion/soporte/pdf.ts, tests/aceptacion/soporte/escenario-material.ts, config/alcance.json]
estado: abierto
---
# Los escenarios de las páginas sin texto y de la página web tienen pasos y fallan en rojo

**Qué:** los pasos de los escenarios que `specs-mate-primer-release` añade o cambia en `features/material.feature`: añadir un PDF con todas o con algunas páginas sin texto y, si specs decide redactar desde una página web, su escenario de MATE-2. MATE está cerrada: esos escenarios son sus pendientes, los de `escenarios_en_rojo.MATE` de `config/alcance.json`, y el resto del área sigue en verde. Hace falta un PDF de prueba con páginas sin capa de texto, en `tests/aceptacion/soporte/pdf.ts`.

**Hecho cuando:** `make check-aceptacion` da verde en el carril (fase aceptacion, área MATE): los escenarios de `escenarios_en_rojo.MATE` fallan por una comprobación y no por un paso sin definir, y los demás escenarios de MATE siguen en verde.

**Leer primero:** `docs/tickets/specs-mate-primer-release.md` y los escenarios que dejó en `features/material.feature`; `tests/aceptacion/pasos/material.ts` y `redaccion.ts`; `tests/aceptacion/soporte/pdf.ts` y `escenario-material.ts`; el plan §6, «Pendientes de un área cerrada».

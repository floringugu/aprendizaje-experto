---
fase: aceptacion
area: MATE
depende: [specs-item-numerico-borrador, recu-aceptacion-item-numerico]
toca: [tests/aceptacion/pasos/redaccion-rechazos.ts, tests/aceptacion/soporte/escenario-material.ts, tests/aceptacion/soporte/contenido.ts, config/alcance.json]
estado: abierto
---
# Los escenarios del ítem numérico del borrador de MATE tienen pasos y fallan en rojo

**Qué:** escribe los pasos de MATE-2.12 y MATE-2.13: que la IA entregue un ítem numérico de O1 mal formado (sin `valor`, `valor` que no es un número o está escrito como texto, `unidades` vacías, `tolerancia` fuera de 0 a 1 o escrita como texto, `valor` 0 con tolerancia) o bien formado (con y sin unidades, con tolerancia 0 y 1, con valor 0 sin tolerancia), y que el borrador lo tenga con su fuente o la aplicación diga que lo ha apartado y por qué. Reutiliza el soporte de ítems numéricos que deja `recu-aceptacion-item-numerico`, en `contenido.ts`.

**Hecho cuando:** MATE-2.12 y MATE-2.13 fallan por una comprobación y no por un paso sin definir; los demás escenarios de MATE siguen en verde; `escenarios_en_rojo.MATE` de `config/alcance.json` lista los dos y `make check-aceptacion` da verde.

**Leer primero:** `features/material.feature` (MATE-2.3, 2.5 y 2.12 a 2.13); `tests/aceptacion/pasos/redaccion-rechazos.ts`; `tests/aceptacion/soporte/escenario-material.ts` y `contenido.ts`; el plan §6, «Pendientes de un área cerrada».

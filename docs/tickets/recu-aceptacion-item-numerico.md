---
fase: aceptacion
area: RECU
depende: [specs-item-numerico]
toca: [tests/aceptacion/pasos/recuperacion.ts, tests/aceptacion/soporte/contenido.ts, tests/aceptacion/soporte/mundo.ts]
estado: abierto
---
# Los escenarios del ítem numérico de RECU tienen pasos y fallan en rojo

**Qué:** escribe los pasos de RECU-2.2 (cambiado), RECU-4.2 y RECU-5.1 a RECU-5.13: construir un ítem con respuesta numérica (`valor`, `unidades`, `tolerancia`), escribir una respuesta, comprobar si es correcta y qué dice el feedback de la parte que falla. El soporte tiene que poder escribir una respuesta numérica correcta y una incorrecta de un ítem numérico, como hoy con `aceptadas` (`tests/aceptacion/soporte/contenido.ts:46`). De paso, corrige el comentario de `BorradorContenido` (`contenido.ts:55`): dice que la aplicación lee el contenido «a través de `leerContenido`», que ya no existe desde aaaef10; ahora lo lee con el puerto `Ficheros` (lo dijo el cierre de MATE, 02-11-2026).

**Hecho cuando:** los 15 escenarios de `escenarios_en_rojo.RECU` tienen todos sus pasos y fallan por una comprobación y no por un paso sin definir; los demás escenarios de RECU y DIAG siguen en verde; el comentario de `contenido.ts:55` ya no cita `leerContenido`; y `make check-aceptacion` da verde.

**Leer primero:** `features/recuperacion.feature` (regla RECU-5 y su Antecedentes); `tests/aceptacion/pasos/recuperacion.ts`; `tests/aceptacion/soporte/contenido.ts`; el plan §6, «Pendientes de un área cerrada».

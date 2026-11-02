---
fase: impl
area: MAST
depende: [mast-pasos-reintentos, recu-reintentos]
toca: [src/dominio/criterio-dominio.ts, src/aplicacion/criterio-dominio.ts, src/aplicacion/estado.ts, tests/unidad/criterio-dominio.test.ts, config/alcance.json, docs/areas/MAST.md, docs/deuda-diseno.md]
estado: abierto
---
# El dominio cuenta el primer intento de cada sesión (MAST-1.2, 1.8 y 4.2)

**Qué:** el acierto sin ayuda de un objetivo cuenta, de cada ítem, el primer intento de la última sesión en que se respondió: los reintentos de la misma sesión (contexto `reintento`) no cuentan, ni para dominar un objetivo ni para devolver el dominio que quitó un fallo en un repaso. Quien lo implemente añade a `toca` lo que cambie en `src/`.

**Hecho cuando:** MAST-1.2, 1.8 y 4.2 pasan, salen de `escenarios_en_rojo.MAST` en `config/alcance.json`, `make cerrar-area A=MAST` da verde y `make check` da verde.

**Leer primero:** `features/dominio.feature` (cabecera, MAST-1.2, MAST-1.8 y MAST-4.2); `docs/areas/MAST.md`; los pasos del ticket `mast-pasos-reintentos`; `src/dominio/criterio-dominio.ts`.

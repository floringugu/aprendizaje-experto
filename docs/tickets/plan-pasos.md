---
fase: aceptacion
area: PLAN
depende: []
toca: [tests/aceptacion/pasos/planificador.ts, tests/aceptacion/soporte/planificador.ts, config/alcance.json]
estado: hecho
---
# Pasos de los reintentos en PLAN (PLAN-1.5, 2.3 y 3.4)

**Qué:** los pasos de PLAN-1.5, 2.3 y 3.4 (un reintento de la misma sesión no cambia la calificación que recibe FSRS ni la fecha del siguiente repaso), que specs añadió con el reaprendizaje sucesivo y hoy no tienen ninguno: son 9 pasos sin definir. Los otros 10 escenarios de PLAN ya fallan con sus pasos. El reintento se hace con `reintentar` (`tests/aceptacion/soporte/acciones.ts:77`) y con el soporte de `tests/aceptacion/soporte/reintentos.ts`, que ya están en `main`: no esperan a `recu-reintentos`.

**Hecho cuando:** `make check-aceptacion` da verde en el carril (fase aceptacion, área PLAN): los 13 escenarios de PLAN tienen todos sus pasos definidos y fallan de verdad (ni pendientes, ni saltados, ni en verde). Si alguno pasa porque la aplicación ya lo hace, `escenarios_en_rojo.PLAN` de `config/alcance.json` lista los demás.

**Leer primero:** `features/planificador.feature:55` (PLAN-1.5), `:80` (PLAN-2.3) y `:117` (PLAN-3.4); `tests/aceptacion/pasos/planificador.ts` y `tests/aceptacion/soporte/planificador.ts`; `tests/aceptacion/pasos/reintentos.ts` (el contrato de los reintentos, en su cabecera) y `tests/aceptacion/soporte/reintentos.ts`.

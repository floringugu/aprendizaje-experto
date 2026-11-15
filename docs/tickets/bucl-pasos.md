---
fase: aceptacion
area: BUCL
depende: []
toca: [tests/aceptacion/pasos/bucle.ts, tests/aceptacion/pasos/configuracion.ts, tests/aceptacion/soporte/calibracion.ts, tests/aceptacion/soporte/bucle.ts, config/alcance.json]
estado: abierto
---
# Pasos de la calibración y de la exploración en el bucle (BUCL-2.4 a 2.7)

**Qué:** los pasos de BUCL-2.4 a 2.7 (el paso 1 no cuenta el intento de exploración ni las prepreguntas, las pantallas de calibración no salen fuera del bucle y su paso 2 enseña una sola), que hoy no tienen todos los suyos: son 11 pasos sin definir. Los otros 11 escenarios de BUCL ya fallan con sus pasos. BUCL-2.5 y 2.6 necesitan los datos de una silueta y de unas tarjetas (CALI-4 y CALI-5): ese soporte va en `tests/aceptacion/soporte/calibracion.ts`, que `cali-pasos` e `inst-pasos` también tienen en `toca`. Lo demás va en `tests/aceptacion/soporte/bucle.ts`, no en `contenido.ts`, `acciones.ts` ni `mundo.ts`.

**Hecho cuando:** `make check-aceptacion` da verde en el carril (fase aceptacion, área BUCL): los 15 escenarios de BUCL tienen todos sus pasos definidos y fallan de verdad (ni pendientes, ni saltados, ni en verde). Si alguno pasa porque la aplicación ya lo hace, `escenarios_en_rojo.BUCL` de `config/alcance.json` lista los demás.

**Leer primero:** `features/bucle.feature:75-108` (BUCL-2.4 a 2.7); `features/calibracion.feature:156` (regla CALI-4), `:280` (CALI-5) y `:400` (CALI-6), que BUCL-2.5 y 2.6 citan; `tests/aceptacion/pasos/bucle.ts` y `calibracion.ts`; `tests/aceptacion/pasos/configuracion.ts`.

## Detalle

- «que el número de prepreguntas configurado es N» lo usa también AYUD-8 (`ayud-pasos`). Va en `tests/aceptacion/pasos/configuracion.ts`, que los dos tickets tienen en `toca`: el que llegue segundo lo encuentra definido y no lo repite (dos definiciones del mismo paso dejan el escenario ambiguo).
- Si `cali-pasos` ya está fusionado, `tests/aceptacion/soporte/calibracion.ts` existe y se reutiliza. Si no, este ticket escribe lo mínimo para sus dos escenarios y `cali-pasos` lo amplía.

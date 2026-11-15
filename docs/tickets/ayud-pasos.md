---
fase: aceptacion
area: AYUD
depende: []
toca: [tests/aceptacion/pasos/ayuda.ts, tests/aceptacion/pasos/ayuda-instruccion.ts, tests/aceptacion/pasos/ayuda-exploracion.ts, tests/aceptacion/pasos/ayuda-prepreguntas.ts, tests/aceptacion/pasos/configuracion.ts, tests/aceptacion/soporte/ayuda.ts, src/aplicacion/sesiones.ts, config/alcance.json]
estado: abierto
---
# Pasos de la alternancia, la instrucción, la exploración, la autoexplicación, el diagrama y las prepreguntas en AYUD

**Qué:** los pasos de los 42 escenarios de AYUD que hoy no tienen todos los suyos: AYUD-1.1 a 1.3 (la alternancia de ejemplo y problema), 4.1 a 4.5 (la instrucción antes de cualquier ejemplo), 5.1 a 5.8 (el intento de exploración), 6.1 a 6.8 (la autoexplicación), 7.1 a 7.5 (el diagrama) y 8.1 a 8.13 (las prepreguntas). Son 75 pasos distintos. Los otros 8 escenarios (AYUD-2.1 a 2.7 y 3.1) ya fallan con sus pasos. Va en un solo ticket porque `make check-aceptacion` no admite un escenario del área en curso con pasos sin definir: un ticket con parte de AYUD no podría hacer push. Los pasos van en ficheros por regla (`ayuda-instruccion.ts`, `ayuda-exploracion.ts`, `ayuda-prepreguntas.ts`) y el soporte nuevo, en `tests/aceptacion/soporte/ayuda.ts`, no en `contenido.ts`, `acciones.ts` ni `mundo.ts`. Si hace falta una firma nueva de `src/` (el elemento de sesión con la instrucción, la exploración o las prepreguntas), entra sin cuerpo.

**Hecho cuando:** `make check-aceptacion` da verde en el carril (fase aceptacion, área AYUD): los 50 escenarios de AYUD tienen todos sus pasos definidos y fallan de verdad (ni pendientes, ni saltados, ni en verde). Si alguno pasa porque la aplicación ya lo hace, `escenarios_en_rojo.AYUD` de `config/alcance.json` lista los demás.

**Leer primero:** `features/ayuda.feature:37` (regla AYUD-1), `:148` (AYUD-4), `:209` (AYUD-5), `:318` (AYUD-6), `:421` (AYUD-7) y `:476` (AYUD-8); `tests/aceptacion/pasos/ayuda.ts`, `exploracion.ts` y `prepreguntas.ts` (los pasos de MAST sobre la exploración y las prepreguntas, para reutilizarlos y no definir dos veces el mismo); `tests/aceptacion/pasos/configuracion.ts`.

## Detalle

- «que el número de prepreguntas configurado es N» lo usa también BUCL-2.7 (`bucl-pasos`). Va en `tests/aceptacion/pasos/configuracion.ts`, que los dos tickets tienen en `toca`: el que llegue segundo lo encuentra definido y no lo repite (dos definiciones del mismo paso dejan el escenario ambiguo).
- Es grande para una sola conversación: si llega al relevo, el carril conserva los commits y el push espera al final, con todo AYUD definido.

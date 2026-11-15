---
fase: aceptacion
area: TARE
depende: []
toca: [tests/aceptacion/pasos/tareas.ts, tests/aceptacion/soporte/tareas.ts, config/alcance.json]
estado: abierto
---
# Pasos del orden de las tareas y del texto profesional en TARE (TARE-1.4 y 1.5)

**Qué:** los pasos de TARE-1.4 (tras practicar las primeras tareas, la siguiente es la que sigue en el orden) y de TARE-1.5 (una tarea que parte de un texto profesional lo presenta y su enunciado lo nombra), que hoy no tienen todos los suyos: son 5 pasos sin definir. Los otros 11 escenarios de TARE ya fallan con sus pasos. El soporte nuevo (la tarea con su texto profesional) va en un fichero propio, `tests/aceptacion/soporte/tareas.ts`, y no en `contenido.ts`, `acciones.ts` ni `mundo.ts`, que comparten todos los tickets de pasos: así este no se solapa con ellos.

**Hecho cuando:** `make check-aceptacion` da verde en el carril (fase aceptacion, área TARE): los 13 escenarios de TARE tienen todos sus pasos definidos y fallan de verdad (ni pendientes, ni saltados, ni en verde). Si alguno pasa porque la aplicación ya lo hace, `escenarios_en_rojo.TARE` de `config/alcance.json` lista los demás.

**Leer primero:** `features/tareas.feature:50` (TARE-1.4) y `:57` (TARE-1.5); `tests/aceptacion/pasos/tareas.ts`; `tests/aceptacion/soporte/contenido.ts` (cómo se declara una tarea) y `tests/aceptacion/soporte/pdf.ts`.

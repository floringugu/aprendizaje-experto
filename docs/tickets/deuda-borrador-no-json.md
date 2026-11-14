---
fase: impl
area: MATE
depende: []
toca: [src/aplicacion/mesa-guardada.ts, src/aplicacion/revision-del-material.ts, docs/deuda-diseno.md]
estado: abierto
---
# Un `borrador.json` que no es JSON se rechaza sin lanzar (deuda D26)

**Qué:** pagar la partida D26 de `docs/deuda-diseno.md`. `leerBorrador` lee el borrador sin `try` ni validación, así que un `borrador.json` que no es JSON lanza `SyntaxError` desde los casos de uso de la revisión, mientras que el aprobado, en el mismo caso, se rechaza con su frase. La partida propone dos caminos, capturar el error y rechazar como con el aprobado o validar el borrador con `validarContenido`, y el dueño no ha elegido. Cambian lo que ve la persona, y ningún escenario de `features/` lo fija: antes de escribir código hace falta esa decisión. Es también el ticket de la segunda pasada real del Despachador (`noche-despachador`), la que deja un ticket en la cola de la mañana.

**Hecho cuando:** primero, la conversación expone los dos caminos (qué ve la persona en cada uno, qué escenario haría falta en `features/` y qué ficheros cambian) y para con decisión pendiente, sin tocar código; después, con el camino que elija el dueño, un borrador que no es JSON se rechaza sin lanzar, D26 sale de la tabla de `docs/deuda-diseno.md` y `make check` da verde.

**Leer primero:** `docs/deuda-diseno.md`, la fila D26 y «Cómo se paga»; `src/aplicacion/mesa-guardada.ts:129-160` (`leerJsonDelAprobado` y `leerBorrador`); `src/aplicacion/revision-del-material.ts:140-150` (el comentario de `piezaDeVerFuente`, que ya cuenta con un borrador «que ya no es JSON»).

## Detalle

- Si el camino elegido pide un escenario nuevo, ese escenario es de specs: va a un ticket specs en el mismo PR, y este ticket pasa a depender de él.
- En «Por área» de `docs/deuda-diseno.md`, D26 se añade a la línea de MATE, donde se anotó.

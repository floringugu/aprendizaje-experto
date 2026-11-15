---
fase: impl
area: RECU
depende: [recu-aceptacion-item-numerico]
toca: [src/dominio/correccion.ts, src/aplicacion/contenido.ts, src/aplicacion/formato-contenido.ts, src/aplicacion/respuestas.ts, src/aplicacion/sesiones.ts, src/aplicacion/presentacion.ts, tests/unidad/, config/alcance.json, docs/areas/RECU.md, docs/deuda-diseno.md]
estado: abierto
---
# La app corrige un ítem numérico con tolerancia y unidades

**Qué:** el contenido admite una respuesta numérica (`valor`, `unidades`, `tolerancia`) y la corrección la compara con el margen relativo, lee el número con coma o punto y con notación científica, compara la unidad como texto y no convierte. El feedback dice qué parte falla y el margen que se acepta. `tolerancia_numerica_relativa` se lee de `config/parametros.json`.

**Hecho cuando:** los 15 escenarios de `escenarios_en_rojo.RECU` pasan y la lista queda vacía; `formato-contenido.ts` rechaza un ítem numérico sin `valor` o con `unidades` vacías; `make cerrar-area A=RECU` da verde y `docs/areas/RECU.md` anota la mutación y la deuda de la mini área.

**Contrato que fijan los pasos** (`tests/aceptacion/pasos/recuperacion.ts`, vistas `FeedbackNumerico` e `ItemPresentadoNumerico`): el `Feedback` de un ítem numérico incorrecto lleva además `numerico: { valor?: 'distinto' | 'ilegible', unidad?: 'distinta' | 'falta' | 'sobra', margen?: number, formato?: string }` (solo los campos que fallan; `margen` es el relativo, 0,01 para el 1 %, y solo con el valor fallado; `formato` solo si el valor es `ilegible`, y menciona dígitos, coma, punto y miles); un ítem correcto no lleva `numerico`. El `ItemPresentado` de un ítem numérico no lleva `opciones` y lleva `entrada: 'numero_con_unidad'` (`'numero'` si no tiene unidades). `respuestaCorrecta` es el valor con coma y la primera unidad («9,81 m/s²»). Eso toca `sesiones.ts` y `presentacion.ts`, que se añaden a `toca`.

**Leer primero:** `features/recuperacion.feature` (regla RECU-5); `src/dominio/correccion.ts`; `src/aplicacion/formato-contenido.ts:268`; `docs/areas/RECU.md`. La aplicación de la corrección numérica va en el dominio y la lectura del número, en una función propia que `correccion.ts` llama, para no mezclarla con `normalizar`, que `formato-contenido.ts` usa para las opciones.

---
fase: impl
area: RECU
depende: [recu-aceptacion-item-numerico]
toca: [src/dominio/correccion.ts, src/aplicacion/contenido.ts, src/aplicacion/formato-contenido.ts, src/aplicacion/respuestas.ts, tests/unidad/, config/alcance.json, docs/areas/RECU.md, docs/deuda-diseno.md]
estado: abierto
---
# La app corrige un ítem numérico con tolerancia y unidades

**Qué:** el contenido admite una respuesta numérica (`valor`, `unidades`, `tolerancia`) y la corrección la compara con el margen relativo, lee el número con coma o punto y con notación científica, compara la unidad como texto y no convierte. El feedback dice qué parte falla y el margen que se acepta. `tolerancia_numerica_relativa` se lee de `config/parametros.json`.

**Hecho cuando:** los 15 escenarios de `escenarios_en_rojo.RECU` pasan y la lista queda vacía; `formato-contenido.ts` rechaza un ítem numérico sin `valor` o con `unidades` vacías; `make cerrar-area A=RECU` da verde y `docs/areas/RECU.md` anota la mutación y la deuda de la mini área.

**Leer primero:** `features/recuperacion.feature` (regla RECU-5); `src/dominio/correccion.ts`; `src/aplicacion/formato-contenido.ts:268`; `docs/areas/RECU.md`. La aplicación de la corrección numérica va en el dominio y la lectura del número, en una función propia que `correccion.ts` llama, para no mezclarla con `normalizar`, que `formato-contenido.ts` usa para las opciones.

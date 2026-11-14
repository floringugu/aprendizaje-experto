---
fase: impl
area: RECU
depende: []
toca: [src/aplicacion/sesiones.ts, src/aplicacion/dominio.ts, src/aplicacion/presentacion.ts, src/aplicacion/criterio-dominio.ts, docs/deuda-diseno.md]
estado: abierto
---
# Las acciones de un ítem y de un objetivo tienen tipo (deuda D18)

**Qué:** pagar la partida D18 de `docs/deuda-diseno.md`. Los campos `acciones` de un ítem presentado y de un objetivo son `readonly string[]`, así que `'responder'` y `'practicar'` solo los comprueban los steps de aceptación. Pasan a tener tipo: `AccionDeItem` en `sesiones.ts` y `AccionDeObjetivo` en `dominio.ts`. Solo refactoriza: no cambia ningún comportamiento. Es también el ticket de la primera pasada real del Despachador (`noche-despachador`), porque cabe entero en la lista blanca.

**Hecho cuando:** los dos campos `acciones` llevan su tipo, D18 sale de la tabla de `docs/deuda-diseno.md`, `make check` da verde y el PR solo toca la lista blanca (`src/`, `tests/unidad/`, `docs/deuda-diseno.md` y este ticket), así que se fusiona solo.

**Leer primero:** `docs/deuda-diseno.md`, la fila D18 y «Cómo se paga»; `src/aplicacion/sesiones.ts:24`, `src/aplicacion/dominio.ts:52`, `src/aplicacion/presentacion.ts:16` y `src/aplicacion/criterio-dominio.ts:146`.

## Detalle

- `src/aplicacion/horas.ts:13` tiene otro `acciones: readonly string[]` que D18 no nombra. Si es el mismo caso, se le pone su tipo y el fichero se añade a `toca`; si no, se deja.
- No toca `features/` ni `tests/aceptacion/`. Si el tipo nuevo obliga a cambiar un step, no se cambia: se para con decisión pendiente.
- En «Por área» de `docs/deuda-diseno.md`, D18 se añade a la línea de RECU, donde se anotó.

---
fase: impl
area: PLAN
depende: [noche-lote]
toca: [scripts/arnes/despachador.ts, scripts/arnes/comun/despachador.ts, scripts/arnes/comun/lote.ts, scripts/arnes/manana.ts, tests/arnes/, CLAUDE.md, docs/plan.md, docs/ai-factory/]
estado: abierto
---
# La noche no toma un ticket que choca con lo que `main` cambió desde la base del lote

**Qué:** un lote vivo no ve lo que entra después en `main` (plan §11). Si `main` y el lote cambian los mismos ficheros, el PR `lote/N` → `main` no se puede fusionar y hay que traer el lote a mano: pasó el 15-11-2026 con `lote/1`. `listo` ya excluye el solape con los carriles abiertos; lo que nadie comprueba es el solape entre el `toca` de un ticket y lo que `main` cambió desde la base del lote. Este ticket lo comprueba antes de tomar el ticket y lo avisa por la mañana. Es un cambio del arnés: el área PLAN solo le da nombre a la rama.

**Hecho cuando:** hay un test que reproduce el 15-11-2026 (el lote nace de un commit, `main` cambia después `src/aplicacion/respuestas.ts`, y un ticket de impl con ese fichero en `toca` no se toma: queda en la cola con el motivo y los ficheros); `make manana` dice, de un lote vivo, qué ficheros han cambiado a la vez él y `main`; el plan §6 y §11 dicen lo construido y qué queda de la regla manual; `docs/ai-factory/` lo dibuja como construido, y `make check` da verde.

**Leer primero:** `docs/plan.md` §6, «Lo construido en el paso 3», y §11, «Un lote vivo choca con lo que entra en `main`» (búscalos con Grep); `scripts/arnes/comun/lote.ts` (el estado del lote); `scripts/arnes/comun/despachador.ts` (`elegirTicket`); `scripts/arnes/comun/estado-tickets.ts` (los solapes de `toca`); `scripts/arnes/manana.ts`.

## Dato

Horas UTC del 15-11-2026:

- `lote/1` nació de `117796f`, hacia la 01:10.
- El dueño fusionó en `main` el PR #57 (`recu-impl-item-numerico`, 01:29) y el #60 (`mate-num-borrador`, 01:56).
- La noche fusionó en el lote el PR #61 (`recu-reintentos`, 02:28).
- El PR #56 (`lote/1` → `main`) no pudo fusionarse y se cerró. El lote se trajo a mano con los PR #64 y #65.
- Conflictos de la fusión en seco: `src/aplicacion/respuestas.ts`, `docs/areas/RECU.md`, `config/alcance.json` y `docs/deuda-diseno.md`.
- `recu-impl-item-numerico` y `recu-reintentos` declaraban esos ficheros en `toca`, y ninguno dependía del otro. Los dos estaban listos: uno se hizo de día contra `main` y el otro de noche contra el lote.

## Regla manual mientras no exista

Con un lote vivo no se fusiona aceptación ni impl en `main`: solo specs. Por la mañana, primero el lote. Está en el plan §11.

## Por resolver

- **Con qué se compara.** Los ficheros de `git diff --name-only <base del lote>..origin/main` contra el `toca` del ticket, con la misma comparación de rutas que usan los solapes entre carriles. La base es el commit común de `origin/lote/N` y `origin/main`.
- **`config/alcance.json` y `docs/deuda-diseno.md`.** Están fuera del cómputo de solape a propósito (plan §6, «Tickets»), porque casi todos los carriles los escriben. Chocaron los dos el 15-11-2026. Si cuentan aquí, casi cualquier fusión de impl en `main` deja la noche sin tickets; si no cuentan, el PR del lote puede seguir sin poder fusionarse. El ticket `noche-cola-de-fusion` tiene la misma pregunta: se resuelven juntos.
- **Qué hace el ticket que choca.** A la cola con su motivo, como los demás. No se pone el lote al día con `main`: el ruleset «lote: CI» no deja reescribir la rama y exige historia lineal.
- **De día.** El choque también nace cuando el dueño fusiona en `main` con el lote vivo. `make manana` lo avisa; un aviso en el momento de fusionar sería otro mecanismo y pide su dato.

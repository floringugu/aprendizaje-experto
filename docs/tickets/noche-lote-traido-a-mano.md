---
fase: impl
area: PLAN
depende: [noche-lote, lote-choca-con-main]
toca: [scripts/arnes/despachador.ts, scripts/arnes/comun/lote.ts, scripts/arnes/comun/ramas.ts, scripts/arnes/manana.ts, tests/arnes/, CLAUDE.md, docs/plan.md]
estado: abierto
---
# Un lote que se trajo a `main` a mano deja de ser el lote de la noche

**Qué:** un lote cuenta como fusionado solo si cada commit suyo está en `main` con el mismo parche (`estaFusionadaEn`, `scripts/arnes/comun/ramas.ts`). Si el lote se trae a mano y algún parche cambia al resolver un choque, sigue «vivo» para siempre: `lote/N` no se puede borrar (ruleset «lote: CI», plan §11), así que el Despachador lo reutiliza cada noche, con una base cada vez más vieja, y `make manana` lo enseña como lote que espera la fusión. Este ticket da una forma de dar un lote por terminado y hace que el Despachador no saque carriles de un lote al que le falta lo de `main`. Es un cambio del arnés: el área PLAN solo le da nombre a la rama.

**Hecho cuando:** hay un test que reproduce el 15-11-2026 (un lote con un commit que `main` tiene con otro parche, y `main` con commits y tickets que el lote no tiene): la noche no saca carriles de ese lote y usa el siguiente, y `make manana` no lo enseña como pendiente de fusión; el plan §6 y §11 dicen cómo se da por terminado un lote traído a mano, y `make check` da verde.

**Leer primero:** `scripts/arnes/comun/lote.ts` (`estadoDelLote`, `loteDeLaNoche`, `lotesVivos`); `scripts/arnes/comun/ramas.ts` (`estaFusionadaEn`); `scripts/arnes/manana.ts`; `docs/plan.md` §11, «La numeración depende de que `lote/N` no se borre» y «Un lote vivo choca con lo que entra en `main`» (búscalos con Grep); `docs/tickets/lote-choca-con-main.md`.

## Dato

Noche del 15-11-2026 (`reports/noche/diario.jsonl`, desde las 21:45 UTC):

- `lote/1` nació de `117796f`. El PR #56 (`lote/1` → `main`) chocó y se cerró; el lote se trajo a mano con los PR #64 y #65.
- De sus siete commits, cinco estaban en `main` con el mismo parche. `f5e35f7` y `3b7a1b3` (RECU-6) no: el cherry-pick de `traer-lote-recu` los cambió al unirlos con el ítem numérico.
- Por eso `estadoDelLote` dio «vivo», y el Despachador reutilizó `lote/1`, con 18 commits de `main` por detrás.
- El ticket `mate-pasos-unidad-que-se-lee`, aprobado y listo en `main`, no existía en el lote: `elegirTicket` mira los tickets de aceptación e impl según el lote, y la noche no lo tomó. Tampoco `mate-unidad-que-se-lee`, que depende de él.
- La noche fusionó en ese lote el PR #67 (`recu-pasos-reintentos-aridad`, `960a956`). El PR #68 (`lote/1` → `main`) salió en conflicto en `config/alcance.json` y se cerró; el commit se trajo a `main` desde el carril del ticket.
- GitHub rechazó el borrado de `lote/1` (regla `deletion` del ruleset). Para que la noche deje de usarlo hay que crear `lote/2` desde `main` a mano.

## Lo que hay que decidir en el «Mecanismo»

- Cómo se da un lote por terminado sin borrarlo. Opciones: que cuente el árbol y no los parches (un lote cuyos ficheros cambiados son iguales en `main`); que no cuente un lote con el PR hacia `main` cerrado y otro lote de número mayor, o un comando del dueño que lo anote.
- Qué hace la noche con un lote vivo al que le faltan commits de `main`: no usarlo y decirlo en la cola, o exigir que el dueño lo resuelva antes. `lote-choca-con-main` ya mira el solape por `toca`; aquí el problema es que los tickets y sus dependencias se leen de un lote viejo.

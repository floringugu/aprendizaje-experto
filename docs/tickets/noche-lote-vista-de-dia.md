---
fase: impl
area: PLAN
depende: [noche-lote]
toca: [scripts/arnes/comun/estado-tickets.ts, scripts/arnes/comun/tablero.ts, scripts/arnes/tickets.ts, scripts/arnes/comun/worktrees.ts, tests/arnes/, docs/plan.md]
estado: abierto
---
# `make tickets`, el tablero y `make abrir` cuentan lo que ya está hecho en un lote vivo

**Qué:** la vista de día mira solo `origin/main` (plan §6, «Lo construido en el paso 3»). Mientras un lote espera a que el dueño lo fusione, un ticket que la noche hizo en él sale «listo» en `make tickets`, en el tablero y en el aviso de inicio, y `make abrir N=<ticket>` lo abriría otra vez desde `main`. Hay que decidir qué enseña la vista de día de esos tickets y qué hace `make abrir` con ellos. Es un cambio del arnés: el área PLAN solo le da nombre a la rama.

**Hecho cuando:** con un lote vivo, `make tickets` y el tablero distinguen un ticket hecho en el lote de uno listo, y `make abrir` de ese ticket se niega y dice por qué; hay tests de los dos casos; el plan §6 y §11 lo dicen, y `make check` da verde.

**Leer primero:** `docs/plan.md` §6, «Lo construido en el paso 3», y §11, «La vista de día no conoce el lote» (búscalos con Grep); `scripts/arnes/comun/lote.ts` (`lotesVivos`, `resumenDelLote`); `scripts/arnes/comun/estado-tickets.ts` (`situacionDelRepositorio`, que ya acepta otro origen); `scripts/arnes/comun/despachador.ts` (`elegirTicket`, que ya lo resuelve para la noche).

## Dato

- No hay ninguno de los registros todavía: el lote no ha tenido su pasada real. Antes de construir nada, mira en `reports/noche/` y en los transcripts si el dueño o una conversación abrió de día un ticket que ya estaba hecho en un lote (principio 7). Si no ha pasado, el ticket se queda abierto o se descarta.

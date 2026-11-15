---
fase: impl
area: PLAN
depende: [noche-lote]
toca: [scripts/arnes/despachador.ts, scripts/arnes/comun/despachador.ts, scripts/arnes/comun/diario-noche.ts, scripts/arnes/manana.ts, tests/arnes/, CLAUDE.md, docs/plan.md, docs/ai-factory/]
estado: abierto
---
# Un PR de la noche con la CI en rojo vuelve a la sesión de su ticket antes de ir a la cola

**Qué:** hoy, una CI en rojo manda el ticket a la cola de la mañana (plan §6, «Noche desatendida», «Reglas de parada»). El dueño pidió el 15-11-2026 que el fallo vuelva antes a la sesión que hizo el trabajo: el Despachador la reanuda con el fallo delante y, si el PR sigue en rojo tras un número fijo de intentos, entonces va a la cola. Cambia una decisión del 13-11-2026, así que este PR enmienda «Lo acordado» del plan §6 con su fecha. Es un cambio del arnés: el área PLAN solo le da nombre a la rama.

**Hecho cuando:** las reglas del Despachador (`queHacer`) tienen la nueva, con tests: CI en rojo con intentos por gastar, reanuda la sesión con el fallo; con los intentos gastados, a la cola con el motivo y el número de intentos; `make manana` dice cuántas veces volvió cada ticket; una pasada real con un PR en rojo muestra la vuelta; el plan §6 y §11 dicen lo construido y sus límites; `docs/ai-factory/` lo dibuja como construido, y `make check` da verde.

**Leer primero:** `docs/plan.md` §6, «Noche desatendida», «Lo acordado» y «Lo construido en el paso 2» (búscalos con Grep); `scripts/arnes/comun/despachador.ts` (`queHacer`, `motivoDelPr`); `scripts/arnes/despachador.ts` (cómo reanuda con `--resume`); `scripts/arnes/comun/diario-noche.ts`.

## Motivo (principio 7)

Es una petición del dueño del 15-11-2026, al adaptar al repositorio el diagrama de `docs/ai-factory/`. No hay dato: de las 4 entradas que la noche ha dejado en la cola hasta el 15-11-2026 (`reports/noche/diario.jsonl`), 3 fueron por una decisión pendiente y 1 por un PR en verde que esperaba el visto bueno; ninguna por una CI en rojo. El hook del push ya exige `make check` en verde antes de abrir el PR, así que la CI solo sale en rojo por lo que el hook no pasa (la mutación, los jobs `rama` y `rutas`) o por una diferencia entre el portátil y la CI. El plan tiene que decirlo así.

## Por resolver

- **Cuántos intentos.** Un número fijo y pequeño; el relevo tiene 4 y la reanudación «sigue», 2.
- **Cómo le llega el fallo.** La sesión reanudada con `--resume` y un mensaje con el job que falla y su salida (`gh run view --log-failed`), o solo el nombre del job, para que lo mire ella.
- **Qué fallos vuelven.** `check` y `mutacion`, sí. `rama` y `rutas` en rojo son un PR que toca lo que su fase no puede: eso es una decisión del dueño y va a la cola sin intento.
- **El conflicto de fusión.** Con tres carriles (`noche-tres-carriles`) y la cola de fusión (`noche-cola-de-fusion`), un PR puede chocar con otro recién fusionado en el lote. Es otro fallo que vuelve a la sesión; se decide aquí la regla y allí quién la dispara.
- **La ventana.** Un intento no empieza con la ventana cerrada, como el relevo.

## Solape

Comparte `scripts/arnes/`, `tests/arnes/`, `CLAUDE.md` y `docs/plan.md` con los demás tickets de la noche: no pueden tener carril a la vez, y `make tickets` lo dice.

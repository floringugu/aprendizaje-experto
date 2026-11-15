---
fase: impl
area: PLAN
depende: [noche-lote]
toca: [scripts/arnes/despachador.ts, scripts/arnes/comun/despachador.ts, scripts/arnes/comun/diario-noche.ts, scripts/arnes/manana.ts, tests/arnes/, Makefile, CLAUDE.md, docs/plan.md]
estado: abierto
---
# El Despachador lleva hasta tres carriles a la vez

**Qué:** el Despachador lleva hoy un solo carril a la vez (plan §6, «Noche desatendida», «Lo acordado»). El dueño decidió el 15-11-2026 que lleve hasta tres. Cambia una decisión del 13-11-2026, así que el plan §6 tiene que decirlo con su fecha. Es un cambio del arnés: el área PLAN solo le da nombre a la rama.

**Hecho cuando:** una pasada real del Despachador lleva tres tickets a la vez, cada uno en su carril, y `make manana` los resume sin mezclar sus sesiones; dos tickets cuyo `toca` se solapa no corren a la vez, con un test; el número de carriles se puede bajar a uno al lanzarlo; el plan §6 y §11 dicen lo construido y sus límites, y `make check` da verde.

**Leer primero:** `docs/plan.md` §6, «Noche desatendida», «Lo acordado» y «Lo construido en el paso 2» y «en el paso 3» (búscalos con Grep); `scripts/arnes/despachador.ts` (`despachar`, `siguienteTicket`); `scripts/arnes/comun/despachador.ts` (`elegirTicket`, `queHacer`); `scripts/arnes/comun/estado-tickets.ts` (los solapes de `toca`); `scripts/arnes/comun/diario-noche.ts`.

## Dato

- La reproducción de los registros (36 carriles, 38 PR) da las mismas noches con un carril que con tres: 5 con lote. Por eso el 13-11-2026 se acordó uno. Con tres no se ganan noches según ese dato; se gana tiempo dentro de la noche. Es una petición del dueño.

## Por resolver

- **Qué tickets corren juntos.** `elegirTicket` devuelve uno. Con tres, no puede dar dos cuyo `toca` se solape, ni uno que dependa de otro que está en marcha.
- **El límite de uso es uno para los tres.** Las reglas 2 y 3 de `queHacer` terminan la noche o esperan al reinicio: hay que decidir qué pasa con las otras dos sesiones.
- **El lote.** Los tres PR van a la misma rama `lote/N`, con rebase y sin exigir la rama al día. Un PR que choca con otro recién fusionado se queda sin poder fusionarse: va a la cola con ese motivo.
- **`make check` en paralelo.** Tres carriles pasan a la vez la comprobación del push en el mismo portátil. Medir cuánto tarda y la temperatura; con batería, el gasto se multiplica (paso 4, `noche-usuario-y-tapa`).
- **El diario y `make manana`.** Las anotaciones de los tres tickets se intercalan en `diario.jsonl`.

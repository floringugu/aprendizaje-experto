---
fase: impl
area: PLAN
depende: []
toca: [.claude/hooks/anotar-parada.ts, .claude/hooks/exigir-check-implementador.ts, scripts/arnes/comun/relevo.ts, scripts/arnes/comun/exigir-check.ts, tests/arnes/, CLAUDE.md, docs/plan.md]
estado: abierto
---
# Una marca citada en mitad del mensaje no cuenta como parada

**Qué:** el hook Stop (`.claude/hooks/anotar-parada.ts:46`) anota una parada con decisión si el último mensaje contiene `[DECISIÓN PENDIENTE]` en cualquier sitio, y lo mira antes que `[RELEVO]`. Un mensaje de relevo que cita la otra marca al contar lo que hará la sesión siguiente se anota como decisión: de noche, el ticket va a la cola en vez de seguir en una sesión nueva. Este ticket hace que solo cuente la marca con la que termina el mensaje. Es un cambio del arnés: el área PLAN solo le da nombre a la rama.

**Hecho cuando:** hay un test con el mensaje del 15-11-2026 (cita `[DECISIÓN PENDIENTE]` entre comillas de código y termina con `[RELEVO]`) que se anota como relevo, y otro que termina con `[DECISIÓN PENDIENTE]` y se anota como decisión; los avisos que piden las marcas siguen diciendo «termina tu mensaje con»; `exigir-check-implementador.ts` sigue la misma regla, y `make check` da verde.

**Leer primero:** `.claude/hooks/anotar-parada.ts:40-65`; `.claude/hooks/exigir-check-implementador.ts:26`; `scripts/arnes/comun/relevo.ts` (los avisos del relevo); `scripts/arnes/comun/despachador.ts` (`queHacer`: qué hace la noche con cada parada).

## Dato

Noche del 15-11-2026, ticket `plan` (`reports/noche/plan-20261115T220745.tsv` y `reports/noche/diario.jsonl`):

- La sesión llegó al umbral de contexto sin commits, escribió `reports/relevo.md` y terminó su mensaje con `[RELEVO]`.
- La frase anterior decía: «Esa sesión escribirá el Mecanismo, abrirá el PR hacia `lote/1` y terminará con `[DECISIÓN PENDIENTE]`.»
- El hook respondió «Claude ha parado con [DECISIÓN PENDIENTE]: espera tu decisión.», y el diario anotó `plan` en la cola con «paró con una decisión pendiente», a las 22:13 UTC. La noche terminó ahí, con la ventana abierta hasta las 05:00 UTC.
- Con la parada anotada como relevo, `queHacer` habría lanzado una sesión nueva en el carril.

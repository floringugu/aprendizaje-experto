---
fase: impl
area: PLAN
depende: [noche-despachador]
toca: [scripts/arnes/despachador.ts, scripts/arnes/comun/despachador.ts, scripts/arnes/manana.ts, scripts/arnes/ci.ts, scripts/arnes/comun/ramas.ts, scripts/arnes/comun/worktrees.ts, tests/arnes/, .github/workflows/, Makefile, CLAUDE.md, docs/plan.md]
estado: abierto
---
# La noche acumula aceptación e impl en una rama `lote/N` que el dueño fusiona por la mañana

**Qué:** paso 3 de la noche desatendida (plan §6, «Noche desatendida»): una rama de integración `lote/N`, una sola viva a la vez, que nace de `main`. De noche, los carriles de aceptación e impl salen de ella y sus PR van hacia ella, donde se fusionan con la CI en verde y sin visto bueno; por la mañana el dueño revisa el PR `lote/N` → `main` y lo fusiona con `--admin`. Las specs siguen yendo a `main` una a una, con su visto bueno. Es un cambio del arnés: el área PLAN solo le da nombre a la rama.

**Hecho cuando:** una pasada real del Despachador fusiona en `lote/N` dos tickets encadenados (uno de aceptación y el impl que depende de él) sin que nadie toque nada; `make manana` resume el lote (tickets, ficheros y PR hacia `main`); el dueño fusiona ese PR y `main` queda con los dos; el plan §6 y §11 dicen lo construido, y `make check` da verde.

**Leer primero:** `docs/plan.md` §6, «Noche desatendida» y los dos rulesets de `main` (búscalos con Grep); `.github/workflows/` (los jobs `rama`, `rutas` y `check`); `scripts/arnes/ci.ts` y `scripts/arnes/rutas-fase.ts`; `scripts/arnes/comun/ramas.ts` (`RAMA_DE_ORIGEN`, `estaFusionada`); el ticket `noche-despachador`.

## Decisiones ya tomadas (13-11-2026; no se reabren)

- Se llama `lote/N`, no «etapa/N». Solo acumula aceptación e impl.
- Un ruleset nuevo, «lote: CI», exige PR y CI en `lote/*`, sin visto bueno. Lo crea el dueño: Claude no toca rulesets. El PR de este ticket le da los comandos en un bloque `sh`.
- La CI corre también en los PR hacia `lote/*`. El PR `lote/*` → `main` queda exento de los jobs `rama` y `rutas`: su rama no es de una fase y junta rutas de dos.
- El PR `lote/N` → `main` lo fusiona el dueño con `gh pr merge <n> --rebase --admin`.

## Por qué

- En la reproducción de los registros (36 carriles, 38 PR), sin lote la noche tarda 15 noches en lo que con lote tarda 5: 0 de los 31 tickets abiertos caben en la lista blanca, así que sin lote nada se fusiona de noche y cada ticket que depende de otro espera un día.

## Detalle

- «Hecho» para el Despachador pasa a ser «fusionado en `lote/N`», y «listo» tiene que contar como cumplidas las dependencias que ya están hechas en el lote. `estaFusionada`, `make rama` y `make retirar` miran hoy `origin/main`: en un carril del lote tienen que mirar su rama de lote.
- Los límites nuevos que esto abre van al plan §11: lo que entra en `lote/N` de noche no lo ha visto nadie hasta la mañana, y el visto bueno pasa a darse sobre el diff entero del lote.

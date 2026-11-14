---
fase: impl
area: PLAN
depende: []
toca: [scripts/arnes/comun/ramas.ts, tests/arnes/ramas.test.ts, docs/plan.md]
estado: abierto
---
# `make retirar` reconoce una rama fusionada aunque el rebase de GitHub le cambie el contexto del parche

**Qué:** `estaFusionada` da por sin fusionar una rama cuyo PR ya fusionó GitHub cuando, al hacer el rebase, cambian las líneas de contexto del parche: `git cherry` compara el parche con su contexto. Con eso `make retirar`, `make fase N=` y `make rama` se niegan con un falso «Sin fusionar en origin/main», y el dueño tiene que borrar el carril a mano. Es un cambio del arnés: el área PLAN solo le da nombre a la rama.

**Hecho cuando:** un test de `tests/arnes/ramas.test.ts` reproduce el caso (el mismo cambio llega a la rama de origen con otro contexto, porque entre medias entró otro commit que toca líneas vecinas) y `estaFusionada` lo da por fusionado; una rama con un commit que de verdad falta sigue contando como sin fusionar; el plan §6 describe la regla nueva, y `make check` da verde.

**Leer primero:** `scripts/arnes/comun/ramas.ts:83-90` (`estaFusionada`); `scripts/arnes/comun/worktrees.ts:229-239` (quién la llama); `docs/plan.md` §6, el párrafo que empieza por «`make fase N=` y `make retirar` se niegan» (búscalo con Grep); `tests/arnes/ramas.test.ts` y `tests/arnes/origen.ts`.

## El dato

- 14-11-2026: `make retirar N=mast-pasos-prepreguntas` se negó. Su único commit, `f37ef6c`, estaba en `main` como `71db500` desde el PR #36 (02-11-2026). Los dos cambian lo mismo; solo difiere el contexto del trozo de `config/alcance.json`, porque el PR #35 entró antes y cambió las líneas de al lado.
- `config/alcance.json` lo escriben casi todos los carriles, cada uno en su parte (plan §6, «Tickets»), así que el caso se repetirá, y más con la noche desatendida, donde el Despachador retira el carril él solo (ticket `noche-despachador`).

## Detalle

- Hay que elegir la regla con el paso «diseñarlo dos veces». Dos candidatas: comparar los parches sin contexto (`git diff -U0` de cada commit de la rama, buscado entre los commits de `origin/main` posteriores al punto en que sale la rama), o preguntar a GitHub si el PR de la rama está fusionado y su cabeza es la punta de la rama local (`gh pr list --head <rama> --state merged --json headRefOid`). La segunda depende de la red y de `gh`; la primera, no.
- No se hace aquí: un `make retirar` que descarte un carril sin fusionar. El 14-11-2026 hubo que borrar a mano el carril de medida `medida-fable`, que no tenía PR; es un solo caso, y de un carril de prueba.

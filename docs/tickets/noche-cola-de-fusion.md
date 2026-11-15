---
fase: impl
area: PLAN
depende: [noche-tres-carriles]
toca: [scripts/arnes/despachador.ts, scripts/arnes/comun/despachador.ts, scripts/arnes/comun/lote.ts, scripts/arnes/comun/diario-noche.ts, scripts/arnes/manana.ts, tests/arnes/, CLAUDE.md, docs/plan.md, docs/ai-factory/]
estado: abierto
---
# Los PR de la noche entran en el lote de uno en uno, cada uno al día con el anterior

**Qué:** con tres carriles (`noche-tres-carriles`), dos PR pueden estar en verde a la vez contra el mismo `lote/N`, y el segundo se fusiona sin haber pasado la CI con el primero dentro. El dueño pidió el 15-11-2026 una cola de fusión: el Despachador fusiona los PR en el orden en que acaban, de uno en uno; antes de cada fusión pone la rama al día con el lote y espera a su CI. Es la segunda de las tres capas contra los choques: no lanzar juntos tickets que se solapan (`noche-tres-carriles`), fusionar en orden (este ticket) y, si hay conflicto, reanudar la sesión del ticket (`noche-fallo-vuelve-al-agente`). Cambia una decisión del 13-11-2026, así que este PR enmienda «Lo acordado» del plan §6 con su fecha. Es un cambio del arnés: el área PLAN solo le da nombre a la rama.

**Hecho cuando:** hay tests del orden (dos PR en verde: entra el que acabó antes, y el otro se pone al día y repite la CI antes de entrar) y del conflicto (un PR que no se puede poner al día no se fusiona: vuelve a su sesión si `noche-fallo-vuelve-al-agente` está hecho, y si no, va a la cola con el motivo); una pasada real con dos tickets a la vez lo muestra; el plan §6 y §11 dicen lo construido y sus límites; `docs/ai-factory/` lo dibuja como construido, y `make check` da verde.

**Leer primero:** `docs/plan.md` §6, «Noche desatendida», «Lo acordado» y «Lo construido en el paso 3», y «Tickets», el párrafo «No cuentan `config/alcance.json` ni `docs/deuda-diseno.md`» (búscalos con Grep); `scripts/arnes/comun/lote.ts`; `scripts/arnes/despachador.ts`; los tickets `noche-tres-carriles` y `lote-choca-con-main`.

## Motivo (principio 7)

Es una petición del dueño del 15-11-2026, al adaptar al repositorio el diagrama de `docs/ai-factory/`. No hay dato de dos PR de la noche que se pisaran: hasta hoy la noche lleva un solo carril. El dato cercano es el choque de `lote/1` con `main` del 15-11-2026 (ticket `lote-choca-con-main`), que es entre el lote y `main`, no entre dos PR del lote. El plan tiene que decirlo así.

## Por resolver

- **`config/alcance.json` y `docs/deuda-diseno.md`.** Casi todo carril impl los escribe, y están fuera del cómputo de solape a propósito (plan §6, «Tickets»): dos tickets que no se solapan en nada más chocarán aquí al ponerse al día. Dos salidas: resolverlos con un script al poner la rama al día (cada carril escribe su parte: su área, sus escenarios, sus filas), que es lo recomendado; o que no los escriba el carril, sino el Despachador al fusionar. La misma pregunta está en `lote-choca-con-main`.
- **Quién pone la rama al día.** El Despachador con `git rebase` y `git push --force-with-lease` en el carril, o GitHub con «Update branch». El ruleset «lote: CI» no exige hoy la rama al día.
- **La fusión automática.** Hoy la sesión activa `gh pr merge --auto --rebase` y GitHub fusiona cuando la CI pasa. Con la cola, quien fusiona es el Despachador: hay que quitar esa instrucción del aviso del carril para los PR de la noche, o dejar que GitHub exija la rama al día y haga él la cola.
- **El coste.** Cada PR que espera repite la CI, con su mutación.

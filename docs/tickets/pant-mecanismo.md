---
fase: impl
area: PANT
depende: []
toca: [docs/areas/PANT.md, docs/tickets/pant.md, docs/tickets/pant-pasos.md]
estado: hecho
---
# El «Mecanismo» de PANT

**Qué:** abre `docs/areas/PANT.md` desde `docs/areas/plantilla.md` y escribe solo el «Mecanismo» (plan §16, pasos 1 y 2): cómo funcionará el servidor con sus pantallas, los puntos de §17.8 que le tocan, cómo se prueban las pantallas, y, si pide una dependencia nueva, su licencia y su tamaño. Propone las partidas de `docs/deuda-diseno.md` que se pagarían con PANT; se pagan en el ticket `pant`. No toca código. Se puede empezar ya.

**Hecho cuando:** el dueño ha aprobado el «Mecanismo» y la elección de partidas de deuda, los dos escritos en `docs/areas/PANT.md`, y `make check` da verde.

**Leer primero:** la fila «Área `PANT`» del plan §0 (`docs/plan.md:50`); el plan §17 (`git grep -n "^### 17" -- docs/plan.md`), sobre todo §17.5 y §17.8; `features/pantallas.feature`; `docs/areas/plantilla.md`; el «Mecanismo» de `docs/areas/MATE.md`, que deja a PANT los adaptadores.

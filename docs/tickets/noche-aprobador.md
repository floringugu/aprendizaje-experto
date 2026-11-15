---
fase: impl
area: PLAN
depende: [noche-lote]
toca: [scripts/arnes/despachador.ts, scripts/arnes/comun/despachador.ts, scripts/arnes/comun/diario-noche.ts, scripts/arnes/manana.ts, .claude/agents/, tests/arnes/, CLAUDE.md, docs/plan.md, docs/ai-factory/]
estado: abierto
---
# Un Aprobador revisa de noche el trabajo de cada ticket, en una sesión propia, antes del PR

**Qué:** hoy la sesión que hace el ticket se revisa a sí misma con los revisores del plan §7, y el plan §6 deja el Aprobador «fuera de la primera versión». El dueño pidió el 15-11-2026 que exista: cuando la sesión del ticket termina con `make check` en verde, el Despachador lanza otra sesión, con el contexto limpio, que revisa el cambio y escribe sus hallazgos. Si hay hallazgos bloqueantes, vuelven a la sesión del ticket, hasta dos rondas; si siguen tras la segunda, el ticket va a la cola sin PR. Los menores no paran el PR: los enseña `make manana`. Cambia una decisión del 13-11-2026, así que este PR enmienda «Lo acordado» del plan §6 con su fecha. Es un cambio del arnés: el área PLAN solo le da nombre a la rama.

**Hecho cuando:** las reglas del Despachador tienen el estado «en revisión», con tests: sin hallazgos bloqueantes, se abre el PR; con ellos y rondas por gastar, vuelve a la sesión del ticket; con las dos rondas gastadas, a la cola con los hallazgos; `make manana` enseña los hallazgos menores de cada ticket fusionado; una pasada real muestra una revisión con hallazgos; el plan §6, §7 y §11 dicen lo construido y sus límites; `docs/ai-factory/` lo dibuja como construido, y `make check` da verde.

**Leer primero:** `docs/plan.md` §6, «Noche desatendida», «Lo acordado», y §7 (los revisores; búscalos con Grep); `docs/ai-factory/` (las cajas «Aprobador», «Revisor» y «Hallazgo», y las filas 5b a 8 de la tabla de estados); `.claude/agents/revisor-codigo.md` y `revisor-evidencia.md`; el skill `review-ticket`; `scripts/arnes/comun/despachador.ts` (`queHacer`).

## Motivo (principio 7)

Es una petición del dueño del 15-11-2026, al adaptar al repositorio el diagrama de `docs/ai-factory/`. No hay dato: no se ha medido cuántos defectos de un PR de la noche habría encontrado una segunda sesión. El plan tiene que decirlo así.

## Por resolver

- **Quién abre el PR.** Hoy lo abre la sesión del ticket. Con el Aprobador, la sesión tiene que parar antes del PR, y lo abre el Despachador o la sesión reanudada tras la revisión.
- **Qué revisa.** El skill `review-ticket` ya revisa en dos ejes, Normas y Ticket, con subagentes; está en la configuración del usuario del dueño, no en el repositorio, así que el usuario de la noche (`noche-usuario-y-tapa`) no lo tiene. `revisor-codigo` está pensado para el cierre de un área. Hay que decidir si el Aprobador es ese skill en una sesión nueva o un agente propio.
- **Dónde quedan los hallazgos.** El diagrama dice `reports/revision.md`, fuera de git, con severidad (bloqueante o menor), fichero y líneas. `reports/` de un carril se borra al retirarlo: los menores tienen que llegar a `make manana` antes.
- **Modelo y coste.** El diagrama dice Opus. Cada ticket pasa a costar al menos una sesión más, y hasta tres con las dos rondas.
- **Las specs.** Un PR de specs ya espera el visto bueno del dueño: decidir si el Aprobador las revisa también.

---
fase: impl
area: PLAN
depende: [MAST]
toca: [src/aplicacion/sesiones.ts, src/aplicacion/repasos.ts, src/aplicacion/planificador.ts, src/dominio/planificador.ts, src/aplicacion/aplicacion.ts, tests/unidad/planificador*.test.ts, package.json, package-lock.json, config/alcance.json, docs/areas/PLAN.md, docs/deuda-diseno.md]
estado: abierto
---
# PLAN: planificador de repasos

**Qué:** grueso. La primera conversación abre `docs/areas/PLAN.md`, escribe el «Mecanismo» (con `ts-fsrs`, y su licencia y su tamaño) y para hasta que el dueño lo apruebe; después divide el trabajo en tickets (plan §6, «Tickets») y este se estrecha o pasa a `descartado`. Implementa `consultarHorizontes` y `elegirHorizonte`, hoy `sinImplementar` (`src/aplicacion/aplicacion.ts:64-65`).

**Hecho cuando:** `make cerrar-area A=PLAN` da verde y el área está cerrada (plan §16), con `make check` en verde.

**Leer primero:** `features/planificador.feature`; el plan §16, paso 2 («Mecanismo»); `tests/aceptacion/pasos/planificador.ts` y `tests/aceptacion/soporte/planificador.ts`; `src/aplicacion/sesiones.ts` y `repasos.ts`.

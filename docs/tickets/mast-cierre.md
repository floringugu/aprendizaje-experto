---
fase: impl
area: MAST
depende: [mast-transferencia, mast-prepreguntas, mast-pasos-fase-avanzada]
toca: [config/alcance.json, docs/areas/MAST.md, docs/deuda-diseno.md, docs/tickets/mast-pasos-prepreguntas.md, docs/tickets/mast-prepreguntas.md, docs/tickets/mast-pasos-fase-avanzada.md]
estado: abierto
---
# Cierre de MAST

**Qué:** cierra el área con los pasos 6 a 8 del plan §16. Si queda algún escenario de MAST en rojo, lo arregla aquí y añade a `toca` lo que cambie, o crea un ticket si es grande.

**Hecho cuando:** `make cerrar-area A=MAST` da verde; `docs/areas/MAST.md` está completo; MAST está en `areas_cerradas` y sin entrada en `escenarios_en_rojo`, y `make check` da verde.

**Leer primero:** el plan §16, pasos 6 a 8 (`git grep -n "Cierro el área" -- docs/plan.md`); `docs/areas/MAST.md`.

## Detalle

- **Por qué espera (02-11-2026).** La primera conversación de este carril no pudo cerrar MAST, por dos motivos:
  - `make cerrar-area A=MAST` da 66 escenarios en verde y 2 sin definir: MAST-1.6 y 1.7, las prepreguntas de AYUD-8, que añadió `specs-prepreguntas-intermedio`. Sus pasos son de aceptación y no se pueden escribir en impl. Los recogen los tickets `mast-pasos-prepreguntas` y `mast-prepreguntas`.
  - Con MAST cerrada y sin pendientes, el planificador no deja abrir `mast-pasos-fase-avanzada` (aceptación de MAST): «MAST está cerrada y no tiene pendientes». Por eso el cierre va después de ese ticket.
- **Deuda que espera al cierre:** las partidas que apunta `mast-transferencia` en `docs/areas/MAST.md` («Deuda, para `mast-cierre`»). Más las que dejen los tickets nuevos, si las hay.

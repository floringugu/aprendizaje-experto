---
fase: impl
area: MAST
depende: [mast-transferencia]
toca: [config/alcance.json, docs/areas/MAST.md, docs/deuda-diseno.md]
estado: abierto
---
# Cierre de MAST

**Qué:** cierra el área con los pasos 6 a 8 del plan §16. Si queda algún escenario de MAST en rojo, lo arregla aquí y añade a `toca` lo que cambie, o crea un ticket si es grande.

**Hecho cuando:** `make cerrar-area A=MAST` da verde; `docs/areas/MAST.md` está completo; MAST está en `areas_cerradas` y sin entrada en `escenarios_en_rojo`, y `make check` da verde.

**Leer primero:** el plan §16, pasos 6 a 8 (`git grep -n "Cierro el área" -- docs/plan.md`); `docs/areas/MAST.md`.

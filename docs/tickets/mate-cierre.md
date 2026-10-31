---
fase: impl
area: MATE
depende: [mate-reservados, mate-mesa-y-dominio, mate-tarea-a-tare]
toca: [config/alcance.json, docs/areas/MATE.md, docs/deuda-diseno.md]
estado: abierto
---
# Cierre de MATE

**Qué:** mide los escenarios de MATE que sigan en rojo. Si son muchos, crea un ticket por grupo y para; si son pocos, los arregla aquí y añade a `toca` lo que cambie. Después cierra el área con los pasos 6 a 8 del plan §16.

**Hecho cuando:** `make cerrar-area A=MATE` da verde; `docs/areas/MATE.md` tiene el mecanismo, las interfaces descartadas, la deuda pagada, la mutación y los bloqueos; MATE está en `areas_cerradas` y sin entrada en `escenarios_en_rojo`, y `make check` da verde.

**Leer primero:** el plan §16, pasos 6 a 8 (`git grep -n "Cierro el área" -- docs/plan.md`); `docs/areas/MATE.md`; «Las opciones descartadas» de `docs/tickets/mate-mesa-y-dominio.md` y «Por qué» de `docs/tickets/mate-tarea-a-tare.md`.

## Qué se escribe en el archivo del área

- «Interfaces descartadas y por qué»: las opciones descartadas de `mate-mesa-y-dominio` (punto 1, A; punto 2, B) y de `mate-tarea-a-tare` (a).
- «Hallazgos» (`docs/areas/MATE.md:113`): MATE-6.3 ya no es de MATE.
- «Pendiente»: se borra, si los tickets `mate-*` están hechos.

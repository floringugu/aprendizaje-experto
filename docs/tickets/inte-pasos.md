---
fase: aceptacion
area: INTE
depende: []
toca: [tests/aceptacion/pasos/intercalado.ts, tests/aceptacion/soporte/intercalado.ts, config/alcance.json]
estado: abierto
---
# Pasos del objetivo nuevo y de los reservados en INTE (INTE-1.1, 4.1 a 4.3 y 5.1 a 5.4)

**Qué:** los pasos que faltan en INTE: uno de INTE-1.1, los de INTE-4.1 a 4.3 (un objetivo nuevo se practica por bloques hasta dominarlo) y los de INTE-5.1 a 5.4 (los problemas reservados entran en la mezcla tras los demás del grupo y una sola vez). Son 14 pasos sin definir en 8 escenarios. El soporte nuevo va en un fichero propio, `tests/aceptacion/soporte/intercalado.ts`, y no en `contenido.ts`, `acciones.ts` ni `mundo.ts`, que comparten todos los tickets de pasos. INTE-2.1, 2.3, 3.1 y 6.1 pasan hoy sin que INTE esté implementada: el ticket mira por qué. Si es porque la aplicación ya lo hace, quedan fuera de `escenarios_en_rojo.INTE`; si su «Entonces» no comprueba nada, se corrige.

**Hecho cuando:** `make check-aceptacion` da verde en el carril (fase aceptacion, área INTE): ninguno de los 14 escenarios de INTE tiene pasos sin definir, `escenarios_en_rojo.INTE` de `config/alcance.json` lista justo los que fallan de verdad, y los que quedan fuera pasan.

**Leer primero:** `features/intercalado.feature:30` (INTE-1.1), `:86` (regla INTE-4) y `:110` (regla INTE-5); `tests/aceptacion/pasos/intercalado.ts`; `tests/aceptacion/pasos/reservados-mast.ts` (cómo se declara un ítem reservado); el plan §6, «Pendientes de un área cerrada», para `escenarios_en_rojo`.

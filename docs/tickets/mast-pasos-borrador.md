---
fase: aceptacion
area: MAST
depende: [mate-sesiones-a-plan-inte]
toca: [tests/aceptacion/pasos/borradores-en-sesiones.ts, docs/areas/MAST.md]
estado: abierto
---
# Los pasos de MAST-7.4 no chocan con los ítems aprobados

**Qué:** MAST-7.4 (una prueba de retención no presenta el ítem I9 del borrador) usa los pasos de MATE-6.1, que se escribieron para el contenido de MATE. Los antecedentes de `features/dominio.feature` dan 20 ítems por objetivo (I1 a I60): el I9 del borrador y el I20 de `PARECIDO_A_I9` (`tests/aceptacion/pasos/borradores-en-sesiones.ts:37`) ya existen como ítems aprobados de O1, y la prueba de retención de O1 presentaría el I9 aprobado: el escenario fallaría con la aplicación bien hecha. Los pasos liberan esos dos ids del contenido aprobado, si existen, antes de añadirlos (`liberarId`, como MAST-1.4 en `docs/areas/MAST.md`), y los comentarios de `borradores-en-sesiones.ts` que nombran MATE-6.1 dicen también PLAN-4.1, MAST-7.4 e INTE-6.1, que comparten esos pasos desde el ticket `mate-sesiones-a-plan-inte`.

**Hecho cuando:** con los pasos cambiados, MATE-6.1 sigue pasando, MAST-7.4 falla de verdad en el «Cuando» («Sin implementar»), no en un «Dado», y `make check-aceptacion` da verde. En PLAN-4.1 y en INTE-6.1 los pasos no chocan con nada hoy (en INTE el I9 aprobado es un «hecho» de C3, fuera del grupo G1); si el cambio los toca, siguen como estaban.

**Leer primero:** este ticket; `features/dominio.feature` (la regla MAST-7, desde «La retención se mide en diferido», y los antecedentes); `tests/aceptacion/pasos/borradores-en-sesiones.ts:49-125`; `tests/aceptacion/soporte/contenido.ts` (`liberarId`, `idLibre`); «Decisiones de los pasos» de `docs/areas/MAST.md`.

---
fase: specs
area: MATE
depende: [mate-cierre]
toca: [docs/plan.md, docs/cobertura-investigacion.md, features/material.feature]
estado: abierto
---
# Un reservado visto en la revisión cuenta como caso nuevo, y las etiquetas de MATE dicen qué escenario se apoya en el informe

**Qué:** los tres hallazgos de `revisor-evidencia` al cerrar MATE (02-11-2026) que el dueño decidió arreglar. Uno: el plan §0 escribe que un reservado «nuevo» es uno que la persona no ha practicado, aunque lo haya visto en la revisión (MATE-4 y MATE-4.12), y se ajustan con eso las citas de «casos nuevos no vistos». El comportamiento no cambia. Dos: las etiquetas `@evidencia` de las Reglas MATE-3 y MATE-7 pasan a los escenarios que se apoyan en el informe. Tres: O1 del plan §17.6 y la cobertura dicen lo mismo de su respaldo.

**Hecho cuando:** el plan §0 («Transferencia») dice qué es un caso nuevo; I9 (plan §17.6) y la fila 39 de la cobertura casan con eso; las Reglas MATE-3 y MATE-7 no llevan etiquetas `@evidencia` y las llevan MATE-3.5 y MATE-7.1; O1 tiene el mismo respaldo en el plan y en la cobertura; `revisor-evidencia` no da hallazgos sobre esto y la comprobación de la fase da verde.

**Leer primero:** `docs/plan.md:50` (§0, «Transferencia») y `:979` (O1) y `:994` (I9); `features/material.feature:201` (Regla MATE-3), `:303-306` (descripción de MATE-4), `:401-412` (MATE-4.12) y `:484` (Regla MATE-7); `docs/cobertura-investigacion.md:43` (fila 24), `:58` (fila 39) y `:93` (O1).

## Los hallazgos

- **Medio, reservados vistos en la revisión.** Al revisar, la persona ve el enunciado, la respuesta y el feedback de los reservados, y puede quitar o poner «Reservado» (MATE-4.12). El §4 del informe define el nivel experto como «resuelve casos nuevos no vistos (transferencia cercana dentro del dominio)», e I9 lo cita. La feature ya dice que seguir contándolos como nuevos «es decisión del autor». El dueño eligió escribir en el plan §0 que «nuevo» es «no practicado, aunque visto en la revisión», no ocultarlos.
- **Leve, etiquetas.** En MATE-3 solo 3.5 se apoya en el §3: las citas (3.1 a 3.4) y los avisos (3.6, 3.7) no salen del informe. En MATE-7 solo 7.1 se apoya en el §2.2 y el §3; 7.2 y 7.3 son decisión del autor. 3.5 ya lleva `@evidencia-3`.
- **Leve, O1.** El plan rotula O1 «Respaldada para novatos» y cita solo §4, Fase 1. La cobertura la da por extrapolación, porque Kirschner (§2.3) va con (†). El §4 pone la secuencia de fases entre las extrapolaciones; la base sólida cercana es el §2.3, Tetzlaff (d = 0,505). Se cita Tetzlaff en el plan o O1 pasa a «Extrapolación».

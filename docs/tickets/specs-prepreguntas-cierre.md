---
fase: specs
area: AYUD
depende: [specs-prepreguntas-intermedio, specs-registro-calibracion]
toca: [features/instrumentacion.feature, features/bucle.feature, docs/cobertura-investigacion.md, docs/plan.md]
estado: abierto
---
# El registro, el bucle, la tabla de cobertura y el plan recogen las prepreguntas (AYUD-8)

**Qué:** specs-prepreguntas-intermedio añadió AYUD-8, y cuatro sitios fuera de su `toca` no lo mencionan. `features/instrumentacion.feature` (INST-1.3) no lista el contexto «prepregunta» de `respuestas.csv`, que AYUD-8.11 da por hecho. `features/bucle.feature` (BUCL-2.4) tiene un escenario de que el paso 1 no cuenta el intento de exploración, y falta el equivalente para las prepreguntas. `docs/cobertura-investigacion.md` no tiene fila para las prepreguntas, y el informe no las recoge (la evidencia es Soderstrom y Bjork, 2023, que está solo en el ticket y en la nota de `numero_prepreguntas`). `docs/plan.md` no anota la excepción.

**Hecho cuando:** INST-1.3 tiene la fila «en una prepregunta | prepregunta»; BUCL tiene un escenario de que el paso 1 muestra el acierto sin ayuda sin contar las prepreguntas; la tabla de cobertura recoge AYUD-8 (el revisor de evidencia decide si en una fila nueva o en la 10, fracaso productivo) y dice que su evidencia no está en el informe; el dueño decide si el plan anota las prepreguntas como extrapolación; y `make check-specs` está en verde.

**Leer primero:** features/ayuda.feature (regla AYUD-8 y su cabecera); features/instrumentacion.feature (INST-1.3, la tabla de contextos); features/bucle.feature (BUCL-2.4); docs/cobertura-investigacion.md (filas 10, 30 y 59); docs/tickets/specs-prepreguntas-intermedio.md (sección «Evidencia»).

## Por qué va aparte

`features/instrumentacion.feature` está en el `toca` de specs-registro-calibracion, abierto a la vez que specs-prepreguntas-intermedio, y los tres cambios restantes son de otros ficheros que no estaban en su `toca`. Este ticket depende de los dos para no solaparse con ninguno.

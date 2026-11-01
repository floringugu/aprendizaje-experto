---
fase: specs
area: AYUD
depende: [specs-prepreguntas-cierre]
toca: [features/ayuda.feature]
estado: abierto
---
# AYUD-8 cita el escenario correcto del bucle y etiqueta bien su procedencia

**Qué:** el revisor de evidencia, al cerrar specs-prepreguntas-cierre, encontró dos defectos en `features/ayuda.feature` (fuera del `toca` de aquel ticket). El texto de la regla AYUD-8 dice «ni en el paso 1 del bucle (BUCL-2.4)», pero BUCL-2.4 es el escenario de la exploración y el de las prepreguntas es BUCL-2.7. Y la regla lleva `@evidencia-2.2 @evidencia-3 @evidencia-4` aunque el informe no trata las prepreguntas: lo que esas secciones respaldan es la exploración antes de la instrucción y el feedback con confianza previa, no la técnica.

**Hecho cuando:** AYUD-8 cita BUCL-2.7 donde habla del paso 1 del bucle; el dueño decide si las etiquetas `@evidencia-*` se quedan solo en los escenarios que se apoyan en la exploración o el feedback (AYUD-8.7, AYUD-8.13) y el resto pasa a `@extrapolacion`, y se aplica; y `make check-specs` está en verde.

**Leer primero:** features/ayuda.feature (regla AYUD-8, líneas 475 a 520, y los escenarios AYUD-8.7 y AYUD-8.13); features/bucle.feature (BUCL-2.7); docs/cobertura-investigacion.md (nota de la fila 10).

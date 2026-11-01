---
fase: specs
area: CALI
depende: [specs-experimento-releer]
toca: [docs/cobertura-investigacion.md, docs/plan.md]
estado: hecho
---
# La tabla de cobertura y el plan recogen la excepción a RECU-1 y la exclusión de CALI-12

**Qué:** specs-experimento-releer añadió CALI-13 (el modo releer solo existe en el estudio de la mitad releída) y CALI-12 (los intentos del experimento no cuentan para la confianza ni la calibración), y `docs/cobertura-investigacion.md` no los menciona. El revisor de evidencia pidió añadir una nota a la fila 1 (recuperación, RECU-1 a RECU-4) con la excepción y su razón, y citar CALI-12 en las filas 49 y 57 (confianza y calibración). El experimento no necesita fila propia, porque el informe no lo recomienda.

**Hecho cuando:** las filas 1, 49 y 57 citan CALI-13 y CALI-12 con su nota; el dueño decide si el plan §0 anota el experimento como excepción deliberada a RECU-1 (si no, queda como extrapolación solo en las features) y, si sí, está anotado; y `make check-specs` está en verde.

**Leer primero:** docs/cobertura-investigacion.md (filas 1, 49 y 57); features/calibracion.feature, cabecera, CALI-12 y CALI-13; features/recuperacion.feature, nota de RECU-1; docs/plan.md §0 (busca «Planificador» para ver cómo se anota una excepción deliberada).

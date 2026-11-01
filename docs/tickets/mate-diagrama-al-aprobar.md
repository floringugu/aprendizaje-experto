---
fase: impl
area: MATE
depende: [mate-reservados]
toca: [src/aplicacion/contenido.ts, src/aplicacion/revision.ts, src/aplicacion/redaccion.ts, tests/unidad/revision*.ts, tests/unidad/redaccion*.ts]
estado: hecho
---
# Aprobar un ejemplo que va aparte conserva su diagrama

**Qué:** `ObjetivoContenido` y `EjemploResueltoContenido` (`src/aplicacion/contenido.ts`) no declaran `diagrama`, aunque el formato lo valida (MATE-2.7, `formato-contenido.ts`, reglas de objetivo y de ejemplo). Por eso `sinObjetivo` (`src/aplicacion/revision.ts`) copia solo `id`, `pasos` y `fuente`, y al aprobar un ejemplo que iba aparte se pierde su diagrama. La redacción sí lo conserva (`redaccion.ts`), y su test tiene que colarlo con un `Record<string, unknown>`. Lo encontró `revisor-codigo` en el carril `mate-reservados`. El fallo es anterior a ese carril.

**Hecho cuando:** los dos tipos declaran `readonly diagrama?: string`; `sinObjetivo` quita solo `objetivo` y conserva todo lo demás; un test aprueba un ejemplo aparte con diagrama y lo encuentra en el aprobado; el test de la redacción ya no necesita el `Record`, y `make check` da verde.

**Leer primero:** `sinObjetivo` y su llamada en `src/aplicacion/revision.ts` (busca `function sinObjetivo`); las reglas de objetivo y de ejemplo en `src/aplicacion/formato-contenido.ts` (busca `exigir('diagrama'`); el test de `diagrama` en `tests/unidad/redaccion.test.ts`.

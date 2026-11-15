---
fase: specs
area: MATE
depende: [recu-impl-item-numerico]
toca: [features/material.feature, config/alcance.json]
estado: hecho
---
# El contenido rechaza una unidad que la corrección no puede leer

**Qué:** una unidad que, sin espacios, empieza por dígito, coma o punto («1/s», «.5 m») pasa hoy la validación del contenido (MATE-2.12), pero la respuesta «9,81 1/s» no se lee como un número (`leerNumero` la toma por un separador de miles o un segundo decimal, RECU-5.10), así que nadie puede acertar ese ítem. Falta la regla que diga que esa unidad se rechaza al leer el contenido, en `unidades`.

**Hecho cuando:** `features/material.feature` tiene un escenario (junto a MATE-2.12 y MATE-2.13) con una unidad que empieza por dígito y otra por coma o punto, rechazadas en `unidades`; `make check-specs` da verde; y quedan los tickets de aceptación e impl que lo siguen.

**Leer primero:** `features/material.feature:206` (MATE-2.12 y 2.13); `features/recuperacion.feature` (RECU-5.10); `src/dominio/numero-escrito.ts` (`COMIENZO_DUDOSO`); `src/aplicacion/formato-contenido.ts` (`REGLAS_DE_LA_NUMERICA`).

## Detalle

- Dato: `leerNumero('9,81 1/s')` devuelve `undefined`; `leerNumero('5 %')`, `{ valor: 5, resto: '%' }`.
- Propuesta para impl, sin copiar la gramática del número en el formato: la unidad vale si `leerNumero('1 ' + unidad)?.resto` es la unidad sin espacios.

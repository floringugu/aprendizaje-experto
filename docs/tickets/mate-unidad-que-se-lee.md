---
fase: impl
area: MATE
depende: [mate-pasos-unidad-que-se-lee]
toca: [src/aplicacion/formato-contenido.ts, src/dominio/numero-escrito.ts, tests/unidad/formato-contenido*.ts, tests/unidad/numero-escrito*.ts, tests/unidad/redaccion*.ts, config/alcance.json, docs/areas/MATE.md, docs/deuda-diseno.md]
estado: abierto
---
# La aplicación aparta del borrador un ítem con una unidad que la corrección no puede leer

**Qué:** la validación del contenido (`REGLAS_DE_LA_NUMERICA` en `formato-contenido.ts`) rechaza, en `unidades`, una unidad que no se lee detrás de un número, y `incorporarEntrega` aparta el ítem con el motivo que fija MATE-2.14 («sus unidades no se pueden leer detrás de un número»). Es la misma validación del contenido de siempre, así que un contenido a mano con esa unidad también se rechaza.

**Hecho cuando:** MATE-2.14 pasa; `escenarios_en_rojo.MATE` de `config/alcance.json` ya no lo lista; hay tests unitarios de la regla (con las cuatro unidades del escenario, `«%»` y `«m/s²»` que siguen valiendo); `docs/areas/MATE.md` lo anota y `make check` da verde.

**Leer primero:** `features/material.feature` (MATE-2.12 a 2.14); `features/recuperacion.feature` (RECU-5.10); `src/dominio/numero-escrito.ts` (`COMIENZO_DUDOSO`, `leerNumero`); `src/aplicacion/formato-contenido.ts` (`REGLAS_DE_LA_NUMERICA`); el ticket `docs/tickets/mate-num-borrador.md`.

## Detalle

- Contrato que fijan los pasos (`tests/aceptacion/pasos/redaccion-rechazos.ts`): el ítem se aparta con `apartadas[].falta` igual a `unidades`; el ítem de prueba lleva `valor: 9.81` y, en `unidades`, la lista del ejemplo («m/s» y «1/s» van juntas en la misma lista).
- Propuesta, sin copiar la gramática del número en el formato: la unidad vale si `leerNumero('1 ' + unidad)?.resto` es la unidad sin espacios. `leerNumero('9,81 1/s')` devuelve `undefined`; `leerNumero('5 %')`, `{ valor: 5, resto: '%' }`.
- Una unidad con espacios por dentro («m / s») se compara sin ellos, como hace la corrección.

---
fase: impl
area: MATE
depende: [mate-pasos-num-borrador, recu-impl-item-numerico]
toca: [src/aplicacion/formato-contenido.ts, src/aplicacion/redaccion*.ts, tests/unidad/formato-contenido*.ts, tests/unidad/redaccion*.ts, config/alcance.json, docs/areas/MATE.md, docs/deuda-diseno.md]
estado: abierto
---
# La aplicación aparta del borrador un ítem numérico mal formado

**Qué:** `redactarBorrador` aparta un ítem numérico sin `valor`, con `valor` que no es un número, con `unidades` vacías, con `tolerancia` fuera de 0 a 1 o con `valor` 0 y tolerancia, y dice por qué; uno bien formado entra con su `fuente`. La validación es la de `formato-contenido.ts` que `recu-impl-item-numerico` deja para el contenido aprobado: no la dupliques, reutilízala y añade solo lo que el borrador exige de más (el motivo de cada rechazo).

**Hecho cuando:** MATE-2.12 y MATE-2.13 pasan y salen de `escenarios_en_rojo.MATE` (que queda vacío); `make cerrar-area A=MATE` da verde y `docs/areas/MATE.md` anota la mutación y la deuda de la mini área.

**Contrato que fijan los pasos** (`tests/aceptacion/pasos/redaccion-rechazos.ts`): un ítem numérico mal formado se aparta con `apartadas[].falta` igual a la propiedad de `respuesta` que falla: `valor` si falta o no es un número (un texto como «9,81» tampoco lo es), `unidades` si la lista está vacía y `tolerancia` si no es un número entre 0 y 1 o si el `valor` es 0 y la lleva. Hoy los ocho casos se apartan con `falta: 'respuesta'`. Uno bien formado entra con su `respuesta` tal cual (sin propiedades de más ni de menos) y su `fuente`, y `apartadas` queda vacía; valen la tolerancia 0, la tolerancia 1 y el valor 0 sin tolerancia.

**Leer primero:** `features/material.feature` (MATE-2.3, 2.5 y 2.12 a 2.13); `src/aplicacion/formato-contenido.ts` y `redaccion*.ts`; `docs/areas/MATE.md`.

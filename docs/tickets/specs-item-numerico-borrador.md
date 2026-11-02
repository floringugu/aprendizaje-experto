---
fase: specs
area: MATE
depende: [mate-cierre, specs-item-numerico]
toca: [features/material.feature, config/peticion-ia.md]
estado: abierto
---
# Un ítem numérico mal formado no entra en el borrador

**Qué:** `specs-item-numerico` fijó cómo se escribe un ítem numérico en el contenido (RECU-5, exigencia I11). Falta lo que MATE hace cuando la IA entrega uno mal formado, como hace con MATE-2.3 y MATE-2.5. Va aparte para no cambiar MATE mientras `mate-cierre` lo cierra.

**Hecho cuando:** los escenarios de MATE dicen qué ítem numérico se aparta del borrador y qué dice la aplicación (sin `valor`, `valor` que no es un número, `unidades` vacías, `tolerancia` fuera de 0 a 1, `valor` 0 con tolerancia), y que un ítem numérico bien formado entra con su `fuente`; MATE queda como área cerrada con pendientes en `escenarios_en_rojo`, con sus tickets de aceptación e impl; y `make check-specs` da verde.

**Leer primero:** `features/material.feature` (MATE-2.3, MATE-2.5); la regla RECU-5 de `features/recuperacion.feature`; `config/peticion-ia.md`, I11.

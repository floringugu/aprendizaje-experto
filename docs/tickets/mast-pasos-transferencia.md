---
fase: aceptacion
area: MAST
depende: []
toca: [tests/aceptacion/pasos/transferencia.ts, tests/aceptacion/pasos/dominio.ts, tests/aceptacion/soporte/contenido.ts, config/alcance.json, docs/areas/MAST.md]
estado: abierto
---
# Pasos de la transferencia y de los casos nuevos de MAST (MAST-6.7 a 6.14 y 8.1 a 8.6)

**Qué:** los pasos de MAST-6.7 a 6.14 (la transferencia con los problemas reservados) y de MAST-8.1 a 8.6 (los casos nuevos con ítems reservados), que hoy no tienen ninguno, y `escenarios_en_rojo` de MAST en `config/alcance.json`. El resto de MAST ya pasa: sin esa entrada, la fase pediría rojo a toda el área.

**Hecho cuando:** los 14 escenarios fallan de verdad (ni pendientes, ni saltados, ni en verde), `escenarios_en_rojo` lista justo esos IDs de MAST y `make check-aceptacion` da verde.

**Leer primero:** `features/dominio.feature` (MAST-6.7 a 6.14, desde la línea 155, y la regla «Los casos nuevos se miden con ítems reservados», desde la 355); `docs/areas/MAST.md`; `tests/aceptacion/pasos/dominio.ts`; `tests/aceptacion/soporte/contenido.ts`; «### Reservados (etapa 3)» de `docs/areas/MATE.md`, que define el campo `reservado` de un ítem.

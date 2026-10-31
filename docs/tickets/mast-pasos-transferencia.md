---
fase: aceptacion
area: MAST
depende: []
toca: [tests/aceptacion/pasos/transferencia.ts, tests/aceptacion/pasos/reservados-mast.ts, tests/aceptacion/pasos/exploracion.ts, tests/aceptacion/pasos/dominio.ts, tests/aceptacion/soporte/contenido.ts, config/alcance.json, docs/areas/MAST.md]
estado: hecho
---
# Pasos de la transferencia y de los casos nuevos de MAST (MAST-6.7 a 6.14 y 8.1 a 8.6)

**Qué:** los pasos de MAST-6.7 a 6.14 (la transferencia con los problemas reservados), de MAST-8.1 a 8.6 (los casos nuevos con ítems reservados) y de MAST-1.4, 1.5 y 6.6 (el intento de exploración), que hoy no tienen ninguno, y `escenarios_en_rojo` de MAST en `config/alcance.json`. MAST-1.4, 1.5 y 6.6 se añadieron porque `make check-aceptacion` no admite un escenario del área con pasos sin definir. El resto de MAST ya pasa: sin esa entrada, la fase pediría rojo a toda el área.

**Hecho cuando:** MAST-1.4, 1.5, 6.2, 6.4, 6.7 a 6.14 y 8.1 a 8.6 fallan de verdad (ni pendientes, ni saltados, ni en verde), `escenarios_en_rojo` lista justo esos 18 IDs, MAST-6.6 pasa y `make check-aceptacion` da verde. MAST-6.2 y 6.4 ya pasaban, pero la spec les añadió reservados que la aplicación de hoy cuenta como problemas normales.

**Leer primero:** `features/dominio.feature` (MAST-6.7 a 6.14, desde la línea 155, y la regla «Los casos nuevos se miden con ítems reservados», desde la 355); `docs/areas/MAST.md`; `tests/aceptacion/pasos/dominio.ts`; `tests/aceptacion/soporte/contenido.ts`; «### Reservados (etapa 3)» de `docs/areas/MATE.md`, que define el campo `reservado` de un ítem.

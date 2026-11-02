---
fase: aceptacion
area: RECU
depende: [specs-reaprendizaje-sucesivo]
toca: [tests/aceptacion/pasos/recuperacion.ts, tests/aceptacion/soporte/, config/alcance.json, docs/areas/RECU.md]
estado: abierto
---
# Pasos del reaprendizaje sucesivo en RECU (RECU-6.1 a 5.10)

**Qué:** los pasos de RECU-6.1 a 5.10 (un ítem fallado vuelve en la misma sesión hasta acertarlo), que hoy no tienen ninguno, de modo que fallen de verdad. RECU está cerrada: sus pendientes son los diez IDs de `escenarios_en_rojo.RECU` en `config/alcance.json` (RECU-6.1 a 5.10), y el resto del área sigue en verde.

**Hecho cuando:** RECU-6.1 a 5.10 fallan de verdad (ni pendientes, ni saltados, ni en verde), los demás escenarios de RECU siguen en verde y `make check-aceptacion` da verde.

**Leer primero:** `features/recuperacion.feature`, regla RECU-6 (desde el final del fichero) y sus antecedentes; `config/parametros.json` («aciertos_para_cerrar_item_en_sesion» e «items_entre_intento_y_reintento»); `tests/aceptacion/pasos/recuperacion.ts`; `docs/areas/RECU.md`.

## Detalle

- Los reintentos se identifican por el contexto `reintento` de `respuestas.csv` (INST-1.3, CALI-1.4): los pasos de CALI-1.4, CALI-2.6, CALI-4.10 y PLAN-1.5, 2.3 y 3.4 los usan, pero esos escenarios son de áreas aún sin implementar (CALI, PLAN) y no entran aquí.
- RECU-6.8 tiene diez filas, de la sesión de práctica a la prueba de un experimento: los pasos deben llegar a cada contexto con lo que ya existe en `tests/aceptacion/soporte/`.

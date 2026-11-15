---
fase: impl
area: MATE
depende: []
toca: [src/aplicacion/aplicacion.ts, src/aplicacion/bucle.ts, src/aplicacion/horas.ts, src/aplicacion/tareas.ts, src/aplicacion/exportacion.ts, src/aplicacion/sesiones.ts, src/aplicacion/dominio.ts, src/aplicacion/material.ts, tests/unidad/aplicacion*.test.ts, docs/tickets/, docs/deuda-diseno.md]
estado: abierto
---
# Cada área exporta sus casos de uso, y `aplicacion.ts` deja de editarse línea a línea

**Qué:** paga la partida D39 de `docs/deuda-diseno.md`. `crearAplicacion` enumera uno a uno los casos de uso de todas las áreas, así que cada área que se implementa edita las mismas líneas de `src/aplicacion/aplicacion.ts`. El patrón que lo evita ya está en el fichero: `...crearRevisionDelMaterial(dependencias)`, `...crearInicioSesion(…)` y `...CASOS_DE_PANTALLAS`. Con este ticket, cada grupo de casos (`CasosDeBucle`, `CasosDeHoras`, `CasosDeTareas`, `CasosDeExportacion` y los demás) sale de una función de su módulo, y `crearAplicacion` solo las reúne. Los que aún no están implementados devuelven `sinImplementar` desde su módulo. Solo refactoriza: no cambia el comportamiento. El área MATE solo le da nombre a la rama.

**Hecho cuando:** `crearAplicacion` no nombra ningún caso de uso suelto: solo reúne el grupo de cada módulo; implementar un caso que hoy es `sinImplementar` ya no toca `aplicacion.ts`; los tickets abiertos que lo llevan en `toca` solo por eso lo quitan en este PR; D39 sale de la tabla de `docs/deuda-diseno.md`, y `make check` da verde sin cambiar ningún test de aceptación.

**Leer primero:** `src/aplicacion/aplicacion.ts:39-110` (el tipo `Aplicacion` y `crearAplicacion`); `src/aplicacion/revision-del-material.ts` (`crearRevisionDelMaterial`) e `inicio-sesion.ts` (`crearInicioSesion`), que ya siguen el patrón; `src/aplicacion/sin-implementar.ts`; la fila D39 de `docs/deuda-diseno.md`.

## Dato

- 12 de los 198 commits del repositorio tocaron `src/aplicacion/aplicacion.ts` (15-11-2026).
- 7 tickets abiertos lo llevan en `toca`: `plan`, `ayud`, `hora`, `tare`, `bucl`, `inst` y `cali-pasos`. Por eso se bloquean entre sí aunque sus áreas no compartan nada más.
- Medición de los tickets impl de producto abiertos (10 tickets, 45 pares): 29 pares se solapan. `aplicacion.ts` es, con `src/interfaz/`, la ruta más repetida (7 tickets cada una).

## Por resolver

- **Cuándo.** La deuda se paga antes que el área (`docs/deuda-diseno.md`, «Cómo se paga»). `plan` es el primer ticket abierto que toca el fichero: conviene hacer este antes. No se ha puesto como dependencia de `plan`: lo decide el dueño.
- **Los casos de `CasosDeSesiones` y `CasosDeDominio`** están repartidos entre varios módulos (`practica.ts`, `respuestas.ts`, `repasos.ts`, `sesion-en-curso.ts`, `criterio-dominio.ts`, `diagnostico.ts`, `progreso.ts`). Hay que decidir si cada módulo exporta su parte, como ya hace `casosDeSesionEnCurso`, o si se reúnen en `sesiones.ts` y `dominio.ts`. Si hace falta tocar un módulo que no está en `toca`, se añade en el mismo PR.
- **`src/interfaz/`** es la otra ruta que comparten 7 tickets. No es de este ticket: la carpeta aún no existe, y el ticket `pant` pide una pantalla por fichero.

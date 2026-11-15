---
fase: impl
area: RECU
depende: [recu-pasos-reintentos]
toca: [src/dominio/reintentos.ts, src/aplicacion/sesiones.ts, src/aplicacion/aplicacion.ts, src/aplicacion/practica.ts, src/aplicacion/repasos.ts, src/aplicacion/respuestas.ts, src/aplicacion/parametros.ts, tests/unidad/reintentos.test.ts, config/alcance.json, docs/areas/RECU.md, docs/deuda-diseno.md]
estado: abierto
---
# El reaprendizaje sucesivo en RECU (RECU-6.1 a 5.10)

**Qué:** un ítem fallado vuelve en la misma sesión (de práctica, de repaso o intercalada) tras `items_entre_intento_y_reintento` ítems de otros, hasta `aciertos_para_cerrar_item_en_sesion` reintentos acertados. El reintento tiene el mismo feedback que cualquier respuesta, no pide confianza y se registra con el contexto `reintento` y la confianza vacía. No vuelven los ítems del diagnóstico, de las pruebas de retención, de la exploración, de las prepreguntas, de los experimentos ni los reservados. Terminar la sesión sin acertarlo no arrastra el ítem a la siguiente. Quien lo implemente añade a `toca` lo que cambie en `src/`.

**Hecho cuando:** RECU-6.1 a 5.10 pasan, salen de `escenarios_en_rojo.RECU` en `config/alcance.json`, `make cerrar-area A=RECU` da verde y `make check` da verde.

**Leer primero:** `features/recuperacion.feature` (RECU-6); `docs/areas/RECU.md`; los pasos del ticket `recu-pasos-reintentos` (`tests/aceptacion/pasos/reintentos.ts`, con el contrato en su cabecera, y `tests/aceptacion/soporte/reintentos.ts`); `src/aplicacion/sesiones.ts` y `src/aplicacion/respuestas.ts`.

## Detalle

- Dónde se queda lo que cuenta el reintento: no lo cuenta el dominio (MAST-1.8, MAST-4.2, que son del ticket `mast-reintentos`), ni la calibración (CALI-2.6, CALI-4.10) ni el planificador (PLAN-1.5, 2.3 y 3.4), que son de CALI y PLAN. Este ticket solo deja el reintento registrado y distinguible por su contexto.
- `specs-variantes-items` puede cambiar qué ítem vuelve (una variante en lugar del mismo enunciado): si se abre antes que este ticket, mirar cómo cuenta el reintento con una variante.
- Contrato que fijan los pasos (firmas sin cuerpo en `src/aplicacion/sesiones.ts`, y `CASOS_DE_REINTENTOS` con `sinImplementar` en `src/aplicacion/aplicacion.ts`): los contextos `reintento`, `experimento_estudio` y `experimento_prueba`; `reintento?: true` en el elemento de sesión; `consultarSesion` y `terminarSesion`; y `responderItem` devuelve `RespuestaRecogida`, que en un reintento trae ya el feedback.
- RECU-6.7: el «Cuando» falla un reintento antes de terminar la sesión. El paso compara `consultarRepasos` antes y después del fallo; hoy `consultarRepasos` solo da pruebas de retención (PLAN está sin implementar), así que esa comprobación ya pasa.
- RECU-6.8: la exploración, las prepreguntas y los experimentos no tienen sesión propia. El paso falla el ítem con su contexto dentro de una sesión de práctica y solo comprueba que no vuelve.
- RECU-6.8, filas intercaladas: el paso no lleva a la persona a la fase avanzada. Si INTE la exige para intercalar, habrá que cambiar el paso (ticket de aceptación).

---
fase: aceptacion
area: MAST
depende: [mast-transferencia, mast-pasos-prepreguntas]
toca: [tests/aceptacion/soporte/acciones.ts, tests/aceptacion/pasos/contenido.ts, docs/areas/MAST.md]
estado: abierto
---
# Llegar a la fase avanzada en los pasos pasa también la transferencia

**Qué:** desde `mast-transferencia`, la fase avanzada exige superar la transferencia con al menos `minimo_problemas_reservados` problemas reservados (MAST-6.7). Pero `llegarAFase(…, 'avanzado_experto')` (`tests/aceptacion/soporte/acciones.ts`) solo acierta los problemas intercalables, así que la persona se queda en la fase intermedia. El paso «que la persona está en la fase {texto}» no lo nota, porque no comprueba la fase. Hoy no rompe ningún escenario: los que lo usan (en TARE, el paso de la fase y `practicarTarea`; INTE-1.1 en la fila «avanzado_experto», y los de AYUD con esa fase) fallan por pasos sin definir o sin implementar. Cuando se implementen, fallarían lejos de la causa. Por eso dependen de este ticket `tare`, `ayud` e `inte`.

**Hecho cuando:** `llegarAFase(…, 'avanzado_experto')` añade problemas reservados de una categoría con grupo y los acierta, al menos `minimo_problemas_reservados` y leído de la configuración, antes de evaluar la fase; el paso «que la persona está en la fase {texto}» falla si la persona no queda en la fase pedida; los escenarios que hoy pasan siguen pasando, y `make check-aceptacion` da verde.

**Leer primero:** `tests/aceptacion/soporte/acciones.ts:145-171` (`superarProblemasIntercalados` y `llegarAFase`); `tests/aceptacion/pasos/contenido.ts:61-73` (`ponerEnFase`); `src/dominio/transferencia.ts` (`evaluarTransferencia`); `features/dominio.feature`, MAST-6.7 a 6.14; `docs/areas/MAST.md`, «Transferencia y exploración».

## Detalle

- Lo encontró la conversación de impl de `mast-transferencia`, que comparó todas las features antes y después del cambio: ninguna pasa de verde a rojo, pero el paso de la fase avanzada ya no la alcanza.
- Los reservados que se añadan no deben cambiar lo que cuentan otros escenarios: un reservado no cuenta para el dominio ni entra en la práctica ni en los repasos (MAST-8.1, 8.2), pero sí en la sesión intercalada de su grupo (INTE).
- Depende de `mast-pasos-prepreguntas` (02-11-2026): mientras MAST-1.6 y 1.7 no tengan pasos, `make check-aceptacion` falla en el área MAST por escenarios sin definir, y este ticket no puede añadirlos a `escenarios_en_rojo` porque `config/alcance.json` no está en su `toca`.
- `EvaluacionFase` ya tiene en `src/` los tres campos que `tests/aceptacion/pasos/transferencia.ts` declara por intersección. Se puede quitar la intersección si este ticket toca ese fichero; si no, se queda como está.

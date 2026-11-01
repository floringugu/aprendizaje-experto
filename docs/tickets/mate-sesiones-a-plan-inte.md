---
fase: specs
area: MATE
depende: []
toca: [features/material.feature, features/planificador.feature, features/intercalado.feature, features/dominio.feature, config/alcance.json, docs/areas/MATE.md, docs/areas/MAST.md, docs/tickets/mast-transferencia.md, docs/tickets/mast-pasos-borrador.md, docs/tickets/mate-cierre.md]
estado: hecho
---
# Tres ejemplos de MATE-6.1 pasan a PLAN e INTE

**Qué:** los ejemplos «los repasos del día», «una prueba de retención de O1» y «una sesión intercalada» de MATE-6.1 (`features/material.feature:464-466`) llaman a sesiones que MATE no implementa: los repasos de ítems son del planificador (`consultarRepasos` solo da pruebas de retención), `iniciarSesion` da «Sin implementar» para el tipo `retencion`, y la sesión intercalada no existe. Con ellos, MATE no se puede cerrar hasta que PLAN e INTE estén cerradas, y `pant` depende de MATE: un ciclo. Se mueven a la regla de PLAN o de INTE que les toca (la retención, a la de PLAN o MAST, la que implemente `iniciarSesion` de ese tipo: se decide al leerlas), con ID de esa área y sus etiquetas de evidencia. MATE-6.1 se queda con el diagnóstico y la práctica, que pasan, y deja de figurar en `escenarios_en_rojo.MATE`. Los pasos de los ejemplos movidos siguen en `tests/aceptacion/pasos/borradores-en-sesiones.ts`, que esta fase no toca; si hay que moverlos o reetiquetarlos es de un ticket `aceptacion`, y el que mueve los ejemplos lo crea en el mismo PR.

**Hecho cuando:** MATE-6.1 tiene solo los ejemplos del diagnóstico y de la práctica; los tres movidos están en `features/planificador.feature`, `features/dominio.feature` (la retención) o `features/intercalado.feature`, con su ID y sus etiquetas de evidencia, y sus pasos siguen definidos; MATE-6.1 no está en `escenarios_en_rojo.MATE`; `docs/areas/MATE.md` lo anota; el revisor de evidencia no ve nada grave y `make check-specs` da verde.

**Leer primero:** este ticket; `docs/tickets/mate-tarea-a-tare.md` (el mismo movimiento con MATE-6.3); `features/material.feature` (la regla MATE-6, desde «Un borrador nunca aparece en una sesión»); las reglas de sesiones de `features/planificador.feature` y `features/intercalado.feature`; `tests/aceptacion/pasos/borradores-en-sesiones.ts:99-125`; la sección «Escenarios en rojo» de `docs/areas/MATE.md`.

## Por qué

`make cerrar-area A=MATE` exige la aceptación del área en verde y MATE-6.1 no puede estarlo sin PLAN ni INTE. Las opciones eran:

- **a)** esperar a PLAN e INTE antes de cerrar MATE. Descartada: `pant` depende de MATE y INTE de `pant`, un ciclo que `make tickets` rechaza;
- **b)** implementar repasos, retención e intercalada dentro de MATE. Descartada: sus escenarios pasarían en verde antes de su área, el mismo problema que la etapa 3 de `estado-aceptacion`;
- **c)** mover los tres ejemplos a las áreas que los implementan, como MATE-6.3. Es la elegida.

## Cómo quedó

- Los repasos del día, a PLAN-4.1 (regla nueva «Un ítem del borrador no se repasa»); la sesión intercalada, a INTE-6.1 (regla nueva «Un problema del borrador no entra en la mezcla», con la fase intermedia en sus antecedentes); la prueba de retención, a MAST-7.4, en la regla MAST-7.
- La retención va a MAST y no a PLAN, aunque el «Hecho cuando» del ticket nombraba solo PLAN e INTE: el «Qué» dejaba elegir entre PLAN y MAST, y `iniciarSesion` de tipo `retencion` lo implementa MAST (MAST-8.3 la usa y `mast-transferencia` toca `practica.ts`). En PLAN, el escenario pasaría antes de que empezara el área, el problema de la opción b. Por eso el ticket toca ahora `features/dominio.feature` y `config/alcance.json` lista MAST-7.4 en `escenarios_en_rojo.MAST`.
- Los pasos no se han cambiado (esta fase no toca `tests/aceptacion/`), pero los de MAST-7.4 chocan con los 20 ítems por objetivo de los antecedentes de `dominio.feature`: lo arregla el ticket nuevo `mast-pasos-borrador`, del que depende `mast-transferencia`, que ahora cubre también MAST-7.4.
- Con cucumber, los tres escenarios pasan los «Dado» y fallan en el «Cuando»: PLAN-4.1, porque no hay repasos de ítems; MAST-7.4, por «Sin implementar»; INTE-6.1, porque la sesión sin objetivo se rechaza. MATE-6.1 pasa con sus dos ejemplos.

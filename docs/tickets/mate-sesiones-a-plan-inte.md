---
fase: specs
area: MATE
depende: []
toca: [features/material.feature, features/planificador.feature, features/intercalado.feature, config/alcance.json, docs/areas/MATE.md]
estado: abierto
---
# Tres ejemplos de MATE-6.1 pasan a PLAN e INTE

**Qué:** los ejemplos «los repasos del día», «una prueba de retención de O1» y «una sesión intercalada» de MATE-6.1 (`features/material.feature:464-466`) llaman a sesiones que MATE no implementa: los repasos de ítems son del planificador (`consultarRepasos` solo da pruebas de retención), `iniciarSesion` da «Sin implementar» para el tipo `retencion`, y la sesión intercalada no existe. Con ellos, MATE no se puede cerrar hasta que PLAN e INTE estén cerradas, y `pant` depende de MATE: un ciclo. Se mueven a la regla de PLAN o de INTE que les toca (la retención, a la de PLAN o MAST, la que implemente `iniciarSesion` de ese tipo: se decide al leerlas), con ID de esa área y sus etiquetas de evidencia. MATE-6.1 se queda con el diagnóstico y la práctica, que pasan, y deja de figurar en `escenarios_en_rojo.MATE`. Los pasos de los ejemplos movidos siguen en `tests/aceptacion/pasos/borradores-en-sesiones.ts`, que esta fase no toca; si hay que moverlos o reetiquetarlos es de un ticket `aceptacion`, y el que mueve los ejemplos lo crea en el mismo PR.

**Hecho cuando:** MATE-6.1 tiene solo los ejemplos del diagnóstico y de la práctica; los tres movidos están en `features/planificador.feature` o `features/intercalado.feature`, con su ID y sus etiquetas de evidencia, y sus pasos siguen definidos; MATE-6.1 no está en `escenarios_en_rojo.MATE`; `docs/areas/MATE.md` lo anota; el revisor de evidencia no ve nada grave y `make check-specs` da verde.

**Leer primero:** este ticket; `docs/tickets/mate-tarea-a-tare.md` (el mismo movimiento con MATE-6.3); `features/material.feature` (la regla MATE-6, desde «Un borrador nunca aparece en una sesión»); las reglas de sesiones de `features/planificador.feature` y `features/intercalado.feature`; `tests/aceptacion/pasos/borradores-en-sesiones.ts:99-125`; la sección «Escenarios en rojo» de `docs/areas/MATE.md`.

## Por qué

`make cerrar-area A=MATE` exige la aceptación del área en verde y MATE-6.1 no puede estarlo sin PLAN ni INTE. Las opciones eran:

- **a)** esperar a PLAN e INTE antes de cerrar MATE. Descartada: `pant` depende de MATE y INTE de `pant`, un ciclo que `make tickets` rechaza;
- **b)** implementar repasos, retención e intercalada dentro de MATE. Descartada: sus escenarios pasarían en verde antes de su área, el mismo problema que la etapa 3 de `estado-aceptacion`;
- **c)** mover los tres ejemplos a las áreas que los implementan, como MATE-6.3. Es la elegida.

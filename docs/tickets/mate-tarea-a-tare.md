---
fase: specs
area: MATE
depende: []
toca: [features/material.feature, features/tareas.feature]
estado: hecho
---
# MATE-6.3 pasa a las tareas (TARE)

**Qué:** la decisión b del dueño (25-10-2026): el escenario MATE-6.3 (`features/material.feature:472`) pasa a `features/tareas.feature`, con un ID de TARE, porque su paso llama a `pedirTarea`, de TARE-1.1. MATE se cierra con 6.1, 6.2, 6.4 y 6.5, y no implementa `pedirTarea`.

**Hecho cuando:** MATE-6.3 ya no está en `features/material.feature`, el mismo escenario está en la regla de TARE que le toca, con su ID y sus etiquetas de evidencia, el revisor de evidencia no ve nada grave y `make check-specs` da verde.

**Leer primero:** este ticket; `features/material.feature` (la regla MATE-6); la regla TARE-1 de `features/tareas.feature` («En la fase avanzada se practica con tareas representativas»); `tests/aceptacion/pasos/borradores-en-sesiones.ts`, solo para ver qué hace el paso.

## Por qué

El paso de MATE-6.3 llama a `pedirTarea`, que es `sinImplementar` (`src/aplicacion/aplicacion.ts:71`), y `make cerrar-area A=MATE` exige la aceptación del área en verde. Las opciones eran:

- **a)** implementar `pedirTarea` en MATE: TARE-1.1, 1.4 y 1.5 pasarían en verde antes de su área, el mismo problema que la etapa 3 de `estado-aceptacion`. Descartada: va a «Interfaces descartadas y por qué» de `docs/areas/MATE.md` al cerrar el área (ticket `mate-cierre`);
- **b)** pasar el escenario a `tareas.feature` y cerrar MATE sin él. Es la elegida.

El comentario de `tests/aceptacion/pasos/borradores-en-sesiones.ts:35`, que nombra MATE-6.3, lo cambia el ticket `mate-pasos-reservados`: esta fase no toca `tests/aceptacion/`.

---
fase: impl
area: MATE
depende: []
toca: [src/aplicacion/mesa-guardada.ts, src/aplicacion/material-guardado.ts, src/aplicacion/revision-del-material.ts, src/aplicacion/material.ts, src/aplicacion/dependencias.ts, src/aplicacion/estado.ts, src/aplicacion/dominio-valido.ts, tests/unidad/material*.test.ts, tests/unidad/revision-del-material*.test.ts, tests/unidad/ver-fuente.test.ts, tests/unidad/formato-contenido-piezas.ts, tests/unidad/dominio-valido.test.ts]
estado: hecho
---
# Las rutas de la mesa en un solo sitio, y el dominio validado al entrar

**Qué:** las decisiones B y A del dueño (25-10-2026) sobre el código de la revisión de MATE: `mesa-guardada.ts` reúne las rutas y los bytes de la mesa, y `dominioValido` rechaza el dominio que escribiría fuera de la carpeta de datos. Sin comportamiento nuevo para la persona: los escenarios de MATE no cambian.

**Hecho cuando:** `leerContenido` es `contenidoDeFicheros(ficheros)`, las rutas y `codificarJson` están solo en `mesa-guardada.ts`, ningún dominio llega a una ruta sin pasar por `dominioValido`, los tests unitarios cubren el rechazo con `campo` `dominio`, y `make check` da verde.

**Leer primero:** este ticket; `reports/revisor-codigo-MATE.md` (en la carpeta principal: `reports/` no se versiona); `docs/deuda-diseno.md` (D22, por el `campo` nuevo); `features/material.feature` (MATE-6, las sesiones que leen lo aprobado).

## Las decisiones

1. **B, un solo sitio para rutas y bytes:** `mesa-guardada.ts` con las rutas, `codificarJson` y `leerJson`, `leerMesa` y `escribirPar`, y `leerContenido` (`src/aplicacion/dependencias.ts:26`) pasa a ser `contenidoDeFicheros(ficheros)`, que se lo da a quien arranca la aplicación. Hoy `codificarJson` está dos veces (`material-guardado.ts:177` y `revision-del-material.ts:211`), y el aprobado se lee por dos caminos: `Dependencias.leerContenido`, para las sesiones (`estado.ts:240`), y `Ficheros` con `contenido/<d>.json`, para la revisión.
2. **A, validar al entrar:** `dominioValido(dominio): Resultado<string>`, que rechaza con `campo` `dominio`, y lo llaman los casos de uso que reciben un dominio. Hoy el dominio va sin validar dentro de las rutas (`carpetaDelMaterial` y `rutaDelIndice` en `material-guardado.ts:104`, `rutaDelBorrador` y `rutaDelAprobado` en `revision-del-material.ts:207`): con `../` se escribe fuera de la carpeta. Qué caracteres se admiten lo propone esta conversación, y para con `[DECISIÓN PENDIENTE]` antes de escribirlo.

## Las opciones descartadas

Van a «Interfaces descartadas y por qué» de `docs/areas/MATE.md` al cerrar el área (ticket `mate-cierre`).

- En el punto 1, **A, un solo lector:** `enDominio` lee el aprobado por `mesa-guardada.ts` y se quita `leerContenido`. Coste: cambia `Dependencias`, y `tests/aceptacion/soporte/mundo.ts:166`, de otra fase, ya no podría tener `contenidoEscrito ?? contenidos.get` y escribiría el contenido por `Ficheros`. Queda para cuando PANT construya el servidor y las `Dependencias` (ticket `pant`).
- En el punto 2, **B, que `Ficheros` rechace las rutas que salgan de la carpeta de datos:** un solo sitio, que protege también las áreas siguientes. Coste: el puerto lanzaría un error en vez de rechazar con `campo`, y el doble de `Ficheros` de `mundo.ts` tendría que imitarlo. Queda como defensa para el adaptador real de PANT (ticket `pant`).

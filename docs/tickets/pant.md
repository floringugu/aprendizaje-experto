---
fase: impl
area: PANT
depende: [pant-pasos, MAST, MATE, PLAN]
toca: [src/, tests/unidad/, tsconfig.json, knip.json, .dependency-cruiser.cjs, eslint.config.js, stryker.config.json, package.json, package-lock.json, config/alcance.json, docs/areas/PANT.md, docs/deuda-diseno.md]
estado: abierto
---
# PANT: servidor y pantallas

**Qué:** grueso: la primera conversación lo divide en tickets (plan §6, «Tickets») y este se estrecha o pasa a `descartado`. Es el servidor (`src/interfaz/servidor.ts`, con `node:http`), la persistencia del estado, el emparejamiento por QR (§17.5), los adaptadores de MATE y las pantallas de DIAG, RECU, MAST, MATE y PLAN, más Ajustes, según el «Mecanismo» de `docs/areas/PANT.md`. De MATE le quedan dos defensas (ticket `mate-mesa-y-dominio`, «Las opciones descartadas»): un solo lector del aprobado, sin `leerContenido`, al construir las `Dependencias`, y que el adaptador de `Ficheros` rechace las rutas fuera de la carpeta de datos.

**Hecho cuando:** `make cerrar-area A=PANT` da verde y el área está cerrada (plan §16, pasos 3 a 8), con `make check` en verde.

**Leer primero:** `docs/areas/PANT.md`; la fila «Área `PANT`» del plan §0 (`docs/plan.md:50`); el plan §17; `docs/tickets/mate-mesa-y-dominio.md`; `src/aplicacion/dependencias.ts` y `puertos.ts`.

---
fase: impl
area: PANT
depende: [pant-pasos, MAST, plan, mate-num-borrador, mate-primer-release]
toca: [src/, tests/unidad/, tsconfig.json, knip.json, .dependency-cruiser.cjs, eslint.config.js, stryker.config.json, package.json, package-lock.json, config/alcance.json, docs/areas/PANT.md, docs/deuda-diseno.md]
estado: abierto
---
# PANT: servidor y pantallas

**Qué:** grueso: la primera conversación lo divide en tickets (plan §6, «Tickets») y este se estrecha o pasa a `descartado`. Es el servidor (`src/interfaz/servidor.ts`, con `node:http`), la persistencia del estado, el emparejamiento por QR (§17.5), los adaptadores de MATE y las pantallas de DIAG, RECU, MAST, MATE y PLAN, más Ajustes, según el «Mecanismo» de `docs/areas/PANT.md`. De MATE le queda una defensa (ticket `mate-mesa-y-dominio`, «Las opciones descartadas»): que el adaptador de `Ficheros` rechace las rutas fuera de la carpeta de datos. La otra, un solo lector del aprobado sin `leerContenido`, ya la hizo aaaef10. Depende de los tickets `plan`, `mate-num-borrador` y `mate-primer-release` en vez de las áreas PLAN y MATE: con las áreas, los specs aparcados de PLAN y de MATE, que esperan a `PANT`, cerrarían un ciclo. `mate-primer-release` es lo de MATE que entra antes de las pantallas (páginas sin texto y redactar desde una página web).

**Hecho cuando:** `make cerrar-area A=PANT` da verde y el área está cerrada (plan §16, pasos 3 a 8), con `make check` en verde.

**Leer primero:** `docs/areas/PANT.md`; la fila «Área `PANT`» del plan §0 (`docs/plan.md:50`); el plan §17; `docs/tickets/mate-mesa-y-dominio.md`; `src/aplicacion/dependencias.ts` y `puertos.ts`.

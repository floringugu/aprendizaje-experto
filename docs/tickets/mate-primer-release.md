---
fase: impl
area: MATE
depende: [mate-pasos-primer-release]
toca: [src/aplicacion/texto-pdf.ts, src/aplicacion/material.ts, src/aplicacion/material-guardado.ts, src/aplicacion/redaccion.ts, src/aplicacion/puertos.ts, src/aplicacion/texto-html.ts, tests/unidad/texto-pdf.test.ts, tests/unidad/material*.test.ts, tests/unidad/redaccion*.ts, tests/unidad/texto-html.test.ts, config/alcance.json, docs/areas/MATE.md, docs/deuda-diseno.md]
estado: abierto
---
# La aplicación avisa de las páginas sin texto y redacta desde una página web

**Qué:** lo que `specs-mate-primer-release` especifica: al añadir un PDF, la aplicación detecta las páginas sin texto y da el aviso o el rechazo de los escenarios; y `redactarBorrador` y `pedirMasReservados` dejan de rechazar una página web con `documento_sin_pdf` y le pasan a la IA lo que diga el «Mecanismo» (cambia el puerto `RedactorIa`). `pant` depende de este ticket: el adaptador de Claude Code de PANT se escribe ya contra el puerto nuevo. Quien lo implemente añade a `toca` lo que cambie en `src/`.

**Hecho cuando:** los escenarios de `escenarios_en_rojo.MATE` pasan y salen de la lista (que queda vacía); `make cerrar-area A=MATE` da verde, `docs/areas/MATE.md` anota la mutación y la deuda de la mini área, y `make check` da verde.

**Leer primero:** `docs/tickets/specs-mate-primer-release.md`; los escenarios de `escenarios_en_rojo.MATE` en `features/material.feature`; `src/aplicacion/texto-pdf.ts`, `material.ts` y `material-guardado.ts`; `RedactorIa` en `src/aplicacion/puertos.ts` y `src/aplicacion/redaccion.ts`; `docs/areas/MATE.md`.

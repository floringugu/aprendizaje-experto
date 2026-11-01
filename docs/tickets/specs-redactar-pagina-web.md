---
fase: specs
area: MATE
depende: [mate-reservados]
toca: [features/material.feature, docs/areas/MATE.md, docs/plan.md]
estado: abierto
---
# La IA redacta un borrador a partir de una página web

**Qué:** hoy `redactarBorrador` y `pedirMasReservados` rechazan una página HTML con `causa` `documento_sin_pdf`, porque el índice del material no le guarda PDF y el puerto `RedactorIa` solo recibe `pdf` (decisión del dueño del 01-11-2026, en el carril `mate-reservados`). Hay que decidir cómo la lee la IA: su texto, ya sacado al añadirla, o la copia HTML. El cambio llega al puerto y al adaptador de Claude Code de PANT. Si se decide redactar desde la web, hace falta un escenario en MATE-2.

**Hecho cuando:** el mecanismo de MATE dice qué recibe la IA de una página web, con el escenario si hace falta, y `make check-specs` da verde.

**Leer primero:** el paso 4, «Redactar», de «Cómo funciona por dentro» en `docs/areas/MATE.md`; `RedactorIa` en `src/aplicacion/puertos.ts`; `guardarDocumento` y `pdfDelDocumento` en `src/aplicacion/material-guardado.ts`; el adaptador `claude-code-en-pc.ts` en `docs/areas/PANT.md`.

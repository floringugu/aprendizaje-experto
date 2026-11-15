---
fase: specs
area: MATE
depende: [mate-cierre, mate-reservados]
toca: [features/material.feature, docs/plan.md, docs/cobertura-investigacion.md, docs/areas/MATE.md, config/parametros.json, config/alcance.json]
estado: abierto
---
# Lo de MATE que entra antes de las pantallas: páginas sin texto, redactar desde una página web y los hallazgos de evidencia

**Qué:** un solo cambio de specs de MATE con los tres que el dueño decidió meter en el primer release (15-11-2026), para que el área se reabra una vez y no tres. Uno, páginas sin texto, en su forma mínima: al añadir un PDF con páginas sin capa de texto, la persona ve un aviso con la lista de páginas o un rechazo; sin OCR. Dos, redactar desde una página web: qué recibe la IA de una página HTML, que hoy `redactarBorrador` y `pedirMasReservados` rechazan con `documento_sin_pdf`. Tres, los hallazgos de `revisor-evidencia` al cerrar MATE, que no cambian el comportamiento. Sustituye a `specs-paginas-sin-texto`, `specs-redactar-pagina-web` y `specs-mate-evidencia`, que pasan a `descartado`.

**Hecho cuando:** los escenarios de `features/material.feature` dicen qué es una página sin texto y qué ve la persona al añadir un PDF con todas o con algunas así; el «Mecanismo» de `docs/areas/MATE.md` dice qué recibe la IA de una página web, con su escenario en MATE-2 si se redacta desde ella; el plan §0 («Transferencia») dice qué es un caso nuevo, I9 y la fila 39 de la cobertura casan con eso, las Reglas MATE-3 y MATE-7 no llevan `@evidencia` y las llevan MATE-3.5 y MATE-7.1, y O1 tiene el mismo respaldo en el plan y en la cobertura; los escenarios nuevos o cambiados están en `escenarios_en_rojo.MATE` de `config/alcance.json`; `revisor-evidencia` no da hallazgos y `make check-specs` da verde.

**Leer primero:** `features/material.feature`, regla «El material se añade en PDF, PPTX, DOCX o URL» (MATE-1.1 a 1.3), `:201` (Regla MATE-3), `:303-306` y `:401-412` (MATE-4 y 4.12) y `:484` (Regla MATE-7); `src/aplicacion/texto-pdf.ts` (`pdf_ilegible`, «Una página sin texto da ''»); el paso 4, «Redactar», de «Cómo funciona por dentro» en `docs/areas/MATE.md`; `RedactorIa` en `src/aplicacion/puertos.ts`; `docs/plan.md:50` (§0, «Transferencia»), `:979` (O1) y `:994` (I9); `docs/cobertura-investigacion.md:43`, `:58` y `:93`.

## Páginas sin texto (de `specs-paginas-sin-texto`)

La app saca el texto con `pdftotext` (`src/aplicacion/texto-pdf.ts`), y una página escaneada sin capa de texto da `''`. Ningún escenario trata ese caso: un PDF escaneado entra en el material y falla después en silencio, porque la IA no recibe texto o porque sus citas no se pueden comprobar (G1) y todo sale con «Cita no encontrada».

Decidido por el dueño (15-11-2026): forma mínima, aviso o rechazo, sin OCR. Queda por decidir en el carril:

- **Umbral de «sin texto».** ¿Solo `''`, o también páginas con muy pocos caracteres (un número de página, una cabecera)? Si hay umbral, va a `config/parametros.json` como extrapolación del autor.
- **Aviso o rechazo.** Con todas las páginas vacías, rechazo parece claro. Con algunas, ¿aviso y se añade igual, sabiendo que esas páginas no darán piezas?
- **Qué recibe la IA.** Si recibe el PDF y lee las imágenes, puede redactar piezas de páginas sin texto cuyas citas no se pueden comprobar. Decidir si eso se permite.

El OCR (`ocrmypdf`) queda fuera: si se quiere después, es un ticket specs nuevo, aparcado como los demás.

## Redactar desde una página web (de `specs-redactar-pagina-web`)

Hoy `redactarBorrador` y `pedirMasReservados` rechazan una página HTML con `causa` `documento_sin_pdf`, porque el índice del material no le guarda PDF y el puerto `RedactorIa` solo recibe `pdf` (decisión del dueño del 01-11-2026, en el carril `mate-reservados`). Hay que decidir cómo la lee la IA: su texto, ya sacado al añadirla, o la copia HTML. El cambio llega al puerto y al adaptador de Claude Code de PANT: por eso entra antes de `pant`. Ver también `guardarDocumento` y `pdfDelDocumento` en `src/aplicacion/material-guardado.ts` y el adaptador `claude-code-en-pc.ts` en `docs/areas/PANT.md`.

## Los hallazgos de evidencia (de `specs-mate-evidencia`)

- **Medio, reservados vistos en la revisión.** Al revisar, la persona ve el enunciado, la respuesta y el feedback de los reservados, y puede quitar o poner «Reservado» (MATE-4.12). El §4 del informe define el nivel experto como «resuelve casos nuevos no vistos (transferencia cercana dentro del dominio)», e I9 lo cita. La feature ya dice que seguir contándolos como nuevos «es decisión del autor». El dueño eligió escribir en el plan §0 que «nuevo» es «no practicado, aunque visto en la revisión», no ocultarlos. El comportamiento no cambia.
- **Leve, etiquetas.** En MATE-3 solo 3.5 se apoya en el §3: las citas (3.1 a 3.4) y los avisos (3.6, 3.7) no salen del informe. En MATE-7 solo 7.1 se apoya en el §2.2 y el §3; 7.2 y 7.3 son decisión del autor. 3.5 ya lleva `@evidencia-3`.
- **Leve, O1.** El plan rotula O1 «Respaldada para novatos» y cita solo §4, Fase 1. La cobertura la da por extrapolación, porque Kirschner (§2.3) va con (†). El §4 pone la secuencia de fases entre las extrapolaciones; la base sólida cercana es el §2.3, Tetzlaff (d = 0,505). Se cita Tetzlaff en el plan o O1 pasa a «Extrapolación».

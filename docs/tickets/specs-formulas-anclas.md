---
fase: specs
area: MATE
depende: [mate-cierre, specs-paginas-sin-texto]
toca: [features/material.feature, config/peticion-ia.md, config/parametros.json]
estado: abierto
---
# Las fórmulas se escriben en LaTeX y se citan con un ancla de texto y un recorte del PDF

**Qué:** `pdftotext -raw` rompe las fórmulas (fracciones partidas, subíndices y superíndices perdidos), así que una pieza que cite una fórmula no puede pasar G1 con la comparación literal: todo saldría con «Cita no encontrada». Especificar que el contenido admite LaTeX y que una fórmula se cita con un ancla: página, varias palabras antes y varias después. La app comprueba el ancla con el texto de Poppler, calcula la caja con `pdftotext -bbox-layout` y recorta esa zona con `pdftoppm`. La persona compara el recorte con la fórmula renderizada al revisar la pieza. Sin dependencias nuevas: las dos herramientas son del Poppler que ya se exige.

**Hecho cuando:** los escenarios fijan el formato del LaTeX en el contenido, la forma del ancla, cuándo un ancla es válida, qué marca lleva la pieza si no lo es, qué ve la persona en la revisión y en «Ver fuente», y que el texto normal sigue con la comprobación literal de G1; y `make check-specs` está en verde.

**Leer primero:** config/peticion-ia.md (G1, fuente literal); features/material.feature (MATE-3, marcas y «Cita no encontrada»; revisión una a una; «Ver fuente» tras responder); src/aplicacion/texto-pdf.ts (`-raw`, páginas por `\f`).

## Decisiones del dueño (01-11-2026; extrapolación del autor)

1. **La fórmula va en LaTeX** en ítems, ejemplos resueltos, instrucciones y feedback, y se muestra renderizada.
2. **Ancla de varias palabras, única en su página.** Una sola palabra es ambigua («la», «es»). El número de palabras va a `config/parametros.json`. Si el ancla no aparece o aparece más de una vez en la página, la pieza lleva «Cita no encontrada».
3. **El ancla verifica el sitio; el contenido lo verifica la persona.** Una fórmula inventada con anclas correctas pasaría la comprobación automática. Por eso la revisión enseña el recorte del PDF junto a la fórmula renderizada, y «Ver fuente» enseña el mismo recorte.
4. **El texto normal no cambia:** sigue con la comparación literal de G1.

## Casos que hay que especificar

- **PDF escaneado:** sin texto no hay anclas; depende de specs-paginas-sin-texto.
- **Fórmula sin texto a un lado:** al principio o al final de una página, o varias ecuaciones seguidas. Propuesta: ancla de un solo lado y altura máxima del recorte, en `config/parametros.json`.
- **Fórmula partida entre dos páginas.**
- **Dos columnas:** el orden de `-raw` sigue el orden interno del PDF, y la palabra «de después» puede no ser la que se ve debajo. Usar las coordenadas de `-bbox-layout` para detectarlo.

## Quién escribe el LaTeX (pendiente de dato, plan §1, principio 7)

Por orden de coste:

1. **La IA que ya redacta los borradores**, leyendo el recorte o la página. Sin dependencias nuevas.
2. **Un reconocedor pequeño ya entrenado** (tipo pix2tex/LaTeX-OCR) sobre el recorte. Añade Python y PyTorch, una dependencia de un tipo que la app no tiene.
3. **Afinar un reconocedor** con datos sintéticos: LaTeX aleatorio compilado con las fuentes del libro, a imagen. Necesita GPU, un conjunto de evaluación y mantener los pesos.

Pasar a la opción siguiente solo si la anterior falla, con este dato: con 10–20 páginas de un libro real de física, porcentaje de fórmulas que la persona tiene que corregir en la revisión y tiempo de corrección por pieza. Medir antes también cuántas anclas salen únicas y cuántas cajas salen bien.

---
fase: specs
area: MATE
depende: [mate-cierre]
toca: [features/material.feature]
estado: abierto
---
# Un PDF con páginas sin texto no entra en silencio en el material

**Qué:** la app saca el texto con `pdftotext` (src/aplicacion/texto-pdf.ts), y una página escaneada sin capa de texto da `''`. Ningún escenario trata ese caso: un PDF escaneado entra en el material y falla después en silencio, porque la IA no recibe texto o porque sus citas no se pueden comprobar (G1) y todo sale con «Cita no encontrada». Especificar qué pasa al añadir un PDF con páginas sin texto y si la app hace OCR.

**Hecho cuando:** los escenarios dicen qué se considera página sin texto, qué ve la persona al añadir un PDF con todas o con algunas páginas así (aviso con la lista de páginas, o rechazo) y, si se decide hacer OCR, con qué programa del PC y qué pasa si no está instalado (como MATE-1.3 con LibreOffice); y `make check-specs` está en verde.

**Leer primero:** features/material.feature, regla «El material se añade en PDF, PPTX, DOCX o URL» (MATE-1.1 a MATE-1.3) y regla de las marcas (MATE-3, «Cita no encontrada»); src/aplicacion/texto-pdf.ts (`pdf_ilegible`, «Una página sin texto da ''»).

## Por decidir

- **Umbral de «sin texto».** ¿Solo `''`, o también páginas con muy pocos caracteres (un número de página, una cabecera)? Si hay umbral, va a `config/parametros.json` como extrapolación del autor.
- **Aviso o rechazo.** Con todas las páginas vacías, rechazo parece claro. Con algunas, ¿aviso y se añade igual, sabiendo que esas páginas no darán piezas?
- **OCR.** `ocrmypdf` (Tesseract) añade la capa de texto en local. El OCR de fórmulas es malo: en dominios como física puede dar texto casi inútil y citas que no casan. Alternativa: no hacer OCR y pedir a la persona un PDF con texto.
- **Qué recibe la IA.** Si recibe el PDF y lee las imágenes, puede redactar piezas de páginas sin texto cuyas citas no se pueden comprobar. Decidir si eso se permite; afecta al mecanismo de MATE, que está por decidir.

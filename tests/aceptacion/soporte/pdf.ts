// PDF mínimo de verdad, sin dependencias: lo lee cualquier herramienta que saque el texto de un PDF
// (la que use la aplicación es una decisión abierta, plan §17.8). Cada línea del texto es una línea
// del PDF, así que los escenarios deciden dónde se parte una frase (MATE-3.3, MATE-3.4).

/** Un carácter que el PDF de prueba no sabe escribir: de control o fuera de Latin-1. */
const FUERA_DE_LATIN1 = /[^ -ÿ]/u;

/** Escribe la línea como texto de PDF: entre paréntesis, con `\`, `(` y `)` escapados. */
function textoPdf(linea: string): string {
  return `(${linea.replace(/[\\()]/g, (caracter) => `\\${caracter}`)})`;
}

/** Las instrucciones que dibujan las líneas de una página, una debajo de otra. */
function flujoDePagina(lineas: readonly string[]): string {
  const dibujadas = lineas.map((linea) => `${textoPdf(linea)} Tj T*`).join('\n');
  return `BT\n/F1 12 Tf\n14 TL\n72 720 Td\n${dibujadas}\nET`;
}

/** Los objetos del PDF: catálogo, árbol de páginas, fuente y, por cada página, la página y su texto. */
function objetosDelPdf(paginas: readonly (readonly string[])[]): string[] {
  // El objeto n es el que ocupa la posición n − 1; la página i es el 4 + 2i y su texto, el 5 + 2i.
  const referencias = paginas.map((_, posicion) => `${String(4 + 2 * posicion)} 0 R`).join(' ');
  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${referencias}] /Count ${String(paginas.length)} >>`,
    // WinAnsi: las vocales con tilde y la eñe ocupan un byte, el mismo que en Latin-1.
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
  ];
  paginas.forEach((lineas, posicion) => {
    const flujo = flujoDePagina(lineas);
    objetos.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${String(5 + 2 * posicion)} 0 R >>`,
      `<< /Length ${String(flujo.length)} >>\nstream\n${flujo}\nendstream`,
    );
  });
  return objetos;
}

/** Un PDF con una página por cada lista de líneas, en ese orden. */
export function pdfDePrueba(paginas: readonly (readonly string[])[]): Uint8Array {
  if (paginas.flat().some((linea) => FUERA_DE_LATIN1.test(linea))) {
    throw new Error('El PDF de prueba solo admite caracteres de Latin-1');
  }
  // En Latin-1 cada carácter es un byte, así que la longitud de la cadena es la posición en el fichero.
  let pdf = '%PDF-1.4\n';
  const posiciones: number[] = [];
  objetosDelPdf(paginas).forEach((objeto, posicion) => {
    posiciones.push(pdf.length);
    pdf += `${String(posicion + 1)} 0 obj\n${objeto}\nendobj\n`;
  });
  const inicioDeLaTabla = pdf.length;
  const filas = posiciones.map((inicio) => `${String(inicio).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `xref\n0 ${String(posiciones.length + 1)}\n0000000000 65535 f \n${filas}`;
  pdf += `trailer\n<< /Size ${String(posiciones.length + 1)} /Root 1 0 R >>\nstartxref\n${String(inicioDeLaTabla)}\n%%EOF\n`;
  return new Uint8Array(Buffer.from(pdf, 'latin1'));
}

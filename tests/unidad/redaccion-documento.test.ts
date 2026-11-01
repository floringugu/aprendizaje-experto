import { describe, expect, it } from 'vitest';
import { guardarDocumento, pdfDelDocumento } from '../../src/aplicacion/material-guardado.ts';
import { ficherosEnMemoria } from './ficheros-en-memoria.ts';
import {
  BYTES_DEL_PDF,
  conPdfEnElMaterial,
  DOCUMENTO,
  DOMINIO,
  ficherosQueApuntan,
  URL_TEMA3,
} from './redaccion-fabricas.ts';

// `pdfDelDocumento`: el PDF que leerá la IA de un documento del material (MATE-2).

const BYTES_DEL_CONVERTIDO = new Uint8Array([9, 8, 7]);
const BYTES_DE_LA_COPIA = new Uint8Array([5, 6]);

/** Un material en memoria, con ficheros que apuntan lo que se escribe: un rechazo no debe escribir nada. */
function entorno() {
  const memoria = ficherosEnMemoria();
  const material = ficherosQueApuntan(memoria.ficheros);
  // `base` guarda sin apuntar (el material se prepara con él); `ficheros` es el que se le pasa al caso.
  return { base: memoria.ficheros, contenidos: memoria.contenidos, ...material };
}

describe('pdfDelDocumento: lo que acepta', () => {
  it('@MATE-1.1 un PDF añadido da los bytes del original', () => {
    const { base, ficheros, escrituras } = entorno();
    conPdfEnElMaterial(base);

    expect(pdfDelDocumento(ficheros, DOMINIO, DOCUMENTO)).toStrictEqual({ ok: true, valor: BYTES_DEL_PDF });
    expect(escrituras).toStrictEqual([]);
  });

  it('@MATE-1.2 un PPTX da los bytes del PDF que sacó LibreOffice, no los del original', () => {
    const { base, ficheros } = entorno();
    const bytes = new Uint8Array([0, 0, 0]);
    guardarDocumento(base, DOMINIO, {
      nombre: 'clase2.pptx',
      bytes,
      pdfConvertido: BYTES_DEL_CONVERTIDO,
      paginas: ['d1'],
    });

    expect(pdfDelDocumento(ficheros, DOMINIO, 'clase2.pptx')).toStrictEqual({ ok: true, valor: BYTES_DEL_CONVERTIDO });
  });

  it('@MATE-1.5 una URL que sirve un PDF se busca por la URL y da la copia descargada', () => {
    const { base, ficheros } = entorno();
    guardarDocumento(base, DOMINIO, { url: URL_TEMA3, copia: BYTES_DE_LA_COPIA, formato: 'pdf', paginas: ['t'] });

    expect(pdfDelDocumento(ficheros, DOMINIO, URL_TEMA3)).toStrictEqual({ ok: true, valor: BYTES_DE_LA_COPIA });
  });

  it('@MATE-1.1 con varios documentos, da el PDF del que se pide', () => {
    const { base, ficheros } = entorno();
    conPdfEnElMaterial(base, 'otro.pdf', BYTES_DE_LA_COPIA);
    conPdfEnElMaterial(base);

    expect(pdfDelDocumento(ficheros, DOMINIO, DOCUMENTO)).toStrictEqual({ ok: true, valor: BYTES_DEL_PDF });
    expect(pdfDelDocumento(ficheros, DOMINIO, 'otro.pdf')).toStrictEqual({ ok: true, valor: BYTES_DE_LA_COPIA });
  });
});

describe('pdfDelDocumento: lo que rechaza, sin escribir nada', () => {
  it('@MATE-1.1 sin material, rechaza con «documento_no_encontrado» y el nombre del documento en el motivo', () => {
    const { ficheros, escrituras } = entorno();

    expect(pdfDelDocumento(ficheros, DOMINIO, 'tema9.pdf')).toStrictEqual({
      ok: false,
      causa: 'documento_no_encontrado',
      motivo: 'No hay ningún documento «tema9.pdf» en el material.',
    });
    expect(escrituras).toStrictEqual([]);
  });

  it('@MATE-1.1 un documento que no está en el índice, aunque haya otros, rechaza con «documento_no_encontrado»', () => {
    const { base, ficheros, escrituras } = entorno();
    conPdfEnElMaterial(base);

    const resultado = pdfDelDocumento(ficheros, DOMINIO, 'tema9.pdf');

    expect(resultado).toMatchObject({ ok: false, causa: 'documento_no_encontrado' });
    expect(escrituras).toStrictEqual([]);
  });

  it('@MATE-1.1 el documento se busca con su nombre exacto: otra mayúscula es otro documento', () => {
    const { base, ficheros } = entorno();
    conPdfEnElMaterial(base);

    expect(pdfDelDocumento(ficheros, DOMINIO, 'APUNTES.PDF')).toMatchObject({
      ok: false,
      causa: 'documento_no_encontrado',
    });
  });

  it('@MATE-1.1 el material de otro dominio no cuenta', () => {
    const { base, ficheros } = entorno();
    conPdfEnElMaterial(base);

    expect(pdfDelDocumento(ficheros, 'otro', DOCUMENTO)).toMatchObject({
      ok: false,
      causa: 'documento_no_encontrado',
    });
  });

  it('@MATE-1.1 un documento del índice cuyo PDF ya no está rechaza con «documento_no_encontrado»', () => {
    const { base, contenidos, ficheros, escrituras } = entorno();
    conPdfEnElMaterial(base);
    contenidos.delete(`material/${DOMINIO}/originales/${DOCUMENTO}`);

    const resultado = pdfDelDocumento(ficheros, DOMINIO, DOCUMENTO);

    expect(resultado).toMatchObject({ ok: false, causa: 'documento_no_encontrado' });
    expect(resultado.ok ? '' : resultado.motivo).toContain('«apuntes.pdf»');
    expect(escrituras).toStrictEqual([]);
  });

  it('@MATE-1.5 una URL guardada como página web rechaza con «documento_sin_pdf»: la IA solo lee PDF', () => {
    const { base, ficheros, escrituras } = entorno();
    guardarDocumento(base, DOMINIO, {
      url: URL_TEMA3,
      copia: BYTES_DE_LA_COPIA,
      formato: 'html',
      paginas: ['texto de la página'],
    });

    const resultado = pdfDelDocumento(ficheros, DOMINIO, URL_TEMA3);

    expect(resultado).toMatchObject({ ok: false, causa: 'documento_sin_pdf' });
    expect(resultado.ok ? '' : resultado.motivo).toContain(`«${URL_TEMA3}»`);
    expect(resultado.ok ? '' : resultado.motivo).toContain('solo redacta a partir de un PDF');
    expect(escrituras).toStrictEqual([]);
  });
});

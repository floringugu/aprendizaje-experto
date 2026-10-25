import { afterEach, describe, expect, it, vi } from 'vitest';
import { documentosDelMaterial, textosDelMaterial } from '../../src/aplicacion/material-guardado.ts';
import { anadirMaterial, listarMaterial } from '../../src/aplicacion/material.ts';
import type { LibreOffice, PaginaDescargada, Web } from '../../src/aplicacion/puertos.ts';
import type { Resultado } from '../../src/aplicacion/resultado.ts';
import { pdfDePrueba } from '../aceptacion/soporte/pdf.ts';
import { ficherosEnMemoria } from './ficheros-en-memoria.ts';

const DOMINIO = 'ficticio';
const URL_TEMA3 = 'https://ejemplo.org/tema3';
const HTML_TEMA3 = '<html><body><h1>Tema 3</h1><p>El paso P1 va antes que el paso P2.</p></body></html>';
const TEXTO_TEMA3 = 'Tema 3\nEl paso P1 va antes que el paso P2.';
// Unos bytes que no son un PDF: pdftotext los rechaza.
const NO_ES_UN_PDF = 'esto no es un PDF';

function bytesDe(texto: string, codificacion: BufferEncoding = 'utf8'): Uint8Array {
  return new Uint8Array(Buffer.from(texto, codificacion));
}

interface LlamadaAConvertir {
  readonly nombre: string;
  readonly bytes: Uint8Array;
}

/** Un LibreOffice de prueba: `convertir` es lo que hace `convertirAPdf`, y `llamadas` apunta cada conversión pedida. */
function libreOfficeDe(instalado: boolean, convertir: () => Promise<Uint8Array>) {
  const llamadas: LlamadaAConvertir[] = [];
  const puerto: LibreOffice = {
    instalado: () => Promise.resolve(instalado),
    convertirAPdf: (nombre, bytes) => {
      llamadas.push({ nombre, bytes });
      return convertir();
    },
  };
  return { puerto, llamadas };
}

/** Un LibreOffice que convierte siempre en el mismo PDF. */
function libreOfficeQueConvierteEn(pdf: Uint8Array) {
  return libreOfficeDe(true, () => Promise.resolve(pdf));
}

/** Una web con estas páginas por URL; el resto de las URL no se pueden descargar. */
function webCon(paginas: Readonly<Record<string, PaginaDescargada>>): Web {
  return { descargar: (url) => Promise.resolve(paginas[url]) };
}

function pagina(tipoContenido: string, bytes: Uint8Array): PaginaDescargada {
  return { tipoContenido, bytes };
}

/** Lo que usa `anadirMaterial`: ficheros en memoria y, por defecto, ni LibreOffice ni páginas web. */
function entorno(externos: { readonly libreOffice?: LibreOffice; readonly web?: Web } = {}) {
  const memoria = ficherosEnMemoria();
  const sinLibreOffice = libreOfficeDe(false, () => Promise.reject(new Error('No se debería convertir')));
  return {
    ...memoria,
    externos: {
      ficheros: memoria.ficheros,
      libreOffice: externos.libreOffice ?? sinLibreOffice.puerto,
      web: externos.web ?? webCon({}),
    },
  };
}

type Entorno = ReturnType<typeof entorno>;

/** Un entorno con LibreOffice instalado, que convierte siempre en el mismo PDF. */
function entornoConLibreOffice(convertido: Uint8Array) {
  const libreOffice = libreOfficeQueConvierteEn(convertido);
  return { mesa: entorno({ libreOffice: libreOffice.puerto }), llamadas: libreOffice.llamadas };
}

/** Un entorno donde `URL_TEMA3` sirve estos bytes con este `Content-Type`. */
function entornoConLaPagina(tipoContenido: string, bytes: Uint8Array): Entorno {
  return entorno({ web: webCon({ [URL_TEMA3]: pagina(tipoContenido, bytes) }) });
}

function anadirFichero(mesa: Entorno, nombre: string, bytes: Uint8Array) {
  return anadirMaterial(mesa.externos, { dominio: DOMINIO, nombre, bytes });
}

function anadirUrl(mesa: Entorno, url: string) {
  return anadirMaterial(mesa.externos, { dominio: DOMINIO, url });
}

function documentos(mesa: Entorno): readonly string[] {
  return documentosDelMaterial(mesa.ficheros, DOMINIO);
}

function textoDe(mesa: Entorno, documento: string): readonly string[] | undefined {
  return textosDelMaterial(mesa.ficheros, DOMINIO).get(documento);
}

/** Si alguno de los ficheros guardados tiene exactamente estos bytes, sea cual sea su ruta. */
function seGuardo(mesa: Entorno, bytes: Uint8Array): boolean {
  return [...mesa.contenidos.values()].some((guardado) => Buffer.from(guardado).equals(bytes));
}

/** Añade `URL_TEMA3` y comprueba que está en la lista, con estas páginas de texto y con su copia guardada. */
async function comprobarUrlAnadida(mesa: Entorno, copia: Uint8Array, paginas: readonly string[]): Promise<void> {
  const resultado = await anadirUrl(mesa, URL_TEMA3);

  expect(resultado).toEqual({ ok: true, valor: null });
  expect(documentos(mesa)).toEqual([URL_TEMA3]);
  expect(textoDe(mesa, URL_TEMA3)).toEqual(paginas);
  expect(seGuardo(mesa, copia)).toBe(true);
}

/** Un rechazo no deja nada: ningún fichero escrito y nada en la lista (@MATE-1.3, @MATE-1.4). */
function comprobarQueNoSeGuardoNada(mesa: Entorno): void {
  expect(mesa.contenidos.size).toBe(0);
  expect(documentos(mesa)).toEqual([]);
}

/** Rechazo por `causa`: sin `campo` y con el motivo que verá la persona. */
function comprobarRechazoPorCausa(resultado: Resultado<null>, causa: string): void {
  expect(resultado).toMatchObject({ ok: false, causa });
  expect(resultado).not.toHaveProperty('campo');
  expect(resultado.ok ? '' : resultado.motivo).not.toBe('');
}

describe('anadirMaterial: un fichero', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('@MATE-1.1 un PDF se añade sin LibreOffice, con el texto de cada página, y aparece en la lista', async () => {
    const mesa = entorno();
    const pdf = pdfDePrueba([['Texto de la primera página'], ['Texto de la segunda']]);

    const resultado = await anadirFichero(mesa, 'tema1.pdf', pdf);

    expect(resultado).toEqual({ ok: true, valor: null });
    expect(documentos(mesa)).toEqual(['tema1.pdf']);
    expect(textoDe(mesa, 'tema1.pdf')).toEqual(['Texto de la primera página', 'Texto de la segunda']);
    expect(seGuardo(mesa, pdf)).toBe(true);
  });

  it.each(['clase2.pptx', 'resumen.docx'])(
    '@MATE-1.2 %s se convierte con LibreOffice y el texto sale del PDF convertido, no del original',
    async (nombre) => {
      const original = bytesDe('contenido del fichero de ofimática, que no es un PDF');
      const convertido = pdfDePrueba([['Diapositiva convertida']]);
      const { mesa, llamadas } = entornoConLibreOffice(convertido);

      const resultado = await anadirFichero(mesa, nombre, original);

      expect(resultado).toEqual({ ok: true, valor: null });
      expect(llamadas).toEqual([{ nombre, bytes: original }]);
      expect(documentos(mesa)).toEqual([nombre]);
      expect(textoDe(mesa, nombre)).toEqual(['Diapositiva convertida']);
      expect(seGuardo(mesa, original)).toBe(true);
      expect(seGuardo(mesa, convertido)).toBe(true);
    },
  );

  it.each([
    ['TEMA1.PDF', 0],
    ['Clase2.PPTX', 1],
    ['RESUMEN.DocX', 1],
  ])(
    '@MATE-1.1 la extensión de %s se reconoce aunque vaya en mayúsculas (%i conversiones)',
    async (nombre, conversiones) => {
      const { mesa, llamadas } = entornoConLibreOffice(pdfDePrueba([['Texto']]));

      const resultado = await anadirFichero(mesa, nombre, pdfDePrueba([['Texto']]));

      expect(resultado).toEqual({ ok: true, valor: null });
      expect(documentos(mesa)).toEqual([nombre]);
      expect(llamadas).toHaveLength(conversiones);
    },
  );

  it.each(['clase2.pptx', 'RESUMEN.DOCX'])(
    '@MATE-1.3 sin LibreOffice, %s se rechaza con falta_libreoffice y no se guarda nada',
    async (nombre) => {
      const libreOffice = libreOfficeDe(false, () => Promise.resolve(pdfDePrueba([['Texto']])));
      const mesa = entorno({ libreOffice: libreOffice.puerto });

      const resultado = await anadirFichero(mesa, nombre, bytesDe('contenido'));

      comprobarRechazoPorCausa(resultado, 'falta_libreoffice');
      expect(libreOffice.llamadas).toEqual([]);
      comprobarQueNoSeGuardoNada(mesa);
    },
  );

  it('@MATE-1.2 si LibreOffice no puede convertir el fichero, se rechaza con conversion_fallida y no se guarda nada', async () => {
    const libreOffice = libreOfficeDe(true, () => Promise.reject(new Error('El fichero está dañado')));
    const mesa = entorno({ libreOffice: libreOffice.puerto });

    const resultado = await anadirFichero(mesa, 'clase2.pptx', bytesDe('contenido'));

    comprobarRechazoPorCausa(resultado, 'conversion_fallida');
    expect(libreOffice.llamadas).toHaveLength(1);
    comprobarQueNoSeGuardoNada(mesa);
  });

  it.each(['libro.epub', 'tabla.xlsx', 'notas.doc', 'apuntes.pdf.txt', 'apuntes.pdfx', 'sin-extension', 'pdf'])(
    '@MATE-1.4 «%s» se rechaza con tipo_no_admitido y no se guarda nada',
    async (nombre) => {
      const { mesa, llamadas } = entornoConLibreOffice(pdfDePrueba([['Texto']]));

      const resultado = await anadirFichero(mesa, nombre, pdfDePrueba([['Texto']]));

      comprobarRechazoPorCausa(resultado, 'tipo_no_admitido');
      expect(llamadas).toEqual([]);
      comprobarQueNoSeGuardoNada(mesa);
    },
  );

  it.each(['carpeta/apuntes.pdf', 'carpeta\\apuntes.pdf', '../apuntes.pdf', 'carpeta/libro.epub'])(
    '@MATE-1.4 el nombre «%s» lleva carpetas: se rechaza con el campo nombre, antes de mirar el tipo',
    async (nombre) => {
      const mesa = entorno();

      const resultado = await anadirFichero(mesa, nombre, pdfDePrueba([['Texto']]));

      expect(resultado).toMatchObject({ ok: false, campo: 'nombre' });
      expect(resultado).not.toHaveProperty('causa');
      expect(resultado.ok ? '' : resultado.motivo).not.toBe('');
      comprobarQueNoSeGuardoNada(mesa);
    },
  );

  it('@MATE-1.1 unos bytes que no son un PDF se rechazan con pdf_ilegible y no se guarda nada', async () => {
    const mesa = entorno();

    const resultado = await anadirFichero(mesa, 'roto.pdf', bytesDe(NO_ES_UN_PDF));

    comprobarRechazoPorCausa(resultado, 'pdf_ilegible');
    comprobarQueNoSeGuardoNada(mesa);
  });

  it('@MATE-1.2 un PDF convertido que no se puede leer se rechaza con pdf_ilegible y no guarda ni el original', async () => {
    const { mesa } = entornoConLibreOffice(bytesDe(NO_ES_UN_PDF));

    const resultado = await anadirFichero(mesa, 'clase2.pptx', bytesDe('contenido'));

    comprobarRechazoPorCausa(resultado, 'pdf_ilegible');
    comprobarQueNoSeGuardoNada(mesa);
  });

  it('sin pdftotext instalado, un PDF se rechaza con falta_poppler y no se guarda nada (regla que la feature no cubre)', async () => {
    // Una carpeta que no existe como único sitio donde buscar programas: pdftotext no arranca.
    vi.stubEnv('PATH', '/ruta/que/no/existe');
    const mesa = entorno();

    const resultado = await anadirFichero(mesa, 'tema1.pdf', pdfDePrueba([['Texto']]));

    comprobarRechazoPorCausa(resultado, 'falta_poppler');
    comprobarQueNoSeGuardoNada(mesa);
  });
});

describe('anadirMaterial: una URL', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each(['text/html', 'text/html; charset=utf-8', 'TEXT/HTML; Charset=UTF-8', 'text/html ; charset=utf-8'])(
    '@MATE-1.5 una página con Content-Type «%s» es HTML: una sola página de texto, y se guarda la copia',
    async (tipoContenido) => {
      const copia = bytesDe(HTML_TEMA3);
      const mesa = entornoConLaPagina(tipoContenido, copia);

      await comprobarUrlAnadida(mesa, copia, [TEXTO_TEMA3]);
    },
  );

  it('@MATE-1.5 el texto de la página se lee con el charset del Content-Type', async () => {
    const latin1 = bytesDe('<p>Información</p>', 'latin1');
    const mesa = entornoConLaPagina('text/html; charset=ISO-8859-1', latin1);

    await anadirUrl(mesa, URL_TEMA3);

    expect(textoDe(mesa, URL_TEMA3)).toEqual(['Información']);
  });

  it('@MATE-1.5 una página HTML se lee sin pdftotext', async () => {
    vi.stubEnv('PATH', '/ruta/que/no/existe');
    const mesa = entornoConLaPagina('text/html', bytesDe(HTML_TEMA3));

    expect(await anadirUrl(mesa, URL_TEMA3)).toEqual({ ok: true, valor: null });
  });

  it.each(['application/pdf', 'Application/PDF; foo=bar'])(
    '@MATE-1.5 una URL con Content-Type «%s» es un PDF: sus páginas salen de pdftotext y se guarda la copia',
    async (tipoContenido) => {
      const copia = pdfDePrueba([['Primera página web'], ['Segunda página web']]);
      const mesa = entornoConLaPagina(tipoContenido, copia);

      await comprobarUrlAnadida(mesa, copia, ['Primera página web', 'Segunda página web']);
    },
  );

  it.each(['image/png', 'text/plain; charset=utf-8', 'text/htmlx', ''])(
    '@MATE-1.4 una URL con Content-Type «%s» se rechaza con tipo_no_admitido y no se guarda nada',
    async (tipoContenido) => {
      const mesa = entornoConLaPagina(tipoContenido, bytesDe(HTML_TEMA3));

      const resultado = await anadirUrl(mesa, URL_TEMA3);

      comprobarRechazoPorCausa(resultado, 'tipo_no_admitido');
      comprobarQueNoSeGuardoNada(mesa);
    },
  );

  it('@MATE-1.1 una URL que no se puede descargar se rechaza con url_no_disponible y no se guarda nada', async () => {
    const mesa = entorno();

    const resultado = await anadirUrl(mesa, URL_TEMA3);

    comprobarRechazoPorCausa(resultado, 'url_no_disponible');
    comprobarQueNoSeGuardoNada(mesa);
  });

  it('@MATE-1.1 una URL que sirve un PDF roto se rechaza con pdf_ilegible y no se guarda nada', async () => {
    const mesa = entornoConLaPagina('application/pdf', bytesDe(NO_ES_UN_PDF));

    const resultado = await anadirUrl(mesa, URL_TEMA3);

    comprobarRechazoPorCausa(resultado, 'pdf_ilegible');
    comprobarQueNoSeGuardoNada(mesa);
  });
});

describe('listarMaterial', () => {
  it('@MATE-1.1 sin material, la lista está vacía y no se rechaza', () => {
    const mesa = entorno();

    expect(listarMaterial(mesa.ficheros, { dominio: DOMINIO })).toEqual({ ok: true, valor: [] });
  });

  it('@MATE-1.1 da los nombres y las URL tal como se añadieron, en el orden en que se añadieron', async () => {
    const libreOffice = libreOfficeQueConvierteEn(pdfDePrueba([['Diapositiva']]));
    const web = webCon({ [URL_TEMA3]: pagina('text/html', bytesDe(HTML_TEMA3)) });
    const mesa = entorno({ libreOffice: libreOffice.puerto, web });

    await anadirFichero(mesa, 'tema1.pdf', pdfDePrueba([['Texto']]));
    await anadirFichero(mesa, 'clase2.pptx', bytesDe('contenido'));
    await anadirUrl(mesa, URL_TEMA3);

    expect(listarMaterial(mesa.ficheros, { dominio: DOMINIO })).toEqual({
      ok: true,
      valor: ['tema1.pdf', 'clase2.pptx', URL_TEMA3],
    });
  });

  it('@MATE-1.1 el material de un dominio no aparece en la lista de otro', async () => {
    const mesa = entorno();

    await anadirMaterial(mesa.externos, { dominio: 'otro', nombre: 'tema1.pdf', bytes: pdfDePrueba([['Texto']]) });

    expect(listarMaterial(mesa.ficheros, { dominio: 'otro' })).toEqual({ ok: true, valor: ['tema1.pdf'] });
    expect(listarMaterial(mesa.ficheros, { dominio: DOMINIO })).toEqual({ ok: true, valor: [] });
  });
});

import { describe, expect, it } from 'vitest';
import {
  documentosDelMaterial,
  guardarDocumento,
  textosDelMaterial,
  type DocumentoNuevo,
} from '../../src/aplicacion/material-guardado.ts';
import type { Ficheros } from '../../src/aplicacion/puertos.ts';

const DOMINIO = 'ficticio';
const INDICE = `material/${DOMINIO}/indice.json`;
const URL_TEMA3 = 'https://ejemplo.org/tema3';
const URL_TEMA4 = 'https://ejemplo.org/tema4';

/** Un `Ficheros` en memoria: los ficheros por ruta y las rutas escritas, en el orden en que se escribieron. */
function ficherosEnMemoria() {
  const guardados = new Map<string, Uint8Array>();
  const escritas: string[] = [];
  const ficheros: Ficheros = {
    leer: (ruta) => guardados.get(ruta),
    escribir: (ruta, bytes) => {
      guardados.set(ruta, bytes);
      escritas.push(ruta);
    },
  };
  return { ficheros, guardados, escritas };
}

function bytesDe(texto: string): Uint8Array {
  return new TextEncoder().encode(texto);
}

function textoDe(guardados: ReadonlyMap<string, Uint8Array>, ruta: string): string {
  const bytes = guardados.get(ruta);
  if (bytes === undefined) {
    throw new Error(`Falta el fichero ${ruta}`);
  }
  return new TextDecoder().decode(bytes);
}

function jsonDe(guardados: ReadonlyMap<string, Uint8Array>, ruta: string): unknown {
  return JSON.parse(textoDe(guardados, ruta));
}

function pdf(nombre: string, contenido = 'pdf', paginas: readonly string[] = [`texto de ${nombre}`]): DocumentoNuevo {
  return { nombre, bytes: bytesDe(contenido), paginas };
}

function web(url: string, formato: 'html' | 'pdf', contenido = 'copia'): DocumentoNuevo {
  return { url, copia: bytesDe(contenido), formato, paginas: [`texto de ${url}`] };
}

describe('guardarDocumento: las rutas', () => {
  it('@MATE-1.1 un PDF se guarda en originales/ y su entrada usa el original como pdf', () => {
    const { ficheros, guardados } = ficherosEnMemoria();

    guardarDocumento(ficheros, DOMINIO, pdf('apuntes.pdf', 'contenido del pdf', ['página 1', 'página 2']));

    const original = `material/${DOMINIO}/originales/apuntes.pdf`;
    expect(textoDe(guardados, original)).toBe('contenido del pdf');
    expect(jsonDe(guardados, `material/${DOMINIO}/apuntes.pdf.texto.json`)).toEqual(['página 1', 'página 2']);
    expect(jsonDe(guardados, INDICE)).toEqual([
      {
        documento: 'apuntes.pdf',
        original,
        texto: `material/${DOMINIO}/apuntes.pdf.texto.json`,
        pdf: original,
      },
    ]);
    expect([...guardados.keys()].sort()).toEqual(
      [original, INDICE, `material/${DOMINIO}/apuntes.pdf.texto.json`].sort(),
    );
  });

  it('@MATE-1.2 un PPTX guarda el original y el PDF de LibreOffice, y la entrada apunta al convertido', () => {
    const { ficheros, guardados } = ficherosEnMemoria();

    guardarDocumento(ficheros, DOMINIO, {
      nombre: 'clase2.pptx',
      bytes: bytesDe('pptx original'),
      pdfConvertido: bytesDe('pdf de libreoffice'),
      paginas: ['diapositiva 1'],
    });

    const original = `material/${DOMINIO}/originales/clase2.pptx`;
    const convertido = `material/${DOMINIO}/clase2.pptx.pdf`;
    expect(textoDe(guardados, original)).toBe('pptx original');
    expect(textoDe(guardados, convertido)).toBe('pdf de libreoffice');
    expect(jsonDe(guardados, INDICE)).toEqual([
      {
        documento: 'clase2.pptx',
        original,
        texto: `material/${DOMINIO}/clase2.pptx.texto.json`,
        pdf: convertido,
      },
    ]);
  });

  it('@MATE-1.5 una URL HTML se guarda como web-1.html, con su texto y sin pdf', () => {
    const { ficheros, guardados } = ficherosEnMemoria();

    guardarDocumento(ficheros, DOMINIO, web(URL_TEMA3, 'html', '<p>La página</p>'));

    const original = `material/${DOMINIO}/web-1.html`;
    expect(textoDe(guardados, original)).toBe('<p>La página</p>');
    expect(jsonDe(guardados, `material/${DOMINIO}/web-1.texto.json`)).toEqual([`texto de ${URL_TEMA3}`]);
    const indice = jsonDe(guardados, INDICE);
    expect(indice).toEqual([{ documento: URL_TEMA3, original, texto: `material/${DOMINIO}/web-1.texto.json` }]);
    expect(JSON.stringify(indice)).not.toContain('"pdf"');
  });

  it('@MATE-1.5 una URL que sirve un PDF se guarda como web-1.pdf, que es también su pdf', () => {
    const { ficheros, guardados } = ficherosEnMemoria();

    guardarDocumento(ficheros, DOMINIO, web(URL_TEMA3, 'pdf', 'bytes del pdf'));

    const copia = `material/${DOMINIO}/web-1.pdf`;
    expect(textoDe(guardados, copia)).toBe('bytes del pdf');
    expect(jsonDe(guardados, INDICE)).toEqual([
      { documento: URL_TEMA3, original: copia, texto: `material/${DOMINIO}/web-1.texto.json`, pdf: copia },
    ]);
  });

  it('@MATE-1.1 un PDF llamado como la copia de una URL no la pisa, porque los originales van en originales/', () => {
    const { ficheros, guardados } = ficherosEnMemoria();

    guardarDocumento(ficheros, DOMINIO, pdf('web-1.pdf', 'el fichero de la persona'));
    guardarDocumento(ficheros, DOMINIO, web(URL_TEMA3, 'pdf', 'la copia de la URL'));

    expect(textoDe(guardados, `material/${DOMINIO}/originales/web-1.pdf`)).toBe('el fichero de la persona');
    expect(textoDe(guardados, `material/${DOMINIO}/web-1.pdf`)).toBe('la copia de la URL');
    // El texto del fichero es `web-1.pdf.texto.json` y el de la URL, `web-1.texto.json`: tampoco chocan.
    expect(jsonDe(guardados, `material/${DOMINIO}/web-1.pdf.texto.json`)).toEqual(['texto de web-1.pdf']);
    expect(jsonDe(guardados, `material/${DOMINIO}/web-1.texto.json`)).toEqual([`texto de ${URL_TEMA3}`]);
  });

  it('@MATE-1.1 cada dominio tiene su propia carpeta', () => {
    const { ficheros } = ficherosEnMemoria();

    guardarDocumento(ficheros, 'ficticio', pdf('apuntes.pdf'));

    expect(documentosDelMaterial(ficheros, 'ficticio')).toEqual(['apuntes.pdf']);
    expect(documentosDelMaterial(ficheros, 'otro')).toEqual([]);
  });
});

describe('guardarDocumento: el orden de escritura', () => {
  it('@MATE-1.2 el índice se escribe el último, después del original, del convertido y del texto', () => {
    const { ficheros, escritas } = ficherosEnMemoria();

    guardarDocumento(ficheros, DOMINIO, {
      nombre: 'resumen.docx',
      bytes: bytesDe('docx'),
      pdfConvertido: bytesDe('pdf'),
      paginas: ['página 1'],
    });

    expect(escritas).toHaveLength(4);
    expect(escritas.at(-1)).toBe(INDICE);
    expect(escritas.filter((ruta) => ruta === INDICE)).toHaveLength(1);
  });

  it('@MATE-1.5 el índice también se escribe el último con una URL', () => {
    const { ficheros, escritas } = ficherosEnMemoria();

    guardarDocumento(ficheros, DOMINIO, web(URL_TEMA3, 'html'));

    expect(escritas).toEqual([`material/${DOMINIO}/web-1.html`, `material/${DOMINIO}/web-1.texto.json`, INDICE]);
  });
});

describe('guardarDocumento: el orden del índice y las sustituciones', () => {
  it('@MATE-1.1 la lista sigue el orden en que se añadió el material, con los nombres y las URL tal cual', () => {
    const { ficheros } = ficherosEnMemoria();

    guardarDocumento(ficheros, DOMINIO, pdf('tema1.pdf'));
    guardarDocumento(ficheros, DOMINIO, web(URL_TEMA3, 'html'));
    guardarDocumento(ficheros, DOMINIO, {
      nombre: 'resumen.docx',
      bytes: bytesDe('docx'),
      pdfConvertido: bytesDe('pdf'),
      paginas: [],
    });

    expect(documentosDelMaterial(ficheros, DOMINIO)).toEqual(['tema1.pdf', URL_TEMA3, 'resumen.docx']);
  });

  it('@MATE-1.1 añadir otra vez un documento lo sustituye en su sitio, sin moverlo al final', () => {
    const { ficheros, guardados } = ficherosEnMemoria();
    guardarDocumento(ficheros, DOMINIO, pdf('a.pdf', 'versión 1', ['texto viejo']));
    guardarDocumento(ficheros, DOMINIO, pdf('b.pdf'));

    guardarDocumento(ficheros, DOMINIO, pdf('a.pdf', 'versión 2', ['texto nuevo']));

    expect(documentosDelMaterial(ficheros, DOMINIO)).toEqual(['a.pdf', 'b.pdf']);
    expect(textoDe(guardados, `material/${DOMINIO}/originales/a.pdf`)).toBe('versión 2');
    expect(textosDelMaterial(ficheros, DOMINIO).get('a.pdf')).toEqual(['texto nuevo']);
  });

  it('@MATE-1.2 la entrada sustituida lleva el pdf de la nueva versión, no el de la vieja', () => {
    const { ficheros, guardados } = ficherosEnMemoria();
    guardarDocumento(ficheros, DOMINIO, pdf('clase2.pdf'));

    guardarDocumento(ficheros, DOMINIO, { ...pdf('clase2.pdf'), pdfConvertido: bytesDe('convertido') });

    expect(jsonDe(guardados, INDICE)).toEqual([
      {
        documento: 'clase2.pdf',
        original: `material/${DOMINIO}/originales/clase2.pdf`,
        texto: `material/${DOMINIO}/clase2.pdf.texto.json`,
        pdf: `material/${DOMINIO}/clase2.pdf.pdf`,
      },
    ]);
  });
});

describe('guardarDocumento: el número de la copia de una URL', () => {
  it('@MATE-1.5 la primera URL es la 1 y cada URL nueva toma la siguiente', () => {
    const { ficheros, guardados } = ficherosEnMemoria();

    guardarDocumento(ficheros, DOMINIO, web(URL_TEMA3, 'html', 'tema 3'));
    guardarDocumento(ficheros, DOMINIO, web(URL_TEMA4, 'html', 'tema 4'));

    expect(textoDe(guardados, `material/${DOMINIO}/web-1.html`)).toBe('tema 3');
    expect(textoDe(guardados, `material/${DOMINIO}/web-2.html`)).toBe('tema 4');
  });

  it('@MATE-1.5 una URL repetida conserva su número y sustituye su copia, sin tocar las demás', () => {
    const { ficheros, guardados } = ficherosEnMemoria();
    guardarDocumento(ficheros, DOMINIO, web(URL_TEMA3, 'html', 'tema 3, primera copia'));
    guardarDocumento(ficheros, DOMINIO, web(URL_TEMA4, 'html', 'tema 4'));

    guardarDocumento(ficheros, DOMINIO, web(URL_TEMA3, 'html', 'tema 3, segunda copia'));

    expect(documentosDelMaterial(ficheros, DOMINIO)).toEqual([URL_TEMA3, URL_TEMA4]);
    expect(textoDe(guardados, `material/${DOMINIO}/web-1.html`)).toBe('tema 3, segunda copia');
    expect(textoDe(guardados, `material/${DOMINIO}/web-2.html`)).toBe('tema 4');
    expect(guardados.has(`material/${DOMINIO}/web-3.html`)).toBe(false);
  });

  it('@MATE-1.5 una URL que era HTML y ahora sirve un PDF conserva su número y pasa a llevar pdf', () => {
    const { ficheros, guardados } = ficherosEnMemoria();
    guardarDocumento(ficheros, DOMINIO, web(URL_TEMA3, 'html'));

    guardarDocumento(ficheros, DOMINIO, web(URL_TEMA3, 'pdf', 'ahora es un pdf'));

    const copia = `material/${DOMINIO}/web-1.pdf`;
    expect(textoDe(guardados, copia)).toBe('ahora es un pdf');
    expect(jsonDe(guardados, INDICE)).toEqual([
      { documento: URL_TEMA3, original: copia, texto: `material/${DOMINIO}/web-1.texto.json`, pdf: copia },
    ]);
  });

  it('@MATE-1.5 una URL que sirve un PDF y después una página HTML deja la entrada sin pdf', () => {
    const { ficheros, guardados } = ficherosEnMemoria();
    guardarDocumento(ficheros, DOMINIO, web(URL_TEMA3, 'pdf'));

    guardarDocumento(ficheros, DOMINIO, web(URL_TEMA3, 'html'));

    expect(jsonDe(guardados, INDICE)).toEqual([
      {
        documento: URL_TEMA3,
        original: `material/${DOMINIO}/web-1.html`,
        texto: `material/${DOMINIO}/web-1.texto.json`,
      },
    ]);
  });

  it('@MATE-1.5 la URL nueva toma el mayor número del índice más uno, no la cantidad de documentos', () => {
    const { ficheros, guardados } = ficherosEnMemoria();
    const entrada = (n: number) => ({
      documento: `https://ejemplo.org/${String(n)}`,
      original: `material/${DOMINIO}/web-${String(n)}.html`,
      texto: `material/${DOMINIO}/web-${String(n)}.texto.json`,
    });
    // Un índice con huecos (la 1 y la 5): hay dos documentos, pero el siguiente número es el 6.
    ficheros.escribir(INDICE, bytesDe(JSON.stringify([entrada(5), entrada(1)])));

    guardarDocumento(ficheros, DOMINIO, web(URL_TEMA3, 'html', 'la nueva'));

    expect(textoDe(guardados, `material/${DOMINIO}/web-6.html`)).toBe('la nueva');
    expect(documentosDelMaterial(ficheros, DOMINIO)).toEqual([
      'https://ejemplo.org/5',
      'https://ejemplo.org/1',
      URL_TEMA3,
    ]);
  });

  it('@MATE-1.5 los ficheros con nombre no cuentan para el número: la primera URL sigue siendo la 1', () => {
    const { ficheros, guardados } = ficherosEnMemoria();
    guardarDocumento(ficheros, DOMINIO, pdf('web-7.pdf'));
    guardarDocumento(ficheros, DOMINIO, pdf('tema1.pdf'));

    guardarDocumento(ficheros, DOMINIO, web(URL_TEMA3, 'html'));

    expect(guardados.has(`material/${DOMINIO}/web-1.html`)).toBe(true);
  });
});

describe('textosDelMaterial', () => {
  it('@MATE-4.3 da las páginas guardadas de cada documento, por su nombre o su URL, con sus acentos', () => {
    const { ficheros } = ficherosEnMemoria();
    guardarDocumento(ficheros, DOMINIO, pdf('apuntes.pdf', 'pdf', ['La regla R1 también se aplica', 'Página «dos»']));
    guardarDocumento(ficheros, DOMINIO, {
      nombre: 'clase2.pptx',
      bytes: bytesDe('pptx'),
      pdfConvertido: bytesDe('pdf'),
      paginas: ['Diapositiva única'],
    });
    guardarDocumento(ficheros, DOMINIO, {
      ...web(URL_TEMA3, 'html'),
      paginas: ['El paso P1 va antes que el paso P2.'],
    });

    const textos = textosDelMaterial(ficheros, DOMINIO);

    expect([...textos.keys()]).toEqual(['apuntes.pdf', 'clase2.pptx', URL_TEMA3]);
    expect(textos.get('apuntes.pdf')).toEqual(['La regla R1 también se aplica', 'Página «dos»']);
    expect(textos.get('clase2.pptx')).toEqual(['Diapositiva única']);
    expect(textos.get(URL_TEMA3)).toEqual(['El paso P1 va antes que el paso P2.']);
  });

  it('@MATE-1.5 el texto guardado de una URL no cambia aunque después se añada otro material', () => {
    const { ficheros } = ficherosEnMemoria();
    guardarDocumento(ficheros, DOMINIO, {
      ...web(URL_TEMA3, 'html'),
      paginas: ['El paso P1 va antes que el paso P2.'],
    });

    guardarDocumento(ficheros, DOMINIO, pdf('apuntes.pdf'));

    expect(textosDelMaterial(ficheros, DOMINIO).get(URL_TEMA3)).toEqual(['El paso P1 va antes que el paso P2.']);
  });

  it('@MATE-3.2 un documento cuyo fichero de texto falta no entra en el mapa', () => {
    const { ficheros, guardados } = ficherosEnMemoria();
    guardarDocumento(ficheros, DOMINIO, pdf('apuntes.pdf'));
    guardarDocumento(ficheros, DOMINIO, pdf('perdido.pdf'));
    guardados.delete(`material/${DOMINIO}/perdido.pdf.texto.json`);

    const textos = textosDelMaterial(ficheros, DOMINIO);

    expect([...textos.keys()]).toEqual(['apuntes.pdf']);
    expect(textos.has('perdido.pdf')).toBe(false);
    // Sigue en la lista de material: solo faltan sus páginas.
    expect(documentosDelMaterial(ficheros, DOMINIO)).toEqual(['apuntes.pdf', 'perdido.pdf']);
  });
});

describe('material vacío', () => {
  it('@MATE-1.1 sin índice no hay documentos', () => {
    const { ficheros, escritas } = ficherosEnMemoria();

    expect(documentosDelMaterial(ficheros, DOMINIO)).toEqual([]);
    expect(escritas).toEqual([]);
  });

  it('@MATE-3.2 sin índice no hay textos, y ninguna cita encuentra su documento', () => {
    const { ficheros } = ficherosEnMemoria();

    const textos = textosDelMaterial(ficheros, DOMINIO);

    expect(textos.size).toBe(0);
    expect(textos.get('apuntes.pdf')).toBeUndefined();
  });
});

import type { TextosDelMaterial } from '../dominio/citas.ts';
import { codificarJson, leerJson } from './mesa-guardada.ts';
import type { Ficheros } from './puertos.ts';
import { aceptar, rechazarPorCausa, type Resultado } from './resultado.ts';

// El material guardado de un dominio (plan §0, «Material guardado»), a través del puerto `Ficheros`, que
// no sabe listar carpetas: por eso hay un índice. Las rutas son relativas a la carpeta de datos:
//
//   material/<dominio>/indice.json             el material, en el orden en que se añadió
//   material/<dominio>/originales/<nombre>     cada fichero tal como llegó
//   material/<dominio>/<nombre>.pdf            el PDF que sacó LibreOffice de un PPTX o un DOCX
//   material/<dominio>/web-<n>.html o .pdf     la copia de una URL (@MATE-1.5)
//   material/<dominio>/<nombre>.texto.json     el texto, una cadena por página (de una URL, web-<n>.texto.json)
//
// Los originales van en su propia carpeta para que un nombre de la persona no choque con un fichero de la
// aplicación: un PDF llamado «clase2.pptx.pdf» sustituiría al convertido de «clase2.pptx», y uno llamado
// «web-1.pdf», a la copia de una URL. Los nombres admitidos acaban en .pdf, .pptx o .docx, así que fuera de
// `originales/` tampoco chocan.

/** Un documento ya leído, listo para guardarlo. */
export type DocumentoNuevo =
  | {
      /** El nombre del fichero, sin carpetas: lo comprueba `anadirMaterial`. */
      readonly nombre: string;
      readonly bytes: Uint8Array;
      /** El PDF de LibreOffice, si era un PPTX o un DOCX (@MATE-1.2). */
      readonly pdfConvertido?: Uint8Array;
      readonly paginas: readonly string[];
    }
  | {
      readonly url: string;
      /** La página tal como se descargó: las citas la usan aunque después cambie o desaparezca (@MATE-1.5). */
      readonly copia: Uint8Array;
      readonly formato: 'html' | 'pdf';
      /** De una página HTML, una sola. */
      readonly paginas: readonly string[];
    };

/**
 * Guarda los ficheros del documento y lo apunta en el índice. El índice se escribe el último, para que
 * nunca apunte a un fichero que no está.
 * - Cada entrada del índice lleva `documento` (el nombre o la URL tal cual, el `documento` de las citas),
 *   `original`, `texto` y, si lo hay, `pdf`: el que leerá la IA (MATE-2). Es el original de un PDF, el
 *   convertido de un PPTX o un DOCX, o la copia de una URL que sirve un PDF; una página HTML no lo lleva.
 * - Si `documento` ya está en el índice, la entrada se sustituye en su sitio, sin moverla, y una URL
 *   conserva su `web-<n>`: las citas apuntan al documento por su nombre (plan §0).
 * - Una URL nueva toma como `n` uno más que el mayor del índice, empezando por 1.
 */
export function guardarDocumento(ficheros: Ficheros, dominio: string, documento: DocumentoNuevo): void {
  const indice = leerIndice(ficheros, dominio);
  const { entrada, escrituras } =
    'url' in documento ? guardadoDeUrl(dominio, documento, indice) : guardadoDeFichero(dominio, documento);
  for (const [ruta, bytes] of escrituras) {
    ficheros.escribir(ruta, bytes);
  }
  ficheros.escribir(entrada.texto, codificarJson(documento.paginas));
  // Lo último: si algo falla antes, el índice sigue como estaba y no apunta a ficheros a medias.
  ficheros.escribir(rutaDelIndice(dominio), codificarJson(conEntrada(indice, entrada)));
}

/** Los documentos del material, los nombres y las URL tal como se añadieron, en el orden del índice (@MATE-1.1). */
export function documentosDelMaterial(ficheros: Ficheros, dominio: string): readonly string[] {
  return leerIndice(ficheros, dominio).map((entrada) => entrada.documento);
}

/**
 * El texto de cada documento del material, para las marcas de la revisión y «Ver fuente» (`citas.ts`). Un
 * documento cuyo fichero de texto no está no entra en el mapa: sus citas salen «Cita no encontrada».
 */
export function textosDelMaterial(ficheros: Ficheros, dominio: string): TextosDelMaterial {
  const textos = new Map<string, readonly string[]>();
  for (const entrada of leerIndice(ficheros, dominio)) {
    const bytes = ficheros.leer(entrada.texto);
    // Sin fichero de texto el documento no entra: sus citas salen «Cita no encontrada» (@MATE-3.2).
    if (bytes !== undefined) {
      textos.set(entrada.documento, leerPaginas(bytes));
    }
  }
  return textos;
}

/**
 * El PDF que leerá la IA de un documento del material (MATE-2): el de `pdf` en su entrada del índice. El
 * documento se busca por su nombre o su URL, tal como está en el índice. Rechaza con `causa`:
 * - `documento_no_encontrado` si el documento no está en el índice, o si su PDF ya no está;
 * - `documento_sin_pdf` si es una página HTML, que no lo lleva: por ahora la IA solo redacta a partir de un
 *   PDF (decisión del dueño del 01-11-2026; ticket `specs-redactar-pagina-web`).
 */
export function pdfDelDocumento(ficheros: Ficheros, dominio: string, documento: string): Resultado<Uint8Array> {
  // El documento se busca por su nombre o su URL exactos: así lo apunta el índice y así lo citan las piezas.
  const entrada = leerIndice(ficheros, dominio).find((candidata) => candidata.documento === documento);
  if (entrada === undefined) {
    return rechazarPorCausa('documento_no_encontrado', `No hay ningún documento «${documento}» en el material.`);
  }
  if (entrada.pdf === undefined) {
    return rechazarPorCausa(
      'documento_sin_pdf',
      `«${documento}» es una página web: por ahora la IA solo redacta a partir de un PDF, no de una página web.`,
    );
  }
  const bytes = ficheros.leer(entrada.pdf);
  if (bytes === undefined) {
    // El índice apunta a un PDF que ya no está (alguien lo ha borrado): para la persona es como si no existiera.
    return rechazarPorCausa(
      'documento_no_encontrado',
      `El PDF de «${documento}» ya no está en el material: vuelve a añadirlo.`,
    );
  }
  return aceptar(bytes);
}

// Una entrada del índice (`indice.json`, una lista de entradas). Las rutas son completas, relativas a la
// carpeta de datos, para que quien las lea (MATE-2) no tenga que reconstruirlas. `pdf` falta en una página HTML.
interface EntradaDelIndice {
  readonly documento: string;
  readonly original: string;
  readonly texto: string;
  readonly pdf?: string;
}

// Lo que hay que guardar de un documento, además de su texto: la entrada del índice y los ficheros con sus
// bytes, en el orden en que se escriben.
interface Guardado {
  readonly entrada: EntradaDelIndice;
  readonly escrituras: ReadonlyMap<string, Uint8Array>;
}

type DocumentoDeUrl = Extract<DocumentoNuevo, { readonly url: string }>;
type DocumentoDeFichero = Exclude<DocumentoNuevo, DocumentoDeUrl>;

// El número de una copia de URL, sacado de la ruta de su texto (`…/web-3.texto.json` es el 3). Un nombre de
// fichero nunca coincide: acaba en .pdf, .pptx o .docx antes de `.texto.json`, y aquí `web-<n>` va seguido
// directamente de `.texto.json`.
const TEXTO_DE_UNA_URL = /web-(\d+)\.texto\.json$/;

function carpetaDelMaterial(dominio: string): string {
  return `material/${dominio}`;
}

function rutaDelIndice(dominio: string): string {
  return `${carpetaDelMaterial(dominio)}/indice.json`;
}

// Un fichero que llegó con nombre: el original va en `originales/` (ver el comentario del módulo), y el PDF
// que leerá la IA es el convertido si lo hay (@MATE-1.2) o, si no, el propio original, que ya es un PDF.
function guardadoDeFichero(dominio: string, documento: DocumentoDeFichero): Guardado {
  const carpeta = carpetaDelMaterial(dominio);
  const original = `${carpeta}/originales/${documento.nombre}`;
  const escrituras = new Map<string, Uint8Array>([[original, documento.bytes]]);
  let pdf = original;
  if (documento.pdfConvertido !== undefined) {
    pdf = `${carpeta}/${documento.nombre}.pdf`;
    escrituras.set(pdf, documento.pdfConvertido);
  }
  const texto = `${carpeta}/${documento.nombre}.texto.json`;
  return { entrada: { documento: documento.nombre, original, texto, pdf }, escrituras };
}

// La copia de una URL (@MATE-1.5): `web-<n>.html` o `web-<n>.pdf`. Una página HTML no tiene PDF que leer;
// una que sirve un PDF lo guarda como copia y ese es su `pdf`.
function guardadoDeUrl(dominio: string, documento: DocumentoDeUrl, indice: readonly EntradaDelIndice[]): Guardado {
  const carpeta = carpetaDelMaterial(dominio);
  const numero = numeroDeLaUrl(documento.url, indice);
  const original = `${carpeta}/web-${String(numero)}.${documento.formato}`;
  const texto = `${carpeta}/web-${String(numero)}.texto.json`;
  const pdf = documento.formato === 'pdf' ? { pdf: original } : {};
  return {
    entrada: { documento: documento.url, original, texto, ...pdf },
    escrituras: new Map([[original, documento.copia]]),
  };
}

// Una URL que ya está conserva su `n`, aunque ahora sirva otro formato; las demás toman el mayor más uno.
function numeroDeLaUrl(url: string, indice: readonly EntradaDelIndice[]): number {
  const existente = indice.find((entrada) => entrada.documento === url);
  const suyo = existente === undefined ? undefined : numeroDeWeb(existente.texto);
  if (suyo !== undefined) {
    return suyo;
  }
  return Math.max(0, ...indice.map((entrada) => numeroDeWeb(entrada.texto) ?? 0)) + 1;
}

function numeroDeWeb(rutaDelTexto: string): number | undefined {
  const coincidencia = TEXTO_DE_UNA_URL.exec(rutaDelTexto);
  return coincidencia?.[1] === undefined ? undefined : Number(coincidencia[1]);
}

// Sustituye la entrada del mismo documento en su sitio (@MATE-1.1: el orden es el de la primera vez); si no
// estaba, va al final.
function conEntrada(indice: readonly EntradaDelIndice[], nueva: EntradaDelIndice): readonly EntradaDelIndice[] {
  if (!indice.some((entrada) => entrada.documento === nueva.documento)) {
    return [...indice, nueva];
  }
  return indice.map((entrada) => (entrada.documento === nueva.documento ? nueva : entrada));
}

// Sin índice no se ha añadido nada: el material está vacío. Solo la aplicación escribe el índice, así que
// no se comprueba campo a campo.
function leerIndice(ficheros: Ficheros, dominio: string): readonly EntradaDelIndice[] {
  const bytes = ficheros.leer(rutaDelIndice(dominio));
  return bytes === undefined ? [] : (leerJson(bytes) as EntradaDelIndice[]);
}

function leerPaginas(bytes: Uint8Array): readonly string[] {
  return leerJson(bytes) as string[];
}

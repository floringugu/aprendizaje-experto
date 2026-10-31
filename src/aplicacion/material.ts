import type { Dependencias } from './dependencias.ts';
import { dominioValido } from './dominio-valido.ts';
import { documentosDelMaterial, guardarDocumento } from './material-guardado.ts';
import type { PeticionDominio } from './peticiones.ts';
import type { Ficheros, LibreOffice, PaginaDescargada } from './puertos.ts';
import type { Resultado } from './resultado.ts';
import { aceptar, rechazarElCampo, rechazarPorCausa } from './resultado.ts';
import type { CasosDeRevision, FuenteAbierta, PeticionPieza } from './revision-del-material.ts';
import { textoDelHtml } from './texto-html.ts';
import { textoDelPdf } from './texto-pdf.ts';

// Material del dominio y borradores que redacta una IA (MATE, plan §17.6). Nada de lo que está en el
// borrador llega a una sesión: las sesiones solo leen `contenido/<dominio>.json` (MATE-6).

// Los escenarios leen el borrador con estos tipos; se definen en mesa.ts, con la mesa de la revisión.
export type { BorradorDominio, EjemploDeObjetivoAprobado } from './mesa.ts';

/** Material que añade la persona: un fichero (PDF, PPTX o DOCX) o una URL (MATE-1.1). */
type PeticionMaterial =
  | { readonly dominio: string; readonly nombre: string; readonly bytes: Uint8Array }
  | { readonly dominio: string; readonly url: string };

/** Lo que la aplicación hizo con el borrador que entregó la IA (MATE-2.3). */
interface BorradorRedactado {
  /** Una por pieza apartada: la propiedad del formato del contenido que le falta (`feedback`, `pasos`…). */
  readonly apartadas: readonly { readonly falta: string }[];
}

/** Los casos de la revisión están en revision-del-material.ts, con su hueco de deshacer. */
export interface CasosDeMaterial extends CasosDeRevision {
  /**
   * Añade un fichero o una URL al material. PPTX y DOCX se guardan también en PDF, convertidos con
   * LibreOffice; de una URL se guarda una copia (MATE-1). Rechaza con `causa` `tipo_no_admitido`,
   * `falta_libreoffice`, `conversion_fallida`, `url_no_disponible`, `falta_poppler` o `pdf_ilegible`, y con
   * `campo` `nombre` si el nombre del fichero lleva carpetas. Antes de leer o escribir nada, y antes de
   * cualquier otro rechazo, rechaza con `campo` `dominio` si el dominio no pasa `dominioValido`.
   */
  anadirMaterial(peticion: PeticionMaterial): Promise<Resultado<null>>;
  /**
   * El material del dominio: los nombres de los ficheros y las URL, tal como se añadieron. Rechaza con
   * `campo` `dominio` si el dominio no pasa `dominioValido`.
   */
  listarMaterial(peticion: PeticionDominio): Resultado<readonly string[]>;
  /** La IA configurada redacta piezas a partir de un documento del material (MATE-2). Sin IA, `causa` `sin_ia`. */
  redactarBorrador(peticion: {
    readonly dominio: string;
    readonly documento: string;
  }): Promise<Resultado<BorradorRedactado>>;
  /**
   * «Ver fuente» de una pieza del borrador o de un ítem aprobado. En una sesión, solo después de que la
   * persona responda (MATE-7.1); sin fuente, se rechaza (MATE-7.3).
   */
  verFuente(peticion: PeticionPieza): Resultado<FuenteAbierta>;
}

/**
 * Lee el material que añade la persona y lo guarda con `guardarDocumento` («Mecanismo» 1 a 3). Nada se
 * guarda hasta tener el texto, así que un rechazo no deja ficheros a medias.
 * - **Dominio.** Antes de nada, y antes de cualquier otro rechazo, rechaza con `campo` `dominio` si no pasa
 *   `dominioValido`: va dentro de las rutas del material.
 * - **Fichero.** Si el nombre lleva `/` o `\`, rechaza con `campo` `nombre`: el nombre va dentro de una ruta.
 *   El tipo sale de la extensión, sin distinguir mayúsculas: `.pdf`, `.pptx` o `.docx`; cualquier otra, o
 *   ninguna, rechaza con `tipo_no_admitido` (@MATE-1.4). Un PPTX o un DOCX pregunta antes
 *   `libreOffice.instalado()` y, si no está, rechaza con `falta_libreoffice` (@MATE-1.3); si `convertirAPdf`
 *   rechaza la promesa, con `conversion_fallida`. El texto sale de `textoDelPdf`: del PDF convertido, si lo
 *   hay (@MATE-1.2), o del propio fichero.
 * - **URL.** La descarga `web.descargar`; si da `undefined`, rechaza con `url_no_disponible`. El tipo es el
 *   `Content-Type` sin parámetros y en minúsculas: `text/html` se lee con `textoDelHtml` y es una sola
 *   página; `application/pdf`, con `textoDelPdf`; cualquier otro, `tipo_no_admitido`. Se guarda la copia
 *   descargada, para que las citas no dependan de la página (@MATE-1.5).
 *
 * Los rechazos de `textoDelPdf` (`falta_poppler`, `pdf_ilegible`) se devuelven tal cual.
 */
export function anadirMaterial(
  externos: Pick<Dependencias, 'ficheros' | 'libreOffice' | 'web'>,
  peticion: PeticionMaterial,
): Promise<Resultado<null>> {
  const dominio = dominioValido(peticion.dominio);
  if (!dominio.ok) {
    return Promise.resolve(dominio);
  }
  return 'url' in peticion ? anadirUrl(externos, peticion) : anadirFichero(externos, peticion);
}

/**
 * Los documentos de `documentosDelMaterial`: sin material, la lista está vacía (@MATE-1.1). Solo rechaza,
 * con `campo` `dominio`, si el dominio no pasa `dominioValido`.
 */
export function listarMaterial(ficheros: Ficheros, peticion: PeticionDominio): Resultado<readonly string[]> {
  const dominio = dominioValido(peticion.dominio);
  if (!dominio.ok) {
    return dominio;
  }
  return aceptar(documentosDelMaterial(ficheros, peticion.dominio));
}

type Externos = Pick<Dependencias, 'ficheros' | 'libreOffice' | 'web'>;
type PeticionDeUrl = Extract<PeticionMaterial, { readonly url: string }>;
type PeticionDeFichero = Exclude<PeticionMaterial, PeticionDeUrl>;
type FormatoDeCopia = 'html' | 'pdf';

// Un nombre admitido acaba en una de estas extensiones, en mayúsculas o en minúsculas («TEMA1.PDF»).
const EXTENSION_ADMITIDA = /\.(pdf|pptx|docx)$/i;
const EXTENSION_PDF = /\.pdf$/i;
// El nombre del fichero acaba dentro de una ruta: con `/` o `\` saldría de su carpeta.
const CARPETA_EN_EL_NOMBRE = /[/\\]/;
// El `Content-Type` de una URL, sin parámetros y en minúsculas, y el formato de la copia que se guarda.
const FORMATO_POR_TIPO: ReadonlyMap<string, FormatoDeCopia> = new Map<string, FormatoDeCopia>([
  ['text/html', 'html'],
  ['application/pdf', 'pdf'],
]);

const MOTIVO_NOMBRE_CON_CARPETAS = 'El nombre del fichero no puede llevar «/» ni «\\»: quita las carpetas del nombre.';
const MOTIVO_TIPO_NO_ADMITIDO = 'Solo se admiten PDF, PPTX, DOCX y URL.';
const MOTIVO_FALTA_LIBREOFFICE = 'Para añadir PPTX y DOCX hay que instalar LibreOffice en el PC.';
const MOTIVO_URL_SIN_TIPO_ADMITIDO =
  'La dirección no lleva a una página web ni a un PDF: solo se admiten PDF, PPTX, DOCX y URL.';

/**
 * Un fichero: primero el nombre, luego el PDF del que sale el texto (el propio fichero o el convertido) y,
 * solo con el texto en la mano, se guarda. Un rechazo en cualquiera de los pasos no escribe nada.
 */
async function anadirFichero(externos: Externos, peticion: PeticionDeFichero): Promise<Resultado<null>> {
  const { nombre, bytes } = peticion;
  const rechazo = rechazoDelNombre(nombre);
  if (rechazo !== undefined) {
    return rechazo;
  }
  const convertido = await convertirSiHaceFalta(externos.libreOffice, peticion);
  if (!convertido.ok) {
    return convertido;
  }
  // El texto sale del PDF convertido, si lo hay, y no del PPTX o el DOCX original (@MATE-1.2).
  const texto = await textoDelPdf(convertido.valor ?? bytes);
  if (!texto.ok) {
    return texto;
  }
  // Con `exactOptionalPropertyTypes`, `pdfConvertido` no puede valer `undefined`: o está o no se escribe.
  const pdfConvertido = convertido.valor === undefined ? {} : { pdfConvertido: convertido.valor };
  guardarDocumento(externos.ficheros, peticion.dominio, { nombre, bytes, ...pdfConvertido, paginas: texto.valor });
  return aceptar(null);
}

/** El rechazo del nombre, si lo hay: con carpetas (@MATE-1) o de un tipo que no se admite (@MATE-1.4). */
function rechazoDelNombre(nombre: string): Resultado<never> | undefined {
  if (CARPETA_EN_EL_NOMBRE.test(nombre)) {
    return rechazarElCampo('nombre', MOTIVO_NOMBRE_CON_CARPETAS);
  }
  return EXTENSION_ADMITIDA.test(nombre) ? undefined : rechazarPorCausa('tipo_no_admitido', MOTIVO_TIPO_NO_ADMITIDO);
}

/**
 * El PDF de un PPTX o un DOCX, sacado con LibreOffice; `undefined` si el fichero ya es un PDF y no hay nada
 * que convertir. Sin LibreOffice se rechaza antes de intentarlo (@MATE-1.3).
 */
async function convertirSiHaceFalta(
  libreOffice: LibreOffice,
  peticion: PeticionDeFichero,
): Promise<Resultado<Uint8Array | undefined>> {
  if (EXTENSION_PDF.test(peticion.nombre)) {
    return aceptar(undefined);
  }
  if (!(await libreOffice.instalado())) {
    return rechazarPorCausa('falta_libreoffice', MOTIVO_FALTA_LIBREOFFICE);
  }
  try {
    return aceptar(await libreOffice.convertirAPdf(peticion.nombre, peticion.bytes));
  } catch {
    // LibreOffice rechaza la promesa si no puede con el fichero (roto, protegido con contraseña…).
    return rechazarPorCausa(
      'conversion_fallida',
      `LibreOffice no ha podido convertir «${peticion.nombre}» a PDF: puede que el fichero esté roto.`,
    );
  }
}

/** Una URL: se descarga, se lee según su `Content-Type` y se guarda la copia con su texto (@MATE-1.5). */
async function anadirUrl(externos: Externos, peticion: PeticionDeUrl): Promise<Resultado<null>> {
  const pagina = await externos.web.descargar(peticion.url);
  if (pagina === undefined) {
    return rechazarPorCausa(
      'url_no_disponible',
      `No se ha podido descargar «${peticion.url}»: comprueba la dirección y la conexión.`,
    );
  }
  const formato = FORMATO_POR_TIPO.get(tipoSinParametros(pagina.tipoContenido));
  if (formato === undefined) {
    return rechazarPorCausa('tipo_no_admitido', MOTIVO_URL_SIN_TIPO_ADMITIDO);
  }
  const paginas = await paginasDeLaCopia(pagina, formato);
  if (!paginas.ok) {
    return paginas;
  }
  // La copia es la que se descargó, tal cual: las citas no dependen de lo que diga la página después (@MATE-1.5).
  guardarDocumento(externos.ficheros, peticion.dominio, {
    url: peticion.url,
    copia: pagina.bytes,
    formato,
    paginas: paginas.valor,
  });
  return aceptar(null);
}

/** `text/HTML ; charset=utf-8` es `text/html`: lo que va antes del primer `;`, sin espacios y en minúsculas. */
function tipoSinParametros(tipoContenido: string): string {
  return (tipoContenido.split(';')[0] ?? '').trim().toLowerCase();
}

/** Las páginas de la copia: una página HTML es una sola; un PDF tiene las suyas. */
function paginasDeLaCopia(pagina: PaginaDescargada, formato: FormatoDeCopia): Promise<Resultado<readonly string[]>> {
  if (formato === 'pdf') {
    return textoDelPdf(pagina.bytes);
  }
  // `textoDelHtml` recibe el `Content-Type` entero: de él sale el `charset` con el que se leen los bytes.
  return Promise.resolve(aceptar([textoDelHtml(pagina.bytes, pagina.tipoContenido)]));
}

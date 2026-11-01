import type { Dependencias } from './dependencias.ts';
import { dominioValido } from './dominio-valido.ts';
import { documentosDelMaterial, guardarDocumento, pdfDelDocumento } from './material-guardado.ts';
import type { Mesa } from './mesa.ts';
import { escribirBorrador, leerMesa } from './mesa-guardada.ts';
import type { PeticionDominio } from './peticiones.ts';
import type { Ficheros, LibreOffice, PaginaDescargada, PeticionDeRedaccion } from './puertos.ts';
import { aprobadoParaLaIa, incorporarEntrega, peticionDeReservados, type Apartada } from './redaccion.ts';
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
export interface BorradorRedactado {
  /** Una por pieza apartada: la propiedad del formato del contenido que le falta (`feedback`, `pasos`…). */
  readonly apartadas: readonly Apartada[];
}

/** Un documento del material del que la IA redacta piezas: su nombre o su URL, tal como se añadió. */
interface DocumentoParaRedactar {
  readonly dominio: string;
  readonly documento: string;
}

/** Al pedir más reservados: el documento y el objetivo del que se piden (MATE-2.10). */
type PeticionReservados = DocumentoParaRedactar & { readonly objetivo: string };

type ExternosDeRedaccion = Pick<Dependencias, 'ficheros' | 'leerIa'>;

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
  /**
   * La IA configurada redacta piezas a partir de un documento del material, y las válidas se añaden al
   * borrador (MATE-2). Rechaza con `causa` `sin_ia` (@MATE-2.4), `documento_no_encontrado` o
   * `documento_sin_pdf` (una página web: por ahora la IA solo lee PDF), y como la revisión si no puede leer
   * el contenido del dominio.
   */
  redactarBorrador(peticion: DocumentoParaRedactar): Promise<Resultado<BorradorRedactado>>;
  /**
   * La IA configurada redacta, a partir de un documento del material, ítems reservados de un objetivo
   * (MATE-2.10). A la IA se le piden solo ítems con `reservado: true` y se le pasan los enunciados de los
   * ítems que el objetivo ya tiene, aprobados y pendientes, para que el caso sea otro. Lo que entrega pasa
   * por el mismo formato que `redactarBorrador`; además, un ítem que no trae `reservado: true` se aparta
   * (MATE-2.11), y uno que cuelga de otro objetivo también. Rechaza con `causa` `objetivo_no_encontrado`
   * (no está ni en el contenido aprobado ni en el borrador) y con las de `redactarBorrador`.
   */
  pedirMasReservados(peticion: PeticionReservados): Promise<Resultado<BorradorRedactado>>;
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

/**
 * La IA redacta piezas a partir de un documento del material y las válidas van al borrador («Mecanismo» 4,
 * MATE-2). Es `redactarConLaIa` sin objetivo.
 */
export function redactarBorrador(
  externos: ExternosDeRedaccion,
  peticion: DocumentoParaRedactar,
): Promise<Resultado<BorradorRedactado>> {
  return redactarConLaIa(externos, peticion);
}

/** Más ítems reservados de `peticion.objetivo` (MATE-2.10, MATE-2.11). Es `redactarConLaIa` con ese objetivo. */
export function pedirMasReservados(
  externos: ExternosDeRedaccion,
  peticion: PeticionReservados,
): Promise<Resultado<BorradorRedactado>> {
  return redactarConLaIa(externos, peticion, peticion.objetivo);
}

type ExternosDeAlta = Pick<Dependencias, 'ficheros' | 'libreOffice' | 'web'>;
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
async function anadirFichero(externos: ExternosDeAlta, peticion: PeticionDeFichero): Promise<Resultado<null>> {
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
async function anadirUrl(externos: ExternosDeAlta, peticion: PeticionDeUrl): Promise<Resultado<null>> {
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

const MOTIVO_SIN_IA = 'Para redactar borradores hay que configurar una IA en Ajustes.';

/**
 * El cuerpo de `redactarBorrador` y, con `objetivo`, de `pedirMasReservados` («Mecanismo» 4). Por este orden:
 * 1. **Dominio.** Rechaza con `campo` `dominio` el que no pasa `dominioValido`.
 * 2. **IA.** Si `leerIa()` da `undefined`, rechaza con `causa` `sin_ia` y `MOTIVO_SIN_IA` antes de leer
 *    nada: ni la mesa ni el documento (@MATE-2.4).
 * 3. **Mesa.** `leerMesa`, que rechaza como la revisión (`id_repetido`, un contenido que no cumple el formato…).
 * 4. **Objetivo** (solo con `objetivo`). `peticionDeReservados(mesa, objetivo)`; si da `undefined`, rechaza
 *    con `causa` `objetivo_no_encontrado` y el objetivo en el motivo.
 * 5. **Documento.** `pdfDelDocumento`, que rechaza con `documento_no_encontrado` o `documento_sin_pdf`.
 * 6. **Redacción.** `await ia.redactar({ documento, pdf, aprobado: aprobadoParaLaIa(mesa.aprobado) })`, con
 *    `reservadosDe` si hay objetivo. Si la IA rechaza la promesa, el rechazo se propaga sin capturarlo: qué
 *    ve la persona lo decide PANT (`docs/areas/PANT.md`, «Qué devuelve `leerIa` sin sesión»).
 * 7. **Incorporación.** Vuelve a leer la mesa con `leerMesa`, que rechaza igual que en el paso 3: la IA tarda,
 *    y si la persona aprueba una pieza mientras tanto, incorporar en la mesa de antes la devolvería al
 *    borrador con el mismo id que en el aprobado. `incorporarEntrega(mesa, entrega, objetivo)` y
 *    `escribirBorrador` con lo que devuelve; el aprobado no se escribe (@MATE-2.1).
 *
 * Acepta con las `apartadas` de `incorporarEntrega`. Ningún rechazo escribe nada.
 */
async function redactarConLaIa(
  externos: ExternosDeRedaccion,
  peticion: DocumentoParaRedactar,
  objetivo?: string,
): Promise<Resultado<BorradorRedactado>> {
  const dominio = dominioValido(peticion.dominio);
  if (!dominio.ok) {
    return dominio;
  }
  const ia = externos.leerIa();
  if (ia === undefined) {
    return rechazarPorCausa('sin_ia', MOTIVO_SIN_IA);
  }
  const paraLaIa = peticionParaLaIa(externos.ficheros, peticion, objetivo);
  if (!paraLaIa.ok) {
    return paraLaIa;
  }
  // Si la IA rechaza la promesa, el rechazo se propaga: no se captura aquí (lo decide PANT).
  const entrega = await ia.redactar(paraLaIa.valor);
  // La mesa se vuelve a leer: durante la espera la persona ha podido aprobar, corregir o descartar piezas, y
  // la entrega tiene que incorporarse a lo que hay ahora, no a lo que había al pedirla.
  const lectura = leerMesa(externos.ficheros, peticion.dominio);
  if (!lectura.ok) {
    return lectura;
  }
  const { borrador, apartadas } = incorporarEntrega(lectura.valor.mesa, entrega, objetivo);
  escribirBorrador(externos.ficheros, peticion.dominio, borrador);
  return aceptar({ apartadas });
}

/**
 * Lo que se le pide a la IA, con los pasos 3 a 5 de `redactarConLaIa`, en ese orden: la mesa, el objetivo (si
 * lo hay) y el PDF del documento. Un rechazo en cualquiera de ellos no llega a la IA.
 */
function peticionParaLaIa(
  ficheros: Ficheros,
  peticion: DocumentoParaRedactar,
  objetivo: string | undefined,
): Resultado<PeticionDeRedaccion> {
  const lectura = leerMesa(ficheros, peticion.dominio);
  if (!lectura.ok) {
    return lectura;
  }
  const { mesa } = lectura.valor;
  const reservados = reservadosDeLaPeticion(mesa, objetivo);
  if (!reservados.ok) {
    return reservados;
  }
  const pdf = pdfDelDocumento(ficheros, peticion.dominio, peticion.documento);
  if (!pdf.ok) {
    return pdf;
  }
  return aceptar({
    documento: peticion.documento,
    pdf: pdf.valor,
    aprobado: aprobadoParaLaIa(mesa.aprobado),
    ...reservados.valor,
  });
}

/** `reservadosDe` solo existe al pedir más reservados de un objetivo (MATE-2.10); sin objetivo, la petición no lo lleva. */
type ConReservados = Pick<PeticionDeRedaccion, 'reservadosDe'>;

/**
 * Los enunciados de los ítems del objetivo, para que la IA proponga otro caso (@MATE-2.10). Con
 * `exactOptionalPropertyTypes`, `reservadosDe` no puede valer `undefined`: o está o no se escribe.
 */
function reservadosDeLaPeticion(mesa: Mesa, objetivo: string | undefined): Resultado<ConReservados> {
  if (objetivo === undefined) {
    return aceptar({});
  }
  const reservadosDe = peticionDeReservados(mesa, objetivo);
  if (reservadosDe === undefined) {
    return rechazarPorCausa(
      'objetivo_no_encontrado',
      `No existe el objetivo «${objetivo}»: no está ni en el contenido aprobado ni en el borrador.`,
    );
  }
  return aceptar({ reservadosDe });
}

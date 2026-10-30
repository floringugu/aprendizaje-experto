// Las citas del material (MATE-3): si el fragmento que cita una pieza está tal cual en su documento, y
// qué texto enseña «Ver fuente» (MATE-4.3). «Tal cual» quiere decir igual salvo los espacios: cada tramo
// seguido de caracteres de espacio (espacios, tabuladores, saltos de línea y también el espacio de no
// separación que a veces sale de un PDF) cuenta como un solo espacio, en el fragmento y en el documento,
// y nada más se normaliza (plan §0, especificación de MATE). Así, una tilde, una mayúscula o una palabra
// partida con guion a final de línea dan «Cita no encontrada» (@MATE-3.2, @MATE-3.4).

/** De dónde dice una pieza que sale: la forma de su `fuente`, que el dominio no importa de la aplicación. */
export interface Cita {
  /** El nombre del fichero o la URL, tal como se añadió al material. */
  readonly documento: string;
  /** La página, la diapositiva o el apartado, en texto libre («página 12»). */
  readonly lugar: string;
  readonly fragmento: string;
}

/** El texto del material: cada nombre de fichero o URL con sus páginas, en orden. Una URL es una sola página. */
export type TextosDelMaterial = ReadonlyMap<string, readonly string[]>;

/** «No está en tu material» y «Cita no encontrada»: las marcas que salen de la fuente de una pieza (MATE-3). */
export type MarcaDeCita = 'sin_fuente' | 'cita_no_encontrada';

/** La marca de una pieza a partir de su fuente; `undefined` si no lleva ninguna. */
export type Marcador = (fuente: Cita | undefined) => MarcaDeCita | undefined;

/**
 * El marcador de un material. Una pieza lleva:
 * - `sin_fuente` si no trae fuente (@MATE-3.1);
 * - `cita_no_encontrada` si su documento no está en `textos` o si el fragmento no aparece en él
 *   (@MATE-3.2). Las páginas se unen con un salto de línea, así que se encuentra una cita que cruza de
 *   una página a la siguiente. Los espacios del principio y del final del fragmento no cuentan, y un
 *   fragmento que solo tiene espacios no cita nada.
 *
 * Cada documento se normaliza una sola vez, la primera vez que una cita lo necesita: la revisión pide la
 * marca de todas las piezas pendientes, y muchas citan el mismo documento.
 */
export function marcadorDelMaterial(textos: TextosDelMaterial): Marcador {
  // Los documentos ya normalizados, por nombre. Cada uno se llena la primera vez que una cita lo pide.
  const normalizados = new Map<string, DocumentoNormalizado>();
  return (fuente) => {
    if (fuente === undefined) return 'sin_fuente';
    const doc = documentoNormalizado(textos, normalizados, fuente.documento);
    const encontrada = doc !== undefined && buscarFragmento(doc, fuente.fragmento) !== undefined;
    return encontrada ? undefined : 'cita_no_encontrada';
  };
}

/**
 * El texto que enseña la hoja de «Ver fuente» (@MATE-4.3): las páginas enteras donde está el fragmento,
 * buscado igual que en `marcadorDelMaterial`. Si aparece varias veces, cuenta la primera; si cruza de una
 * página a otra, trae todas las que abarca, unidas con un salto de línea.
 *
 * Si el fragmento no aparece, trae la página que dice `lugar`, cuando `lugar` lleva un solo número y ese
 * número es una página del documento («página 12», «diapositiva 3»): así la persona compara una pieza
 * marcada con lo que de verdad dice esa página. El fragmento va antes que `lugar` porque la IA puede
 * contar las páginas impresas, que en un libro no coinciden con las del PDF.
 *
 * `undefined` si el documento no está en `textos`, o si el fragmento no aparece y `lugar` no da una página.
 */
export function contextoDeLaCita(cita: Cita, textos: TextosDelMaterial): string | undefined {
  const paginas = textos.get(cita.documento);
  if (paginas === undefined) return undefined;
  const doc = normalizarDocumento(paginas);
  const rango = buscarFragmento(doc, cita.fragmento);
  if (rango === undefined) return paginaDelLugar(cita.lugar, paginas);
  // Van de la página del primer carácter a la del último. `slice` incluye también las páginas vacías que
  // hay entre ellas, aunque no tengan tramo: son parte de lo que abarca la cita.
  const primera = paginaDePosicion(doc, rango.inicio);
  const ultima = paginaDePosicion(doc, rango.fin - 1);
  return paginas.slice(primera, ultima + 1).join('\n');
}

// Piezas internas: todas trabajan sobre el texto normalizado y ninguna sale del módulo.

/**
 * Los caracteres de espacio que cuentan como uno: el espacio, el tabulador, los saltos de línea (\n, \r),
 * los de control de espacio (\f, \v) y el espacio de no separación (U+00A0), que a veces sale de un PDF.
 * No se usa `\s`: cubre más caracteres (espacios Unicode raros, U+FEFF) de los que pide la especificación.
 */
const TRAMO_DE_ESPACIOS = /[ \t\n\r\f\v\u00a0]+/g;

/**
 * El texto con cada tramo de espacios hecho un solo espacio, y sin espacio al principio ni al final. Así el
 * fragmento «  hola  » y el texto «hola» se comparan igual. Tras el primer paso, el espacio del principio y el
 * del final (si lo hay) es uno solo, y se quita.
 */
function normalizar(texto: string): string {
  return texto.replace(TRAMO_DE_ESPACIOS, ' ').replace(/^ | $/g, '');
}

/** Una página con texto: su número en la lista de `textos` y dónde están sus caracteres en el texto unido. */
interface Tramo {
  readonly indice: number;
  /** Primer carácter de la página en el texto unido. Basta con el inicio: la página siguiente empieza tras un espacio. */
  readonly inicio: number;
}

/** Un documento listo para buscar: sus páginas normalizadas y unidas por un espacio. */
interface DocumentoNormalizado {
  readonly texto: string;
  readonly tramos: readonly Tramo[];
}

/** Dónde está un fragmento en el texto unido: desde `inicio`, sin incluir `fin`. */
interface Rango {
  readonly inicio: number;
  readonly fin: number;
}

/**
 * Une las páginas en un solo texto normalizado. Entre dos páginas con texto va un espacio: es lo que deja el
 * salto de línea de la regla MATE-3 una vez normalizado. Las páginas vacías no ocupan sitio en el texto unido
 * (no tienen tramo), pero siguen contando en la numeración de las páginas.
 */
function normalizarDocumento(paginas: readonly string[]): DocumentoNormalizado {
  const partes: string[] = [];
  const tramos: Tramo[] = [];
  let inicio = 0;
  for (const [indice, original] of paginas.entries()) {
    const texto = normalizar(original);
    if (texto === '') continue;
    tramos.push({ indice, inicio });
    partes.push(texto);
    // El +1 es el espacio que separa esta página de la siguiente en el texto unido.
    inicio += texto.length + 1;
  }
  return { texto: partes.join(' '), tramos };
}

/**
 * El documento normalizado de `nombre`, o `undefined` si no está en `textos`. Se normaliza la primera vez que
 * una cita lo pide y se guarda en `recordados`, para que varias piezas del mismo documento no lo repitan.
 */
function documentoNormalizado(
  textos: TextosDelMaterial,
  recordados: Map<string, DocumentoNormalizado>,
  nombre: string,
): DocumentoNormalizado | undefined {
  const guardado = recordados.get(nombre);
  if (guardado !== undefined) return guardado;
  const paginas = textos.get(nombre);
  if (paginas === undefined) return undefined;
  const doc = normalizarDocumento(paginas);
  recordados.set(nombre, doc);
  return doc;
}

/**
 * Dónde aparece el fragmento en el texto unido, o `undefined`. El fragmento se normaliza igual que el documento,
 * así que la comparación es «tal cual» salvo los espacios (@MATE-3.2). Un fragmento vacío no cita nada: sin esta
 * comprobación, `indexOf('')` lo encontraría al principio.
 */
function buscarFragmento(doc: DocumentoNormalizado, fragmento: string): Rango | undefined {
  const buscado = normalizar(fragmento);
  if (buscado === '') return undefined;
  const inicio = doc.texto.indexOf(buscado);
  return inicio < 0 ? undefined : { inicio, fin: inicio + buscado.length };
}

/**
 * El número (desde 0) de la página que contiene esa posición del texto unido: la última cuyo primer carácter
 * está en la posición o antes. Las páginas van en orden, así que esa es la que la contiene. Una posición que
 * cae justo al principio de una página cuenta para ella (por eso es «o antes» y no «antes»).
 */
function paginaDePosicion(doc: DocumentoNormalizado, posicion: number): number {
  let pagina = 0;
  for (const tramo of doc.tramos) {
    if (tramo.inicio <= posicion) pagina = tramo.indice;
  }
  return pagina;
}

/**
 * La página que dice `lugar` («página 12», «diapositiva 3»), si `lugar` lleva un solo número y ese número es
 * una página del documento. Con dos números («apartado 2.3») no se sabe cuál es, y «página 0» o «página 99»
 * no son páginas de este documento.
 */
function paginaDelLugar(lugar: string, paginas: readonly string[]): string | undefined {
  const numeros = lugar.match(/\d+/g) ?? [];
  if (numeros.length !== 1) return undefined;
  // La lista empieza en 0 y las páginas en 1, por eso se resta uno. Una página 0 da -1, que no es una
  // posición de la lista: no hay página.
  return paginas[Number(numeros[0]) - 1];
}

// El texto de una página web del material (plan §0, «Texto de una página web»). Código propio, sin
// dependencias: basta con lo que necesitan las citas (MATE-3) y la hoja de «Ver fuente» (MATE-4.3).

// Si el `Content-Type` no trae `charset`, o `TextDecoder` no lo conoce, se lee como UTF-8 (@MATE-1.1).
const CODIFICACION_POR_DEFECTO = 'utf-8';
// `charset=ISO-8859-1`, `CHARSET="utf-8"`, `charset = 'latin1'`: sin distinguir mayúsculas y con comillas o sin ellas.
const CHARSET = /charset\s*=\s*["']?([^\s;"']+)/i;

// Fuera los comentarios `<!-- … -->` y los elementos `script` y `style` enteros. `\1` repite el nombre que
// abrió el elemento, así que `<script>` solo se cierra con `</script>`, y la `i` hace lo mismo con `<SCRIPT>`.
const COMENTARIOS = /<!--[\s\S]*?-->/g;
const SCRIPT_Y_STYLE = /<(script|style)(?=[\s/>])[^>]*>[\s\S]*?<\/\1\s*>/gi;

// En HTML el espacio en blanco del código es el espacio, el tabulador, el salto de línea, el avance de página
// y el retorno de carro. No se usa `\s` porque también cubre `\u00A0` (el espacio duro), que el navegador no
// junta con los demás.
const ESPACIOS_DEL_CODIGO = /[ \t\n\r\f]+/g;

// Los nombres de la regla 4, separados por espacios para que quepan en pocas líneas.
const ETIQUETAS_DE_BLOQUE =
  'p div br hr li ul ol dl dt dd h1 h2 h3 h4 h5 h6 table caption tr td th title section article header footer ' +
  'nav aside main blockquote pre figure figcaption';
// Abre o cierra (`<p>`, `</p>`, `<br/>`, `<P class="a">`) una de las etiquetas de bloque. La búsqueda hacia
// delante `(?=[\s/>])` obliga a que el nombre termine ahí: `<p>` no es `<pre>` ni `<param>`.
const ETIQUETA_DE_BLOQUE = new RegExp(`<\\/?(?:${ETIQUETAS_DE_BLOQUE.replaceAll(' ', '|')})(?=[\\s/>])[^>]*>`, 'gi');
// Cualquier otra etiqueta, y también `<!DOCTYPE …>` y `<?xml …?>`. Una `<` seguida de espacio o de un número
// («2 < 3») no es una etiqueta y se queda como texto.
const OTRA_ETIQUETA = /<[!?/]?[a-z][^>]*>/gi;

// Una entidad: `&amp;`, `&#233;` o `&#xE9;`. Se captura lo que va entre `&` y `;`.
const ENTIDAD = /&(#?[a-z0-9]+);/gi;
const ENTIDAD_HEXADECIMAL = /^#x([0-9a-f]+)$/i;
const ENTIDAD_DECIMAL = /^#([0-9]+)$/;

// Las entidades de nombre más comunes en español (@MATE-1.1). Es un `Map` y no un objeto para que
// `&constructor;` o `&toString;` no encuentren las propiedades que todo objeto hereda. Los nombres
// distinguen mayúsculas: `&Ntilde;` es «Ñ» y `&ntilde;`, «ñ».
const ENTIDADES_CON_NOMBRE: ReadonlyMap<string, string> = new Map(
  Object.entries({
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: '\u00A0',
    aacute: 'á',
    eacute: 'é',
    iacute: 'í',
    oacute: 'ó',
    uacute: 'ú',
    Aacute: 'Á',
    Eacute: 'É',
    Iacute: 'Í',
    Oacute: 'Ó',
    Uacute: 'Ú',
    auml: 'ä',
    euml: 'ë',
    iuml: 'ï',
    ouml: 'ö',
    uuml: 'ü',
    Auml: 'Ä',
    Euml: 'Ë',
    Iuml: 'Ï',
    Ouml: 'Ö',
    Uuml: 'Ü',
    ntilde: 'ñ',
    Ntilde: 'Ñ',
    iquest: '¿',
    iexcl: '¡',
    laquo: '«',
    raquo: '»',
    ordm: 'º',
    ordf: 'ª',
    ndash: '–',
    mdash: '—',
    lsquo: '‘',
    rsquo: '’',
    ldquo: '“',
    rdquo: '”',
    hellip: '…',
    middot: '·',
    euro: '€',
  }),
);

/**
 * El texto de una página HTML como lo leería una persona, con una línea por bloque. Por orden:
 * 1. Los bytes se decodifican con el `charset` de `tipoContenido` («text/html; charset=ISO-8859-1»), sin
 *    distinguir mayúsculas y con comillas o sin ellas. Si no lo trae, o `TextDecoder` no lo conoce, en UTF-8.
 * 2. Fuera los comentarios `<!-- … -->` y los elementos `script` y `style`, con lo que llevan dentro.
 * 3. Cada tramo de espacios del código (espacios, tabuladores, saltos de línea) es un solo espacio, como
 *    en el navegador.
 * 4. Las etiquetas de bloque, al abrirse y al cerrarse, pasan a un salto de línea: `p`, `div`, `br`, `hr`,
 *    `li`, `ul`, `ol`, `dl`, `dt`, `dd`, `h1`…`h6`, `table`, `caption`, `tr`, `td`, `th`, `title`, `section`,
 *    `article`, `header`, `footer`, `nav`, `aside`, `main`, `blockquote`, `pre`, `figure` y `figcaption`. Las
 *    celdas también, para que no se peguen: una cita de una fila las une con un espacio (MATE-3.3). Las demás
 *    desaparecen sin dejar espacio: «<b>ho</b>la» da «hola».
 * 5. Se decodifican las entidades, después de quitar las etiquetas para que `&lt;p&gt;` quede como texto:
 *    las numéricas (`&#233;`, `&#xE9;`) y las de nombre más comunes en español (`&amp;`, `&lt;`, `&gt;`,
 *    `&quot;`, `&apos;`, `&nbsp;`, las vocales con tilde y con diéresis en mayúscula y en minúscula,
 *    `&ntilde;`, `&Ntilde;`, `&iquest;`, `&iexcl;`, `&laquo;`, `&raquo;`, `&ordm;`, `&ordf;`, `&ndash;`,
 *    `&mdash;`, `&lsquo;`, `&rsquo;`, `&ldquo;`, `&rdquo;`, `&hellip;`, `&middot;` y `&euro;`). Una entidad
 *    que no se conoce, o un número que no es un carácter, se queda tal cual.
 * 6. Cada línea, sin espacios al principio ni al final; las líneas vacías no salen.
 */
export function textoDelHtml(bytes: Uint8Array, tipoContenido: string): string {
  const html = decodificar(bytes, tipoContenido);
  const sinCodigo = quitarComentariosYCodigo(html);
  const compacto = sinCodigo.replace(ESPACIOS_DEL_CODIGO, ' ');
  // Las entidades van después de quitar las etiquetas: así `&lt;p&gt;` queda como el texto «<p>» y no como
  // una etiqueta que se borraría (@MATE-1.1).
  const sinEtiquetas = quitarEtiquetas(compacto);
  return lineasConTexto(decodificarEntidades(sinEtiquetas));
}

/** Regla 1: los bytes con el `charset` del tipo de contenido, o en UTF-8 si falta o no se conoce. */
function decodificar(bytes: Uint8Array, tipoContenido: string): string {
  const etiqueta = CHARSET.exec(tipoContenido)?.[1] ?? CODIFICACION_POR_DEFECTO;
  try {
    return new TextDecoder(etiqueta).decode(bytes);
  } catch {
    // `TextDecoder` lanza `RangeError` con una etiqueta que no conoce («charset=klingon»).
    return new TextDecoder(CODIFICACION_POR_DEFECTO).decode(bytes);
  }
}

/** Regla 2: fuera los comentarios y los elementos `script` y `style`, con lo que llevan dentro. */
function quitarComentariosYCodigo(html: string): string {
  return html.replace(COMENTARIOS, '').replace(SCRIPT_Y_STYLE, '');
}

/** Regla 4: las etiquetas de bloque son un salto de línea; las demás desaparecen sin dejar espacio. */
function quitarEtiquetas(texto: string): string {
  return texto.replace(ETIQUETA_DE_BLOQUE, '\n').replace(OTRA_ETIQUETA, '');
}

/** El carácter de un número de entidad, o `undefined` si ese número no es un carácter. */
function caracterDelNumero(numero: number): string | undefined {
  try {
    const caracter = String.fromCodePoint(numero);
    // Un sustituto suelto (`&#xD800;`) cabe en un `string` de JavaScript, pero no es un carácter.
    return caracter.isWellFormed() ? caracter : undefined;
  } catch {
    // `fromCodePoint` lanza `RangeError` si el número pasa del último carácter de Unicode.
    return undefined;
  }
}

/** El texto que pone una entidad (lo que va entre `&` y `;`), o `undefined` si no se conoce. */
function caracterDeLaEntidad(cuerpo: string): string | undefined {
  const hexadecimal = ENTIDAD_HEXADECIMAL.exec(cuerpo)?.[1];
  if (hexadecimal !== undefined) {
    return caracterDelNumero(Number(`0x${hexadecimal}`));
  }
  const decimal = ENTIDAD_DECIMAL.exec(cuerpo)?.[1];
  if (decimal !== undefined) {
    return caracterDelNumero(Number(decimal));
  }
  return ENTIDADES_CON_NOMBRE.get(cuerpo);
}

/**
 * Regla 5: las entidades. Una sola pasada, así que `&amp;lt;` da `&lt;` y no `<`. Una entidad que no se
 * conoce, o un número que no es un carácter, se queda tal cual.
 */
function decodificarEntidades(texto: string): string {
  return texto.replace(ENTIDAD, (entidad, cuerpo: string) => caracterDeLaEntidad(cuerpo) ?? entidad);
}

/**
 * Regla 6: cada línea sin espacios en los extremos y sin las vacías. `trim` quita también el espacio duro
 * (`&nbsp;`) y el retorno de carro, así que una línea que solo trae eso tampoco sale.
 */
function lineasConTexto(texto: string): string {
  return texto
    .split('\n')
    .map((linea) => linea.trim())
    .filter((linea) => linea !== '')
    .join('\n');
}

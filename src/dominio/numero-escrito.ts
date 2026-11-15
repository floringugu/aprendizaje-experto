// Lectura y escritura de un número tal como lo teclea la persona (RECU-5). Va aparte de `normalizar`
// (correccion.ts), que compara textos: aquí el texto se convierte en un número y se separa de lo que
// lleva detrás. Nadie más sabe qué formas de escribir un número se entienden.

/** Lo que se lee de una respuesta numérica. */
export interface NumeroEscrito {
  readonly valor: number;
  /**
   * Lo que la persona escribió detrás del número, sin ningún espacio: la unidad («m/s²» de «9,81 m / s²»).
   * Vacío si solo escribió el número.
   */
  readonly resto: string;
}

/**
 * Cómo se escribe un número, dicho para la persona cuando su respuesta no se entendió (@RECU-5.10). Está
 * junto a `leerNumero` porque describe lo que esa función acepta: si cambia una, cambia la otra.
 */
export const FORMATO_DE_UN_NUMERO =
  'Un número se escribe con dígitos, con coma o punto como separador decimal y sin separador de miles: ' +
  '«1000,5». La notación científica se escribe con «e» o con una potencia de diez: «6,674e-11» o «6,674·10^-11».';

// Las expresiones regulares de abajo son los dos trozos de un número. Algunas pistas para leerlas: `^` ancla
// la búsqueda al principio del texto (sin él, `exec` encontraría un número en medio, como el 5 de «muy 5 m», y
// se daría por el primero); `(?:…)` agrupa sin guardar lo que casa; `?` hace opcional lo anterior; `+` pide
// uno o más; `\d` es un dígito del 0 al 9; `\s` es un espacio; y dentro de `[…]` se escribe cualquiera de
// los caracteres de la lista, con `\-` para el guion de verdad (sin la barra sería un rango).

/**
 * El principio de un número: un signo opcional (`+`, `-` o `−`, el menos tipográfico), dígitos y, si hay
 * separador decimal (`.` o `,`), más dígitos detrás. Con dígitos obligatorios a los dos lados del separador,
 * «,5» y «5,» no son una mantisa entera: de «5,» solo se lee el 5, y la coma sobrante se rechaza más abajo.
 */
const MANTISA = /^[+\-−]?\d+(?:[.,]\d+)?/;

/**
 * El exponente que sigue pegado a la mantisa, en una de dos formas: la letra `e` (o `E`) y un entero con
 * signo opcional («e-11»); o un signo de multiplicar entre espacios opcionales, `10` y la potencia, con `^` y
 * un entero con signo opcional («·10^-11») o con el entero en superíndices, con `⁺` o `⁻` opcional delante
 * («×10⁻¹¹»). Un `e` o un `x` que no completan nada de esto no casan: quedan como resto («5 eV»).
 */
const EXPONENTE = /^(?:[eE][+\-−]?\d+|\s*[·×x*]\s*10(?:\^[+\-−]?\d+|[⁺⁻]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+))/;

/** El signo de multiplicar con su `10` y, si lo lleva, el `^`: lo que en JavaScript es la letra `e`. */
const POR_DIEZ_ELEVADO_A = /\s*[·×x*]\s*10\^?/;

/** Los superíndices, en el orden de los dígitos: la posición de cada uno en la cadena es su valor. */
const SUPERINDICES = '⁰¹²³⁴⁵⁶⁷⁸⁹';

/** Cualquier espacio, para quitarlos todos del resto con `replace` (la `g` los quita todos, no solo el primero). */
const ESPACIOS = /\s/g;

/** Un resto que empieza así es un separador de miles o un segundo separador decimal («1 000», «9,8,1»). */
const COMIENZO_DUDOSO = /^[\d,.]/;

/**
 * Reescribe lo leído (mantisa y exponente) como lo escribiría JavaScript, «6.674e-11», para que `Number`
 * devuelva el `number` más cercano. Multiplicar por la potencia de diez a mano sumaría un error de redondeo
 * y «6,674·10^-11» no daría exactamente lo mismo que «0,00000000006674».
 */
function enFormaDeJavaScript(leido: string): string {
  return leido
    .replace(POR_DIEZ_ELEVADO_A, 'e')
    .replaceAll('⁺', '') // un exponente sin signo ya es positivo
    .replaceAll('⁻', '-')
    .replaceAll('−', '-')
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (superindice) => String(SUPERINDICES.indexOf(superindice)))
    .replace(',', '.');
}

/**
 * Lee el número con el que empieza `texto` y lo separa de lo que lleva detrás. Devuelve `undefined` si
 * `texto` no empieza por un número, si lo que sigue al número hace dudar de cuál es o si el número no
 * cabe en un `number`, como «1e999» (@RECU-5.10).
 *
 * Los espacios de los extremos no cuentan. El número se escribe así, sin espacios dentro salvo donde se dice:
 * - Un signo opcional: `+`, `-` o `−` (el signo menos tipográfico, U+2212).
 * - Dígitos y, opcionalmente, una coma o un punto seguido de más dígitos (@RECU-5.4): «9,81», «9.81»,
 *   «12». Tiene que haber dígitos a los dos lados del separador: «,5» y «5,» no se leen.
 * - Opcionalmente, un exponente pegado (@RECU-5.5), en una de estas formas:
 *   - `e` o `E`, un signo opcional y dígitos: «6,674e-11», «6,67E-11», «1e+21».
 *   - Un signo de multiplicar (`·`, `×`, `x` o `*`, con espacios opcionales a los lados), `10^`, un signo
 *     opcional y dígitos: «6,674·10^-11», «6,674 x 10^11».
 *   - Un signo de multiplicar igual, `10` y el exponente en superíndices (`⁰` a `⁹`, con `⁺` o `⁻`
 *     opcional delante): «6,674×10⁻¹¹».
 *   Una «e» o un signo de multiplicar que no completan un exponente son parte del resto: «5 eV» es 5 con
 *   el resto «eV».
 *
 * El resto es todo lo que sigue, sin ningún espacio (@RECU-5.6). Si el resto empieza por un dígito, una
 * coma o un punto, el texto no se lee: es un separador de miles o un segundo separador decimal
 * («1.000,5», «1 000», «9,8,1») y no se adivina qué número quiso escribir la persona. Por eso «1.000» se
 * lee como 1, con tres decimales, y no como mil.
 *
 * El valor es el `number` más cercano a lo escrito, como si se hubiera escrito en JavaScript
 * (`6.674e-11`): no se calcula multiplicando por la potencia de diez, que añadiría error de redondeo, así
 * que «0,00000000006674» y «6,674·10^-11» dan exactamente el mismo valor.
 */
export function leerNumero(texto: string): NumeroEscrito | undefined {
  const sinBordes = texto.trim();
  const mantisa = MANTISA.exec(sinBordes)?.[0];
  if (mantisa === undefined) {
    return undefined;
  }
  const exponente = EXPONENTE.exec(sinBordes.slice(mantisa.length))?.[0] ?? '';
  const resto = sinBordes.slice(mantisa.length + exponente.length).replace(ESPACIOS, '');
  const valor = Number(enFormaDeJavaScript(mantisa + exponente));
  // Un número que no cabe en un `number` («1e999») sale como infinito, y el infinito pasaría por
  // correcto con cualquier valor al comparar con un margen: se trata como algo que no se lee.
  if (COMIENZO_DUDOSO.test(resto) || !Number.isFinite(valor)) {
    return undefined;
  }
  return { valor, resto };
}

/**
 * Escribe un número como lo escribiría la persona, con coma decimal: 9.81 → «9,81», 12 → «12»,
 * 6.674e-11 → «6,674e-11» (@RECU-5.11). Lo que devuelve lo vuelve a leer `leerNumero` con el mismo valor.
 */
export function escribirNumero(valor: number): string {
  // `String` da la forma más corta que vuelve al mismo número, «6.674e-11», que `leerNumero` entiende; solo
  // hay que cambiar el punto por la coma.
  return String(valor).replace('.', ',');
}

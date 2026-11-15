// Corrección automática de una respuesta contra lo que el contenido da por bueno (DIAG-1.2, RECU-3,
// RECU-5). Una respuesta de texto (elegida o escrita) se compara normalizada, con `esCorrecta`; una
// numérica, por su valor con un margen y por su unidad, con `falloNumerico`, que además dice qué parte
// falla. La lectura del número está en numero-escrito.ts.

import { escribirNumero, FORMATO_DE_UN_NUMERO, leerNumero } from './numero-escrito.ts';

/**
 * Lo que el contenido da por bueno en una respuesta de texto: elegir la opción correcta, o escribir una de
 * las aceptadas. Una respuesta escrita tiene al menos una aceptada: el contenido se valida al leerlo.
 */
type RespuestaDeTexto =
  | { readonly opciones: readonly string[]; readonly correcta: string }
  | { readonly aceptadas: readonly [string, ...string[]] };

/** Lo que el contenido da por bueno en un ítem numérico (RECU-5). El contenido se valida al leerlo. */
interface RespuestaNumerica {
  readonly valor: number;
  /**
   * Todas las formas de escribir la unidad que valen, con la que se enseña en primer lugar. Sin la
   * propiedad, el ítem no tiene unidad y se responde solo con un número (@RECU-5.8).
   */
  readonly unidades?: readonly [string, ...string[]];
  /** Margen relativo propio del ítem (0,05 es el 5 %), que manda sobre el del parámetro (@RECU-5.2). */
  readonly tolerancia?: number;
}

type RespuestaEsperada = RespuestaDeTexto | RespuestaNumerica;

/**
 * Qué parte de una respuesta numérica falla (@RECU-5.11). Solo lleva los campos de lo que falla: es lo
 * que la aplicación pone tal cual en el feedback (@RECU-2.2).
 */
export interface FalloNumerico {
  /** `distinto`: se lee como un número, pero queda fuera del margen. `ilegible`: no se lee como un número. */
  readonly valor?: 'distinto' | 'ilegible';
  /**
   * `distinta`: no es ninguna de las del contenido. `falta`: el ítem tiene unidad y la respuesta no.
   * `sobra`: el ítem no tiene unidad y la respuesta sí.
   */
  readonly unidad?: 'distinta' | 'falta' | 'sobra';
  /** El margen relativo con el que se ha corregido (0,01 es el 1 %). Solo si el valor es `distinto` (@RECU-5.12). */
  readonly margen?: number;
  /** Cómo se escribe un número (`FORMATO_DE_UN_NUMERO`). Solo si el valor es `ilegible` (@RECU-5.10). */
  readonly formato?: string;
}

/** Todas las respuestas de texto que se corrigen como acertadas. */
function respuestasAceptadas(esperada: RespuestaDeTexto): readonly string[] {
  return 'aceptadas' in esperada ? esperada.aceptadas : [esperada.correcta];
}

/**
 * La respuesta que el feedback enseña como correcta (@RECU-2.1): la opción correcta; en una respuesta
 * escrita, la primera de las aceptadas, que es la que el autor pone como principal; y en una numérica, el
 * valor con coma decimal seguido de un espacio y la primera unidad, «9,81 m/s²», o solo el valor si el
 * ítem no tiene unidad, «12» (@RECU-5.11). Una respuesta con `valor` es numérica aunque traiga además
 * opciones o aceptadas.
 */
export function respuestaMostrada(esperada: RespuestaEsperada): string {
  // `valor` se mira primero: es lo que distingue una respuesta numérica, que puede traer también
  // `aceptadas`, y TypeScript solo deja leer `unidades` después de comprobarlo.
  if ('valor' in esperada) {
    return numeroMostrado(esperada);
  }
  return 'aceptadas' in esperada ? esperada.aceptadas[0] : esperada.correcta;
}

/** El valor con coma decimal y, si el ítem tiene unidades, un espacio y la primera de ellas. */
function numeroMostrado(esperada: RespuestaNumerica): string {
  const valor = escribirNumero(esperada.valor);
  return esperada.unidades === undefined ? valor : `${valor} ${esperada.unidades[0]}`;
}

/**
 * Deja la respuesta en una forma comparable: sin espacios en los extremos, con los espacios repetidos
 * reducidos a uno y en minúsculas (@RECU-3.1, @RECU-3.2). Los acentos se conservan: ninguna regla pide
 * ignorarlos, así que «proporcion» no cuenta como «proporción». También decide cuándo dos opciones de un
 * ítem son la misma (MATE-2.5): `formato-contenido.ts` usa esta misma función para que elegir una opción
 * repetida no pueda contar como acierto.
 */
export function normalizar(texto: string): string {
  return texto.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * La corrección es siempre automática: la respuesta se compara con las que da por buenas el contenido
 * del autor, y nunca se pregunta a la persona si cree que ha acertado (@DIAG-1.2, @RECU-3.3). Es la
 * corrección de las respuestas de texto; la de las numéricas es `falloNumerico`.
 */
export function esCorrecta(respuesta: string, esperada: RespuestaDeTexto): boolean {
  const respuestaNormalizada = normalizar(respuesta);
  return respuestasAceptadas(esperada).some((aceptada) => normalizar(aceptada) === respuestaNormalizada);
}

/** Quita todos los espacios: la unidad se compara sin ellos («m / s²» es «m/s²», @RECU-5.6). */
function sinEspacios(texto: string): string {
  return texto.replace(/\s/g, '');
}

/**
 * El fallo del valor, si lo hay (@RECU-5.1, @RECU-5.2, @RECU-5.12). `tolerancia` es relativa; el margen con
 * el que se compara es absoluto: la tolerancia por el valor absoluto del ítem, para que un valor negativo no
 * dé un margen negativo.
 */
function falloDelValor(
  leido: number,
  esperado: number,
  tolerancia: number,
): { readonly valor: 'distinto'; readonly margen: number } | undefined {
  const margenAbsoluto = tolerancia * Math.abs(esperado);
  // Los `number` no guardan 0,3 ni 0,33 exactos: en JavaScript, 0,33 - 0,3 da 0,030000000000000027, un poco
  // por encima del margen del 10 % sobre 0,3 (0,03), y dejaría fuera una respuesta que está justo en el
  // límite. `Number.EPSILON` es el error relativo del redondeo, y se multiplica por el tamaño de los
  // números que se restan.
  const holgura = Number.EPSILON * (Math.abs(leido) + Math.abs(esperado));
  return Math.abs(leido - esperado) <= margenAbsoluto + holgura ? undefined : { valor: 'distinto', margen: tolerancia };
}

/**
 * El fallo de la unidad, si lo hay (@RECU-5.6, @RECU-5.7, @RECU-5.9, @RECU-5.13). `resto` es lo que la
 * persona escribió detrás del número, ya sin espacios.
 */
function falloDeLaUnidad(
  resto: string,
  unidades: RespuestaNumerica['unidades'],
): { readonly unidad: 'distinta' | 'falta' | 'sobra' } | undefined {
  if (unidades === undefined) {
    return resto === '' ? undefined : { unidad: 'sobra' };
  }
  if (resto === '') {
    return { unidad: 'falta' };
  }
  return unidades.some((unidad) => sinEspacios(unidad) === resto) ? undefined : { unidad: 'distinta' };
}

/**
 * Corrige la respuesta a un ítem numérico (RECU-5). Devuelve `undefined` si es correcta y, si no, qué
 * parte falla. `toleranciaPorDefecto` es el margen relativo de los ítems que no traen el suyo, el
 * parámetro `tolerancia_numerica_relativa` (@RECU-5.1, @RECU-5.3).
 *
 * - **Lectura.** La respuesta se lee con `leerNumero`. Si no se lee, el fallo es solo
 *   `{ valor: 'ilegible', formato: FORMATO_DE_UN_NUMERO }`: de la unidad no se dice nada, porque no se
 *   sabe dónde acaba el número (@RECU-5.10).
 * - **Valor.** Vale si su distancia al valor del ítem no supera el margen: la tolerancia (la del ítem o,
 *   si no la trae, `toleranciaPorDefecto`) por el valor absoluto del ítem. El límite vale: con el 5 %
 *   sobre 100, 95 y 105 son correctas (@RECU-5.2). Se compara el número, no el texto, y no se cuentan
 *   cifras: «9,8», «9,81» y «9,810» valen por 9,81 (@RECU-5.4). Con valor 0 el margen es 0 y solo vale 0.
 *   Para que el redondeo de los `number` no deje fuera una respuesta que está justo en el límite (0,33
 *   con el 10 % sobre 0,3), a la comparación se le da la holgura de ese redondeo: `Number.EPSILON` por la
 *   suma de los valores absolutos de los dos números. Si no vale, el fallo lleva `valor: 'distinto'` y
 *   `margen`, la tolerancia con la que se ha corregido (@RECU-5.12).
 * - **Unidad.** Se compara como texto, sin ningún espacio y distinguiendo mayúsculas: «m / s²» vale por
 *   «m/s²», y «M/S²» no (@RECU-5.6). Vale cualquiera de las `unidades` del ítem; no se convierte, así que
 *   una unidad equivalente que el contenido no da es `distinta` (@RECU-5.7). Si el ítem tiene unidades y
 *   la respuesta no trae ninguna, `falta` (@RECU-5.9); si el ítem no tiene y la respuesta trae una,
 *   `sobra` (@RECU-5.13).
 *
 * El valor y la unidad se corrigen por separado, y el fallo lleva las dos partes si fallan las dos
 * (@RECU-5.11): «12 m/s» por «9,81 m/s²» da `{ valor: 'distinto', margen: 0.01, unidad: 'distinta' }`.
 */
export function falloNumerico(
  respuesta: string,
  esperada: RespuestaNumerica,
  toleranciaPorDefecto: number,
): FalloNumerico | undefined {
  const leido = leerNumero(respuesta);
  if (leido === undefined) {
    return { valor: 'ilegible', formato: FORMATO_DE_UN_NUMERO };
  }
  const delValor = falloDelValor(leido.valor, esperada.valor, esperada.tolerancia ?? toleranciaPorDefecto);
  const delaUnidad = falloDeLaUnidad(leido.resto, esperada.unidades);
  if (delValor === undefined && delaUnidad === undefined) {
    return undefined;
  }
  // Se esparcen los dos fallos para que el objeto lleve solo los campos de lo que falla: un `undefined` se
  // esparce como nada, y un campo con valor `undefined` no es lo mismo que un campo ausente.
  return { ...delValor, ...delaUnidad };
}

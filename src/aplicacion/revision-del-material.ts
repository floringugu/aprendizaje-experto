import { contextoDeLaCita, marcadorDelMaterial, type Marcador } from '../dominio/citas.ts';
import type { ContenidoValidado, Fuente } from './contenido.ts';
import { contenidoValidado, type Entorno } from './estado.ts';
import { textosDelMaterial } from './material-guardado.ts';
import { buscarPieza, idRepetido, type BorradorDominio, type Mesa, type PiezaDeLaMesa } from './mesa.ts';
import type { PeticionDominio } from './peticiones.ts';
import type { Ficheros } from './puertos.ts';
import { aceptar, rechazar, rechazarPorCausa, type Resultado } from './resultado.ts';
import { aplicar, revisar, type Accion, type FiltroRevision, type Revision } from './revision.ts';

// Los casos de uso de la pantalla «Revisión del material» (MATE-4, MATE-5) sobre los dos ficheros del
// dominio, con «Deshacer». Cómo pasa cada pieza del borrador al aprobado es cosa de revision.ts; aquí se
// leen y se escriben los ficheros y se guarda lo que había para deshacer («Mecanismo» 6 y 8 de MATE).
// También «Ver fuente», que lee la misma mesa desde la revisión y desde las sesiones («Mecanismo» 7).

export interface PeticionPieza {
  readonly dominio: string;
  readonly pieza: string;
}

/** La hoja de «Ver fuente»: el fragmento dentro del texto de su lugar (MATE-4.3). */
export interface FuenteAbierta {
  readonly documento: string;
  readonly lugar: string;
  readonly fragmento: string;
  /** El texto entero del lugar citado (la página, la diapositiva o el apartado). */
  readonly texto: string;
}

export interface CasosDeRevision {
  /** Las piezas pendientes del borrador, agrupadas por objetivo; sin filtro, todas (MATE-4.1, MATE-4.2). */
  abrirRevision(peticion: { readonly dominio: string; readonly filtro?: FiltroRevision }): Resultado<Revision>;
  /** Pasa la pieza del borrador al contenido aprobado, con su fuente (MATE-4.4). */
  aprobarPieza(peticion: PeticionPieza): Resultado<null>;
  /** «Aprobar las N sin marca»: las marcadas siguen pendientes (MATE-5.2). */
  aprobarSinMarca(peticion: PeticionDominio): Resultado<null>;
  descartarPieza(peticion: PeticionPieza): Resultado<null>;
  /**
   * Sustituye la pieza por la corregida, que sigue pendiente (MATE-4.6). Si no cumple el formato del
   * contenido, no la guarda y rechaza con el `campo` que falta (MATE-4.8).
   */
  corregirPieza(peticion: PeticionPieza & { readonly corregida: unknown }): Resultado<null>;
  /** Deshace la última aprobación, descarte o corrección (MATE-4.9, MATE-4.10). */
  deshacer(peticion: PeticionDominio): Resultado<null>;
}

/**
 * Los casos de la revisión sobre `ficheros`, con un hueco de deshacer por dominio, en memoria. Cada
 * llamada tiene sus propios huecos; la aplicación crea uno por persona. Devuelve un objeto de funciones,
 * no una instancia de clase: `crearAplicacion` lo reparte con `...`, que no copia los métodos de una clase.
 *
 * **La mesa.** Cada caso lee `contenido/borradores/<dominio>.json` (el borrador) y
 * `contenido/<dominio>.json` (el aprobado) con `ficheros`:
 * - el aprobado puede estar escrito a mano. Si no existe, o no cumple el formato del contenido, rechaza
 *   con `contenidoValidado` (estado.ts). Si no es JSON, rechaza diciendo que no se puede leer;
 * - sin borrador, el borrador está vacío, con el `dominio` de la petición. Solo lo escribe la aplicación,
 *   así que no se valida;
 * - si `idRepetido` da un id, rechaza con `causa` `id_repetido` y el id en el motivo: la revisión nombra
 *   cada pieza solo por su id, y cualquier acción sería ambigua.
 *
 * **Los casos.**
 * - `abrirRevision` da `revisar`, con el filtro `pendientes` si no viene, y no escribe nada. Las marcas
 *   salen de `marcadorDelMaterial(textosDelMaterial(…))` cada vez que se abre (@MATE-4.7).
 * - `aprobarPieza`, `aprobarSinMarca`, `descartarPieza` y `corregirPieza` llaman a `aplicar` con su
 *   acción. Si la acepta, escriben los dos ficheros enteros, en JSON sangrado con dos espacios, y el hueco
 *   del dominio pasa a guardar lo que había en ellos y lo que se acaba de escribir. Si `aplicar` rechaza,
 *   no escriben nada, no tocan el hueco y devuelven el rechazo tal cual (`pieza_no_encontrada`,
 *   `objetivo_pendiente`, el `campo` de una corrección). Si devuelve la misma mesa (aprobar en bloque sin
 *   ninguna pieza que aprobar), tampoco escriben ni tocan el hueco.
 * - `deshacer` vuelve a dejar los dos ficheros como estaban antes de la última acción del dominio y vacía
 *   el hueco: solo se deshace la última (@MATE-4.9, @MATE-4.10). Rechaza con `causa` `nada_que_deshacer`
 *   si el hueco está vacío, o si alguno de los dos ficheros ya no es lo que escribió esa acción (lo ha
 *   cambiado otra cosa: un borrador redactado después, otra persona, una edición a mano). Volver a lo de
 *   antes borraría ese cambio sin avisar (regla que la feature no cubre).
 */
export function crearRevisionDelMaterial(ficheros: Ficheros): CasosDeRevision {
  // El hueco de cada dominio vive en este cierre: dos llamadas a la función no comparten nada.
  const almacen: Almacen = { ficheros, huecos: new Map() };
  return {
    abrirRevision: ({ dominio, filtro }) => abrir(ficheros, dominio, filtro ?? 'pendientes'),
    aprobarPieza: ({ dominio, pieza }) => ejecutar(almacen, dominio, { tipo: 'aprobar', pieza }),
    aprobarSinMarca: ({ dominio }) => ejecutar(almacen, dominio, { tipo: 'aprobar_sin_marca' }),
    descartarPieza: ({ dominio, pieza }) => ejecutar(almacen, dominio, { tipo: 'descartar', pieza }),
    corregirPieza: ({ dominio, pieza, corregida }) =>
      ejecutar(almacen, dominio, { tipo: 'corregir', pieza, corregida }),
    deshacer: ({ dominio }) => deshacerLaUltima(almacen, dominio),
  };
}

/**
 * «Ver fuente» de una pieza, desde la revisión o desde una sesión (MATE-4.3, MATE-7): su fuente, con el
 * texto que da `contextoDeLaCita(fuente, textosDelMaterial(…))`. Lee la mesa como los casos de la revisión,
 * con sus mismos rechazos, y busca la pieza con `buscarPieza`. Después rechaza, por este orden, con `causa`:
 * - `pieza_no_encontrada` si la pieza no está en la mesa;
 * - `antes_de_responder` si es un ítem aprobado que la persona tiene en curso (`enCurso`): la fuente va
 *   con el feedback, y antes adelantaría la respuesta o cambiaría la confianza que declara (@MATE-7.1).
 *   El estado del dominio se busca en `todosLosDominios`, sin crearlo: abrir la fuente desde la revisión
 *   no es abrir el dominio. Lo pendiente del borrador no se comprueba, porque las sesiones solo presentan
 *   lo aprobado (MATE-6); así se abre en la revisión un ítem que se presentó y cuya aprobación se deshizo;
 * - `sin_fuente` si la pieza no tiene fuente (@MATE-7.3);
 * - `cita_no_encontrada` si `contextoDeLaCita` da `undefined`.
 */
export function verFuente(entorno: Entorno, peticion: PeticionPieza): Resultado<FuenteAbierta> {
  const { ficheros } = entorno.dependencias;
  const lectura = leerMesa(ficheros, peticion.dominio);
  if (!lectura.ok) {
    return lectura;
  }
  const fuente = fuenteQueSePuedeAbrir(entorno, peticion, lectura.valor.mesa);
  if (!fuente.ok) {
    return fuente;
  }
  const texto = contextoDeLaCita(fuente.valor, textosDelMaterial(ficheros, peticion.dominio));
  if (texto === undefined) {
    return rechazarPorCausa(
      'cita_no_encontrada',
      `La cita de «${peticion.pieza}» no se encuentra en el material: no hay nada que enseñar.`,
    );
  }
  // Se copian los tres campos uno a uno: la hoja no debe llevar nada más que el contenido haya podido traer.
  const { documento, lugar, fragmento } = fuente.valor;
  return aceptar({ documento, lugar, fragmento, texto });
}

/**
 * La fuente de la pieza, si se puede abrir: los rechazos que no dependen del material, por el orden que
 * dice `verFuente`. Con una pieza sin fuente no se llega a mirar el texto del material.
 */
function fuenteQueSePuedeAbrir(entorno: Entorno, peticion: PeticionPieza, mesa: Mesa): Resultado<Fuente> {
  const pieza = buscarPieza(mesa, peticion.pieza);
  if (pieza === undefined) {
    return rechazarPorCausa(
      'pieza_no_encontrada',
      `«${peticion.pieza}» no está entre las piezas de «${peticion.dominio}».`,
    );
  }
  if (esItemEnCurso(entorno, peticion, pieza)) {
    return rechazarPorCausa(
      'antes_de_responder',
      `«Ver fuente» de «${peticion.pieza}» se abre después del feedback: antes podría adelantar la respuesta.`,
    );
  }
  if (pieza.fuente === undefined) {
    return rechazarPorCausa('sin_fuente', `«${peticion.pieza}» no tiene fuente: no hay nada que enseñar.`);
  }
  return aceptar(pieza.fuente);
}

/**
 * Si la pieza es un ítem aprobado que la persona tiene en curso. Solo mira el estado que ya existe
 * (`todosLosDominios`): `estadoDe` lo crearía, y abrir una fuente desde la revisión no abre el dominio.
 */
function esItemEnCurso(entorno: Entorno, peticion: PeticionPieza, pieza: PiezaDeLaMesa): boolean {
  const estado = entorno.persona.todosLosDominios.get(peticion.dominio);
  return pieza.aprobada && pieza.tipo === 'item' && estado?.enCurso(peticion.pieza) === true;
}

// --- Qué se guarda para deshacer ---

/** Los bytes de los dos ficheros de un dominio. */
interface ParDeBytes {
  readonly borrador: Uint8Array;
  readonly aprobado: Uint8Array;
}

/**
 * Lo que guarda el hueco de un dominio: los ficheros antes de la última acción y los que esa acción acaba
 * de escribir. Se guardan bytes, no objetos: «lo que escribió la acción» se compara con lo que hay ahora
 * byte a byte, y no depende de cómo se interprete el JSON.
 */
interface Hueco {
  readonly antes: ParDeBytes;
  readonly despues: ParDeBytes;
}

/** Los ficheros y los huecos de deshacer, por dominio: lo que comparten los casos de una revisión. */
interface Almacen {
  readonly ficheros: Ficheros;
  readonly huecos: Map<string, Hueco>;
}

// --- Rutas y bytes ---

const rutaDelBorrador = (dominio: string): string => `contenido/borradores/${dominio}.json`;
const rutaDelAprobado = (dominio: string): string => `contenido/${dominio}.json`;

// JSON sangrado con dos espacios, como el resto de ficheros de la aplicación, para poder abrirlo y leerlo a mano.
function codificarJson(valor: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(valor, null, '  '));
}

function leerJson(bytes: Uint8Array): unknown {
  return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
}

/** Los mismos bytes, uno a uno; `undefined` (el fichero ya no existe) no es igual a nada. */
function mismosBytes(actuales: Uint8Array | undefined, esperados: Uint8Array): boolean {
  return actuales?.length === esperados.length && actuales.every((byte, posicion) => byte === esperados[posicion]);
}

// --- Leer la mesa ---

/** Un fichero leído: su contenido ya interpretado y los bytes de los que sale. */
interface Leido<Contenido> {
  readonly contenido: Contenido;
  readonly bytes: Uint8Array;
}

/** La mesa de un dominio con los bytes de los dos ficheros de los que sale. */
interface Lectura {
  readonly mesa: Mesa;
  readonly bytes: ParDeBytes;
}

/**
 * Lee el borrador y el aprobado, y rechaza si alguno no sirve para revisar (ver «La mesa» arriba): el
 * aprobado que no existe, no es JSON o no cumple el formato, y los ids repetidos.
 */
function leerMesa(ficheros: Ficheros, dominio: string): Resultado<Lectura> {
  const aprobado = leerAprobado(ficheros, dominio);
  if (!aprobado.ok) {
    return aprobado;
  }
  const borrador = leerBorrador(ficheros, dominio);
  const mesa: Mesa = { borrador: borrador.contenido, aprobado: aprobado.valor.contenido };
  const repetido = idRepetido(mesa);
  if (repetido !== undefined) {
    return rechazarPorCausa(
      'id_repetido',
      `No se puede revisar «${dominio}»: el id «${repetido}» lo usan varias piezas y la revisión las nombra por su id.`,
    );
  }
  return aceptar({ mesa, bytes: { borrador: borrador.bytes, aprobado: aprobado.valor.bytes } });
}

/**
 * El contenido aprobado, que puede estar escrito a mano: lo valida `contenidoValidado` (estado.ts), con los
 * mismos rechazos que ven los demás casos de uso. El de «no existe» se repite aquí porque, sin fichero, no
 * hay bytes que guardar para deshacer, y TypeScript no sabe que `contenidoValidado` rechaza `undefined`.
 */
function leerAprobado(ficheros: Ficheros, dominio: string): Resultado<Leido<ContenidoValidado>> {
  const bytes = ficheros.leer(rutaDelAprobado(dominio));
  if (bytes === undefined) {
    return rechazar(`No existe el dominio «${dominio}».`);
  }
  const json = leerJsonDelAprobado(dominio, bytes);
  const contenido = json.ok ? contenidoValidado(dominio, json.valor) : json;
  return contenido.ok ? aceptar({ contenido: contenido.valor, bytes }) : contenido;
}

function leerJsonDelAprobado(dominio: string, bytes: Uint8Array): Resultado<unknown> {
  try {
    return aceptar(leerJson(bytes));
  } catch (error) {
    // `JSON.parse` solo lanza `SyntaxError` con un texto que no es JSON; cualquier otro error no es de esto.
    if (!(error instanceof SyntaxError)) {
      throw error;
    }
    return rechazar(`No se puede leer ${rutaDelAprobado(dominio)}: no es JSON.`);
  }
}

/**
 * El borrador solo lo escribe la aplicación, así que no se valida. Sin fichero, es un borrador vacío, y
 * sus bytes son los de ese borrador vacío: así `ParDeBytes` nunca tiene un hueco, y restaurar un borrador
 * que no existía lo dejaría vacío, que para la revisión es lo mismo (en la práctica no ocurre: una acción
 * que cambia la mesa necesita una pieza en el borrador, que por tanto existe).
 */
function leerBorrador(ficheros: Ficheros, dominio: string): Leido<BorradorDominio> {
  const bytes = ficheros.leer(rutaDelBorrador(dominio));
  if (bytes !== undefined) {
    return { contenido: leerJson(bytes) as BorradorDominio, bytes };
  }
  const vacio: BorradorDominio = { dominio, objetivos: [], categorias: [], items: [], tareas: [] };
  return { contenido: vacio, bytes: codificarJson(vacio) };
}

/** Las marcas se calculan con el material de ahora, cada vez, y no se guardan (@MATE-4.7). */
function marcasDelMaterial(ficheros: Ficheros, dominio: string): Marcador {
  return marcadorDelMaterial(textosDelMaterial(ficheros, dominio));
}

// --- Los casos ---

function abrir(ficheros: Ficheros, dominio: string, filtro: FiltroRevision): Resultado<Revision> {
  const lectura = leerMesa(ficheros, dominio);
  if (!lectura.ok) {
    return lectura;
  }
  return aceptar(revisar(lectura.valor.mesa, marcasDelMaterial(ficheros, dominio), filtro));
}

/**
 * Aplica la acción a la mesa del dominio. Solo si `aplicar` la acepta y la mesa cambia se escriben los dos
 * ficheros y se renueva el hueco; un rechazo, o la misma mesa (aprobar en bloque sin piezas), no tocan nada.
 */
function ejecutar(almacen: Almacen, dominio: string, accion: Accion): Resultado<null> {
  const lectura = leerMesa(almacen.ficheros, dominio);
  if (!lectura.ok) {
    return lectura;
  }
  const { mesa, bytes } = lectura.valor;
  const nueva = aplicar(mesa, accion, marcasDelMaterial(almacen.ficheros, dominio));
  if (!nueva.ok) {
    return nueva;
  }
  // `aplicar` devuelve la misma referencia cuando no hay nada que cambiar.
  if (nueva.valor !== mesa) {
    const escritos: ParDeBytes = {
      borrador: codificarJson(nueva.valor.borrador),
      aprobado: codificarJson(nueva.valor.aprobado),
    };
    escribirPar(almacen.ficheros, dominio, escritos);
    almacen.huecos.set(dominio, { antes: bytes, despues: escritos });
  }
  return aceptar(null);
}

function escribirPar(ficheros: Ficheros, dominio: string, bytes: ParDeBytes): void {
  ficheros.escribir(rutaDelBorrador(dominio), bytes.borrador);
  ficheros.escribir(rutaDelAprobado(dominio), bytes.aprobado);
}

/**
 * Restaura los dos ficheros a como estaban antes de la última acción, solo si siguen siendo lo que ella
 * escribió (@MATE-4.9, @MATE-4.10). Si no, volver a lo de antes borraría un cambio ajeno sin avisar.
 */
function deshacerLaUltima(almacen: Almacen, dominio: string): Resultado<null> {
  const hueco = almacen.huecos.get(dominio);
  if (hueco === undefined) {
    return rechazarPorCausa('nada_que_deshacer', 'No hay ninguna acción que deshacer.');
  }
  const { ficheros } = almacen;
  const sigueIgual =
    mismosBytes(ficheros.leer(rutaDelBorrador(dominio)), hueco.despues.borrador) &&
    mismosBytes(ficheros.leer(rutaDelAprobado(dominio)), hueco.despues.aprobado);
  if (!sigueIgual) {
    return rechazarPorCausa(
      'nada_que_deshacer',
      'No se puede deshacer: los ficheros han cambiado después de la última acción y se perdería ese cambio.',
    );
  }
  escribirPar(ficheros, dominio, hueco.antes);
  almacen.huecos.delete(dominio);
  return aceptar(null);
}

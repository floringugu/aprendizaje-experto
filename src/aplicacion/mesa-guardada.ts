import type { ContenidoValidado } from './contenido.ts';
import { lugarDelFallo, validarContenido } from './formato-contenido.ts';
import { idRepetido, type BorradorDominio, type Mesa } from './mesa.ts';
import type { Ficheros } from './puertos.ts';
import { aceptar, rechazar, rechazarPorCausa, type Resultado } from './resultado.ts';

// La mesa guardada de un dominio: los dos ficheros que lee y escribe la revisión, y que las sesiones leen
// a través de `contenidoDeFicheros`. Es el único sitio que conoce sus rutas, relativas a la carpeta de datos:
//
//   contenido/<dominio>.json              el contenido aprobado, el único que leen las sesiones (MATE-6)
//   contenido/borradores/<dominio>.json   el borrador, con las piezas pendientes de revisar
//
// El dominio llega ya validado por `dominioValido`: aquí va dentro de la ruta tal cual.

const rutaDelBorrador = (dominio: string): string => `contenido/borradores/${dominio}.json`;
const rutaDelAprobado = (dominio: string): string => `contenido/${dominio}.json`;

/** Los bytes de los dos ficheros de un dominio: lo que «Deshacer» guarda y compara. */
export interface ParDeBytes {
  readonly borrador: Uint8Array;
  readonly aprobado: Uint8Array;
}

/** La mesa de un dominio con los bytes de los dos ficheros de los que sale. */
export interface LecturaDeLaMesa {
  readonly mesa: Mesa;
  readonly bytes: ParDeBytes;
}

/** JSON sangrado con dos espacios, como todos los ficheros de la aplicación, para poder abrirlo y leerlo a mano. */
export function codificarJson(valor: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(valor, null, '  '));
}

/** Lo contrario de `codificarJson`. Lanza `SyntaxError` si los bytes no son JSON. */
export function leerJson(bytes: Uint8Array): unknown {
  return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
}

/**
 * Lee `contenido/<dominio>.json` con `ficheros` cada vez que se llama, y da el JSON tal cual, sin validar
 * (lo valida `enDominio`), o `undefined` si no existe. Si el fichero no es JSON, da su texto:
 * `validarContenido` lo rechaza como un contenido que no cumple el formato, en vez de tumbar el servidor.
 */
export function contenidoDeFicheros(ficheros: Ficheros): (dominio: string) => unknown {
  return (dominio) => {
    const bytes = ficheros.leer(rutaDelAprobado(dominio));
    if (bytes === undefined) {
      return undefined;
    }
    try {
      return leerJson(bytes);
    } catch (error) {
      // `JSON.parse` solo lanza `SyntaxError` con un texto que no es JSON; cualquier otro error no es de esto.
      if (!(error instanceof SyntaxError)) {
        throw error;
      }
      // El texto no cumple el formato del contenido, y `validarContenido` lo rechazará como tal.
      return new TextDecoder().decode(bytes);
    }
  };
}

/**
 * El contenido aprobado del dominio, tal como se leyó (`undefined` si no existe), ya validado. Si no
 * existe, o no cumple el formato (D16), rechaza: un contenido mal escrito no tumba el servidor, y el
 * rechazo dice qué pieza hay que arreglar. Lo usan `enDominio` (estado.ts), `leerMesa` y `leerAprobado`,
 * que lo leen con el puerto `Ficheros` porque la revisión también lo escribe.
 */
export function contenidoValidado(dominio: string, leido: unknown): Resultado<ContenidoValidado> {
  if (leido === undefined) {
    return rechazar(`No existe el dominio «${dominio}».`);
  }
  const contenido = validarContenido(leido);
  if (!contenido.ok) {
    return rechazar(`El contenido de «${dominio}» no cumple el formato: revisa ${lugarDelFallo(contenido.fallo)}.`);
  }
  return aceptar(contenido.valor);
}

/** Un fichero leído: su contenido ya interpretado y los bytes de los que sale. */
interface Leido<Contenido> {
  readonly contenido: Contenido;
  readonly bytes: Uint8Array;
}

/**
 * Lee el borrador y el aprobado, y rechaza si alguno no sirve para revisar:
 * - el aprobado puede estar escrito a mano. Si no existe, o no cumple el formato del contenido, rechaza con
 *   `contenidoValidado`. Si no es JSON, rechaza diciendo que no se puede leer, con su ruta;
 * - sin borrador, el borrador está vacío, con el `dominio` de la petición, y sus bytes son los de ese
 *   borrador vacío en `codificarJson`. Solo lo escribe la aplicación, así que no se valida;
 * - si `idRepetido` da un id, rechaza con `causa` `id_repetido` y el id en el motivo: la revisión nombra
 *   cada pieza solo por su id, y cualquier acción sería ambigua.
 */
export function leerMesa(ficheros: Ficheros, dominio: string): Resultado<LecturaDeLaMesa> {
  const aprobado = leerAprobadoConBytes(ficheros, dominio);
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

/** Solo el aprobado, con los mismos rechazos que `leerMesa`, sin leer el borrador: lo que necesita «Ver fuente» (MATE-6). */
export function leerAprobado(ficheros: Ficheros, dominio: string): Resultado<ContenidoValidado> {
  const leido = leerAprobadoConBytes(ficheros, dominio);
  return leido.ok ? aceptar(leido.valor.contenido) : leido;
}

/**
 * El contenido aprobado, que puede estar escrito a mano: lo valida `contenidoValidado`, con los
 * mismos rechazos que ven los demás casos de uso. El de «no existe» se repite aquí porque, sin fichero, no
 * hay bytes que guardar para deshacer, y TypeScript no sabe que `contenidoValidado` rechaza `undefined`.
 */
function leerAprobadoConBytes(ficheros: Ficheros, dominio: string): Resultado<Leido<ContenidoValidado>> {
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

/** Los bytes que se escriben para la mesa: los dos ficheros enteros, en `codificarJson`. */
export function bytesDeLaMesa(mesa: Mesa): ParDeBytes {
  return { borrador: codificarJson(mesa.borrador), aprobado: codificarJson(mesa.aprobado) };
}

/** Escribe los dos ficheros del dominio, primero el borrador. */
export function escribirPar(ficheros: Ficheros, dominio: string, par: ParDeBytes): void {
  ficheros.escribir(rutaDelBorrador(dominio), par.borrador);
  ficheros.escribir(rutaDelAprobado(dominio), par.aprobado);
}

/** Si los dos ficheros del dominio son, byte a byte, los de `par`. Un fichero que no existe no es igual a nada. */
export function mismaMesa(ficheros: Ficheros, dominio: string, par: ParDeBytes): boolean {
  return (
    mismosBytes(ficheros.leer(rutaDelBorrador(dominio)), par.borrador) &&
    mismosBytes(ficheros.leer(rutaDelAprobado(dominio)), par.aprobado)
  );
}

/** Los mismos bytes, uno a uno; `undefined` (el fichero ya no existe) no es igual a nada. */
function mismosBytes(actuales: Uint8Array | undefined, esperados: Uint8Array): boolean {
  return actuales?.length === esperados.length && actuales.every((byte, posicion) => byte === esperados[posicion]);
}

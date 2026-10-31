import { contextoDeLaCita, marcadorDelMaterial, type Marcador } from '../dominio/citas.ts';
import type { Fuente } from './contenido.ts';
import { dominioValido } from './dominio-valido.ts';
import type { Entorno } from './estado.ts';
import { textosDelMaterial } from './material-guardado.ts';
import { buscarPieza, type BorradorDominio, type PiezaDeLaMesa } from './mesa.ts';
import { bytesDeLaMesa, escribirPar, leerAprobado, leerMesa, mismaMesa, type ParDeBytes } from './mesa-guardada.ts';
import type { PeticionDominio } from './peticiones.ts';
import type { Ficheros } from './puertos.ts';
import { aceptar, rechazarPorCausa, type Resultado } from './resultado.ts';
import { aplicar, revisar, type Accion, type FiltroRevision, type Revision } from './revision.ts';

// Los casos de uso de la pantalla «Revisión del material» (MATE-4, MATE-5) sobre los dos ficheros del
// dominio, con «Deshacer». Cómo pasa cada pieza del borrador al aprobado es cosa de revision.ts; dónde están
// los ficheros y cómo se leen, de mesa-guardada.ts; aquí se guarda lo que había para deshacer («Mecanismo» 6 y 8 de MATE).
// También «Ver fuente», desde la revisión y desde las sesiones («Mecanismo» 7), que lee primero el aprobado.

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
 * **La mesa.** Cada caso la lee con `leerMesa` (mesa-guardada.ts), y rechaza como ella si no sirve para revisar.
 *
 * **El dominio.** Antes de leer o escribir nada, y antes de cualquier otro rechazo, todos los casos
 * rechazan con `campo` `dominio` el que no pasa `dominioValido`.
 *
 * **Los casos.**
 * - `abrirRevision` da `revisar`, con el filtro `pendientes` si no viene, y no escribe nada. Las marcas
 *   salen de `marcadorDelMaterial(textosDelMaterial(…))` cada vez que se abre (@MATE-4.7).
 * - `aprobarPieza`, `descartarPieza` y `corregirPieza` llaman a `aplicar` con su acción. Si la acepta,
 *   escriben los dos ficheros enteros, en JSON sangrado con dos espacios, y el hueco del dominio pasa a
 *   guardar lo que había en ellos y lo que se acaba de escribir. Si `aplicar` rechaza, no escriben nada,
 *   no tocan el hueco y devuelven el rechazo tal cual (`pieza_no_encontrada`, `objetivo_pendiente`, el
 *   `campo` de una corrección).
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
    abrirRevision: ({ dominio, filtro }) =>
      conDominioValido(dominio, () => abrir(ficheros, dominio, filtro ?? 'pendientes')),
    aprobarPieza: ({ dominio, pieza }) =>
      conDominioValido(dominio, () => ejecutar(almacen, dominio, { tipo: 'aprobar', pieza })),
    descartarPieza: ({ dominio, pieza }) =>
      conDominioValido(dominio, () => ejecutar(almacen, dominio, { tipo: 'descartar', pieza })),
    corregirPieza: ({ dominio, pieza, corregida }) =>
      conDominioValido(dominio, () => ejecutar(almacen, dominio, { tipo: 'corregir', pieza, corregida })),
    deshacer: ({ dominio }) => conDominioValido(dominio, () => deshacerLaUltima(almacen, dominio)),
  };
}

/** Ejecuta el caso solo si el dominio pasa `dominioValido`: si no, devuelve su rechazo sin leer ni escribir nada. */
function conDominioValido<T>(dominio: string, caso: () => Resultado<T>): Resultado<T> {
  const valido = dominioValido(dominio);
  return valido.ok ? caso() : valido;
}

/**
 * «Ver fuente» de una pieza, desde la revisión o desde una sesión (MATE-4.3, MATE-7): su fuente, con el
 * texto que da `contextoDeLaCita(fuente, textosDelMaterial(…))`. Antes de leer nada, rechaza con `campo`
 * `dominio` el dominio que no pasa `dominioValido`. Busca la pieza con `piezaDeVerFuente`, que rechaza como
 * la revisión si no puede leer lo que necesita. Después rechaza, por este orden, con `causa`:
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
  const valido = dominioValido(peticion.dominio);
  if (!valido.ok) {
    return valido;
  }
  const { ficheros } = entorno.dependencias;
  const pieza = piezaDeVerFuente(ficheros, peticion);
  if (!pieza.ok) {
    return pieza;
  }
  const fuente = fuenteQueSePuedeAbrir(entorno, peticion, pieza.valor);
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
 * La pieza que pide «Ver fuente», o `undefined` si no está. La busca primero en el aprobado (`leerAprobado`),
 * que es lo único que presentan las sesiones (MATE-6), y solo si no está ahí lee la mesa entera (`leerMesa`)
 * y la busca con `buscarPieza`. Así, abrir desde una sesión la fuente de una pieza aprobada no depende del
 * borrador: un borrador con un id del aprobado, o que ya no es JSON, no lo impide. Los rechazos son los de
 * esas dos lecturas: sin aprobado, o con uno que no sirve, no se busca en ningún sitio.
 */
function piezaDeVerFuente(ficheros: Ficheros, peticion: PeticionPieza): Resultado<PiezaDeLaMesa | undefined> {
  const { dominio, pieza } = peticion;
  const aprobado = leerAprobado(ficheros, dominio);
  if (!aprobado.ok) {
    return aprobado;
  }
  // Una mesa con el borrador vacío: `buscarPieza` solo puede dar entonces una pieza del aprobado (`aprobada: true`).
  const borradorVacio: BorradorDominio = { dominio, objetivos: [], categorias: [], items: [], tareas: [] };
  const delAprobado = buscarPieza({ borrador: borradorVacio, aprobado: aprobado.valor }, pieza);
  if (delAprobado !== undefined) {
    return aceptar(delAprobado);
  }
  // No está en el aprobado: solo puede ser del borrador, y para fiarse de él hay que leer la mesa entera.
  const lectura = leerMesa(ficheros, dominio);
  return lectura.ok ? aceptar(buscarPieza(lectura.valor.mesa, pieza)) : lectura;
}

/**
 * La fuente de la pieza, si se puede abrir: los rechazos que no dependen del material, por el orden que
 * dice `verFuente`. Con una pieza sin fuente no se llega a mirar el texto del material.
 */
function fuenteQueSePuedeAbrir(
  entorno: Entorno,
  peticion: PeticionPieza,
  pieza: PiezaDeLaMesa | undefined,
): Resultado<Fuente> {
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
 * Aplica la acción a la mesa del dominio. Solo si `aplicar` la acepta se escriben los dos ficheros y se
 * renueva el hueco; un rechazo no toca nada.
 */
function ejecutar(almacen: Almacen, dominio: string, accion: Accion): Resultado<null> {
  const lectura = leerMesa(almacen.ficheros, dominio);
  if (!lectura.ok) {
    return lectura;
  }
  const { mesa, bytes } = lectura.valor;
  const nueva = aplicar(mesa, accion);
  if (!nueva.ok) {
    return nueva;
  }
  const escritos = bytesDeLaMesa(nueva.valor);
  escribirPar(almacen.ficheros, dominio, escritos);
  almacen.huecos.set(dominio, { antes: bytes, despues: escritos });
  return aceptar(null);
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
  if (!mismaMesa(ficheros, dominio, hueco.despues)) {
    return rechazarPorCausa(
      'nada_que_deshacer',
      'No se puede deshacer: los ficheros han cambiado después de la última acción y se perdería ese cambio.',
    );
  }
  escribirPar(ficheros, dominio, hueco.antes);
  almacen.huecos.delete(dominio);
  return aceptar(null);
}

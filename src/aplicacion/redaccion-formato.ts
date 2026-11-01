import type { CategoriaContenido, ItemContenido, ObjetivoContenido, TareaContenido } from './contenido.ts';
import { esRegistro, esTextoNoVacio, falloDeLaPiezaSuelta, type FalloDeFormato } from './formato-contenido.ts';
import type { EjemploDeObjetivoAprobado } from './mesa.ts';

// La primera mitad de `incorporarEntrega` (redaccion.ts): leer lo que entrega la IA y separar las piezas que
// cumplen el formato de las que no. Aquí no se cambia ningún id ni se coloca nada: eso lo hace redaccion.ts.

/** Una tarea de la IA: `antes_de` no lo mira el formato, así que puede traer cualquier cosa. */
export type TareaDeLaIa = TareaContenido & { readonly antes_de?: unknown };

/** Lo que se ha leído de la entrega: las piezas válidas de cada lista y las que no entran. */
export interface EntregaRevisada {
  readonly objetivos: readonly ObjetivoContenido[];
  /** Los ejemplos que van aparte, cada uno con el `objetivo` del que cuelga. */
  readonly ejemplos: readonly EjemploDeObjetivoAprobado[];
  /** Con `diagnostico: false`: el diagnóstico lo marca la persona, no la IA (@MATE-2.6). */
  readonly items: readonly ItemContenido[];
  readonly categorias: readonly CategoriaContenido[];
  readonly tareas: readonly TareaDeLaIa[];
  /** Una por pieza apartada, en el orden en que se recorre la entrega. */
  readonly fallos: readonly FalloDeFormato[];
  /** Los ids de todas las piezas de la entrega que se leen, válidas o no, y los de los ejemplos de dentro. */
  readonly ids: ReadonlySet<string>;
}

type ComprobarPieza = (pieza: unknown) => FalloDeFormato | undefined;

interface Revisadas<Pieza> {
  readonly validas: readonly Pieza[];
  readonly fallos: readonly FalloDeFormato[];
}

/** Las cinco listas de la entrega tal como llegan, sin comprobar. */
interface ListasCrudas {
  readonly objetivos: readonly unknown[];
  readonly ejemplos: readonly unknown[];
  readonly items: readonly unknown[];
  readonly categorias: readonly unknown[];
  readonly tareas: readonly unknown[];
}

/**
 * Lee `entrega` y separa lo que cumple el formato de lo que no (@MATE-2.3, @MATE-2.5, @MATE-2.7, @MATE-2.9).
 * Con `reservadosDe` solo se leen los ítems, porque son lo único que se pidió (@MATE-2.11): las demás
 * listas se ignoran, sin fallos y sin ids.
 */
export function revisarEntrega(entrega: unknown, reservadosDe?: string): EntregaRevisada {
  const crudas = leerListas(entrega, reservadosDe !== undefined);
  const objetivos = revisar<ObjetivoContenido>(crudas.objetivos, (pieza) => falloDeLaPiezaSuelta('objetivo', pieza));
  const ejemplos = revisar<EjemploDeObjetivoAprobado>(crudas.ejemplos, falloDelEjemploAparte);
  const items = revisar<ItemContenido>(crudas.items.map(sinDiagnostico), (pieza) =>
    falloDelItemReservado(pieza, reservadosDe),
  );
  const categorias = revisar<CategoriaContenido>(crudas.categorias, (pieza) =>
    falloDeLaPiezaSuelta('categoria', pieza),
  );
  const tareas = revisar<TareaDeLaIa>(crudas.tareas, (pieza) => falloDeLaPiezaSuelta('tarea', pieza));
  return {
    objetivos: objetivos.validas,
    ejemplos: ejemplos.validas,
    items: items.validas,
    categorias: categorias.validas,
    tareas: tareas.validas,
    fallos: [objetivos, ejemplos, items, categorias, tareas].flatMap(({ fallos }) => fallos),
    ids: idsDeLaEntrega(crudas),
  };
}

/**
 * Las listas de la entrega. Con `soloItems` (se pidieron solo los reservados) las demás quedan vacías, aunque
 * la entrega las traiga (@MATE-2.11). El compilador comprueba que están las cinco.
 */
function leerListas(entrega: unknown, soloItems: boolean): ListasCrudas {
  const sinPedir = (nombre: string): readonly unknown[] => (soloItems ? [] : listaDe(entrega, nombre));
  return {
    objetivos: sinPedir('objetivos'),
    ejemplos: sinPedir('ejemplos_resueltos'),
    items: listaDe(entrega, 'items'),
    categorias: sinPedir('categorias'),
    tareas: sinPedir('tareas'),
  };
}

/** La lista `nombre` de la entrega; vacía si la entrega no es un objeto o si ahí no hay una lista. */
function listaDe(entrega: unknown, nombre: string): readonly unknown[] {
  const lista = esRegistro(entrega) ? entrega[nombre] : undefined;
  return Array.isArray(lista) ? lista : [];
}

/**
 * Aparta las piezas con fallo, en su orden, y se queda con las demás tal como están. `Pieza` es el tipo que
 * `falloDe` garantiza: una pieza sin fallo es de ese tipo, y de ahí el único `as`.
 */
function revisar<Pieza>(piezas: readonly unknown[], falloDe: ComprobarPieza): Revisadas<Pieza> {
  const comprobadas = piezas.map((pieza) => ({ pieza, fallo: falloDe(pieza) }));
  return {
    validas: comprobadas.filter(({ fallo }) => fallo === undefined).map(({ pieza }) => pieza as Pieza),
    fallos: comprobadas.flatMap(({ fallo }) => (fallo === undefined ? [] : [fallo])),
  };
}

/**
 * Un ejemplo que va aparte lleva el `objetivo` del que cuelga. `falloDeLaPiezaSuelta` no lo mira (un ejemplo
 * de dentro de su objetivo no lo lleva), así que se comprueba aquí, después del formato.
 */
function falloDelEjemploAparte(ejemplo: unknown): FalloDeFormato | undefined {
  const fallo = falloDeLaPiezaSuelta('ejemplo', ejemplo);
  if (fallo !== undefined) {
    return fallo;
  }
  const objetivo = esRegistro(ejemplo) ? ejemplo['objetivo'] : undefined;
  return esTextoNoVacio(objetivo) ? undefined : { falta: 'objetivo' };
}

/** El ítem con `diagnostico: false`, hubiera lo que hubiera: lo que no es un objeto se queda como está. */
function sinDiagnostico(item: unknown): unknown {
  return esRegistro(item) ? { ...item, diagnostico: false } : item;
}

/**
 * El primer fallo de un ítem. Sin `reservadosDe` solo cuenta el formato; con él, además (por este orden) su
 * `objetivo` tiene que ser `reservadosDe` y su `reservado`, `true` (regla que la feature no cubre,
 * «Reservados» de MATE). El ítem llega ya con `diagnostico: false`.
 */
function falloDelItemReservado(item: unknown, reservadosDe: string | undefined): FalloDeFormato | undefined {
  const fallo = falloDeLaPiezaSuelta('item', item);
  if (fallo !== undefined || reservadosDe === undefined || !esRegistro(item)) {
    return fallo;
  }
  if (item['objetivo'] !== reservadosDe) {
    return { falta: 'objetivo' };
  }
  return item['reservado'] === true ? undefined : { falta: 'reservado' };
}

/** Los ids de las piezas de las listas, tengan o no un formato válido, y los de los ejemplos de los objetivos. */
function idsDeLaEntrega(listas: ListasCrudas): ReadonlySet<string> {
  const deDentro = listas.objetivos.filter(esRegistro).flatMap((objetivo) => listaDe(objetivo, 'ejemplos_resueltos'));
  const todas = [listas.objetivos, listas.ejemplos, listas.items, listas.categorias, listas.tareas, deDentro];
  return new Set(todas.flatMap(idsDe));
}

/** Los ids que son un texto: una pieza que no es un objeto, o que no trae `id`, no ocupa ninguno. */
function idsDe(piezas: readonly unknown[]): string[] {
  return piezas
    .filter(esRegistro)
    .map((pieza) => pieza['id'])
    .filter((id) => typeof id === 'string');
}

// Los ítems reservados (MAST-8): casos que la persona no practica. Cada uno se presenta una sola vez
// y nunca cuenta para dominar un objetivo (@MAST-8.2). Los problemas reservados de categorías con
// grupo de parecidas miden la transferencia del paso a la fase avanzada (@MAST-6.7) y van a la
// mezcla (INTE-5); los demás van a las pruebas de retención (@MAST-8.3).

import { llegaAlUmbral } from './acierto.ts';
import { problemasIntercalables } from './diagnostico.ts';

// Lo que `problemasIntercalables` necesita saber de un ítem y de una categoría.
type ItemClasificado = Parameters<typeof problemasIntercalables>[0][number];
type CategoriaClasificada = Parameters<typeof problemasIntercalables>[1][number];

/** Lo que hace falta saber de un ítem para decidir si es reservado. */
interface ItemMarcable {
  readonly reservado?: boolean;
}

interface ItemReservable extends ItemClasificado, ItemMarcable {}

/** Un ítem es reservado solo con `reservado: true`; sin el campo, o con `false`, no lo es. */
export function esReservado(item: ItemMarcable): boolean {
  return item.reservado === true;
}

/**
 * Los ítems que se practican, en su orden: todos menos los reservados. Sin ellos se preparan el
 * diagnóstico, la práctica y los repasos (@MAST-8.1), y se mide el dominio de un objetivo (@MAST-8.2).
 */
export function sinReservados<T extends ItemMarcable>(items: readonly T[]): readonly T[] {
  return items.filter((item) => !esReservado(item));
}

/**
 * Reparte entre `pruebas` pruebas de retención los reservados de `items` (los de un objetivo) que no
 * van a la mezcla: los hechos y los problemas de categorías sin grupo de parecidas (@MAST-8.3). Van
 * a partes iguales y en el orden del contenido; si no sale exacto, las primeras pruebas llevan uno
 * más. Así, 5 reservados en 2 pruebas dan 3 y 2. La posición de cada lista es la de la prueba, la
 * misma que la de su número de semanas en `retencion_diferida_semanas`. Con 0 pruebas no hay listas.
 *
 * Reparte todos, también los que ya se han gastado: así una prueba no hereda los de otra cuando
 * alguno se responde. Quitar los gastados es cosa de quien prepara la prueba (@MAST-8.5).
 */
export function reservadosDeRetencion(
  items: readonly ItemReservable[],
  categorias: readonly CategoriaClasificada[],
  pruebas: number,
): readonly (readonly string[])[] {
  const vanALaMezcla = new Set(problemasIntercalables(items, categorias));
  const ids = items.filter((item) => esReservado(item) && !vanALaMezcla.has(item.id)).map((item) => item.id);
  return repartirEnPartes(ids, pruebas);
}

/**
 * Parte `ids` en `partes` listas seguidas, a partes iguales; el resto del reparto lo llevan las primeras
 * listas, de una en una. Con 0 partes no hay listas: `Array.from` con longitud 0 no ejecuta la función,
 * así que la división entre 0 de abajo no llega a calcularse.
 */
function repartirEnPartes(ids: readonly string[], partes: number): readonly (readonly string[])[] {
  const base = Math.floor(ids.length / partes);
  const resto = ids.length % partes;
  return Array.from({ length: partes }, (_, posicion) => {
    // Las `resto` primeras listas llevan un id más, así que cada una empieza `posicion` ids más allá
    // de lo que ocuparían las anteriores sin resto, hasta un máximo de `resto`.
    const desde = posicion * base + Math.min(posicion, resto);
    const hasta = desde + base + (posicion < resto ? 1 : 0);
    return ids.slice(desde, hasta);
  });
}

interface EntradaTransferencia {
  /** Todos los ítems del dominio: la transferencia se mide con los de todos los objetivos. */
  readonly items: readonly ItemReservable[];
  readonly categorias: readonly CategoriaClasificada[];
  /** Último intento de cada ítem; el de un reservado es el único que tiene (@MAST-8.5). */
  readonly ultimoIntento: ReadonlyMap<string, boolean>;
  /** `umbral_transferencia`. */
  readonly umbral: number;
  /** `minimo_problemas_reservados`. */
  readonly minimo: number;
}

export interface EvaluacionTransferencia {
  /**
   * Acierto sobre los problemas reservados respondidos, los viejos y los nuevos (@MAST-6.12). Se
   * omite si no se ha respondido ninguno.
   */
  readonly acierto?: number;
  /**
   * Hay al menos `minimo` problemas reservados (@MAST-6.11, @MAST-6.14), están todos respondidos
   * (@MAST-6.8) y el acierto llega al umbral (@MAST-6.7, @MAST-6.10).
   */
  readonly superada: boolean;
  /**
   * Hacen falta reservados nuevos para superarla: hay menos de `minimo` (@MAST-6.9, @MAST-6.11) o
   * están todos respondidos sin llegar al umbral (@MAST-6.13). Con alguno sin responder no faltan:
   * aún se puede llegar con los que hay.
   */
  readonly faltanCasosNuevos: boolean;
}

/**
 * La transferencia a casos nuevos, con los problemas reservados de categorías con grupo de
 * parecidas (@MAST-6.7). Cada uno se responde una sola vez, así que quien no llega al umbral solo
 * puede superarla con reservados nuevos, que se suman a los ya respondidos (@MAST-6.12).
 */
export function evaluarTransferencia(entrada: EntradaTransferencia): EvaluacionTransferencia {
  const { items, categorias, ultimoIntento, umbral, minimo } = entrada;
  // Solo cuentan los problemas reservados de categorías con grupo, de todos los objetivos (@MAST-6.7).
  const ids = problemasIntercalables(items.filter(esReservado), categorias);
  const total = ids.length;
  const respondidos = ids.filter((id) => ultimoIntento.has(id)).length;
  const acertados = ids.filter((id) => ultimoIntento.get(id) === true).length;
  const acierto = respondidos === 0 ? undefined : acertados / respondidos;

  const hayMinimo = total >= minimo;
  const todosRespondidos = respondidos === total;
  const llegaAlNivel = llegaAlUmbral(acierto, umbral);
  const superada = hayMinimo && todosRespondidos && llegaAlNivel;
  // Con alguno sin responder no faltan casos nuevos: aún se puede llegar al umbral con los que hay.
  const faltanCasosNuevos = !hayMinimo || (todosRespondidos && !llegaAlNivel);
  // Con `exactOptionalPropertyTypes`, un campo opcional sin valor se omite: no se pone a `undefined`.
  return acierto === undefined ? { superada, faltanCasosNuevos } : { acierto, superada, faltanCasosNuevos };
}

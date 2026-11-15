import { responderItems } from './acciones.ts';
import type { BorradorContenido, ItemDePrueba } from './contenido.ts';
import { filasDelDominio } from './csv.ts';
import type { Mundo } from './mundo.ts';

// Soporte de los pasos del intercalado (INTE): el objetivo nuevo, los problemas reservados y los
// intentos hechos en sesiones intercaladas. Va aparte de contenido.ts, acciones.ts y mundo.ts, que
// comparten todos los pasos.

const PROBLEMAS_DEL_OBJETIVO_NUEVO_POR_CATEGORIA = 2;
const CONTEXTO_INTERCALADO = 'intercalado';

/**
 * Añade el objetivo al final de la ruta, con problemas de cada categoría y sin ningún intento: la
 * persona aún no lo ha dominado ni practicado. Se hace cuando la persona ya está en la fase (en la
 * cola de preparación, después de llegar a ella), como cuando se aprueba material nuevo.
 */
export function aprobarObjetivoNuevo(actual: Mundo, objetivo: string, categorias: readonly string[]): void {
  actual.preparar(() => {
    const contenido = actual.contenido();
    contenido.agregarObjetivo(objetivo);
    categorias.forEach((categoria) => {
      contenido.agregarItems(objetivo, PROBLEMAS_DEL_OBJETIVO_NUEVO_POR_CATEGORIA, { tipo: 'problema', categoria });
    });
  });
}

/**
 * Hace que `item` sea un problema reservado de la categoría, en el objetivo. Los ítems de partida ya
 * usan ese `id` en otro objetivo: se les da otro antes, para que el escenario pueda usarlo.
 */
export function reservarProblema(actual: Mundo, peticion: { item: string; objetivo: string; categoria: string }): void {
  actual.contenido().liberarId(peticion.item);
  actual.preparar(() => {
    actual.contenido().agregarItem({
      id: peticion.item,
      objetivo: peticion.objetivo,
      tipo: 'problema',
      categoria: peticion.categoria,
      reservado: true,
    });
  });
}

/** El grupo de parecidas de la categoría; falla si no tiene. */
export function grupoDe(contenido: BorradorContenido, categoria: string): string {
  const grupo = contenido.categorias.find((candidata) => candidata.id === categoria)?.grupo_parecidas;
  if (grupo === undefined) {
    throw new Error(`La categoría ${categoria} no tiene grupo de parecidas`);
  }
  return grupo;
}

/** Los problemas de esas categorías que la persona practica: sin los reservados. */
export function problemasDe(contenido: BorradorContenido, categorias: readonly string[]): readonly ItemDePrueba[] {
  return contenido.items.filter(
    (item) =>
      item.tipo === 'problema' &&
      !contenido.esReservado(item) &&
      item.categoria !== undefined &&
      categorias.includes(item.categoria),
  );
}

/** La persona acierta cada problema en una sesión intercalada. */
export function responderEnIntercalado(actual: Mundo, items: readonly ItemDePrueba[]): void {
  responderItems(actual, { items, aciertos: items.length, contexto: CONTEXTO_INTERCALADO });
}

/** Los `id` de los ítems con algún intento en una sesión intercalada, según respuestas.csv. */
export function conIntentoIntercalado(actual: Mundo): ReadonlySet<string> {
  return new Set(
    filasDelDominio(actual, 'respuestas.csv')
      .filter((fila) => fila['contexto'] === CONTEXTO_INTERCALADO)
      .map((fila) => fila['item'] ?? ''),
  );
}

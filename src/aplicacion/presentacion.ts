import type { ItemContenido } from './contenido.ts';
import type { ItemPresentado } from './sesiones.ts';

/** Lo único que se puede hacer con un ítem antes de responder: responderlo. */
const ACCIONES_DE_UN_ITEM: readonly string[] = ['responder'];

/**
 * Lo que ve la persona de un ítem. No se muestran ni el objetivo ni la categoría, porque darían una
 * pista del tipo de problema (@DIAG-1.3).
 */
export function presentar(item: ItemContenido): ItemPresentado {
  return {
    id: item.id,
    enunciado: item.enunciado,
    acciones: ACCIONES_DE_UN_ITEM,
    ...('opciones' in item.respuesta ? { opciones: item.respuesta.opciones } : {}),
  };
}

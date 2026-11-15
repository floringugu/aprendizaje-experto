import type { ItemContenido } from './contenido.ts';
import type { AccionDeItem, ItemPresentado } from './sesiones.ts';

/** Antes de responder solo se puede responder: ni ver la respuesta ni darlo por sabido (@RECU-1.2). */
const ACCIONES_DE_UN_ITEM: readonly AccionDeItem[] = ['responder'];

/**
 * Lo que ve la persona de un ítem. La respuesta correcta y el feedback llegan después de responder
 * (@RECU-1.1). No se muestran ni el objetivo ni la categoría, porque darían una pista del tipo de
 * problema (@DIAG-1.3). Un ítem de opciones lleva sus `opciones`; uno numérico no las lleva y dice en
 * `entrada` qué escribe la persona: `numero_con_unidad` si el ítem tiene `unidades` y `numero` si no
 * (@RECU-4.2, @RECU-5.8). Uno de respuesta escrita no lleva ninguna de las dos.
 */
export function presentar(item: ItemContenido): ItemPresentado {
  return {
    id: item.id,
    enunciado: item.enunciado,
    acciones: ACCIONES_DE_UN_ITEM,
    ...loQueSeResponde(item.respuesta),
  };
}

/**
 * Las claves de `ItemPresentado` que dependen del tipo de respuesta. Se devuelve un objeto con solo las
 * claves que corresponden, y no `undefined` en las demás: un campo ausente no es lo mismo que uno con valor
 * `undefined`, y el ítem presentado no debe llevar claves vacías.
 */
function loQueSeResponde(respuesta: ItemContenido['respuesta']): Pick<ItemPresentado, 'opciones' | 'entrada'> {
  // `valor` se mira primero: distingue la respuesta numérica, que no lleva `opciones` aunque traiga más campos.
  if ('valor' in respuesta) {
    return { entrada: respuesta.unidades === undefined ? 'numero' : 'numero_con_unidad' };
  }
  return 'opciones' in respuesta ? { opciones: respuesta.opciones } : {};
}

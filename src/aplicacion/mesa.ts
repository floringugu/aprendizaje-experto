import type {
  CategoriaContenido,
  ContenidoDominio,
  EjemploResueltoContenido,
  Fuente,
  ItemContenido,
  ObjetivoContenido,
  TareaContenido,
} from './contenido.ts';
import type { TipoDePieza } from './formato-contenido.ts';

// La mesa de la revisión del material (MATE-4, MATE-5): el borrador y el contenido aprobado de un
// dominio, y cómo se recorren sus piezas. La revisión (revision.ts) las pasa de uno a otro; «Ver fuente»
// (revision-del-material.ts) busca una por su id.

/** Un ejemplo resuelto del borrador para un objetivo que ya está aprobado: va aparte, con su objetivo. */
export interface EjemploDeObjetivoAprobado extends EjemploResueltoContenido {
  readonly objetivo: string;
}

/**
 * Una tarea del borrador. `antes_de` es el id de la tarea que va justo detrás, aprobada o del borrador
 * (plan §0, «Reglas de `MATE` que la feature no cubre»); sin él, va al final. El campo es solo del
 * borrador: la tarea entra en el aprobado sin él (@MATE-4.11).
 */
export interface TareaDelBorrador extends TareaContenido {
  readonly antes_de?: string;
}

/**
 * `contenido/borradores/<dominio>.json`: el formato del contenido, con las piezas pendientes de revisar.
 * Los ejemplos de un objetivo nuevo van dentro de él; los de un objetivo ya aprobado, en `ejemplos_resueltos`.
 */
export interface BorradorDominio extends ContenidoDominio {
  readonly ejemplos_resueltos?: readonly EjemploDeObjetivoAprobado[];
  readonly tareas: readonly TareaDelBorrador[];
}

/** Lo que la revisión lee y escribe de un dominio. */
export interface Mesa {
  readonly borrador: BorradorDominio;
  readonly aprobado: ContenidoDominio;
}

/**
 * El primer id del borrador que se repite, o `undefined` si no hay ninguno. Recorre el borrador en el
 * orden de `revisar` y da el primer id que ya ha salido antes en el borrador, sea cual sea el tipo de
 * pieza, o que también está en el aprobado, en cualquiera de sus piezas. Que el aprobado repita ids
 * entre sus propias piezas no cuenta: el contenido escrito a mano puede hacerlo (plan §0, «Borradores»).
 *
 * La revisión nombra cada pieza solo por su id, así que un id repetido haría ambigua cualquier acción.
 * Los casos de uso de revision-del-material.ts la comprueban al leer la mesa, antes de llamar a `aplicar`.
 */
export function idRepetido(mesa: Mesa): string | undefined {
  // `ContenidoDominio` encaja como borrador sin ejemplos aparte, así que `pendientesDelBorrador` también
  // da todas las piezas del aprobado, con los ejemplos de dentro de sus objetivos.
  const aprobados = new Set(pendientesDelBorrador(mesa.aprobado).map(({ pieza }) => pieza.id));
  const delBorrador = pendientesDelBorrador(mesa.borrador).map(({ pieza }) => pieza.id);
  // Repetido: está en el aprobado o ya ha salido antes en el borrador (su primera aparición es anterior).
  return delBorrador.find((id, posicion) => aprobados.has(id) || delBorrador.indexOf(id) < posicion);
}

/** Una pieza de la mesa, buscada por su id, con lo que necesita «Ver fuente». */
export interface PiezaDeLaMesa {
  readonly tipo: TipoDePieza;
  /** Sin fuente si se escribió a mano (MATE-7.3) o si la IA no la dio. */
  readonly fuente: Fuente | undefined;
  /** `true` si está en el contenido aprobado; `false` si sigue pendiente en el borrador. */
  readonly aprobada: boolean;
}

/**
 * La pieza con ese id, de cualquier tipo, o `undefined` si no está en la mesa. Busca primero entre las
 * pendientes del borrador y después en el aprobado, cada uno en el orden de `pendientesDelBorrador` (con
 * los ejemplos de dentro de sus objetivos), y da la primera que encuentra. Con una mesa sin ids repetidos
 * (`idRepetido` da `undefined`) solo hay una; el aprobado escrito a mano puede repetir ids entre sus
 * propias piezas, y entonces da la primera de ellas.
 */
export function buscarPieza(mesa: Mesa, id: string): PiezaDeLaMesa | undefined {
  // `??` solo mira el aprobado si el borrador no la tiene: así el orden es el de la especificación.
  return piezaDeUnaLista(mesa.borrador, id, false) ?? piezaDeUnaLista(mesa.aprobado, id, true);
}

/**
 * La primera pieza con ese id de una de las dos listas de la mesa. `aprobada` dice de cuál se trata: el
 * aprobado encaja como borrador sin ejemplos aparte, y por eso lo recorre la misma función (ver `idRepetido`).
 */
function piezaDeUnaLista(lista: BorradorDominio, id: string, aprobada: boolean): PiezaDeLaMesa | undefined {
  const encontrada = pendientesDelBorrador(lista).find(({ pieza }) => pieza.id === id);
  return encontrada === undefined ? undefined : { tipo: encontrada.tipo, fuente: encontrada.pieza.fuente, aprobada };
}

/**
 * Una pieza pendiente, con el sitio del borrador donde está. Todas tienen `id` y `fuente` opcional.
 * Un ejemplo puede estar dentro de su objetivo pendiente o ir aparte, ya con el `objetivo` de un
 * objetivo aprobado.
 */
export type Pendiente =
  | { readonly tipo: 'objetivo'; readonly pieza: ObjetivoContenido }
  | {
      readonly tipo: 'ejemplo';
      readonly pieza: EjemploResueltoContenido;
      readonly objetivo: string;
      readonly aparte: boolean;
    }
  | { readonly tipo: 'item'; readonly pieza: ItemContenido }
  | { readonly tipo: 'categoria'; readonly pieza: CategoriaContenido }
  | { readonly tipo: 'tarea'; readonly pieza: TareaDelBorrador };

/** Las pendientes en el orden de la revisión: ver `revisar`. */
export function pendientesDelBorrador(borrador: BorradorDominio): readonly Pendiente[] {
  const deObjetivos = borrador.objetivos.flatMap((objetivo): Pendiente[] => [
    { tipo: 'objetivo', pieza: objetivo },
    ...objetivo.ejemplos_resueltos.map((pieza): Pendiente => ({
      tipo: 'ejemplo',
      pieza,
      objetivo: objetivo.id,
      aparte: false,
    })),
  ]);
  const aparte = (borrador.ejemplos_resueltos ?? []).map((pieza): Pendiente => ({
    tipo: 'ejemplo',
    pieza,
    objetivo: pieza.objetivo,
    aparte: true,
  }));
  const items = borrador.items.map((pieza): Pendiente => ({ tipo: 'item', pieza }));
  const categorias = borrador.categorias.map((pieza): Pendiente => ({ tipo: 'categoria', pieza }));
  const tareas = borrador.tareas.map((pieza): Pendiente => ({ tipo: 'tarea', pieza }));
  return [...deObjetivos, ...aparte, ...items, ...categorias, ...tareas];
}

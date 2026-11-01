import {
  itemsDelObjetivo,
  type CategoriaContenido,
  type ContenidoDominio,
  type EjemploResueltoContenido,
  type ItemContenido,
  type ObjetivoContenido,
} from './contenido.ts';
import type { BorradorDominio, EjemploDeObjetivoAprobado, Mesa, TareaDelBorrador } from './mesa.ts';
import type { AprobadoParaLaIa, ReservadosDe } from './puertos.ts';
import { revisarEntrega, type EntregaRevisada, type TareaDeLaIa } from './redaccion-formato.ts';
import { crearAsignador, type Asignador } from './redaccion-ids.ts';

// Lo que la aplicación hace con lo que entrega la IA («Mecanismo» 4 de MATE, MATE-2): lógica pura sobre la
// mesa (mesa.ts), como la revisión. Leer el documento, llamar a la IA y escribir el borrador lo hacen los
// casos de uso de material.ts.

/** Una pieza que no entra en el borrador: la propiedad del formato que no cumple (MATE-2.3). */
export interface Apartada {
  readonly falta: string;
}

/** El borrador con lo que entregó la IA, y lo que no entró. */
export interface EntregaIncorporada {
  readonly borrador: BorradorDominio;
  /** Una por pieza apartada, en el orden en que se recorre la entrega (ver `incorporarEntrega`). */
  readonly apartadas: readonly Apartada[];
}

/**
 * Lo aprobado que se le pasa a la IA, en el orden del contenido: los objetivos con su `id` y su
 * `instruccion`, las categorías con su `id`, su `descripcion` y, si lo tienen, su `grupo_parecidas`, y las
 * tareas con su `id` y su `enunciado` (plan §0, «Reglas de `MATE` que la feature no cubre»). Nada más.
 */
export function aprobadoParaLaIa(aprobado: ContenidoDominio): AprobadoParaLaIa {
  return {
    objetivos: aprobado.objetivos.map(({ id, instruccion }) => ({ id, instruccion })),
    categorias: aprobado.categorias.map(({ id, descripcion, grupo_parecidas }) =>
      grupo_parecidas === undefined ? { id, descripcion } : { id, descripcion, grupo_parecidas },
    ),
    tareas: aprobado.tareas.map(({ id, enunciado }) => ({ id, enunciado })),
  };
}

/**
 * Lo que se le pide a la IA al pedir más reservados de `objetivo` (@MATE-2.10): el objetivo y los
 * enunciados de todos sus ítems, primero los aprobados y después los pendientes del borrador, cada uno en
 * su orden. `undefined` si el objetivo no está ni en el aprobado ni en el borrador.
 */
export function peticionDeReservados(mesa: Mesa, objetivo: string): ReservadosDe | undefined {
  const { borrador, aprobado } = mesa;
  if (![...aprobado.objetivos, ...borrador.objetivos].some(({ id }) => id === objetivo)) {
    return undefined;
  }
  // Primero los aprobados y después los pendientes: el orden en que la persona los ha ido viendo.
  const items = [...itemsDelObjetivo(aprobado.items, objetivo), ...itemsDelObjetivo(borrador.items, objetivo)];
  return { objetivo, enunciados: items.map(({ enunciado }) => enunciado) };
}

/**
 * Añade al borrador de la mesa las piezas válidas de `entrega`, el JSON tal como lo dio la IA, y aparta las
 * demás. No toca el aprobado. La mesa de entrada no repite ids, y el borrador que devuelve tampoco.
 *
 * **Qué se lee.** Las listas `objetivos`, `ejemplos_resueltos` (los ejemplos que van aparte), `items`,
 * `categorias` y `tareas` de la entrega, y se recorren en ese orden. Una lista que falta, o que no es una
 * lista, no aporta nada; si la entrega no es un objeto, no aporta nada. El resto, como su `dominio`, se ignora.
 *
 * **Formato.** Cada pieza se valida con `falloDeLaPiezaSuelta` de su tipo; un objetivo, con los ejemplos que
 * lleva dentro. La que falla se aparta con `{ falta }`, solo eso (@MATE-2.3, @MATE-2.5, @MATE-2.7, @MATE-2.9).
 * Un ejemplo que va aparte sin `objetivo` de texto no vacío se aparta con `falta: 'objetivo'`. Un ítem que es
 * un objeto se valida ya con `diagnostico: false` y entra así: el diagnóstico lo marca la persona, no la IA
 * (@MATE-2.6), así que el `diagnostico` de la IA no cuenta, ni para apartarlo. El `reservado` de la IA sí se
 * conserva (@MATE-2.8). Las propiedades de más de una pieza se conservan, como las deja la validación.
 *
 * **Ids** (@MATE-2.2, plan §0). Una pieza válida conserva su `id` si está libre. Si está en la mesa (en el
 * aprobado o en el borrador, con los ejemplos de dentro de los objetivos y los que van aparte) o ya lo ha
 * tomado una pieza anterior de la entrega, toma el primero libre con el mismo prefijo: «I3» pasa a «I4»,
 * «I5»…, y un id que no acaba en número, «X», pasa a «X2», «X3»… Libre quiere decir que no está en la mesa,
 * ni es el `id` de ninguna pieza de la entrega, válida o no, ni lo ha tomado ya otra pieza. Los ids se
 * dan en el orden en que se recorre la entrega, con los ejemplos de un objetivo detrás de él.
 *
 * **Lo que cita un id nuevo cambia con él.** Por cada tipo hay un mapa del `id` que dio la IA al que queda,
 * con solo la primera pieza válida de ese tipo que lo usa:
 * - el `objetivo` de los ítems y de los ejemplos que van aparte sigue al mapa de los objetivos;
 * - la `categoria` de los ítems, al de las categorías;
 * - el `antes_de` de las tareas, al de las tareas. Después, un `antes_de` que no es el `id` de una tarea
 *   del aprobado ni el de una tarea válida de la entrega se quita (plan §0), y también el que es el `id`
 *   de la propia tarea: `corregirPieza` lo rechaza, y la persona no podría corregirla sin quitarlo.
 *   Al aprobarla, sin `antes_de` va al final, igual que con él.
 * Una referencia que no está en el mapa se queda como estaba.
 *
 * **Dónde va cada pieza.** Al final de su lista del borrador que ya había, en el orden de la entrega. Un
 * ejemplo que la IA da dentro de su objetivo se queda dentro. Uno que va aparte entra al final de los
 * ejemplos de su objetivo, ya sin `objetivo`, si ese objetivo es uno válido de la misma entrega; si no, va
 * a los `ejemplos_resueltos` de la raíz del borrador, con su `objetivo` («Mecanismo» 4).
 *
 * **Con `reservadosDe`** (al pedir más reservados de ese objetivo, @MATE-2.11). Solo cuentan los ítems: las
 * demás listas se ignoran, sin entradas en `apartadas`, porque no se pidieron. Cada ítem se aparta, por este
 * orden, si no cumple el formato; con `falta: 'objetivo'` si su `objetivo` no es `reservadosDe`; y con
 * `falta: 'reservado'` si su `reservado` no es `true` (regla que la feature no cubre, «Reservados» de MATE).
 */
export function incorporarEntrega(mesa: Mesa, entrega: unknown, reservadosDe?: string): EntregaIncorporada {
  const revisada = revisarEntrega(entrega, reservadosDe);
  const nuevas = piezasNuevas(mesa, revisada);
  return {
    borrador: conLasPiezas(mesa.borrador, nuevas),
    // Una apartada es solo su `falta`: el resto del fallo (qué pieza es) lo da el comentario de `Apartada`.
    apartadas: revisada.fallos.map(({ falta }) => ({ falta })),
  };
}

// --- Las piezas que entran, con su id y sus referencias ya puestos ---

/** Lo que `incorporarEntrega` añade al borrador, lista a lista. */
interface PiezasNuevas {
  readonly objetivos: readonly ObjetivoContenido[];
  /** Los ejemplos que siguen yendo aparte, en la raíz del borrador, con su `objetivo`. */
  readonly ejemplosAparte: readonly EjemploDeObjetivoAprobado[];
  readonly items: readonly ItemContenido[];
  readonly categorias: readonly CategoriaContenido[];
  readonly tareas: readonly TareaDelBorrador[];
}

/** Las piezas con su id nuevo, y el mapa del id que dio la IA al que queda (solo el de la primera que lo usa). */
interface Renombradas<Pieza> {
  readonly piezas: readonly Pieza[];
  readonly mapa: ReadonlyMap<string, string>;
}

type MapaDeIds = ReadonlyMap<string, string>;

/**
 * Da su id a cada pieza válida y pone al día lo que la cita. Los ids se dan en el orden en que se recorre la
 * entrega (objetivos con sus ejemplos de dentro, ejemplos aparte, ítems, categorías y tareas): las llamadas
 * a `asignar` siguen ese orden, y de ello depende qué pieza se queda con un id cuando hay varias que lo piden.
 */
function piezasNuevas(mesa: Mesa, revisada: EntregaRevisada): PiezasNuevas {
  const asignar = crearAsignador(mesa, revisada.ids);
  const objetivos = renombrar(revisada.objetivos, (objetivo) => renombrarObjetivo(objetivo, asignar));
  const ejemplos = revisada.ejemplos.map((ejemplo) => conIdNuevo(ejemplo, asignar));
  const items = revisada.items.map((item) => conIdNuevo(item, asignar));
  const categorias = renombrar(revisada.categorias, (categoria) => conIdNuevo(categoria, asignar));
  const tareas = renombrar(revisada.tareas, (tarea) => conIdNuevo(tarea, asignar));
  const { dentro, aparte } = repartirEjemplos(ejemplos, objetivos.mapa);
  const existentes = new Set([...mesa.aprobado.tareas, ...tareas.piezas].map(({ id }) => id));
  return {
    objetivos: objetivos.piezas.map((objetivo) => conEjemplosDeMas(objetivo, dentro.get(objetivo.id) ?? [])),
    ejemplosAparte: aparte,
    items: items.map((item) => conReferenciasSeguidas(item, objetivos.mapa, categorias.mapa)),
    categorias: categorias.piezas,
    tareas: tareas.piezas.map((tarea) => conElAntesDeResuelto(tarea, tareas.mapa, existentes)),
  };
}

/** La pieza con el id que le da `asignar`: el suyo, o el primero libre con su prefijo. */
function conIdNuevo<Pieza extends { readonly id: string }>(pieza: Pieza, asignar: Asignador): Pieza {
  return { ...pieza, id: asignar(pieza.id) };
}

/** Un objetivo toma su id antes que los ejemplos que lleva dentro, que también pueden chocar con la mesa. */
function renombrarObjetivo(objetivo: ObjetivoContenido, asignar: Asignador): ObjetivoContenido {
  const id = asignar(objetivo.id);
  const ejemplos = objetivo.ejemplos_resueltos.map((ejemplo) => conIdNuevo(ejemplo, asignar));
  return { ...objetivo, id, ejemplos_resueltos: ejemplos };
}

/** Renombra las piezas en su orden y apunta, por cada id de la IA, el que queda a la primera pieza que lo usa. */
function renombrar<Pieza extends { readonly id: string }>(
  piezas: readonly Pieza[],
  renombrarUna: (pieza: Pieza) => Pieza,
): Renombradas<Pieza> {
  const mapa = new Map<string, string>();
  const renombradas = piezas.map((pieza) => {
    const nueva = renombrarUna(pieza);
    // Si dos piezas válidas traen el mismo id, la referencia sigue a la primera.
    if (!mapa.has(pieza.id)) {
      mapa.set(pieza.id, nueva.id);
    }
    return nueva;
  });
  return { piezas: renombradas, mapa };
}

/**
 * Los ejemplos que van aparte (ya con su id nuevo): los de un objetivo válido de la misma entrega van dentro
 * de él, indexados por el id que le queda y ya sin `objetivo`; los demás siguen aparte, con su `objetivo`.
 */
function repartirEjemplos(
  ejemplos: readonly EjemploDeObjetivoAprobado[],
  objetivos: MapaDeIds,
): {
  readonly dentro: ReadonlyMap<string, readonly EjemploResueltoContenido[]>;
  readonly aparte: readonly EjemploDeObjetivoAprobado[];
} {
  const dentro = new Map<string, EjemploResueltoContenido[]>();
  const aparte: EjemploDeObjetivoAprobado[] = [];
  for (const ejemplo of ejemplos) {
    // Dentro de su objetivo, un ejemplo no lleva `objetivo`; el resto de sus propiedades se conservan.
    const { objetivo, ...sinObjetivo } = ejemplo;
    const destino = objetivos.get(objetivo);
    if (destino === undefined) {
      aparte.push(ejemplo);
    } else {
      dentro.set(destino, [...(dentro.get(destino) ?? []), sinObjetivo]);
    }
  }
  return { dentro, aparte };
}

function conEjemplosDeMas(
  objetivo: ObjetivoContenido,
  ejemplos: readonly EjemploResueltoContenido[],
): ObjetivoContenido {
  return { ...objetivo, ejemplos_resueltos: [...objetivo.ejemplos_resueltos, ...ejemplos] };
}

/** El `objetivo` y la `categoria` de un ítem pasan al id que ha quedado; lo que no está en el mapa se queda igual. */
function conReferenciasSeguidas(item: ItemContenido, objetivos: MapaDeIds, categorias: MapaDeIds): ItemContenido {
  const { categoria } = item;
  return {
    ...item,
    objetivo: objetivos.get(item.objetivo) ?? item.objetivo,
    ...(categoria === undefined ? {} : { categoria: categorias.get(categoria) ?? categoria }),
  };
}

/**
 * El `antes_de` de una tarea pasa al id que ha quedado a la tarea que cita. Si después no es el id de una
 * tarea del aprobado ni de una tarea válida de la entrega (`existentes`), si es el de la propia tarea, o si ni
 * siquiera es un texto, se quita.
 */
function conElAntesDeResuelto(
  tarea: TareaDeLaIa,
  tareas: MapaDeIds,
  existentes: ReadonlySet<string>,
): TareaDelBorrador {
  const { antes_de: citada, ...resto } = tarea;
  const destino = typeof citada === 'string' ? (tareas.get(citada) ?? citada) : undefined;
  const valido = destino !== undefined && destino !== resto.id && existentes.has(destino);
  return valido ? { ...resto, antes_de: destino } : resto;
}

/** Cada pieza al final de su lista del borrador, que no se toca: en la raíz solo hay `ejemplos_resueltos` si hay alguno. */
function conLasPiezas(borrador: BorradorDominio, nuevas: PiezasNuevas): BorradorDominio {
  const hayEjemplosAparte = borrador.ejemplos_resueltos !== undefined || nuevas.ejemplosAparte.length > 0;
  return {
    ...borrador,
    objetivos: [...borrador.objetivos, ...nuevas.objetivos],
    items: [...borrador.items, ...nuevas.items],
    categorias: [...borrador.categorias, ...nuevas.categorias],
    tareas: [...borrador.tareas, ...nuevas.tareas],
    ...(hayEjemplosAparte
      ? { ejemplos_resueltos: [...(borrador.ejemplos_resueltos ?? []), ...nuevas.ejemplosAparte] }
      : {}),
  };
}

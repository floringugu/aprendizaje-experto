import type { MarcaDeCita, Marcador } from '../dominio/citas.ts';
import type { ContenidoDominio, EjemploResueltoContenido, ItemContenido, ObjetivoContenido } from './contenido.ts';
import {
  esRegistro,
  falloDeLaPiezaSuelta,
  lugarDelFallo,
  type FalloDeFormato,
  type Registro,
  type TipoDePieza,
} from './formato-contenido.ts';
import { idRepetido, pendientesDelBorrador, type BorradorDominio, type Mesa, type Pendiente } from './mesa.ts';
import { conLaTareaAprobada, sinLaTareaDescartada } from './orden-de-las-tareas.ts';
import { aceptar, rechazarElCampo, rechazarPorCausa, type Resultado } from './resultado.ts';

// La revisión del material (MATE-4, MATE-5): cómo pasa cada pieza del borrador al contenido aprobado.
// Es lógica pura sobre la mesa (mesa.ts); leer y escribir los ficheros, y guardar lo que había para
// deshacer, lo hacen los casos de uso de revision-del-material.ts.

/**
 * Las marcas de una pieza pendiente. Las pone la aplicación, no la IA (MATE-3): la de su cita, que da el
 * marcador, y `un_solo_paso`, la de un ejemplo resuelto con menos de 2 pasos (@MATE-3.5).
 */
export type Marca = MarcaDeCita | 'un_solo_paso';

/** Filtros de la revisión (MATE-4.2): todas las pendientes, o solo las que llevan una marca. */
export type FiltroRevision = 'pendientes' | Marca;

interface PiezaPendiente {
  readonly id: string;
  readonly tipo: TipoDePieza;
  /**
   * La marca de su cita, si tiene, y después `un_solo_paso`, si es un ejemplo resuelto con menos de 2
   * pasos: de ninguna a dos marcas.
   */
  readonly marcas: readonly Marca[];
}

interface GrupoRevision {
  /** Objetivo del que cuelgan las piezas; ausente en las que no cuelgan de ninguno, como las tareas. */
  readonly objetivo?: string;
  readonly piezas: readonly PiezaPendiente[];
}

/** La pantalla «Revisión del material»: las piezas pendientes, agrupadas por objetivo (MATE-4.1). */
export interface Revision {
  readonly grupos: readonly GrupoRevision[];
}

export type Accion =
  | { readonly tipo: 'aprobar'; readonly pieza: string }
  | { readonly tipo: 'descartar'; readonly pieza: string }
  | { readonly tipo: 'corregir'; readonly pieza: string; readonly corregida: unknown };

/**
 * Las piezas pendientes del borrador, con sus marcas, agrupadas por el objetivo del que cuelgan
 * (@MATE-4.1). De qué objetivo cuelga cada una:
 * - un objetivo, de sí mismo, y los ejemplos que lleva dentro, de él;
 * - un ejemplo de los que van aparte, un ítem, de su `objetivo`;
 * - una categoría o una tarea, de ninguno: van en un grupo sin `objetivo`, el último (plan §0,
 *   «Categorías en el borrador»).
 *
 * Los grupos salen en el orden en que aparece su primera pieza, y las piezas de cada grupo en el orden
 * del borrador: objetivos (cada uno seguido de sus ejemplos), ejemplos que van aparte, ítems, categorías
 * y tareas.
 * Con un filtro de marca solo quedan las piezas que la llevan, y un grupo sin piezas no sale (@MATE-4.2).
 */
export function revisar(mesa: Mesa, marcas: Marcador, filtro: FiltroRevision): Revision {
  const piezas = pendientesDelBorrador(mesa.borrador).map((pendiente) => ({
    objetivo: colgadoDe(pendiente),
    pieza: piezaPendiente(pendiente, marcas),
  }));
  const visibles = piezas.filter(({ pieza }) => filtro === 'pendientes' || pieza.marcas.includes(filtro));
  return { grupos: agruparPorObjetivo(visibles) };
}

/**
 * Aplica la acción y devuelve la mesa nueva, sin tocar la de entrada. Lo que no cambia se queda donde
 * estaba y en el mismo orden; lo que entra en una lista va al final, salvo una tarea con `antes_de`. La
 * mesa de entrada no repite ids (`idRepetido` da `undefined`), y la que devuelve tampoco.
 *
 * - `aprobar` saca la pieza del borrador y la pone en el aprobado con su fuente, si la tiene (@MATE-4.4,
 *   @MATE-5.3); da igual que lleve marca. Un objetivo entra sin sus ejemplos, que siguen pendientes y
 *   pasan a la lista de los que van aparte, con `objetivo`. Un ejemplo que iba aparte entra dentro de
 *   su objetivo, ya sin `objetivo`. Una pieza que cuelga de un objetivo que no está en el aprobado no
 *   se aprueba: el aprobado quedaría con un objetivo que no existe. Rechaza con `causa`
 *   `objetivo_pendiente` (regla que la feature no cubre, aprobada en el Mecanismo de MATE). Igual un
 *   ítem cuya `categoria` no está en el aprobado: `categoria_pendiente`, después de mirar el objetivo
 *   (plan §0, «Reglas de `MATE` que la feature no cubre»).
 *
 *   Una tarea entra sin `antes_de`, delante de la primera tarea aprobada que se encuentra siguiendo los
 *   `antes_de` desde el suyo: si apunta a una tarea pendiente, se sigue el de esa. Si la cadena se corta
 *   (una tarea sin `antes_de`, o un id que no es de ninguna tarea) o vuelve a una tarea por la que ya ha
 *   pasado, empezando por la propia, va al final (@MATE-4.11, plan §0). Así da igual en qué orden se
 *   aprueben, y no se rechaza nada.
 * - `descartar` saca la pieza del borrador y no toca el aprobado (@MATE-4.5). Un objetivo se va con
 *   todo lo que cuelga de él en el borrador: sus ejemplos y sus ítems (regla que la feature no cubre).
 *   Los ítems del borrador cuya `categoria` es la categoría descartada se quedan sin `categoria` y
 *   siguen pendientes (regla que la feature no cubre, aprobada por el dueño el 30-10-2026). Las tareas
 *   del borrador con `antes_de` hacia la tarea descartada pasan a llevar el de ella, o ninguno si ella
 *   no lo llevaba o si apuntaba a la propia tarea: siguen en el mismo sitio de la cadena (plan §0).
 * - `corregir` sustituye la pieza por `corregida`, en el mismo sitio del borrador, y sigue pendiente
 *   (@MATE-4.6). Se valida como una pieza suelta de su tipo: si no cumple el formato del contenido, no
 *   cambia nada y rechaza con el `campo` que falta (@MATE-4.8). Si cambia el `id`, o si la mesa queda
 *   con un id repetido (un objetivo corregido con un ejemplo dentro que usa el id de otra pieza),
 *   rechaza con `campo` `id` (regla que la feature no cubre, plan §0). Una corrección que deja una
 *   referencia que no lleva a ninguna parte rechaza con el `campo` de la referencia (plan §0; el
 *   `objetivo`, aprobado por el dueño el 24-10-2026):
 *   - `objetivo`: un ítem que pasa a colgar de un objetivo que no está ni en el borrador ni en el
 *     aprobado. Nunca se podría aprobar;
 *   - `categoria`: un ítem con una `categoria` que no está ni en el borrador ni en el aprobado;
 *   - `antes_de`: una tarea con un `antes_de` que es su propio id o que no es el de ninguna tarea del
 *     borrador ni del aprobado.
 *   Se comprueba en este orden: el formato, el `id`, el `objetivo`, la `categoria`, el `antes_de` y los
 *   ids repetidos. Un ejemplo que va aparte conserva su `objetivo`, venga o no en `corregida`.
 *
 * Una pieza que no está en el borrador rechaza con `causa` `pieza_no_encontrada`. No hay acción sobre
 * varias piezas a la vez: cada una se aprueba al leerla, también las que no tienen marca (@MATE-5.5).
 */
export function aplicar(mesa: Mesa, accion: Accion): Resultado<Mesa> {
  switch (accion.tipo) {
    case 'aprobar':
      return sobrePieza(mesa, accion.pieza, aprobarPieza);
    case 'descartar':
      return sobrePieza(mesa, accion.pieza, (actual, pendiente) => aceptar(descartarPieza(actual, pendiente)));
    case 'corregir':
      return sobrePieza(mesa, accion.pieza, (actual, pendiente) => corregirPieza(actual, pendiente, accion.corregida));
  }
}

// --- Las piezas pendientes del borrador ---

/** El objetivo del que cuelga la pieza; las categorías y las tareas no cuelgan de ninguno. */
function colgadoDe(pendiente: Pendiente): string | undefined {
  switch (pendiente.tipo) {
    case 'objetivo':
      return pendiente.pieza.id;
    case 'ejemplo':
      return pendiente.objetivo;
    case 'item':
      return pendiente.pieza.objetivo;
    case 'categoria':
    case 'tarea':
      return undefined;
  }
}

function piezaPendiente(pendiente: Pendiente, marcas: Marcador): PiezaPendiente {
  return { id: pendiente.pieza.id, tipo: pendiente.tipo, marcas: marcasDeLaPieza(pendiente, marcas) };
}

/**
 * Las marcas de la pieza, en este orden: la de su cita, si el marcador da una, y `un_solo_paso`, si es un
 * ejemplo resuelto con menos de 2 pasos, vaya dentro de su objetivo o aparte (@MATE-3.5). Los pasos de un
 * ejemplo nunca están vacíos en un contenido válido; `<= 1` cubre ese caso igual que «menos de 2».
 */
function marcasDeLaPieza(pendiente: Pendiente, marcadorDeCita: Marcador): readonly Marca[] {
  const deLaCita = marcadorDeCita(pendiente.pieza.fuente);
  const unSoloPaso = pendiente.tipo === 'ejemplo' && pendiente.pieza.pasos.length <= 1;
  return [...(deLaCita === undefined ? [] : [deLaCita]), ...(unSoloPaso ? (['un_solo_paso'] as const) : [])];
}

/** Los grupos salen en el orden en que aparece su primera pieza: un `Map` recuerda el orden de inserción. */
function agruparPorObjetivo(
  piezas: readonly { readonly objetivo: string | undefined; readonly pieza: PiezaPendiente }[],
): readonly GrupoRevision[] {
  const porObjetivo = new Map<string | undefined, PiezaPendiente[]>();
  for (const { objetivo, pieza } of piezas) {
    porObjetivo.set(objetivo, [...(porObjetivo.get(objetivo) ?? []), pieza]);
  }
  return [...porObjetivo].map(([objetivo, grupo]) =>
    objetivo === undefined ? { piezas: grupo } : { objetivo, piezas: grupo },
  );
}

// --- Rechazos ---

/** Lo que da una comprobación previa a un cambio: el rechazo, o `undefined` si la pieza la pasa. */
type Rechazo = Resultado<never> | undefined;

/** Busca la pieza en el borrador y le aplica la acción; si no está, `pieza_no_encontrada`. */
function sobrePieza(
  mesa: Mesa,
  id: string,
  accion: (mesa: Mesa, pendiente: Pendiente) => Resultado<Mesa>,
): Resultado<Mesa> {
  const pendiente = pendientesDelBorrador(mesa.borrador).find(({ pieza }) => pieza.id === id);
  return pendiente === undefined
    ? rechazarPorCausa('pieza_no_encontrada', `«${id}» no está entre las piezas pendientes de revisar.`)
    : accion(mesa, pendiente);
}

// --- Cambios sobre las listas del borrador ---

/** Un cambio sobre una lista de piezas con `id`, la que sea: la del borrador donde está la pieza. */
type CambioDeLista = <Pieza extends { readonly id: string }>(lista: readonly Pieza[]) => readonly Pieza[];

function quitar(id: string): CambioDeLista {
  return (lista) => lista.filter((pieza) => pieza.id !== id);
}

function conBorrador(mesa: Mesa, cambios: Partial<BorradorDominio>): Mesa {
  return { ...mesa, borrador: { ...mesa.borrador, ...cambios } };
}

function conAprobado(mesa: Mesa, cambios: Partial<ContenidoDominio>): Mesa {
  return { ...mesa, aprobado: { ...mesa.aprobado, ...cambios } };
}

/** Aplica el cambio a la lista del borrador donde está la pieza; el resto del borrador no se toca. */
function cambiarPieza(mesa: Mesa, pendiente: Pendiente, cambio: CambioDeLista): Mesa {
  const { borrador } = mesa;
  switch (pendiente.tipo) {
    case 'objetivo':
      return conBorrador(mesa, { objetivos: cambio(borrador.objetivos) });
    case 'item':
      return conBorrador(mesa, { items: cambio(borrador.items) });
    case 'categoria':
      return conBorrador(mesa, { categorias: cambio(borrador.categorias) });
    case 'tarea':
      return conBorrador(mesa, { tareas: cambio(borrador.tareas) });
    case 'ejemplo':
      return pendiente.aparte
        ? conBorrador(mesa, { ejemplos_resueltos: cambio(borrador.ejemplos_resueltos ?? []) })
        : conBorrador(mesa, { objetivos: cambiarEjemplosDe(borrador.objetivos, pendiente.objetivo, cambio) });
  }
}

function cambiarEjemplosDe(
  objetivos: readonly ObjetivoContenido[],
  id: string,
  cambio: CambioDeLista,
): readonly ObjetivoContenido[] {
  return objetivos.map((objetivo) =>
    objetivo.id === id ? { ...objetivo, ejemplos_resueltos: cambio(objetivo.ejemplos_resueltos) } : objetivo,
  );
}

// --- Descartar ---

function descartarPieza(mesa: Mesa, pendiente: Pendiente): Mesa {
  const sinLaPieza = cambiarPieza(mesa, pendiente, quitar(pendiente.pieza.id));
  switch (pendiente.tipo) {
    case 'objetivo':
      return sinLoQueCuelga(sinLaPieza, pendiente.pieza.id);
    case 'categoria':
      return sinLaCategoriaEnLosItems(sinLaPieza, pendiente.pieza.id);
    case 'tarea':
      // `mesa` aún tiene la tarea en el borrador: así se ve cuáles apuntaban a ella.
      return conBorrador(mesa, { tareas: sinLaTareaDescartada(mesa.borrador.tareas, pendiente.pieza) });
    case 'ejemplo':
    case 'item':
      return sinLaPieza;
  }
}

/** Al descartar un objetivo se van con él los ejemplos que iban aparte y los ítems que eran suyos. */
function sinLoQueCuelga(mesa: Mesa, objetivo: string): Mesa {
  const { borrador } = mesa;
  const cuelga = (pieza: { readonly objetivo: string }): boolean => pieza.objetivo === objetivo;
  const sinEjemplos =
    borrador.ejemplos_resueltos === undefined
      ? {}
      : { ejemplos_resueltos: borrador.ejemplos_resueltos.filter((ejemplo) => !cuelga(ejemplo)) };
  return conBorrador(mesa, { ...sinEjemplos, items: borrador.items.filter((item) => !cuelga(item)) });
}

/**
 * Al descartar una categoría, los ítems del borrador que la tenían siguen pendientes, en el mismo sitio y
 * sin `categoria`: sin la propiedad, no con el valor `undefined`, que el formato del contenido trataría
 * igual pero que dejaría el fichero con una clave de más.
 */
function sinLaCategoriaEnLosItems(mesa: Mesa, categoria: string): Mesa {
  const sinCategoria = (item: ItemContenido): ItemContenido => {
    const { categoria: suya, ...resto } = item;
    return suya === categoria ? resto : item;
  };
  return conBorrador(mesa, { items: mesa.borrador.items.map(sinCategoria) });
}

// --- Aprobar ---

function aprobarPieza(mesa: Mesa, pendiente: Pendiente): Resultado<Mesa> {
  const rechazo = rechazoPorPendiente(mesa, pendiente);
  if (rechazo !== undefined) {
    return rechazo;
  }
  const sinLaPieza = cambiarPieza(mesa, pendiente, quitar(pendiente.pieza.id));
  return aceptar(entrarEnElAprobado(sinLaPieza, pendiente));
}

/** El rechazo de aprobar una pieza cuyo objetivo o cuya categoría siguen pendientes: primero el objetivo. */
function rechazoPorPendiente(mesa: Mesa, pendiente: Pendiente): Rechazo {
  const id = pendiente.pieza.id;
  const objetivo = objetivoSinAprobar(mesa, pendiente);
  if (objetivo !== undefined) {
    return rechazarPorCausa(
      'objetivo_pendiente',
      `No se puede aprobar «${id}»: su objetivo ${objetivo} sigue pendiente. Aprueba antes el objetivo.`,
    );
  }
  const categoria = pendiente.tipo === 'item' ? pendiente.pieza.categoria : undefined;
  const aprobada = mesa.aprobado.categorias.some(({ id }) => id === categoria);
  return categoria === undefined || aprobada
    ? undefined
    : rechazarPorCausa(
        'categoria_pendiente',
        `No se puede aprobar «${id}»: su categoría ${categoria} sigue pendiente. Aprueba antes la categoría.`,
      );
}

/**
 * El objetivo del que cuelga la pieza si no está en el aprobado (`undefined` si no cuelga de ninguno o ya
 * está). Un ejemplo que aún va dentro de su objetivo pendiente también cuenta: primero se aprueba el
 * objetivo, y sus ejemplos pasan a ir aparte.
 */
function objetivoSinAprobar(mesa: Mesa, pendiente: Pendiente): string | undefined {
  const objetivo = colgadoDe(pendiente);
  if (pendiente.tipo === 'objetivo' || objetivo === undefined) {
    return undefined;
  }
  const dentro = pendiente.tipo === 'ejemplo' && !pendiente.aparte;
  return dentro || !mesa.aprobado.objetivos.some(({ id }) => id === objetivo) ? objetivo : undefined;
}

/** Añade la pieza al final de su lista en el aprobado. `mesa` ya no la tiene en el borrador. */
function entrarEnElAprobado(mesa: Mesa, pendiente: Pendiente): Mesa {
  const { aprobado } = mesa;
  switch (pendiente.tipo) {
    case 'objetivo':
      return aprobarObjetivo(mesa, pendiente.pieza);
    case 'item':
      return conAprobado(mesa, { items: [...aprobado.items, pendiente.pieza] });
    case 'categoria':
      return conAprobado(mesa, { categorias: [...aprobado.categorias, pendiente.pieza] });
    case 'tarea':
      // `mesa` ya no tiene la tarea en el borrador, y esas son las pendientes por las que sigue la cadena.
      return conAprobado(mesa, { tareas: conLaTareaAprobada(aprobado.tareas, pendiente.pieza, mesa.borrador.tareas) });
    case 'ejemplo':
      return conAprobado(mesa, {
        objetivos: aprobado.objetivos.map((objetivo) =>
          objetivo.id === pendiente.objetivo
            ? { ...objetivo, ejemplos_resueltos: [...objetivo.ejemplos_resueltos, sinObjetivo(pendiente.pieza)] }
            : objetivo,
        ),
      });
  }
}

/** El objetivo entra sin sus ejemplos: siguen pendientes, y van aparte con el `objetivo` al que pertenecen. */
function aprobarObjetivo(mesa: Mesa, objetivo: ObjetivoContenido): Mesa {
  const conAprobados = conAprobado(mesa, {
    objetivos: [...mesa.aprobado.objetivos, { ...objetivo, ejemplos_resueltos: [] }],
  });
  if (objetivo.ejemplos_resueltos.length === 0) {
    return conAprobados;
  }
  const sueltos = objetivo.ejemplos_resueltos.map((ejemplo) => ({ ...ejemplo, objetivo: objetivo.id }));
  return conBorrador(conAprobados, { ejemplos_resueltos: [...(mesa.borrador.ejemplos_resueltos ?? []), ...sueltos] });
}

/** Dentro de su objetivo, un ejemplo no lleva `objetivo`; se conserva la fuente, si la tiene. */
function sinObjetivo(ejemplo: EjemploResueltoContenido): EjemploResueltoContenido {
  const { id, pasos, fuente } = ejemplo;
  return fuente === undefined ? { id, pasos } : { id, pasos, fuente };
}

// --- Corregir ---

/**
 * La corrección de una pieza: `recibida` es lo que llega, y `validada`, lo que se comprueba contra el
 * formato. Solo se distinguen en un ejemplo, que se valida con el `objetivo` de la pieza que sustituye,
 * venga o no en `recibida`; en las demás piezas son lo mismo.
 */
interface Correccion {
  readonly recibida: unknown;
  readonly validada: unknown;
}

/**
 * Sustituye la pieza por `corregida` si pasa las comprobaciones de `primerRechazoDeLaCorreccion` y la mesa
 * resultante no repite ningún id. Valida `corregida` tal como está en el borrador (@MATE-4.8): un ejemplo
 * que va aparte se valida con su `objetivo`, venga o no en `corregida`, y se guarda con él; uno de dentro
 * de su objetivo se valida igual, pero se guarda tal como llega, sin `objetivo`.
 */
function corregirPieza(mesa: Mesa, pendiente: Pendiente, corregida: unknown): Resultado<Mesa> {
  const validada = conObjetivoDelEjemplo(pendiente, corregida);
  const rechazo = primerRechazoDeLaCorreccion(mesa, pendiente, { recibida: corregida, validada });
  if (rechazo !== undefined) {
    return rechazo;
  }
  const id = pendiente.pieza.id;
  const guardada = pendiente.tipo === 'ejemplo' && pendiente.aparte ? validada : corregida;
  // El `as` es honesto: `falloDeLaPiezaSuelta` ha comprobado que `validada` es una pieza de su tipo, y
  // `guardada` es esa misma pieza o la que llegó, que solo se diferencia en el `objetivo` de un ejemplo.
  const sustituir: CambioDeLista = (lista) =>
    lista.map((pieza) => (pieza.id === id ? (guardada as typeof pieza) : pieza));
  const mesaNueva = cambiarPieza(mesa, pendiente, sustituir);
  // Se compara la mesa ya corregida: el objetivo viejo no está en ella, así que no choca con sus ejemplos.
  const repetido = idRepetido(mesaNueva);
  return repetido === undefined
    ? aceptar(mesaNueva)
    : rechazarElCampo('id', `No se guarda la corrección: el id «${repetido}» ya lo usa otra pieza.`);
}

/** Un ejemplo corregido se valida con el `objetivo` de la pieza que sustituye, venga o no en `corregida`. */
function conObjetivoDelEjemplo(pendiente: Pendiente, corregida: unknown): unknown {
  return pendiente.tipo === 'ejemplo' && esRegistro(corregida)
    ? { ...corregida, objetivo: pendiente.objetivo }
    : corregida;
}

/**
 * El primer rechazo de la corrección, en el orden del plan (formato, `id`, `objetivo`, `categoria` y
 * `antes_de`), o `undefined` si pasa todos. Los ids repetidos se miran después, sobre la mesa ya corregida.
 */
function primerRechazoDeLaCorreccion(mesa: Mesa, pendiente: Pendiente, correccion: Correccion): Rechazo {
  const fallo = falloDeLaPiezaSuelta(pendiente.tipo, correccion.validada, pendiente.pieza.id);
  if (fallo !== undefined) {
    return rechazoDeFormato(fallo);
  }
  const id = pendiente.pieza.id;
  const { recibida } = correccion;
  if (!esRegistro(recibida) || recibida['id'] !== id) {
    return rechazarElCampo('id', `No se guarda la corrección: no se puede cambiar el id de «${id}».`);
  }
  return (
    rechazoDeReferenciaDelItem(mesa, pendiente, recibida) ?? rechazoDeAntesDeInexistente(mesa, pendiente, recibida)
  );
}

/**
 * Un ítem que pasa a colgar de un objetivo, o de una categoría, que no está ni en el borrador ni en el
 * aprobado nunca se podría aprobar. Primero se mira el objetivo. El formato ya ha comprobado que `objetivo`
 * y `categoria` son textos no vacíos si vienen; sin `categoria` no hay a qué apuntar.
 */
function rechazoDeReferenciaDelItem(mesa: Mesa, pendiente: Pendiente, corregida: Registro): Rechazo {
  const { borrador, aprobado } = mesa;
  // Lo que no es un texto no es una referencia: el formato ya ha dejado pasar solo textos en estas propiedades.
  const sinDestino = (campo: string, nombre: string, piezas: readonly { readonly id: string }[]) =>
    typeof corregida[campo] !== 'string' || piezas.some(({ id }) => id === corregida[campo])
      ? undefined
      : rechazarElCampo(
          campo,
          `No se guarda la corrección: ${nombre} «${corregida[campo]}» no está ni en el borrador ni en el aprobado.`,
        );
  return pendiente.tipo !== 'item'
    ? undefined
    : (sinDestino('objetivo', 'el objetivo', [...borrador.objetivos, ...aprobado.objetivos]) ??
        sinDestino('categoria', 'la categoría', [...borrador.categorias, ...aprobado.categorias]));
}

/**
 * Una tarea con un `antes_de` que es su propio id, o que no es el de ninguna tarea del borrador ni del
 * aprobado, deja la cadena apuntando a ninguna parte. El formato no mira `antes_de`, que es solo del
 * borrador: lo que no sea un texto tampoco coincide con ningún id y se rechaza aquí.
 */
function rechazoDeAntesDeInexistente(mesa: Mesa, pendiente: Pendiente, corregida: Registro): Rechazo {
  const antesDe = corregida['antes_de'];
  if (pendiente.tipo !== 'tarea' || antesDe === undefined) {
    return undefined;
  }
  const otras = [...mesa.borrador.tareas, ...mesa.aprobado.tareas].filter(({ id }) => id !== pendiente.pieza.id);
  return otras.some(({ id }) => id === antesDe)
    ? undefined
    : rechazarElCampo(
        'antes_de',
        `No se guarda la corrección: «antes_de» tiene que ser el id de otra tarea, del borrador o del aprobado, y ${JSON.stringify(antesDe)} no lo es.`,
      );
}

function rechazoDeFormato(fallo: FalloDeFormato): Resultado<never> {
  return rechazarElCampo(fallo.falta, `No se guarda la corrección: falta o no es válido ${lugarDelFallo(fallo)}.`);
}

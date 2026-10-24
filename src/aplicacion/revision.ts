import type { Marca, Marcador } from '../dominio/citas.ts';
import type {
  ContenidoDominio,
  EjemploResueltoContenido,
  ItemContenido,
  ObjetivoContenido,
  TareaContenido,
} from './contenido.ts';
import { falloDeLaPiezaSuelta, type FalloDeFormato, type TipoDePieza } from './formato-contenido.ts';
import { aceptar, type Resultado } from './resultado.ts';

// La revisión del material (MATE-4, MATE-5): cómo pasa cada pieza del borrador al contenido aprobado.
// Es lógica pura sobre la pareja borrador–aprobado; leer y escribir los ficheros, y guardar lo que había
// para deshacer, lo hacen los casos de uso de material.ts.

/** Un ejemplo resuelto del borrador para un objetivo que ya está aprobado: va aparte, con su objetivo. */
export interface EjemploDeObjetivoAprobado extends EjemploResueltoContenido {
  readonly objetivo: string;
}

/**
 * `contenido/borradores/<dominio>.json`: el formato del contenido, con las piezas pendientes de revisar.
 * Los ejemplos de un objetivo nuevo van dentro de él; los de un objetivo ya aprobado, en `ejemplos_resueltos`.
 */
export interface BorradorDominio extends ContenidoDominio {
  readonly ejemplos_resueltos?: readonly EjemploDeObjetivoAprobado[];
}

/** Lo que la revisión lee y escribe de un dominio. */
export interface Mesa {
  readonly borrador: BorradorDominio;
  readonly aprobado: ContenidoDominio;
}

/** Filtros de la revisión (MATE-4.2): todas las pendientes, o solo las que llevan una marca. */
export type FiltroRevision = 'pendientes' | Marca;

interface PiezaPendiente {
  readonly id: string;
  readonly tipo: TipoDePieza;
  /** La marca que le pone el marcador, si tiene alguna: una lista vacía o de un elemento. */
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
  /** Las piezas que aprobaría «Aprobar las N sin marca»; 0 si no hay ninguna (MATE-5.1, MATE-5.4). */
  readonly aprobablesEnBloque: number;
}

export type Accion =
  | { readonly tipo: 'aprobar'; readonly pieza: string }
  | { readonly tipo: 'aprobar_sin_marca' }
  | { readonly tipo: 'descartar'; readonly pieza: string }
  | { readonly tipo: 'corregir'; readonly pieza: string; readonly corregida: unknown };

/**
 * Las piezas pendientes del borrador, con sus marcas, agrupadas por el objetivo del que cuelgan
 * (@MATE-4.1). De qué objetivo cuelga cada una:
 * - un objetivo, de sí mismo, y los ejemplos que lleva dentro, de él;
 * - un ejemplo de los que van aparte, un ítem, de su `objetivo`;
 * - una tarea, de ninguno: las tareas van en un grupo sin `objetivo`, el último.
 *
 * Los grupos salen en el orden en que aparece su primera pieza, y las piezas de cada grupo en el orden
 * del borrador: objetivos (cada uno seguido de sus ejemplos), ejemplos que van aparte, ítems y tareas.
 * Con un filtro de marca solo quedan las piezas que la llevan, y un grupo sin piezas no sale (@MATE-4.2).
 *
 * `aprobablesEnBloque` no depende del filtro: son las piezas que aprobaría `aprobar_sin_marca`.
 */
export function revisar(mesa: Mesa, marcas: Marcador, filtro: FiltroRevision): Revision {
  const piezas = pendientesDelBorrador(mesa.borrador).map((pendiente) => ({
    objetivo: colgadoDe(pendiente),
    pieza: piezaPendiente(pendiente, marcas),
  }));
  const visibles = piezas.filter(({ pieza }) => filtro === 'pendientes' || pieza.marcas.includes(filtro));
  return { grupos: agruparPorObjetivo(visibles), aprobablesEnBloque: idsEnBloque(mesa, marcas).length };
}

/**
 * Aplica la acción y devuelve la mesa nueva, sin tocar la de entrada. Lo que no cambia se queda donde
 * estaba y en el mismo orden; lo que entra en una lista va al final.
 *
 * - `aprobar` saca la pieza del borrador y la pone en el aprobado con su fuente, si la tiene (@MATE-4.4,
 *   @MATE-5.3); da igual que lleve marca. Un objetivo entra sin sus ejemplos, que siguen pendientes y
 *   pasan a la lista de los que van aparte, con `objetivo`. Un ejemplo que iba aparte entra dentro de
 *   su objetivo, ya sin `objetivo`. Una pieza que cuelga de un objetivo que no está en el aprobado no
 *   se aprueba: el aprobado quedaría con un objetivo que no existe. Rechaza con `causa`
 *   `objetivo_pendiente` (regla que la feature no cubre, aprobada en el Mecanismo de MATE).
 * - `aprobar_sin_marca` aprueba, en el orden del borrador, las piezas a las que `marcas` no pone
 *   ninguna marca (@MATE-5.2). Primero los objetivos, para que después puedan entrar las piezas que
 *   cuelgan de ellos; una pieza sin marca que cuelga de un objetivo pendiente con marca no entra, y
 *   tampoco cuenta en `aprobablesEnBloque`. Sin ninguna, devuelve la misma mesa.
 * - `descartar` saca la pieza del borrador y no toca el aprobado (@MATE-4.5). Un objetivo se va con
 *   todo lo que cuelga de él en el borrador: sus ejemplos y sus ítems (regla que la feature no cubre).
 * - `corregir` sustituye la pieza por `corregida`, en el mismo sitio del borrador, y sigue pendiente
 *   (@MATE-4.6). Se valida como una pieza suelta de su tipo: si no cumple el formato del contenido, no
 *   cambia nada y rechaza con el `campo` que falta (@MATE-4.8); si cambia el `id`, rechaza con `campo`
 *   `id`. Un ejemplo que va aparte conserva su `objetivo`, venga o no en `corregida`.
 *
 * Una pieza que no está en el borrador rechaza con `causa` `pieza_no_encontrada`. Las marcas no se
 * guardan: se vuelven a calcular cada vez que se abre la revisión (@MATE-4.7).
 */
export function aplicar(mesa: Mesa, accion: Accion, marcas: Marcador): Resultado<Mesa> {
  switch (accion.tipo) {
    case 'aprobar':
      return sobrePieza(mesa, accion.pieza, aprobarPieza);
    case 'aprobar_sin_marca':
      return aprobarEnBloque(mesa, marcas);
    case 'descartar':
      return sobrePieza(mesa, accion.pieza, (actual, pendiente) => aceptar(descartarPieza(actual, pendiente)));
    case 'corregir':
      return sobrePieza(mesa, accion.pieza, (actual, pendiente) => corregirPieza(actual, pendiente, accion.corregida));
  }
}

// --- Las piezas pendientes del borrador ---

/**
 * Una pieza pendiente, con el sitio del borrador donde está. Todas tienen `id` y `fuente` opcional.
 * Un ejemplo puede estar dentro de su objetivo pendiente o ir aparte, ya con el `objetivo` de un
 * objetivo aprobado.
 */
type Pendiente =
  | { readonly tipo: 'objetivo'; readonly pieza: ObjetivoContenido }
  | {
      readonly tipo: 'ejemplo';
      readonly pieza: EjemploResueltoContenido;
      readonly objetivo: string;
      readonly aparte: boolean;
    }
  | { readonly tipo: 'item'; readonly pieza: ItemContenido }
  | { readonly tipo: 'tarea'; readonly pieza: TareaContenido };

/** Las pendientes en el orden de la revisión: ver `revisar`. */
function pendientesDelBorrador(borrador: BorradorDominio): readonly Pendiente[] {
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
  const tareas = borrador.tareas.map((pieza): Pendiente => ({ tipo: 'tarea', pieza }));
  return [...deObjetivos, ...aparte, ...items, ...tareas];
}

/** El objetivo del que cuelga la pieza; las tareas no cuelgan de ninguno. */
function colgadoDe(pendiente: Pendiente): string | undefined {
  switch (pendiente.tipo) {
    case 'objetivo':
      return pendiente.pieza.id;
    case 'ejemplo':
      return pendiente.objetivo;
    case 'item':
      return pendiente.pieza.objetivo;
    case 'tarea':
      return undefined;
  }
}

function piezaPendiente(pendiente: Pendiente, marcas: Marcador): PiezaPendiente {
  const marca = marcas(pendiente.pieza.fuente);
  return { id: pendiente.pieza.id, tipo: pendiente.tipo, marcas: marca === undefined ? [] : [marca] };
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

// --- Aprobar en bloque ---

/**
 * Los ids que entran con «Aprobar las N sin marca», en el orden en que se aprueban. Es la única fuente
 * de `aprobablesEnBloque` y de `aprobar_sin_marca`: el número del botón no puede diferir de lo que se
 * aprueba. Primero van los objetivos sin marca; después, las demás sin marca cuyo objetivo ya está
 * aprobado o entra en este mismo bloque (@MATE-5.2).
 */
function idsEnBloque(mesa: Mesa, marcas: Marcador): readonly string[] {
  const sinMarca = pendientesDelBorrador(mesa.borrador).filter(({ pieza }) => marcas(pieza.fuente) === undefined);
  const objetivos = sinMarca.filter(({ tipo }) => tipo === 'objetivo');
  const disponibles = new Set([...mesa.aprobado.objetivos, ...objetivos.map(({ pieza }) => pieza)].map(({ id }) => id));
  const colgantes = sinMarca.filter((pendiente) => {
    const objetivo = colgadoDe(pendiente);
    return pendiente.tipo !== 'objetivo' && (objetivo === undefined || disponibles.has(objetivo));
  });
  return [...objetivos, ...colgantes].map(({ pieza }) => pieza.id);
}

function aprobarEnBloque(mesa: Mesa, marcas: Marcador): Resultado<Mesa> {
  let actual = mesa;
  for (const id of idsEnBloque(mesa, marcas)) {
    const resultado = sobrePieza(actual, id, aprobarPieza);
    if (!resultado.ok) {
      return resultado;
    }
    actual = resultado.valor;
  }
  return aceptar(actual);
}

// --- Rechazos ---

function rechazarPor(causa: string, motivo: string): Resultado<never> {
  return { ok: false, motivo, causa };
}

function rechazarElCampo(campo: string, motivo: string): Resultado<never> {
  return { ok: false, motivo, campo };
}

/** Busca la pieza en el borrador y le aplica la acción; si no está, `pieza_no_encontrada`. */
function sobrePieza(
  mesa: Mesa,
  id: string,
  accion: (mesa: Mesa, pendiente: Pendiente) => Resultado<Mesa>,
): Resultado<Mesa> {
  const pendiente = pendientesDelBorrador(mesa.borrador).find(({ pieza }) => pieza.id === id);
  return pendiente === undefined
    ? rechazarPor('pieza_no_encontrada', `«${id}» no está entre las piezas pendientes de revisar.`)
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
  return pendiente.tipo === 'objetivo' ? sinLoQueCuelga(sinLaPieza, pendiente.pieza.id) : sinLaPieza;
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

// --- Aprobar ---

function aprobarPieza(mesa: Mesa, pendiente: Pendiente): Resultado<Mesa> {
  const sinAprobar = objetivoSinAprobar(mesa, pendiente);
  if (sinAprobar !== undefined) {
    return rechazarPor(
      'objetivo_pendiente',
      `No se puede aprobar «${pendiente.pieza.id}»: su objetivo ${sinAprobar} sigue pendiente. Aprueba antes el objetivo.`,
    );
  }
  const sinLaPieza = cambiarPieza(mesa, pendiente, quitar(pendiente.pieza.id));
  return aceptar(entrarEnElAprobado(sinLaPieza, pendiente));
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
    case 'tarea':
      return conAprobado(mesa, { tareas: [...aprobado.tareas, pendiente.pieza] });
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

type Registro = Readonly<Record<string, unknown>>;

function esRegistro(valor: unknown): valor is Registro {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

/**
 * Sustituye la pieza por `corregida` si cumple el formato de su tipo y conserva el `id`. Valida
 * `corregida` tal como está en el borrador (@MATE-4.8): un ejemplo que va aparte se valida con su
 * `objetivo`, venga o no en `corregida`, y se guarda con él.
 */
function corregirPieza(mesa: Mesa, pendiente: Pendiente, corregida: unknown): Resultado<Mesa> {
  const conObjetivo =
    pendiente.tipo === 'ejemplo' && esRegistro(corregida) ? { ...corregida, objetivo: pendiente.objetivo } : corregida;
  const fallo = falloDeLaPiezaSuelta(pendiente.tipo, conObjetivo);
  if (fallo !== undefined) {
    return rechazoDeFormato(fallo);
  }
  const id = pendiente.pieza.id;
  if (!esRegistro(corregida) || corregida['id'] !== id) {
    return rechazarElCampo('id', `No se guarda la corrección: no se puede cambiar el id de «${id}».`);
  }
  const guardada = pendiente.tipo === 'ejemplo' && pendiente.aparte ? conObjetivo : corregida;
  // El `as` es honesto: `falloDeLaPiezaSuelta` ha comprobado que `guardada` es una pieza de su tipo.
  const sustituir: CambioDeLista = (lista) =>
    lista.map((pieza) => (pieza.id === id ? (guardada as typeof pieza) : pieza));
  return aceptar(cambiarPieza(mesa, pendiente, sustituir));
}

function rechazoDeFormato(fallo: FalloDeFormato): Resultado<never> {
  const donde = fallo.pieza === undefined ? '' : ` de ${fallo.pieza}`;
  return rechazarElCampo(fallo.falta, `No se guarda la corrección: falta o no es válido «${fallo.falta}»${donde}.`);
}

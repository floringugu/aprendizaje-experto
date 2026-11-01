// Fábricas y ayudantes de los tests de la revisión del material (MATE-4, MATE-5, MATE-7). Los usan los de la
// mesa y la revisión (mesa, revision, revision-aplicar, revision-ids) y los de los casos de uso que leen y
// escriben sus ficheros (revision-del-material, revision-del-material-deshacer, ver-fuente). No es un fichero
// de tests: vitest solo recoge los *.test.ts, así que aquí no se ejecuta nada.
import type { Marcador } from '../../src/dominio/citas.ts';
import type {
  CategoriaContenido,
  ContenidoDominio,
  EjemploResueltoContenido,
  Fuente,
  ItemContenido,
  ObjetivoContenido,
  TareaContenido,
} from '../../src/aplicacion/contenido.ts';
import type { Dependencias } from '../../src/aplicacion/dependencias.ts';
import type { Ficheros, ParametrosJson } from '../../src/aplicacion/puertos.ts';
import type { Resultado } from '../../src/aplicacion/resultado.ts';
import { aplicar, revisar, type Accion, type FiltroRevision, type Marca } from '../../src/aplicacion/revision.ts';
import type { BorradorDominio, Mesa, TareaDelBorrador } from '../../src/aplicacion/mesa.ts';

export const FUENTE_BUENA: Fuente = { documento: 'apuntes.pdf', lugar: 'página 12', fragmento: 'buena' };
export const FUENTE_MALA: Fuente = { ...FUENTE_BUENA, fragmento: 'mala' };

/** Marcador hecho a mano: sin fuente es `sin_fuente`, el fragmento «mala» no se encuentra y el resto no lleva marca. */
export const marcador: Marcador = (fuente) => {
  if (fuente === undefined) return 'sin_fuente';
  return fuente.fragmento === 'mala' ? 'cita_no_encontrada' : undefined;
};

const conFuente = (fuente: Fuente | undefined): { fuente?: Fuente } => (fuente === undefined ? {} : { fuente });

export function item(id: string, fuente?: Fuente, objetivo = 'O1'): ItemContenido {
  const respuesta = { opciones: ['a', 'b'], correcta: 'a' };
  const base = { id, objetivo, tipo: 'hecho', diagnostico: false, enunciado: `Enunciado de ${id}`, respuesta };
  return { ...(base as Omit<ItemContenido, 'feedback'>), feedback: 'Feedback', ...conFuente(fuente) };
}
/** Un ítem que pertenece a esa categoría; por defecto, de O1, como `item`. */
export function itemDeCategoria(id: string, categoria: string, objetivo = 'O1'): ItemContenido {
  return { ...item(id, undefined, objetivo), categoria };
}
/** Un problema (no un hecho) de ese objetivo, con categoría si se da; por defecto, de O1 y no reservado. */
export function problema(id: string, categoriaDelProblema?: string, objetivoDelProblema = 'O1'): ItemContenido {
  const base: ItemContenido = { ...item(id, undefined, objetivoDelProblema), tipo: 'problema' };
  return categoriaDelProblema === undefined ? base : { ...base, categoria: categoriaDelProblema };
}
/** El mismo ítem, con `reservado: true`. */
export const reservado = (pieza: ItemContenido): ItemContenido => ({ ...pieza, reservado: true });
export function categoria(id: string, fuente?: Fuente): CategoriaContenido {
  return { id, descripcion: `Descripción de ${id}`, ...conFuente(fuente) };
}
/** Una categoría de un grupo de parecidas, las únicas cuyos problemas se pueden reservar y se intercalan. */
export function categoriaConGrupo(id: string, grupo = 'G1'): CategoriaContenido {
  return { ...categoria(id), grupo_parecidas: grupo };
}
export function ejemplo(id: string, fuente?: Fuente): EjemploResueltoContenido {
  return { id, pasos: ['P1'], ...conFuente(fuente) };
}
/** Un ejemplo con tantos pasos como se pida (`ejemplo` lleva uno solo, el mínimo que pide el formato). */
export function ejemploDePasos(id: string, pasos: number, fuente?: Fuente): EjemploResueltoContenido {
  return { ...ejemplo(id, fuente), pasos: Array.from({ length: pasos }, (_, indice) => `P${String(indice + 1)}`) };
}
export function objetivo(id: string, ejemplos: EjemploResueltoContenido[] = [], fuente?: Fuente): ObjetivoContenido {
  return { id, instruccion: `Instrucción de ${id}`, ejemplos_resueltos: ejemplos, ...conFuente(fuente) };
}
export function tarea(id: string, fuente?: Fuente): TareaContenido {
  const rubrica = [{ criterio: 'Planteamiento', niveles: [{ nivel: 0, descriptor: 'Descriptor' }] }];
  return { id, enunciado: `Enunciado de ${id}`, rubrica, ...conFuente(fuente) };
}
/** Una tarea del borrador que dice cuál va justo detrás (`antes_de`), aprobada o del borrador. */
export function tareaAntesDe(id: string, antesDe: string, fuente?: Fuente): TareaDelBorrador {
  return { ...tarea(id, fuente), antes_de: antesDe };
}

/** Congela la mesa entera: si el código intenta cambiarla en vez de copiarla, el test falla con un error. */
function congelar<T>(valor: T): T {
  if (typeof valor === 'object' && valor !== null) {
    Object.values(valor).forEach(congelar);
    Object.freeze(valor);
  }
  return valor;
}

const VACIO: ContenidoDominio = { dominio: 'ficticio', objetivos: [], categorias: [], items: [], tareas: [] };
export function mesaDe(borrador: Partial<BorradorDominio>, aprobado: Partial<ContenidoDominio> = {}): Mesa {
  return congelar({ borrador: { ...VACIO, ...borrador }, aprobado: { ...VACIO, ...aprobado } });
}

/** Los ítems de los escenarios de MATE-4 y MATE-5: I7 e I10 sin marca, I8 sin fuente e I9 con cita no encontrada. */
export const ITEMS = [item('I7', FUENTE_BUENA), item('I8'), item('I9', FUENTE_MALA), item('I10', FUENTE_BUENA)];
export const MESA = mesaDe({ items: ITEMS }, { objetivos: [objetivo('O1')] });

export const ids = (piezas: readonly { readonly id: string }[]): string[] => piezas.map(({ id }) => id);

/** Los bytes de un fichero JSON como los escribe la aplicación: sangrado con dos espacios. */
export const codificar = (valor: unknown): Uint8Array => new TextEncoder().encode(JSON.stringify(valor, null, '  '));

/**
 * Escribe `mesa` en `ficheros` como la dejaría la aplicación: el borrador en
 * `contenido/borradores/<dominio>.json` y el aprobado en `contenido/<dominio>.json`, en JSON con dos
 * espacios de sangría y con `dominio` en los dos en lugar del que traiga la mesa.
 */
export function escribirMesa(ficheros: Ficheros, mesa: Mesa, dominio = 'ficticio'): void {
  ficheros.escribir(`contenido/borradores/${dominio}.json`, codificar({ ...mesa.borrador, dominio }));
  ficheros.escribir(`contenido/${dominio}.json`, codificar({ ...mesa.aprobado, dominio }));
}

/** Las marcas de la pieza `id` en la revisión, o `undefined` si la pieza no sale (por el filtro o porque no está). */
export function marcasDe(mesa: Mesa, id: string, filtro: FiltroRevision = 'pendientes'): readonly Marca[] | undefined {
  const piezas = revisar(mesa, marcador, filtro).grupos.flatMap((grupo) => grupo.piezas);
  return piezas.find((pieza) => pieza.id === id)?.marcas;
}

/** Cada grupo como [objetivo, ids de sus piezas]. */
export function agrupadas(mesa: Mesa, filtro: FiltroRevision = 'pendientes'): unknown[] {
  return revisar(mesa, marcador, filtro).grupos.map(({ objetivo: grupo, piezas }) => [grupo, ids(piezas)]);
}

/**
 * Los ayudantes de `aplicar`: el éxito o el rechazo que el test espera, y un error claro si pasa lo otro.
 * Un rechazo sin motivo, o con el motivo en blanco, tampoco vale: la persona no sabría qué ha pasado.
 */
function exito(resultado: Resultado<Mesa>): Mesa {
  if (!resultado.ok) throw new Error(`Se esperaba éxito y fue un rechazo: ${resultado.motivo}`);
  return resultado.valor;
}
export const aplicado = (mesa: Mesa, accion: Accion): Mesa => exito(aplicar(mesa, accion));
export function rechazado(mesa: Mesa, accion: Accion): Extract<Resultado<Mesa>, { ok: false }> {
  const resultado = aplicar(mesa, accion);
  if (resultado.ok) throw new Error('Se esperaba un rechazo');
  if (resultado.motivo.trim() === '') throw new Error('El rechazo no explica el motivo');
  return resultado;
}

/** El mínimo de problemas reservados que usan por defecto los tests de la revisión (el valor de config/parametros.json). */
const MINIMO_RESERVADOS = 5;

/** Los parámetros de prueba de la revisión: solo el mínimo de problemas reservados, que es el que lee. */
export const parametrosDeReservados = (minimo: number): ParametrosJson => ({
  minimo_problemas_reservados: { valor: minimo },
});

/** Lo que recibe `crearRevisionDelMaterial`: los ficheros y unos parámetros de prueba. */
export function externosDe(
  ficheros: Ficheros,
  minimo = MINIMO_RESERVADOS,
): Pick<Dependencias, 'ficheros' | 'leerParametros'> {
  return { ficheros, leerParametros: () => parametrosDeReservados(minimo) };
}

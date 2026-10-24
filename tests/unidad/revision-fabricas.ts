// Fábricas y ayudantes de los tests de la revisión del material (MATE-4, MATE-5). Los usan
// revision.test.ts (revisar) y revision-aplicar.test.ts (aplicar). No es un fichero de tests: vitest
// solo recoge los *.test.ts, así que aquí no se ejecuta nada.
import type { Marcador } from '../../src/dominio/citas.ts';
import type {
  ContenidoDominio,
  EjemploResueltoContenido,
  Fuente,
  ItemContenido,
  ObjetivoContenido,
  TareaContenido,
} from '../../src/aplicacion/contenido.ts';
import type { Resultado } from '../../src/aplicacion/resultado.ts';
import {
  aplicar,
  revisar,
  type Accion,
  type BorradorDominio,
  type FiltroRevision,
  type Mesa,
} from '../../src/aplicacion/revision.ts';

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
export function ejemplo(id: string, fuente?: Fuente): EjemploResueltoContenido {
  return { id, pasos: ['P1'], ...conFuente(fuente) };
}
export function objetivo(id: string, ejemplos: EjemploResueltoContenido[] = [], fuente?: Fuente): ObjetivoContenido {
  return { id, instruccion: `Instrucción de ${id}`, ejemplos_resueltos: ejemplos, ...conFuente(fuente) };
}
export function tarea(id: string, fuente?: Fuente): TareaContenido {
  const rubrica = [{ criterio: 'Planteamiento', niveles: [{ nivel: 0, descriptor: 'Descriptor' }] }];
  return { id, enunciado: `Enunciado de ${id}`, rubrica, ...conFuente(fuente) };
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

/** Cada grupo como [objetivo, ids de sus piezas]. */
export function agrupadas(mesa: Mesa, filtro: FiltroRevision = 'pendientes'): unknown[] {
  return revisar(mesa, marcador, filtro).grupos.map(({ objetivo: grupo, piezas }) => [grupo, ids(piezas)]);
}

/** Los ayudantes de `aplicar`: el éxito o el rechazo que el test espera, y un error claro si pasa lo otro. */
function exito(resultado: Resultado<Mesa>): Mesa {
  if (!resultado.ok) throw new Error(`Se esperaba éxito y fue un rechazo: ${resultado.motivo}`);
  return resultado.valor;
}
export const aplicado = (mesa: Mesa, accion: Accion): Mesa => exito(aplicar(mesa, accion, marcador));
export function rechazado(mesa: Mesa, accion: Accion): Extract<Resultado<Mesa>, { ok: false }> {
  const resultado = aplicar(mesa, accion, marcador);
  if (resultado.ok) throw new Error('Se esperaba un rechazo');
  return resultado;
}

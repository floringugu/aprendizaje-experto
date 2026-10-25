// Ayudantes compartidos de los tests de `formato-contenido` (formato-contenido, formato-contenido-respuesta y
// formato-contenido-suelta). No es un fichero de tests: vitest solo recoge los *.test.ts, así que aquí no se
// ejecuta nada.
import { expect, it } from 'vitest';
import { validarContenido } from '../../src/aplicacion/formato-contenido.ts';

// Las piezas se construyen como las leería `leerContenido` de un fichero JSON: objetos sin tipar.
// Un cambio a `undefined` equivale a que la propiedad falte: la validación no distingue una cosa de la otra.
export type Pieza = Record<string, unknown>;

export const FUENTE: Pieza = { documento: 'apuntes.pdf', lugar: 'página 12', fragmento: 'texto citado' };

// Cómo nombra la validación las piezas de los contenidos de prueba.
export const OBJETIVO = 'el objetivo O2';
export const EJEMPLO = 'el ejemplo resuelto E1 de O2';
export const CATEGORIA = 'la categoría C1';
export const ITEM = 'el ítem I9';
export const TAREA = 'la tarea T3';
// Y las fuentes de esas piezas.
export const FUENTE_DEL_OBJETIVO = 'la fuente del objetivo O2';
export const FUENTE_DEL_EJEMPLO = 'la fuente del ejemplo resuelto E1 de O2';
export const FUENTE_DEL_ITEM = 'la fuente del ítem I9';
export const FUENTE_DE_LA_TAREA = 'la fuente de la tarea T3';

export function nivel(cambios: Pieza = {}): Pieza {
  return { nivel: 0, descriptor: 'Descriptor', ...cambios };
}
export function criterio(cambios: Pieza = {}): Pieza {
  return { criterio: 'Planteamiento', niveles: [nivel()], ...cambios };
}
export function tarea(cambios: Pieza = {}): Pieza {
  return { id: 'T3', enunciado: 'Enunciado', rubrica: [criterio()], ...cambios };
}
export function ejemplo(cambios: Pieza = {}): Pieza {
  return { id: 'E1', pasos: ['P1', 'P2'], ...cambios };
}
export function objetivo(cambios: Pieza = {}): Pieza {
  return { id: 'O2', instruccion: 'Instrucción', ejemplos_resueltos: [ejemplo()], ...cambios };
}
export function categoria(cambios: Pieza = {}): Pieza {
  return { id: 'C1', descripcion: 'Descripción', ...cambios };
}
export function item(cambios: Pieza = {}): Pieza {
  return {
    id: 'I9',
    objetivo: 'O2',
    tipo: 'hecho',
    diagnostico: false,
    enunciado: 'Enunciado',
    respuesta: { opciones: ['a', 'b'], correcta: 'a' },
    feedback: 'Feedback',
    ...cambios,
  };
}
export function contenido(cambios: Pieza = {}): Pieza {
  const piezas = { objetivos: [objetivo()], categorias: [categoria()], items: [item()], tareas: [tarea()] };
  return { dominio: 'mate', ...piezas, ...cambios };
}
/** La pieza sin esa propiedad, como si el autor no la hubiera escrito. */
export function sin(pieza: Pieza, nombre: string): Pieza {
  return Object.fromEntries(Object.entries(pieza).filter(([clave]) => clave !== nombre));
}

// Un contenido válido salvo la pieza que se indica, para ver qué falla en ella.
export const enObjetivo = (cambios: Pieza): Pieza => contenido({ objetivos: [objetivo(cambios)] });
export const enEjemplo = (cambios: Pieza): Pieza => enObjetivo({ ejemplos_resueltos: [ejemplo(cambios)] });
export const enCategoria = (cambios: Pieza): Pieza => contenido({ categorias: [categoria(cambios)] });
export const enItem = (cambios: Pieza): Pieza => contenido({ items: [item(cambios)] });
export const enRespuesta = (respuesta: unknown): Pieza => enItem({ respuesta });
export const enTarea = (cambios: Pieza): Pieza => contenido({ tareas: [tarea(cambios)] });
export const enRubrica = (rubrica: unknown): Pieza => enTarea({ rubrica });
export const enNiveles = (niveles: unknown): Pieza => enRubrica([criterio({ niveles })]);

export function falloDe(leido: unknown): unknown {
  const resultado = validarContenido(leido);
  return resultado.ok ? undefined : resultado.fallo;
}

/** Descripción, lo leído, y la pieza y la propiedad que se espera que fallen. */
type Fila = [descripcion: string, leido: unknown, pieza: string, falta: string];

export function comprobarFallos(filas: readonly Fila[]): void {
  it.each(filas)('D16 %s', (...fila) => {
    const [, leido, pieza, falta] = fila;
    expect(falloDe(leido)).toStrictEqual({ pieza, falta });
  });
}

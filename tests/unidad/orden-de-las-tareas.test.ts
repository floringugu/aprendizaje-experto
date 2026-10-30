import { describe, expect, it } from 'vitest';
import type { TareaContenido } from '../../src/aplicacion/contenido.ts';
import type { TareaDelBorrador } from '../../src/aplicacion/mesa.ts';
import { conLaTareaAprobada, sinLaTareaDescartada } from '../../src/aplicacion/orden-de-las-tareas.ts';
import { FUENTE_BUENA, ids, tarea, tareaAntesDe } from './revision-fabricas.ts';

// Congeladas: si la función cambia la lista que recibe en vez de copiarla, el test falla con un error.
const APROBADAS: readonly TareaContenido[] = Object.freeze([tarea('T1'), tarea('T2')]);

/** Los ids de las tareas aprobadas después de aprobar `nueva`, con `pendientes` en el borrador. */
function aprobadasTras(nueva: TareaDelBorrador, pendientes: readonly TareaDelBorrador[] = []): string[] {
  return ids(conLaTareaAprobada(APROBADAS, nueva, pendientes));
}

/**
 * Aprueba las tareas pendientes en el orden de `orden`, una a una, como haría la persona: cada vez, el
 * borrador es lo que aún no se ha aprobado.
 */
function aprobadasEnOrden(pendientes: readonly TareaDelBorrador[], orden: readonly string[]): string[] {
  let aprobadas: readonly TareaContenido[] = APROBADAS;
  let quedan = pendientes;
  for (const id of orden) {
    const nueva = quedan.find((pendiente) => pendiente.id === id);
    if (nueva === undefined) throw new Error(`«${id}» no está pendiente`);
    quedan = quedan.filter((pendiente) => pendiente.id !== id);
    aprobadas = conLaTareaAprobada(aprobadas, nueva, quedan);
  }
  return ids(aprobadas);
}

describe('conLaTareaAprobada: delante de la tarea que dice «antes de»', () => {
  it.each([
    ['que va antes de T1', 'T1', ['T3', 'T1', 'T2']],
    ['que va antes de T2', 'T2', ['T1', 'T3', 'T2']],
  ])('@MATE-4.11 una tarea %s entra delante de ella', (_descripcion, antesDe, orden) => {
    expect(aprobadasTras(tareaAntesDe('T3', antesDe))).toStrictEqual(orden);
  });

  it('@MATE-4.11 una tarea sin «antes de» entra al final', () => {
    expect(aprobadasTras(tarea('T3'))).toStrictEqual(['T1', 'T2', 'T3']);
  });

  it('@MATE-4.11 la tarea aprobada no lleva `antes_de` y conserva su fuente; las demás no cambian', () => {
    const nuevas = conLaTareaAprobada(APROBADAS, tareaAntesDe('T3', 'T2', FUENTE_BUENA), []);
    expect(nuevas).toStrictEqual([tarea('T1'), tarea('T3', FUENTE_BUENA), tarea('T2')]);
    expect(nuevas[0]).toBe(APROBADAS[0]);
    expect(nuevas[2]).toBe(APROBADAS[1]);
  });

  it('@MATE-4.11 sin fuente, la tarea aprobada tampoco lleva la propiedad `fuente`', () => {
    expect(conLaTareaAprobada(APROBADAS, tareaAntesDe('T3', 'T1'), [])[0]).toStrictEqual(tarea('T3'));
  });
});

describe('conLaTareaAprobada: la cadena de tareas pendientes', () => {
  const T3_ANTES_DE_T4 = tareaAntesDe('T3', 'T4');
  // T3 va antes de T4 y T4 va antes de T1, que ya está aprobada: el orden final es T3, T4, T1, T2.
  const CADENA = [T3_ANTES_DE_T4, tareaAntesDe('T4', 'T1')];

  it.each([[['T3', 'T4']], [['T4', 'T3']]])(
    '@MATE-4.11 la cadena T3, T4, T1 da el mismo orden final si se aprueba en el orden %j',
    (orden) => {
      expect(aprobadasEnOrden(CADENA, orden)).toStrictEqual(['T3', 'T4', 'T1', 'T2']);
    },
  );

  it('@MATE-4.11 la primera tarea de la cadena se coloca delante de la primera aprobada que se encuentra', () => {
    expect(aprobadasEnOrden(CADENA, ['T3'])).toStrictEqual(['T3', 'T1', 'T2']);
  });

  it.each([
    ['un ciclo T3, T4, T3', [tareaAntesDe('T4', 'T3')]],
    ['un ciclo al que T3 no pertenece', [tareaAntesDe('T4', 'T5'), tareaAntesDe('T5', 'T4')]],
    ['una cadena que se corta en una tarea sin «antes de»', [tarea('T4')]],
    ['una cadena que se corta en un id desconocido', [tareaAntesDe('T4', 'T9')]],
  ])('@MATE-4.11 %s: la tarea entra al final', (_descripcion, otras) => {
    expect(aprobadasTras(T3_ANTES_DE_T4, [T3_ANTES_DE_T4, ...otras])).toStrictEqual(['T1', 'T2', 'T3']);
  });

  it.each([
    ['una tarea que va antes de sí misma', tareaAntesDe('T3', 'T3')],
    ['un id que no es de ninguna tarea', tareaAntesDe('T3', 'T9')],
  ])('@MATE-4.11 %s: la tarea entra al final', (_descripcion, nueva) => {
    expect(aprobadasTras(nueva, [nueva])).toStrictEqual(['T1', 'T2', 'T3']);
  });

  it('@MATE-4.11 un ciclo que vuelve a la tarea, con ella fuera del borrador, también va al final', () => {
    expect(aprobadasTras(T3_ANTES_DE_T4, [tareaAntesDe('T4', 'T3')])).toStrictEqual(['T1', 'T2', 'T3']);
  });
});

describe('sinLaTareaDescartada', () => {
  it('@MATE-4.5 las tareas que iban delante de la descartada pasan a llevar su «antes de»', () => {
    const borrador = [tareaAntesDe('T3', 'T4'), tareaAntesDe('T5', 'T4', FUENTE_BUENA), tareaAntesDe('T4', 'T1')];
    const nuevo = sinLaTareaDescartada(borrador, tareaAntesDe('T4', 'T1'));
    expect(nuevo).toStrictEqual([tareaAntesDe('T3', 'T1'), tareaAntesDe('T5', 'T1', FUENTE_BUENA)]);
  });

  it('@MATE-4.5 si la descartada no llevaba «antes de», las que iban delante de ella se quedan sin él, sin la propiedad', () => {
    const nuevo = sinLaTareaDescartada([tareaAntesDe('T3', 'T4', FUENTE_BUENA), tarea('T4')], tarea('T4'));
    expect(nuevo).toStrictEqual([tarea('T3', FUENTE_BUENA)]);
    expect(nuevo[0]).not.toHaveProperty('antes_de');
  });

  it('@MATE-4.5 en el ciclo T3, T4, T3, al descartar T3, T4 se queda sin «antes de» en vez de apuntar a sí misma', () => {
    const nuevo = sinLaTareaDescartada([tareaAntesDe('T3', 'T4'), tareaAntesDe('T4', 'T3')], tareaAntesDe('T3', 'T4'));
    expect(nuevo).toStrictEqual([tarea('T4')]);
    expect(nuevo[0]).not.toHaveProperty('antes_de');
  });

  it('@MATE-4.5 las demás tareas no cambian y siguen en su orden', () => {
    const borrador = [tareaAntesDe('T3', 'T1'), tarea('T4'), tareaAntesDe('T5', 'T4'), tareaAntesDe('T6', 'T2')];
    const nuevo = sinLaTareaDescartada(borrador, tarea('T4'));
    expect(ids(nuevo)).toStrictEqual(['T3', 'T5', 'T6']);
    expect(nuevo[0]).toBe(borrador[0]);
    expect(nuevo[2]).toBe(borrador[3]);
  });
});

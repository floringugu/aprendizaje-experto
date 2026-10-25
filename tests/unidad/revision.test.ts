import { describe, expect, it } from 'vitest';
import { revisar } from '../../src/aplicacion/revision.ts';
import {
  FUENTE_BUENA,
  ITEMS,
  MESA,
  agrupadas,
  ejemplo,
  item,
  marcador,
  mesaDe,
  objetivo,
  tarea,
} from './revision-fabricas.ts';

describe('revisar: agrupación y orden', () => {
  it('@MATE-4.1 las piezas se agrupan por objetivo', () => {
    const mesa = mesaDe({ items: [...ITEMS, item('I11', undefined, 'O2')] });
    expect(agrupadas(mesa)).toStrictEqual([
      ['O1', ['I7', 'I8', 'I9', 'I10']],
      ['O2', ['I11']],
    ]);
  });

  it('@MATE-4.1 cada pieza trae su marca: ninguna, o una', () => {
    const [grupo] = revisar(MESA, marcador, 'pendientes').grupos;
    expect(grupo?.piezas).toStrictEqual([
      { id: 'I7', tipo: 'item', marcas: [] },
      { id: 'I8', tipo: 'item', marcas: ['sin_fuente'] },
      { id: 'I9', tipo: 'item', marcas: ['cita_no_encontrada'] },
      { id: 'I10', tipo: 'item', marcas: [] },
    ]);
  });

  it('@MATE-4.1 el orden es: objetivos con sus ejemplos, ejemplos aparte, ítems; las tareas, en un grupo sin objetivo al final', () => {
    const mesa = mesaDe({
      objetivos: [objetivo('O2', [ejemplo('E1')])],
      ejemplos_resueltos: [{ ...ejemplo('E2'), objetivo: 'O1' }],
      items: [item('I7'), item('I8', undefined, 'O2')],
      tareas: [tarea('T1')],
    });
    expect(agrupadas(mesa)).toStrictEqual([
      ['O2', ['O2', 'E1', 'I8']],
      ['O1', ['E2', 'I7']],
      [undefined, ['T1']],
    ]);
    expect(revisar(mesa, marcador, 'pendientes').grupos.at(-1)).not.toHaveProperty('objetivo');
  });
});

describe('revisar: filtros', () => {
  it.each([
    ['pendientes', ['I7', 'I8', 'I9', 'I10']],
    ['sin_fuente', ['I8']],
    ['cita_no_encontrada', ['I9']],
  ] as const)('@MATE-4.2 el filtro «%s» muestra solo %j', (filtro, esperadas) => {
    expect(agrupadas(MESA, filtro)).toStrictEqual([['O1', esperadas]]);
  });

  it('@MATE-4.2 un grupo sin piezas no sale con el filtro', () => {
    const mesa = mesaDe({ items: [item('I7', FUENTE_BUENA), item('I8', undefined, 'O2')] });
    expect(agrupadas(mesa, 'sin_fuente')).toStrictEqual([['O2', ['I8']]]);
  });
});

import { describe, expect, it } from 'vitest';
import type { EjemploResueltoContenido } from '../../src/aplicacion/contenido.ts';
import type { Mesa } from '../../src/aplicacion/mesa.ts';
import { revisar } from '../../src/aplicacion/revision.ts';
import {
  FUENTE_BUENA,
  FUENTE_MALA,
  ITEMS,
  MESA,
  agrupadas,
  categoria,
  ejemplo,
  ejemploDePasos,
  item,
  marcador,
  marcasDe,
  mesaDe,
  objetivo,
  reservado,
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
      { id: 'I7', tipo: 'item', marcas: [], reservado: false },
      { id: 'I8', tipo: 'item', marcas: ['sin_fuente'], reservado: false },
      { id: 'I9', tipo: 'item', marcas: ['cita_no_encontrada'], reservado: false },
      { id: 'I10', tipo: 'item', marcas: [], reservado: false },
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

describe('revisar: categorías', () => {
  const mesa = mesaDe({
    objetivos: [objetivo('O2', [], FUENTE_BUENA)],
    items: [item('I7', FUENTE_BUENA)],
    categorias: [categoria('C1', FUENTE_BUENA), categoria('C2')],
    tareas: [tarea('T1', FUENTE_BUENA)],
  });

  it('@MATE-4.1 una categoría pendiente va en el grupo sin objetivo, después de los ítems y antes que las tareas', () => {
    expect(agrupadas(mesa)).toStrictEqual([
      ['O2', ['O2']],
      ['O1', ['I7']],
      [undefined, ['C1', 'C2', 'T1']],
    ]);
    expect(revisar(mesa, marcador, 'pendientes').grupos.at(-1)).not.toHaveProperty('objetivo');
  });

  it('@MATE-4.1 la pieza de una categoría dice que es una categoría', () => {
    const sinObjetivo = revisar(mesa, marcador, 'pendientes').grupos.at(-1);
    expect(sinObjetivo?.piezas[0]).toStrictEqual({ id: 'C1', tipo: 'categoria', marcas: [], reservado: false });
  });

  it.each([
    ['con la cita encontrada', FUENTE_BUENA, []],
    ['sin fuente', undefined, ['sin_fuente']],
    ['con una cita que no se encuentra', FUENTE_MALA, ['cita_no_encontrada']],
  ] as const)('@MATE-3.1 @MATE-3.2 una categoría %s lleva las marcas %j', (_descripcion, fuente, marcas) => {
    expect(marcasDe(mesaDe({ categorias: [categoria('C1', fuente)] }), 'C1')).toStrictEqual(marcas);
  });

  it('@MATE-4.2 el filtro por marca deja solo las categorías que la llevan, en el grupo sin objetivo', () => {
    expect(agrupadas(mesa, 'sin_fuente')).toStrictEqual([[undefined, ['C2']]]);
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

describe('revisar: marca «un_solo_paso»', () => {
  /** Una mesa con ese ejemplo, dentro de su objetivo O1 pendiente o aparte, con O1 ya aprobado. */
  const mesaConEjemplo = (lugar: 'dentro' | 'aparte', pieza: EjemploResueltoContenido): Mesa =>
    lugar === 'dentro'
      ? mesaDe({ objetivos: [objetivo('O1', [pieza])] })
      : mesaDe({ ejemplos_resueltos: [{ ...pieza, objetivo: 'O1' }] }, { objetivos: [objetivo('O1')] });

  it.each([
    ['dentro', 1, ['un_solo_paso']],
    ['dentro', 2, []],
    ['aparte', 1, ['un_solo_paso']],
    ['aparte', 2, []],
  ] as const)('@MATE-3.5 un ejemplo «%s» de su objetivo con %i paso(s) lleva las marcas %j', (lugar, pasos, marcas) => {
    const mesa = mesaConEjemplo(lugar, ejemploDePasos('E9', pasos, FUENTE_BUENA));
    expect(marcasDe(mesa, 'E9')).toStrictEqual(marcas);
  });

  it.each([
    ['sin fuente', undefined, ['sin_fuente', 'un_solo_paso']],
    ['con una cita que no se encuentra', FUENTE_MALA, ['cita_no_encontrada', 'un_solo_paso']],
  ] as const)(
    '@MATE-3.5 un ejemplo de un paso %s lleva primero la marca de su cita',
    (_descripcion, fuente, marcas) => {
      expect(marcasDe(mesaConEjemplo('dentro', ejemploDePasos('E9', 1, fuente)), 'E9')).toStrictEqual(marcas);
      expect(marcasDe(mesaConEjemplo('aparte', ejemploDePasos('E9', 1, fuente)), 'E9')).toStrictEqual(marcas);
    },
  );

  it('@MATE-3.5 el filtro «un_solo_paso» deja solo los ejemplos de un paso, estén donde estén', () => {
    const mesa = mesaDe(
      {
        objetivos: [objetivo('O2', [ejemploDePasos('E1', 1, FUENTE_BUENA), ejemploDePasos('E2', 2, FUENTE_BUENA)])],
        ejemplos_resueltos: [
          { ...ejemploDePasos('E3', 1), objetivo: 'O1' },
          { ...ejemploDePasos('E4', 3, FUENTE_BUENA), objetivo: 'O1' },
        ],
        items: [item('I7')],
        tareas: [tarea('T1')],
      },
      { objetivos: [objetivo('O1')] },
    );
    expect(agrupadas(mesa, 'un_solo_paso')).toStrictEqual([
      ['O2', ['E1']],
      ['O1', ['E3']],
    ]);
  });

  it.each(['O1', 'I7', 'T1'])(
    '@MATE-3.5 una pieza que no es un ejemplo (%s) nunca lleva la marca «un_solo_paso»',
    (id) => {
      // Sin fuente, para que lleve alguna marca: la de su cita, y solo esa. El objetivo lleva dentro un ejemplo de un paso.
      const mesa = mesaDe({
        objetivos: [objetivo('O1', [ejemplo('E1', FUENTE_BUENA)])],
        items: [item('I7')],
        tareas: [tarea('T1')],
      });
      expect(marcasDe(mesa, id)).toStrictEqual(['sin_fuente']);
      expect(marcasDe(mesa, id, 'un_solo_paso')).toBeUndefined();
    },
  );
});

describe('revisar: «reservado» de la pieza', () => {
  /** El valor `reservado` de la pieza `id` en la revisión sin filtro, o `undefined` si la pieza no sale. */
  const reservadoDe = (mesa: Mesa, id: string): boolean | undefined =>
    revisar(mesa, marcador, 'pendientes')
      .grupos.flatMap((grupo) => grupo.piezas)
      .find((pieza) => pieza.id === id)?.reservado;

  it('@MATE-4.12 un ítem con «reservado» verdadero sale con reservado verdadero', () => {
    expect(reservadoDe(mesaDe({ items: [reservado(item('I7'))] }), 'I7')).toBe(true);
  });

  it.each([
    ['sin el campo', item('I7')],
    ['con «reservado» falso', { ...item('I7'), reservado: false }],
  ])('@MATE-4.12 un ítem %s sale con reservado falso', (_descripcion, pieza) => {
    expect(reservadoDe(mesaDe({ items: [pieza] }), 'I7')).toBe(false);
  });

  it.each(['O1', 'E1', 'C1', 'T1'])('@MATE-4.12 la pieza %s, que no es un ítem, sale con reservado falso', (id) => {
    const mesa = mesaDe({
      objetivos: [objetivo('O1', [ejemplo('E1')])],
      categorias: [categoria('C1')],
      tareas: [tarea('T1')],
    });
    expect(reservadoDe(mesa, id)).toBe(false);
  });

  it('@MATE-4.12 «reservado» no es una marca: no sale en las marcas, aunque falte la fuente', () => {
    const mesa = mesaDe({ items: [reservado(item('I7', FUENTE_BUENA)), reservado(item('I8'))] });
    expect(marcasDe(mesa, 'I7')).toStrictEqual([]);
    expect(marcasDe(mesa, 'I8')).toStrictEqual(['sin_fuente']);
  });

  it('@MATE-4.12 el filtro de marca no tiene en cuenta «reservado»: un reservado con marca sale, uno sin marca, no', () => {
    const mesa = mesaDe({ items: [reservado(item('I7', FUENTE_BUENA)), reservado(item('I8')), item('I9')] });
    expect(agrupadas(mesa, 'sin_fuente')).toStrictEqual([['O1', ['I8', 'I9']]]);
    expect(marcasDe(mesa, 'I7', 'sin_fuente')).toBeUndefined();
  });
});

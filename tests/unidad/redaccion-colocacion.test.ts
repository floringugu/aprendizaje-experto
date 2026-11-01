import { describe, expect, it } from 'vitest';
import { incorporarEntrega } from '../../src/aplicacion/redaccion.ts';
import { conId, ejemploAparte, entregaCon } from './redaccion-fabricas.ts';
import {
  categoria,
  ejemplo,
  ids,
  item,
  itemDeCategoria,
  mesaDe,
  objetivo,
  tarea,
  tareaAntesDe,
} from './revision-fabricas.ts';

// Lo que cita un id que cambia, y el sitio del borrador donde va cada pieza.

describe('incorporarEntrega: lo que cita un id nuevo cambia con él', () => {
  const conObjetivoO1 = mesaDe({}, { objetivos: [objetivo('O1')] });

  it('@MATE-2.2 el objetivo de un ítem sigue al objetivo de la entrega que ha cambiado de id', () => {
    const entrega = entregaCon({ objetivos: [objetivo('O1')], items: [item('I1', undefined, 'O1')] });
    const { borrador } = incorporarEntrega(conObjetivoO1, entrega);
    expect(borrador.objetivos).toStrictEqual([conId(objetivo('O1'), 'O2')]);
    expect(borrador.items).toStrictEqual([item('I1', undefined, 'O2')]);
  });

  it('@MATE-2.2 la categoría de un ítem sigue a la categoría de la entrega que ha cambiado de id', () => {
    const mesa = mesaDe({ categorias: [categoria('C1')] });
    const entrega = entregaCon({ categorias: [categoria('C1')], items: [itemDeCategoria('I1', 'C1')] });
    const { borrador } = incorporarEntrega(mesa, entrega);
    expect(borrador.categorias).toStrictEqual([categoria('C1'), conId(categoria('C1'), 'C2')]);
    expect(borrador.items).toStrictEqual([itemDeCategoria('I1', 'C2')]);
  });

  it('@MATE-2.2 el antes_de de una tarea sigue a la tarea de la entrega que ha cambiado de id', () => {
    const mesa = mesaDe({}, { tareas: [tarea('T1')] });
    const entrega = entregaCon({ tareas: [tarea('T1'), tareaAntesDe('T2', 'T1')] });
    // «T1» choca con la aprobada y toma «T3», porque «T2» es el id de otra tarea de la entrega.
    expect(incorporarEntrega(mesa, entrega).borrador.tareas).toStrictEqual([
      conId(tarea('T1'), 'T3'),
      tareaAntesDe('T2', 'T3'),
    ]);
  });

  it('@MATE-2.2 el objetivo de un ejemplo que va aparte sigue al objetivo que ha cambiado de id', () => {
    const entrega = entregaCon({ objetivos: [objetivo('O1')], ejemplos_resueltos: [ejemploAparte('E1', 'O1')] });
    const { borrador } = incorporarEntrega(conObjetivoO1, entrega);
    expect(borrador.objetivos).toStrictEqual([conId(objetivo('O1', [ejemplo('E1')]), 'O2')]);
    expect(borrador.ejemplos_resueltos).toBeUndefined();
  });

  // En los tres, la mesa ya tiene el id: la primera pieza de la entrega pasa a «2» y la segunda, a «3».
  it('@MATE-2.2 si dos objetivos válidos usan el mismo id, el objetivo de un ítem sigue solo al primero', () => {
    const entrega = entregaCon({ objetivos: [objetivo('O1'), objetivo('O1')], items: [item('I1', undefined, 'O1')] });
    const { borrador } = incorporarEntrega(conObjetivoO1, entrega);
    expect(borrador.objetivos).toStrictEqual([conId(objetivo('O1'), 'O2'), conId(objetivo('O1'), 'O3')]);
    expect(borrador.items[0]?.objetivo).toBe('O2');
  });

  it('@MATE-2.2 si dos categorías válidas usan el mismo id, la categoría de un ítem sigue solo a la primera', () => {
    const mesa = mesaDe({ categorias: [categoria('C1')] });
    const entrega = entregaCon({
      categorias: [categoria('C1'), categoria('C1')],
      items: [itemDeCategoria('I1', 'C1')],
    });
    const { borrador } = incorporarEntrega(mesa, entrega);
    expect(ids(borrador.categorias)).toStrictEqual(['C1', 'C2', 'C3']);
    expect(borrador.items[0]?.categoria).toBe('C2');
  });

  it('@MATE-2.2 si dos tareas válidas usan el mismo id, el antes_de de otra sigue solo a la primera', () => {
    const mesa = mesaDe({}, { tareas: [tarea('T1')] });
    const entrega = entregaCon({ tareas: [tarea('T1'), tarea('T1'), tareaAntesDe('T9', 'T1')] });
    const { borrador } = incorporarEntrega(mesa, entrega);
    expect(ids(borrador.tareas)).toStrictEqual(['T2', 'T3', 'T9']);
    expect(borrador.tareas[2]?.antes_de).toBe('T2');
  });

  it('@MATE-2.2 si la primera pieza con ese id no es válida, lo citado sigue a la primera válida', () => {
    const apartada = { ...objetivo('O1'), instruccion: '' };
    const entrega = entregaCon({ objetivos: [apartada, objetivo('O1')], items: [item('I1', undefined, 'O1')] });
    const { borrador } = incorporarEntrega(conObjetivoO1, entrega);
    expect(borrador.objetivos).toStrictEqual([conId(objetivo('O1'), 'O2')]);
    expect(borrador.items[0]?.objetivo).toBe('O2');
  });

  it('@MATE-2.2 una referencia que no está en el mapa se queda como estaba', () => {
    const mesa = mesaDe({}, { objetivos: [objetivo('O1')], categorias: [categoria('C1')], tareas: [tarea('T1')] });
    const entrega = entregaCon({
      objetivos: [objetivo('O5')],
      categorias: [categoria('C5')],
      items: [itemDeCategoria('I1', 'C1', 'O1'), itemDeCategoria('I2', 'C9', 'O9')],
      tareas: [tareaAntesDe('T5', 'T1')],
    });
    const { borrador } = incorporarEntrega(mesa, entrega);
    expect(borrador.items).toStrictEqual([itemDeCategoria('I1', 'C1', 'O1'), itemDeCategoria('I2', 'C9', 'O9')]);
    expect(borrador.tareas).toStrictEqual([tareaAntesDe('T5', 'T1')]);
  });

  it('@MATE-2.2 un ítem sin categoría sigue sin ella', () => {
    const { borrador } = incorporarEntrega(conObjetivoO1, entregaCon({ items: [item('I1')] }));
    expect(Object.keys(borrador.items[0] ?? {})).not.toContain('categoria');
  });
});

describe('incorporarEntrega: el antes_de de una tarea', () => {
  const mesa = mesaDe({ tareas: [tarea('T7')] }, { tareas: [tarea('T1')] });
  const tareasDe = (...tareas: unknown[]): readonly unknown[] =>
    incorporarEntrega(mesa, entregaCon({ tareas })).borrador.tareas;

  it('@MATE-4.11 se conserva si es el id de una tarea del aprobado', () => {
    expect(tareasDe(tareaAntesDe('T2', 'T1'))).toStrictEqual([tarea('T7'), tareaAntesDe('T2', 'T1')]);
  });

  it('@MATE-4.11 se conserva si es el id de una tarea válida de la entrega, aunque venga después', () => {
    expect(tareasDe(tareaAntesDe('T2', 'T3'), tarea('T3'))).toStrictEqual([
      tarea('T7'),
      tareaAntesDe('T2', 'T3'),
      tarea('T3'),
    ]);
  });

  it.each<[string, unknown]>([
    ['el de ninguna tarea', 'T9'],
    ['el de una tarea del borrador que ya había', 'T7'],
    ['el de la propia tarea', 'T2'],
    ['un texto vacío', ''],
    ['un número', 3],
    ['nulo', null],
  ])('@MATE-4.11 se quita si es %s', (_, antesDe) => {
    expect(tareasDe({ ...tarea('T2'), antes_de: antesDe })).toStrictEqual([tarea('T7'), tarea('T2')]);
  });

  it('@MATE-4.11 se quita si es el id de una tarea de la entrega que se aparta', () => {
    const apartada = { ...tarea('T3'), rubrica: [] };
    expect(tareasDe(tareaAntesDe('T2', 'T3'), apartada)).toStrictEqual([tarea('T7'), tarea('T2')]);
  });

  it('@MATE-4.11 la tarea sin antes_de sigue sin él', () => {
    expect(Object.keys(tareasDe(tarea('T2')).at(-1) ?? {})).not.toContain('antes_de');
  });
});

describe('incorporarEntrega: dónde va cada pieza', () => {
  it('@MATE-2.1 cada pieza va al final de su lista del borrador, en el orden de la entrega', () => {
    const mesa = mesaDe({
      objetivos: [objetivo('O7')],
      ejemplos_resueltos: [ejemploAparte('E7', 'O1')],
      items: [item('I7')],
      categorias: [categoria('C7')],
      tareas: [tarea('T7')],
    });
    const entrega = entregaCon({
      objetivos: [objetivo('O1'), objetivo('O2')],
      ejemplos_resueltos: [ejemploAparte('E1', 'O9'), ejemploAparte('E2', 'O9')],
      items: [item('I1'), item('I2')],
      categorias: [categoria('C1'), categoria('C2')],
      tareas: [tarea('T1'), tarea('T2')],
    });
    expect(incorporarEntrega(mesa, entrega).borrador).toStrictEqual({
      dominio: 'ficticio',
      objetivos: [objetivo('O7'), objetivo('O1'), objetivo('O2')],
      ejemplos_resueltos: [ejemploAparte('E7', 'O1'), ejemploAparte('E1', 'O9'), ejemploAparte('E2', 'O9')],
      items: [item('I7'), item('I1'), item('I2')],
      categorias: [categoria('C7'), categoria('C1'), categoria('C2')],
      tareas: [tarea('T7'), tarea('T1'), tarea('T2')],
    });
  });

  it('@MATE-2.1 un ejemplo que la IA da dentro de su objetivo se queda dentro', () => {
    const entrega = entregaCon({ objetivos: [objetivo('O1', [ejemplo('E1'), ejemplo('E2')])] });
    const { borrador } = incorporarEntrega(mesaDe({}), entrega);
    expect(borrador.objetivos).toStrictEqual([objetivo('O1', [ejemplo('E1'), ejemplo('E2')])]);
    expect(borrador.ejemplos_resueltos).toBeUndefined();
  });

  it('@MATE-2.1 un ejemplo aparte de un objetivo válido de la entrega va al final de los de su objetivo, sin objetivo', () => {
    const entrega = entregaCon({
      objetivos: [objetivo('O1', [ejemplo('E1')]), objetivo('O2')],
      ejemplos_resueltos: [ejemploAparte('E2', 'O1'), ejemploAparte('E3', 'O2'), ejemploAparte('E4', 'O1')],
    });
    const { borrador } = incorporarEntrega(mesaDe({}), entrega);
    expect(borrador.objetivos).toStrictEqual([
      objetivo('O1', [ejemplo('E1'), ejemplo('E2'), ejemplo('E4')]),
      objetivo('O2', [ejemplo('E3')]),
    ]);
    expect(borrador.ejemplos_resueltos).toBeUndefined();
  });

  it('@MATE-2.1 el ejemplo que va dentro de su objetivo conserva sus demás propiedades, solo pierde el objetivo', () => {
    const conDiagrama = { ...ejemploAparte('E2', 'O1'), diagrama: '<svg></svg>' };
    const dentro = { ...ejemplo('E2'), diagrama: '<svg></svg>' };
    const entrega = entregaCon({ objetivos: [objetivo('O1')], ejemplos_resueltos: [conDiagrama] });
    expect(incorporarEntrega(mesaDe({}), entrega).borrador.objetivos).toStrictEqual([
      { ...objetivo('O1'), ejemplos_resueltos: [dentro] },
    ]);
  });

  it.each([
    ['un objetivo aprobado', mesaDe({}, { objetivos: [objetivo('O1')] }), entregaCon({})],
    ['un objetivo del borrador que ya había', mesaDe({ objetivos: [objetivo('O1')] }), entregaCon({})],
    [
      'un objetivo de la entrega que se aparta',
      mesaDe({}),
      entregaCon({ objetivos: [{ ...objetivo('O1'), instruccion: '' }] }),
    ],
    ['un objetivo que no está en ningún sitio', mesaDe({}), entregaCon({})],
  ])('@MATE-2.1 un ejemplo aparte de %s va a la raíz del borrador, con su objetivo', (...fila) => {
    const [, mesa, base] = fila;
    const entrega = { ...base, ejemplos_resueltos: [ejemploAparte('E1', 'O1')] };
    const { borrador } = incorporarEntrega(mesa, entrega);
    expect(borrador.ejemplos_resueltos).toStrictEqual([ejemploAparte('E1', 'O1')]);
  });

  it('@MATE-2.1 sin ejemplos que añadir, la raíz del borrador sigue sin «ejemplos_resueltos» o con la lista que tenía', () => {
    const sin = incorporarEntrega(mesaDe({}), entregaCon({ items: [item('I1')] })).borrador;
    expect(Object.keys(sin)).not.toContain('ejemplos_resueltos');
    const vacia = incorporarEntrega(mesaDe({ ejemplos_resueltos: [] }), entregaCon({})).borrador;
    expect(vacia.ejemplos_resueltos).toStrictEqual([]);
  });
});

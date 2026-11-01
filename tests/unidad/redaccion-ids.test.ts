import { describe, expect, it } from 'vitest';
import { incorporarEntrega } from '../../src/aplicacion/redaccion.ts';
import { conId, ejemploAparte, entregaCon } from './redaccion-fabricas.ts';
import { categoria, ejemplo, ids, item, mesaDe, objetivo, tarea } from './revision-fabricas.ts';

// Los ids de las piezas nuevas: se conservan si están libres y, si no, toman el primero libre con su prefijo.

describe('incorporarEntrega: ids de las piezas', () => {
  /** Los ids de los ítems del borrador que devuelve `incorporarEntrega` al meter esos ítems en `mesa`. */
  const idsDeLosItems = (mesa: ReturnType<typeof mesaDe>, ...entregados: string[]): string[] => {
    const entrega = entregaCon({ items: entregados.map((id) => item(id)) });
    return ids(incorporarEntrega(mesa, entrega).borrador.items);
  };

  it('@MATE-2.2 una pieza conserva su id si está libre', () => {
    const mesa = mesaDe({ items: [item('I1')] }, { items: [item('I3')] });
    expect(idsDeLosItems(mesa, 'I2', 'I9')).toStrictEqual(['I1', 'I2', 'I9']);
  });

  it('@MATE-2.2 un ítem con el id de uno aprobado toma el siguiente, y el aprobado no cambia', () => {
    const mesa = mesaDe({}, { items: [item('I3')] });
    const resultado = incorporarEntrega(mesa, entregaCon({ items: [item('I3')] }));
    expect(resultado.borrador.items).toStrictEqual([conId(item('I3'), 'I4')]);
    expect(mesa.aprobado.items).toStrictEqual([item('I3')]);
  });

  it('@MATE-2.2 un ítem con el id de uno del borrador toma el siguiente, y el del borrador no cambia', () => {
    const mesa = mesaDe({ items: [item('I3')] });
    const resultado = incorporarEntrega(mesa, entregaCon({ items: [item('I3')] }));
    expect(resultado.borrador.items).toStrictEqual([item('I3'), conId(item('I3'), 'I4')]);
  });

  it('@MATE-2.2 salta los ids que también están en la mesa: «I3» pasa a «I6» si están «I4» e «I5»', () => {
    const mesa = mesaDe({ items: [item('I4')] }, { items: [item('I3'), item('I5')] });
    expect(idsDeLosItems(mesa, 'I3')).toStrictEqual(['I4', 'I6']);
  });

  it('@MATE-2.2 el número que sigue es el de la última cifra del id: «P1R7» pasa a «P1R8», «7» a «8»', () => {
    const mesa = mesaDe({}, { items: [item('P1R7'), item('7')] });
    expect(idsDeLosItems(mesa, 'P1R7', '7')).toStrictEqual(['P1R8', '8']);
  });

  it.each<[string, string[], string]>([
    ['«X» pasa a «X2»', ['X'], 'X2'],
    ['«X» pasa a «X3» si ya está «X2»', ['X', 'X2'], 'X3'],
    ['«X2» pasa a «X3»', ['X2'], 'X3'],
  ])('@MATE-2.2 un id que no acaba en número: %s', (_, enLaMesa, esperado) => {
    const mesa = mesaDe({}, { items: enLaMesa.map((id) => item(id)) });
    const pedido = enLaMesa[0] ?? '';
    expect(idsDeLosItems(mesa, pedido)).toStrictEqual([esperado]);
  });

  it('@MATE-2.2 un id con un número que JavaScript no sabe sumar no se queda dando vueltas: se le añade «2»', () => {
    const largo = 'I99999999999999999999';
    const mesa = mesaDe({}, { items: [item(largo)] });
    expect(idsDeLosItems(mesa, largo)).toStrictEqual([`${largo}2`]);
  });

  it.each([
    ['un objetivo aprobado', mesaDe({}, { objetivos: [objetivo('A1')] })],
    ['una categoría del borrador', mesaDe({ categorias: [categoria('A1')] })],
    ['una tarea aprobada', mesaDe({}, { tareas: [tarea('A1')] })],
    ['un ejemplo de dentro de un objetivo aprobado', mesaDe({}, { objetivos: [objetivo('O1', [ejemplo('A1')])] })],
    ['un ejemplo de dentro de un objetivo del borrador', mesaDe({ objetivos: [objetivo('O1', [ejemplo('A1')])] })],
    ['un ejemplo que va aparte, en el borrador', mesaDe({ ejemplos_resueltos: [ejemploAparte('A1', 'O1')] })],
  ])('@MATE-2.2 un id que ya tiene %s, de otro tipo, también cuenta como en uso', (_, mesa) => {
    expect(idsDeLosItems(mesa, 'A1')).toStrictEqual(['A2']);
  });

  it('@MATE-2.2 dos piezas de la entrega con el mismo id: la primera lo conserva y la segunda toma el siguiente', () => {
    expect(idsDeLosItems(mesaDe({}), 'I1', 'I1', 'I1')).toStrictEqual(['I1', 'I2', 'I3']);
  });

  it('@MATE-2.2 el id lo toma el que se recorre antes: cada tipo de pieza, en el orden de la entrega', () => {
    // Las claves van al revés a propósito: lo que cuenta es el orden de las listas, no el de las claves.
    const entrega = {
      tareas: [tarea('X')],
      categorias: [categoria('X')],
      items: [item('X', undefined, 'O9')],
      ejemplos_resueltos: [ejemploAparte('X', 'O9')],
      objetivos: [objetivo('X')],
    };
    const { borrador } = incorporarEntrega(mesaDe({}), entrega);
    expect(ids(borrador.objetivos)).toStrictEqual(['X']);
    expect(ids(borrador.ejemplos_resueltos ?? [])).toStrictEqual(['X2']);
    expect(ids(borrador.items)).toStrictEqual(['X3']);
    expect(ids(borrador.categorias)).toStrictEqual(['X4']);
    expect(ids(borrador.tareas)).toStrictEqual(['X5']);
  });

  it('@MATE-2.2 los ejemplos de dentro de un objetivo toman su id justo detrás de él y antes que el objetivo siguiente', () => {
    const entrega = entregaCon({ objetivos: [objetivo('A', [ejemplo('B')]), objetivo('B')] });
    const { objetivos } = incorporarEntrega(mesaDe({}), entrega).borrador;
    expect(objetivos.map((nuevo) => [nuevo.id, ids(nuevo.ejemplos_resueltos)])).toStrictEqual([
      ['A', ['B']],
      ['B2', []],
    ]);
  });

  it('@MATE-2.2 los ejemplos de dentro de un objetivo también cambian de id si chocan con la mesa', () => {
    const mesa = mesaDe({}, { items: [item('E1')] });
    const entrega = entregaCon({ objetivos: [objetivo('O1', [ejemplo('E1'), ejemplo('E1')])] });
    const { objetivos } = incorporarEntrega(mesa, entrega).borrador;
    expect(ids(objetivos[0]?.ejemplos_resueltos ?? [])).toStrictEqual(['E2', 'E3']);
  });

  it('@MATE-2.2 un id nuevo no es el de una pieza de la entrega que viene detrás, y esta lo conserva', () => {
    const mesa = mesaDe({}, { items: [item('I3')] });
    expect(idsDeLosItems(mesa, 'I3', 'I4')).toStrictEqual(['I5', 'I4']);
  });

  it('@MATE-2.2 un id nuevo no es el de una pieza apartada de la entrega, de ninguna lista', () => {
    const mesa = mesaDe({}, { items: [item('I3')] });
    const apartada = { ...item('I4'), feedback: '' };
    const entrega = entregaCon({
      items: [item('I3'), apartada],
      categorias: [{ ...categoria('I5'), descripcion: '' }],
    });
    expect(ids(incorporarEntrega(mesa, entrega).borrador.items)).toStrictEqual(['I6']);
  });

  it('@MATE-2.2 un id nuevo tampoco es el de un ejemplo de dentro de un objetivo apartado', () => {
    const mesa = mesaDe({}, { items: [item('I3')] });
    const objetivoApartado = { ...objetivo('O5', [ejemplo('I4')]), instruccion: '' };
    const entrega = entregaCon({ objetivos: [objetivoApartado], items: [item('I3')] });
    expect(ids(incorporarEntrega(mesa, entrega).borrador.items)).toStrictEqual(['I5']);
  });

  it('@MATE-2.2 un id que ha tomado una pieza anterior no lo toma otra que busca uno libre', () => {
    const mesa = mesaDe({}, { items: [item('I3')] });
    // «I3» pasa a «I4»; «I2» (libre) la conserva; el segundo «I3» pasa a «I5»: «I4» ya está tomado.
    expect(idsDeLosItems(mesa, 'I3', 'I2', 'I3')).toStrictEqual(['I4', 'I2', 'I5']);
  });

  it('@MATE-2.2 el borrador que devuelve no repite ningún id', () => {
    const mesa = mesaDe({ items: [item('I1')] }, { objetivos: [objetivo('O1', [ejemplo('E1')])], items: [item('I2')] });
    const entrega = entregaCon({
      objetivos: [objetivo('O1', [ejemplo('E1'), ejemplo('E1')]), objetivo('O1')],
      ejemplos_resueltos: [ejemploAparte('E1', 'O1')],
      items: [item('I1'), item('I2'), item('E1')],
      categorias: [categoria('I1')],
      tareas: [tarea('O1'), tarea('O1')],
    });
    const { borrador } = incorporarEntrega(mesa, entrega);
    const todos = [
      ...borrador.objetivos.flatMap((nuevo) => [nuevo, ...nuevo.ejemplos_resueltos]),
      ...(borrador.ejemplos_resueltos ?? []),
      ...borrador.items,
      ...borrador.categorias,
      ...borrador.tareas,
      ...mesa.aprobado.objetivos.flatMap((nuevo) => [nuevo, ...nuevo.ejemplos_resueltos]),
      ...mesa.aprobado.items,
    ].map(({ id }) => id);
    expect(new Set(todos).size).toBe(todos.length);
  });
});

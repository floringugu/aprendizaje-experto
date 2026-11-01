import { describe, expect, it } from 'vitest';
import { incorporarEntrega } from '../../src/aplicacion/redaccion.ts';
import { conId, ejemploAparte, entregaCon, faltas, itemReservado } from './redaccion-fabricas.ts';
import { categoria, ejemplo, ids, item, itemDeCategoria, mesaDe, objetivo, tarea } from './revision-fabricas.ts';

// Al pedir más reservados de un objetivo (`reservadosDe`): solo cuentan los ítems reservados de ese objetivo.

describe('incorporarEntrega con reservadosDe', () => {
  const mesa = mesaDe({}, { objetivos: [objetivo('O1')], items: [item('I1')] });
  const pedir = (...items: unknown[]) => incorporarEntrega(mesa, entregaCon({ items }), 'O1');

  it('@MATE-2.11 entra un ítem de ese objetivo con «reservado» verdadero, con la marca, y no se aparta nada', () => {
    const resultado = pedir(itemReservado('I2'));
    expect(resultado.borrador.items).toStrictEqual([itemReservado('I2')]);
    expect(resultado.apartadas).toStrictEqual([]);
  });

  it('@MATE-2.11 un ítem sin reservado, o con «reservado» falso, se aparta con la falta «reservado»', () => {
    const resultado = pedir(itemReservado('I2'), item('I3'), { ...item('I4'), reservado: false });
    expect(ids(resultado.borrador.items)).toStrictEqual(['I2']);
    expect(resultado.apartadas).toStrictEqual([{ falta: 'reservado' }, { falta: 'reservado' }]);
  });

  it('@MATE-2.11 un ítem de otro objetivo se aparta con la falta «objetivo»', () => {
    const resultado = pedir(itemReservado('I2'), itemReservado('I3', 'O2'));
    expect(ids(resultado.borrador.items)).toStrictEqual(['I2']);
    expect(resultado.apartadas).toStrictEqual([{ falta: 'objetivo' }]);
  });

  it('@MATE-2.11 un ítem que no cumple el formato se aparta con la falta del formato', () => {
    const resultado = pedir(itemReservado('I2'), { ...itemReservado('I3'), feedback: '' });
    expect(ids(resultado.borrador.items)).toStrictEqual(['I2']);
    expect(resultado.apartadas).toStrictEqual([{ falta: 'feedback' }]);
  });

  it('@MATE-2.11 un ítem que no es un objeto se aparta con la falta «id»', () => {
    expect(faltas(pedir('texto', null))).toStrictEqual(['id', 'id']);
  });

  it('@MATE-2.9 un ítem con un «reservado» que no es verdadero ni falso se aparta con la falta «reservado»', () => {
    const resultado = pedir({ ...item('I2'), reservado: 'sí' });
    expect(resultado.apartadas).toStrictEqual([{ falta: 'reservado' }]);
  });

  it.each<[string, Record<string, unknown>, string]>([
    ['el formato antes que el objetivo', { ...item('I2', undefined, 'O2'), reservado: true, feedback: '' }, 'feedback'],
    ['el objetivo antes que reservado', { ...item('I2', undefined, 'O2') }, 'objetivo'],
  ])('@MATE-2.11 de lo que falla, por este orden, se da primero %s', (_, recibido, falta) => {
    expect(pedir(recibido).apartadas).toStrictEqual([{ falta }]);
  });

  it('@MATE-2.6 el ítem entra con diagnostico a falso, y el diagnóstico de la IA no cuenta para apartarlo', () => {
    const resultado = pedir(
      { ...itemReservado('I2'), diagnostico: true },
      { ...itemReservado('I3'), diagnostico: 'sí' },
    );
    expect(resultado.borrador.items).toStrictEqual([itemReservado('I2'), itemReservado('I3')]);
    expect(resultado.apartadas).toStrictEqual([]);
  });

  it('@MATE-2.11 sigue el orden de los ítems, con las apartadas en el suyo', () => {
    const resultado = pedir(item('I2'), itemReservado('I3'), itemReservado('I4', 'O2'), itemReservado('I5'));
    expect(ids(resultado.borrador.items)).toStrictEqual(['I3', 'I5']);
    expect(faltas(resultado)).toStrictEqual(['reservado', 'objetivo']);
  });

  it('@MATE-2.11 las demás listas se ignoran, sin entradas en las apartadas, sean buenas o malas', () => {
    const entrega = entregaCon({
      objetivos: [objetivo('O5'), { ...objetivo('O6'), instruccion: '' }],
      ejemplos_resueltos: [ejemploAparte('E5', 'O1'), { ...ejemploAparte('E6', 'O1'), pasos: [] }],
      items: [itemReservado('I2')],
      categorias: [categoria('C5'), { ...categoria('C6'), descripcion: '' }],
      tareas: [tarea('T5'), { ...tarea('T6'), rubrica: [] }],
    });
    const resultado = incorporarEntrega(mesa, entrega, 'O1');
    expect(resultado.borrador).toStrictEqual({ ...mesa.borrador, items: [itemReservado('I2')] });
    expect(resultado.apartadas).toStrictEqual([]);
  });

  it('@MATE-2.11 el ítem conserva su objetivo y su categoría, aunque la entrega traiga listas de objetivos y categorías', () => {
    const recibido = { ...itemDeCategoria('I2', 'C1', 'O1'), reservado: true };
    const entrega = entregaCon({ objetivos: [objetivo('O1')], categorias: [categoria('C1')], items: [recibido] });
    const { borrador } = incorporarEntrega(mesa, entrega, 'O1');
    expect(borrador.items).toStrictEqual([recibido]);
  });

  it('@MATE-2.2 el ítem con un id que ya está en la mesa toma el siguiente libre', () => {
    const resultado = pedir(itemReservado('I1'), itemReservado('I1'));
    expect(ids(resultado.borrador.items)).toStrictEqual(['I2', 'I3']);
    expect(resultado.borrador.items[0]).toStrictEqual(conId(itemReservado('I1'), 'I2'));
  });

  it('@MATE-2.2 un id nuevo no es el de un ítem de la entrega que se aparta, y los de las demás listas no cuentan', () => {
    const entrega = entregaCon({
      items: [itemReservado('I1'), item('I2')],
      objetivos: [objetivo('I3')],
      tareas: [tarea('I4')],
    });
    // «I2» está en la entrega aunque se aparte, así que «I1» salta a «I3»; «I3» e «I4» van en listas que se ignoran.
    expect(ids(incorporarEntrega(mesa, entrega, 'O1').borrador.items)).toStrictEqual(['I3']);
  });

  it.each<[string, unknown]>([
    ['null', null],
    ['un texto', 'texto'],
    ['una entrega sin ítems', entregaCon({})],
    ['una entrega con los ítems que no son una lista', entregaCon({ items: 'no' })],
  ])('@MATE-2.11 %s no aporta nada', (_, entrega) => {
    expect(incorporarEntrega(mesa, entrega, 'O1')).toStrictEqual({ borrador: mesa.borrador, apartadas: [] });
  });

  it('@MATE-2.11 sin reservadosDe, la misma entrega se lee entera y los ítems no reservados entran', () => {
    const entrega = entregaCon({
      objetivos: [objetivo('O5', [ejemplo('E5')])],
      items: [item('I2'), itemReservado('I3', 'O2')],
    });
    const resultado = incorporarEntrega(mesa, entrega);
    expect(ids(resultado.borrador.objetivos)).toStrictEqual(['O5']);
    expect(ids(resultado.borrador.items)).toStrictEqual(['I2', 'I3']);
    expect(resultado.apartadas).toStrictEqual([]);
  });
});

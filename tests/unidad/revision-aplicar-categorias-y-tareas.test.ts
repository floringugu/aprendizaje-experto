import { describe, expect, it } from 'vitest';
import type { Mesa } from '../../src/aplicacion/mesa.ts';
import {
  FUENTE_BUENA,
  aplicado,
  categoria,
  ids,
  item,
  itemDeCategoria,
  mesaDe,
  objetivo,
  rechazado,
  tarea,
  tareaAntesDe,
} from './revision-fabricas.ts';

// Las categorías son una pieza más del borrador y las tareas pueden llevar `antes_de` (plan §0, «Categorías
// en el borrador» y «Reglas de `MATE` que la feature no cubre»). El resto de `aplicar` está en
// revision-aplicar.test.ts y revision-ids.test.ts.

const aprobar = (mesa: Mesa, pieza: string): Mesa => aplicado(mesa, { tipo: 'aprobar', pieza });
const descartar = (mesa: Mesa, pieza: string): Mesa => aplicado(mesa, { tipo: 'descartar', pieza });

describe('aplicar: categorías', () => {
  it('@MATE-4.4 una categoría entra al final de las categorías del aprobado, con su fuente', () => {
    const mesa = mesaDe(
      { categorias: [categoria('C2', FUENTE_BUENA), categoria('C3')] },
      { categorias: [categoria('C1')] },
    );
    const nueva = aprobar(mesa, 'C2');
    expect(nueva.aprobado.categorias).toStrictEqual([categoria('C1'), categoria('C2', FUENTE_BUENA)]);
    expect(nueva.borrador.categorias).toStrictEqual([categoria('C3')]);
  });

  it('@MATE-4.4 un ítem cuya categoría ya está aprobada se aprueba y conserva su categoría', () => {
    const mesa = mesaDe(
      { items: [itemDeCategoria('I7', 'C1')] },
      { objetivos: [objetivo('O1')], categorias: [categoria('C1')] },
    );
    expect(aprobar(mesa, 'I7').aprobado.items).toStrictEqual([itemDeCategoria('I7', 'C1')]);
  });

  it.each([
    ['pendiente en el borrador', { categorias: [categoria('C1')] }],
    ['que no está en ninguna parte', {}],
  ])(
    'un ítem de una categoría %s no se aprueba: categoria_pendiente (regla que la feature no cubre)',
    (_caso, borrador) => {
      const mesa = mesaDe({ ...borrador, items: [itemDeCategoria('I7', 'C1')] }, { objetivos: [objetivo('O1')] });
      const resultado = rechazado(mesa, { tipo: 'aprobar', pieza: 'I7' });
      expect(resultado).toMatchObject({ ok: false, causa: 'categoria_pendiente' });
      expect(resultado.motivo).toBe(
        'No se puede aprobar «I7»: su categoría C1 sigue pendiente. Aprueba antes la categoría.',
      );
    },
  );

  it('un ítem con su objetivo y su categoría pendientes se rechaza primero por el objetivo (regla que la feature no cubre)', () => {
    const mesa = mesaDe({
      objetivos: [objetivo('O4')],
      categorias: [categoria('C1')],
      items: [itemDeCategoria('I7', 'C1', 'O4')],
    });
    expect(rechazado(mesa, { tipo: 'aprobar', pieza: 'I7' })).toMatchObject({ ok: false, causa: 'objetivo_pendiente' });
  });

  it('@MATE-4.5 una categoría sale del borrador y el aprobado no cambia', () => {
    const mesa = mesaDe({ categorias: [categoria('C1'), categoria('C2')] }, { categorias: [categoria('C3')] });
    const nueva = descartar(mesa, 'C1');
    expect(nueva.borrador.categorias).toStrictEqual([categoria('C2')]);
    expect(nueva.aprobado).toBe(mesa.aprobado);
  });

  it('descartar una categoría deja pendientes sus ítems, en su sitio y sin la propiedad `categoria` (regla que la feature no cubre)', () => {
    const mesa = mesaDe({
      categorias: [categoria('C1'), categoria('C2')],
      items: [itemDeCategoria('I7', 'C1'), itemDeCategoria('I8', 'C2'), item('I9'), itemDeCategoria('I10', 'C1')],
    });
    const nueva = descartar(mesa, 'C1');
    // `toStrictEqual` distingue una propiedad ausente de una que vale `undefined`.
    expect(nueva.borrador.items).toStrictEqual([item('I7'), itemDeCategoria('I8', 'C2'), item('I9'), item('I10')]);
    expect(nueva.borrador.items[1]).toBe(mesa.borrador.items[1]);
  });

  it('@MATE-4.6 una categoría corregida ocupa el mismo sitio del borrador y sigue pendiente', () => {
    const mesa = mesaDe({ categorias: [categoria('C1'), categoria('C2')] });
    const corregida = { ...categoria('C1'), descripcion: 'Nueva descripción', grupo_parecidas: 'G1' };
    const nueva = aplicado(mesa, { tipo: 'corregir', pieza: 'C1', corregida });
    expect(nueva.borrador.categorias).toStrictEqual([corregida, categoria('C2')]);
  });

  it('@MATE-4.8 una categoría corregida sin descripción se rechaza con el campo «descripcion»', () => {
    const mesa = mesaDe({ categorias: [categoria('C1')] });
    const resultado = rechazado(mesa, { tipo: 'corregir', pieza: 'C1', corregida: { id: 'C1' } });
    expect(resultado).toMatchObject({ ok: false, campo: 'descripcion' });
    expect(resultado.motivo).toBe('No se guarda la corrección: falta o no es válido «descripcion» en la categoría C1.');
  });

  it('@MATE-4.8 una categoría corregida con una fuente mal formada se rechaza con el campo «lugar»', () => {
    const mesa = mesaDe({ categorias: [categoria('C1')] });
    const fuente = { documento: 'apuntes.pdf', fragmento: 'texto' };
    const resultado = rechazado(mesa, { tipo: 'corregir', pieza: 'C1', corregida: { ...categoria('C1'), fuente } });
    expect(resultado).toMatchObject({ ok: false, campo: 'lugar' });
  });

  it('@MATE-4.6 cambiar el id de una categoría se rechaza con el campo «id» (regla que la feature no cubre)', () => {
    const mesa = mesaDe({ categorias: [categoria('C1')], items: [item('I7')] });
    const resultado = rechazado(mesa, { tipo: 'corregir', pieza: 'C1', corregida: categoria('I7') });
    expect(resultado).toMatchObject({ ok: false, campo: 'id' });
  });
});

describe('aplicar: corregir un ítem con una categoría que no existe', () => {
  const mesa = mesaDe(
    { objetivos: [objetivo('O2')], categorias: [categoria('C1')], items: [item('I7')] },
    { objetivos: [objetivo('O1')], categorias: [categoria('C3')] },
  );
  const corregir = (corregida: unknown): Mesa => aplicado(mesa, { tipo: 'corregir', pieza: 'I7', corregida });

  it('@MATE-4.6 se rechaza con el campo «categoria» y la mesa no cambia (regla que la feature no cubre)', () => {
    const resultado = rechazado(mesa, { tipo: 'corregir', pieza: 'I7', corregida: itemDeCategoria('I7', 'C9') });
    expect(resultado).toMatchObject({ ok: false, campo: 'categoria' });
    expect(resultado.motivo).toBe(
      'No se guarda la corrección: la categoría «C9» no está ni en el borrador ni en el aprobado.',
    );
  });

  it.each([
    ['del borrador', 'C1'],
    ['del aprobado', 'C3'],
  ])('@MATE-4.6 un ítem puede pasar a una categoría %s (regla que la feature no cubre)', (_donde, destino) => {
    expect(corregir(itemDeCategoria('I7', destino)).borrador.items).toStrictEqual([itemDeCategoria('I7', destino)]);
  });

  it('@MATE-4.6 un ítem sin categoría se puede guardar (regla que la feature no cubre)', () => {
    expect(corregir(item('I7')).borrador.items).toStrictEqual([item('I7')]);
  });

  it('@MATE-4.6 con un objetivo y una categoría que no existen, el rechazo es el del objetivo', () => {
    const corregida = itemDeCategoria('I7', 'C9', 'O9');
    expect(rechazado(mesa, { tipo: 'corregir', pieza: 'I7', corregida })).toMatchObject({
      ok: false,
      campo: 'objetivo',
    });
  });

  it('@MATE-4.6 con un id cambiado y una categoría que no existe, el rechazo es el del id', () => {
    const corregida = itemDeCategoria('I99', 'C9');
    expect(rechazado(mesa, { tipo: 'corregir', pieza: 'I7', corregida })).toMatchObject({ ok: false, campo: 'id' });
  });

  it('@MATE-4.8 con un formato que falla y una categoría que no existe, el rechazo es el del formato', () => {
    const corregida = { ...itemDeCategoria('I7', 'C9'), feedback: '' };
    expect(rechazado(mesa, { tipo: 'corregir', pieza: 'I7', corregida })).toMatchObject({
      ok: false,
      campo: 'feedback',
    });
  });
});

describe('aplicar: tareas con «antes de»', () => {
  const mesa = mesaDe(
    { tareas: [tareaAntesDe('T3', 'T4'), tareaAntesDe('T4', 'T1'), tarea('T5')] },
    { tareas: [tarea('T1'), tarea('T2')] },
  );

  it('@MATE-4.11 una tarea con «antes de» entra delante de esa tarea aprobada, sin el campo', () => {
    const nueva = aprobar(mesaDe({ tareas: [tareaAntesDe('T3', 'T2', FUENTE_BUENA)] }, mesa.aprobado), 'T3');
    expect(nueva.aprobado.tareas).toStrictEqual([tarea('T1'), tarea('T3', FUENTE_BUENA), tarea('T2')]);
    expect(nueva.borrador.tareas).toStrictEqual([]);
  });

  it('@MATE-4.11 una tarea con «antes de» una pendiente sigue la cadena de las tareas que quedan en el borrador', () => {
    const conT3 = aprobar(mesa, 'T3');
    expect(ids(conT3.aprobado.tareas)).toStrictEqual(['T3', 'T1', 'T2']);
    expect(conT3.borrador.tareas).toStrictEqual([tareaAntesDe('T4', 'T1'), tarea('T5')]);
    expect(ids(aprobar(conT3, 'T4').aprobado.tareas)).toStrictEqual(['T3', 'T4', 'T1', 'T2']);
  });

  it('@MATE-4.5 una tarea descartada deja a las que iban delante de ella con su «antes de», o sin él', () => {
    const sinT4 = descartar(mesa, 'T4');
    expect(sinT4.borrador.tareas).toStrictEqual([tareaAntesDe('T3', 'T1'), tarea('T5')]);
    const sinT3 = descartar(sinT4, 'T3');
    expect(sinT3.borrador.tareas).toStrictEqual([tarea('T5')]);
    expect(sinT3.aprobado).toBe(mesa.aprobado);
  });

  it('@MATE-4.6 una tarea corregida conserva su «antes de» si es el de otra tarea, del borrador o del aprobado', () => {
    const corregida = { ...tarea('T3'), enunciado: 'Nuevo', antes_de: 'T2' };
    const nueva = aplicado(mesa, { tipo: 'corregir', pieza: 'T3', corregida });
    expect(nueva.borrador.tareas).toStrictEqual([corregida, tareaAntesDe('T4', 'T1'), tarea('T5')]);
    const aOtra = aplicado(mesa, { tipo: 'corregir', pieza: 'T3', corregida: tareaAntesDe('T3', 'T5') });
    expect(aOtra.borrador.tareas[0]).toStrictEqual(tareaAntesDe('T3', 'T5'));
  });

  it('@MATE-4.6 una tarea corregida sin «antes de» lo pierde (regla que la feature no cubre)', () => {
    const nueva = aplicado(mesa, { tipo: 'corregir', pieza: 'T3', corregida: tarea('T3') });
    expect(nueva.borrador.tareas[0]).toStrictEqual(tarea('T3'));
  });

  it.each<[string, unknown]>([
    ['su propio id', 'T3'],
    ['el de ninguna tarea', 'T9'],
    ['un texto vacío', ''],
    ['un número', 4],
    ['null', null],
  ])(
    '@MATE-4.6 un «antes de» que es %s se rechaza con el campo «antes_de» (regla que la feature no cubre)',
    (_descripcion, antesDe) => {
      const corregida = { ...tarea('T3'), antes_de: antesDe };
      const resultado = rechazado(mesa, { tipo: 'corregir', pieza: 'T3', corregida });
      expect(resultado).toMatchObject({ ok: false, campo: 'antes_de' });
    },
  );

  it('@MATE-4.6 el motivo del «antes de» inexistente dice cuál es', () => {
    const resultado = rechazado(mesa, { tipo: 'corregir', pieza: 'T3', corregida: tareaAntesDe('T3', 'T9') });
    expect(resultado.motivo).toBe(
      'No se guarda la corrección: «antes_de» tiene que ser el id de otra tarea, del borrador o del aprobado, y "T9" no lo es.',
    );
  });

  it('@MATE-4.6 con un id cambiado y un «antes de» inexistente, el rechazo es el del id', () => {
    const corregida = tareaAntesDe('T99', 'T9');
    expect(rechazado(mesa, { tipo: 'corregir', pieza: 'T3', corregida })).toMatchObject({ ok: false, campo: 'id' });
  });

  it('@MATE-4.8 con un formato que falla y un «antes de» inexistente, el rechazo es el del formato', () => {
    const corregida = { ...tareaAntesDe('T3', 'T9'), rubrica: [] };
    expect(rechazado(mesa, { tipo: 'corregir', pieza: 'T3', corregida })).toMatchObject({
      ok: false,
      campo: 'rubrica',
    });
  });
});

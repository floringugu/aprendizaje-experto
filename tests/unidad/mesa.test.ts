import { describe, expect, it } from 'vitest';
import { buscarPieza, idRepetido, pendientesDelBorrador } from '../../src/aplicacion/mesa.ts';
import {
  FUENTE_BUENA,
  FUENTE_MALA,
  ITEMS,
  categoria,
  ejemplo,
  item,
  mesaDe,
  objetivo,
  tarea,
} from './revision-fabricas.ts';

describe('pendientesDelBorrador', () => {
  it('@MATE-4.1 da objetivos con sus ejemplos, ejemplos aparte, ítems, categorías y tareas, en ese orden', () => {
    const borrador = mesaDe({
      objetivos: [objetivo('O2', [ejemplo('E1')])],
      ejemplos_resueltos: [{ ...ejemplo('E2'), objetivo: 'O1' }],
      items: [item('I7')],
      categorias: [categoria('C1')],
      tareas: [tarea('T1')],
    }).borrador;
    const orden = pendientesDelBorrador(borrador).map(({ tipo, pieza }) => `${tipo} ${pieza.id}`);
    expect(orden).toStrictEqual(['objetivo O2', 'ejemplo E1', 'ejemplo E2', 'item I7', 'categoria C1', 'tarea T1']);
  });

  it('@MATE-4.1 las categorías van en el orden del borrador, entre los ítems y las tareas', () => {
    const borrador = mesaDe({
      items: [item('I7'), item('I8')],
      categorias: [categoria('C2'), categoria('C1')],
      tareas: [tarea('T1')],
    }).borrador;
    expect(pendientesDelBorrador(borrador).map(({ pieza }) => pieza.id)).toStrictEqual(['I7', 'I8', 'C2', 'C1', 'T1']);
  });
});

describe('buscarPieza: en el borrador', () => {
  // Una mesa con una pieza de cada tipo en el borrador, cada una con su fuente, más un ejemplo aparte.
  const mesa = mesaDe(
    {
      objetivos: [objetivo('O2', [ejemplo('E1', FUENTE_MALA)], FUENTE_BUENA)],
      ejemplos_resueltos: [{ ...ejemplo('E2', FUENTE_BUENA), objetivo: 'O1' }],
      items: [item('I7', FUENTE_BUENA)],
      categorias: [categoria('C1', FUENTE_BUENA)],
      tareas: [tarea('T1', FUENTE_MALA)],
    },
    { objetivos: [objetivo('O1')] },
  );

  it.each([
    { nombre: 'un objetivo', id: 'O2', tipo: 'objetivo', fuente: FUENTE_BUENA },
    { nombre: 'un ejemplo de dentro de su objetivo', id: 'E1', tipo: 'ejemplo', fuente: FUENTE_MALA },
    { nombre: 'un ejemplo que va aparte', id: 'E2', tipo: 'ejemplo', fuente: FUENTE_BUENA },
    { nombre: 'un ítem', id: 'I7', tipo: 'item', fuente: FUENTE_BUENA },
    { nombre: 'una categoría', id: 'C1', tipo: 'categoria', fuente: FUENTE_BUENA },
    { nombre: 'una tarea', id: 'T1', tipo: 'tarea', fuente: FUENTE_MALA },
  ] as const)('@MATE-4.3 encuentra $nombre, con su tipo y su fuente, y no aprobada', ({ id, tipo, fuente }) => {
    expect(buscarPieza(mesa, id)).toStrictEqual({ tipo, fuente, aprobada: false });
  });
});

describe('buscarPieza: en el aprobado', () => {
  const mesa = mesaDe(
    {},
    {
      objetivos: [objetivo('O1', [ejemplo('E1', FUENTE_MALA)], FUENTE_BUENA)],
      items: [item('I1', FUENTE_BUENA)],
      categorias: [categoria('C1', FUENTE_MALA)],
      tareas: [tarea('T1', FUENTE_MALA)],
    },
  );

  it.each([
    { nombre: 'un objetivo', id: 'O1', tipo: 'objetivo', fuente: FUENTE_BUENA },
    { nombre: 'un ejemplo de dentro de su objetivo', id: 'E1', tipo: 'ejemplo', fuente: FUENTE_MALA },
    { nombre: 'un ítem', id: 'I1', tipo: 'item', fuente: FUENTE_BUENA },
    { nombre: 'una categoría', id: 'C1', tipo: 'categoria', fuente: FUENTE_MALA },
    { nombre: 'una tarea', id: 'T1', tipo: 'tarea', fuente: FUENTE_MALA },
  ] as const)('@MATE-7.2 encuentra $nombre, con su tipo y su fuente, y aprobada', ({ id, tipo, fuente }) => {
    expect(buscarPieza(mesa, id)).toStrictEqual({ tipo, fuente, aprobada: true });
  });
});

describe('buscarPieza: sin fuente, sin pieza y con ids repetidos', () => {
  it.each([
    ['en el borrador', mesaDe({ items: [item('I8')] })],
    ['en el aprobado', mesaDe({}, { items: [item('I8')] })],
  ])('@MATE-7.3 una pieza escrita a mano %s no tiene fuente', (_, mesa) => {
    expect(buscarPieza(mesa, 'I8')?.fuente).toBeUndefined();
  });

  it('@MATE-4.3 un id que no está en la mesa da undefined', () => {
    const mesa = mesaDe({ items: [item('I7')] }, { objetivos: [objetivo('O1', [ejemplo('E1')])] });
    expect(buscarPieza(mesa, 'I99')).toBeUndefined();
  });

  it('@MATE-4.3 una mesa vacía no tiene ninguna pieza (regla que la feature no cubre)', () => {
    expect(buscarPieza(mesaDe({}), 'I7')).toBeUndefined();
  });

  it('@MATE-7.1 busca antes en el borrador que en el aprobado (regla que la feature no cubre)', () => {
    // `idRepetido` impide una mesa así al leerla, pero `buscarPieza` debe dar el borrador igualmente.
    const mesa = mesaDe({ items: [item('I7', FUENTE_MALA)] }, { items: [item('I7', FUENTE_BUENA)] });
    expect(buscarPieza(mesa, 'I7')).toStrictEqual({ tipo: 'item', fuente: FUENTE_MALA, aprobada: false });
  });

  it('@MATE-7.1 con ids repetidos en el aprobado da el primero (regla que la feature no cubre)', () => {
    const mesa = mesaDe({}, { items: [item('I7', FUENTE_BUENA), item('I7', FUENTE_MALA)] });
    expect(buscarPieza(mesa, 'I7')?.fuente).toBe(FUENTE_BUENA);
  });

  it('@MATE-7.1 con ids repetidos de distinto tipo en el aprobado, sigue el orden de pendientesDelBorrador (regla que la feature no cubre)', () => {
    // Orden: objetivos con sus ejemplos, ítems, categorías y tareas. El ejemplo de dentro de un objetivo va antes que el ítem.
    const mesa = mesaDe(
      {},
      {
        objetivos: [objetivo('O1', [ejemplo('X1', FUENTE_MALA)])],
        items: [item('X1', FUENTE_BUENA)],
        categorias: [categoria('X1')],
        tareas: [tarea('X1')],
      },
    );
    expect(buscarPieza(mesa, 'X1')).toStrictEqual({ tipo: 'ejemplo', fuente: FUENTE_MALA, aprobada: true });
  });

  it('@MATE-7.1 una categoría repetida con un ítem va después de él, y antes que una tarea (regla que la feature no cubre)', () => {
    const conItem = mesaDe({}, { items: [item('X1', FUENTE_BUENA)], categorias: [categoria('X1', FUENTE_MALA)] });
    expect(buscarPieza(conItem, 'X1')).toStrictEqual({ tipo: 'item', fuente: FUENTE_BUENA, aprobada: true });
    const conTarea = mesaDe({}, { categorias: [categoria('X1', FUENTE_MALA)], tareas: [tarea('X1', FUENTE_BUENA)] });
    expect(buscarPieza(conTarea, 'X1')).toStrictEqual({ tipo: 'categoria', fuente: FUENTE_MALA, aprobada: true });
  });
});

describe('idRepetido', () => {
  it('@MATE-4.6 sin ids repetidos da undefined (regla que la feature no cubre)', () => {
    const mesa = mesaDe({ items: ITEMS, tareas: [tarea('T1')] }, { objetivos: [objetivo('O1', [ejemplo('E1')])] });
    expect(idRepetido(mesa)).toBeUndefined();
  });

  it('@MATE-4.6 un ejemplo de dentro de un objetivo y otro que va aparte con el mismo id se repiten (regla que la feature no cubre)', () => {
    const mesa = mesaDe({
      objetivos: [objetivo('O1', [ejemplo('E1')])],
      ejemplos_resueltos: [{ ...ejemplo('E1'), objetivo: 'O9' }],
    });
    expect(idRepetido(mesa)).toBe('E1');
  });

  it('@MATE-4.6 un ítem y una tarea con el mismo id se repiten, aunque sean de tipos distintos (regla que la feature no cubre)', () => {
    expect(idRepetido(mesaDe({ items: [item('X1')], tareas: [tarea('X1')] }))).toBe('X1');
  });

  it('@MATE-4.6 una categoría y un ítem con el mismo id se repiten, aunque sean de tipos distintos (regla que la feature no cubre)', () => {
    expect(idRepetido(mesaDe({ items: [item('X1')], categorias: [categoria('X1')] }))).toBe('X1');
  });

  it('@MATE-4.6 dos categorías del borrador con el mismo id se repiten (regla que la feature no cubre)', () => {
    expect(idRepetido(mesaDe({ categorias: [categoria('C1'), categoria('C1')] }))).toBe('C1');
  });

  it.each([
    ['una tarea', { tareas: [tarea('X1')] }],
    ['un ejemplo de dentro de un objetivo', { objetivos: [objetivo('O1', [ejemplo('X1')])] }],
    ['una categoría', { categorias: [categoria('X1')] }],
  ])(
    '@MATE-4.6 un id del borrador que ya está en el aprobado como %s se repite (regla que la feature no cubre)',
    (_, aprobado) => {
      expect(idRepetido(mesaDe({ items: [item('X1')] }, aprobado))).toBe('X1');
    },
  );

  it('@MATE-4.6 el aprobado que repite ids entre sus propias piezas no cuenta (regla que la feature no cubre)', () => {
    const aprobado = { objetivos: [objetivo('O1', [ejemplo('E1')]), objetivo('O2', [ejemplo('E1')])] };
    expect(idRepetido(mesaDe({ items: [item('I7')] }, aprobado))).toBeUndefined();
  });

  it('@MATE-4.6 una categoría del borrador con el mismo id que una del aprobado se repite (regla que la feature no cubre)', () => {
    const mesa = mesaDe({ categorias: [categoria('C1')] }, { categorias: [categoria('C1')] });
    expect(idRepetido(mesa)).toBe('C1');
  });

  it('@MATE-4.6 con dos ids repetidos da el primero en el orden de revisar, no el que salió antes (regla que la feature no cubre)', () => {
    // Al recorrer I1, I2, I2, I1 el primero que ya había salido es I2, aunque I1 salió antes.
    const mesa = mesaDe({ items: [item('I1'), item('I2'), item('I2'), item('I1')] });
    expect(idRepetido(mesa)).toBe('I2');
  });
});

import { describe, expect, it } from 'vitest';
import { buscarPieza } from '../../src/aplicacion/mesa.ts';
import { FUENTE_BUENA, FUENTE_MALA, ejemplo, item, mesaDe, objetivo, tarea } from './revision-fabricas.ts';

describe('buscarPieza: en el borrador', () => {
  // Una mesa con una pieza de cada tipo en el borrador, cada una con su fuente, más un ejemplo aparte.
  const mesa = mesaDe(
    {
      objetivos: [objetivo('O2', [ejemplo('E1', FUENTE_MALA)], FUENTE_BUENA)],
      ejemplos_resueltos: [{ ...ejemplo('E2', FUENTE_BUENA), objetivo: 'O1' }],
      items: [item('I7', FUENTE_BUENA)],
      tareas: [tarea('T1', FUENTE_MALA)],
    },
    { objetivos: [objetivo('O1')] },
  );

  it.each([
    { nombre: 'un objetivo', id: 'O2', tipo: 'objetivo', fuente: FUENTE_BUENA },
    { nombre: 'un ejemplo de dentro de su objetivo', id: 'E1', tipo: 'ejemplo', fuente: FUENTE_MALA },
    { nombre: 'un ejemplo que va aparte', id: 'E2', tipo: 'ejemplo', fuente: FUENTE_BUENA },
    { nombre: 'un ítem', id: 'I7', tipo: 'item', fuente: FUENTE_BUENA },
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
      tareas: [tarea('T1', FUENTE_MALA)],
    },
  );

  it.each([
    { nombre: 'un objetivo', id: 'O1', tipo: 'objetivo', fuente: FUENTE_BUENA },
    { nombre: 'un ejemplo de dentro de su objetivo', id: 'E1', tipo: 'ejemplo', fuente: FUENTE_MALA },
    { nombre: 'un ítem', id: 'I1', tipo: 'item', fuente: FUENTE_BUENA },
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
    // Orden: objetivos con sus ejemplos, ítems y tareas. El ejemplo de dentro de un objetivo va antes que el ítem.
    const mesa = mesaDe(
      {},
      {
        objetivos: [objetivo('O1', [ejemplo('X1', FUENTE_MALA)])],
        items: [item('X1', FUENTE_BUENA)],
        tareas: [tarea('X1')],
      },
    );
    expect(buscarPieza(mesa, 'X1')).toStrictEqual({ tipo: 'ejemplo', fuente: FUENTE_MALA, aprobada: true });
  });
});

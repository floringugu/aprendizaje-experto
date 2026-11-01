import { describe, expect, it } from 'vitest';
import type { Mesa } from '../../src/aplicacion/mesa.ts';
import type { Accion } from '../../src/aplicacion/revision.ts';
import {
  FUENTE_BUENA,
  ITEMS,
  MESA,
  agrupadas,
  aplicado,
  ejemplo,
  ids,
  item,
  mesaDe,
  objetivo,
  rechazado,
  tarea,
} from './revision-fabricas.ts';

const aprobar = (mesa: Mesa, pieza: string): Mesa => aplicado(mesa, { tipo: 'aprobar', pieza });

describe('aplicar: aprobar', () => {
  it('@MATE-4.4 la pieza pasa del borrador al aprobado, con su fuente', () => {
    const nueva = aprobar(MESA, 'I7');
    expect(ids(nueva.borrador.items)).toStrictEqual(['I8', 'I9', 'I10']);
    expect(nueva.aprobado.items).toStrictEqual([item('I7', FUENTE_BUENA)]);
  });

  it.each([['I8'], ['I9']])('@MATE-5.3 una pieza marcada (%s) se aprueba sola, con o sin fuente', (id) => {
    const nueva = aprobar(MESA, id);
    expect(nueva.aprobado.items).toStrictEqual(ITEMS.filter((pieza) => pieza.id === id));
    expect(ids(nueva.borrador.items)).not.toContain(id);
  });

  it('@MATE-4.4 lo que entra en el aprobado va al final y lo demás se queda donde estaba', () => {
    const nueva = aprobar(aprobar(MESA, 'I10'), 'I7');
    expect(ids(nueva.aprobado.items)).toStrictEqual(['I10', 'I7']);
    expect(nueva.aprobado.objetivos).toBe(MESA.aprobado.objetivos);
  });

  it('@MATE-4.4 una tarea entra en las tareas del aprobado', () => {
    const nueva = aprobar(mesaDe({ tareas: [tarea('T1'), tarea('T2')] }), 'T2');
    expect(ids(nueva.aprobado.tareas)).toStrictEqual(['T2']);
    expect(ids(nueva.borrador.tareas)).toStrictEqual(['T1']);
  });

  it('@MATE-4.4 un objetivo entra sin sus ejemplos, que siguen pendientes y van aparte con su objetivo', () => {
    const previo = { ...ejemplo('E0'), objetivo: 'O1' };
    const mesa = mesaDe({
      objetivos: [objetivo('O2', [ejemplo('E1', FUENTE_BUENA)], FUENTE_BUENA)],
      ejemplos_resueltos: [previo],
    });
    const nueva = aprobar(mesa, 'O2');
    expect(nueva.aprobado.objetivos).toStrictEqual([objetivo('O2', [], FUENTE_BUENA)]);
    expect(nueva.borrador.objetivos).toStrictEqual([]);
    expect(nueva.borrador.ejemplos_resueltos).toStrictEqual([
      previo,
      { ...ejemplo('E1', FUENTE_BUENA), objetivo: 'O2' },
    ]);
  });

  it('@MATE-4.4 un ejemplo que iba aparte entra dentro de su objetivo, sin `objetivo` y con su fuente', () => {
    const aparte = { ...ejemplo('E2', FUENTE_BUENA), objetivo: 'O1' };
    const mesa = mesaDe({ ejemplos_resueltos: [aparte] }, { objetivos: [objetivo('O1', [ejemplo('E1')])] });
    const nueva = aprobar(mesa, 'E2');
    expect(nueva.aprobado.objetivos).toStrictEqual([objetivo('O1', [ejemplo('E1'), ejemplo('E2', FUENTE_BUENA)])]);
    expect(nueva.borrador.ejemplos_resueltos).toStrictEqual([]);
  });

  it('@MATE-4.4 un ejemplo que iba aparte entra dentro de su objetivo con su diagrama y su fuente', () => {
    const conDiagrama = { ...ejemplo('E2', FUENTE_BUENA), diagrama: '<svg></svg>' };
    const mesa = mesaDe({ ejemplos_resueltos: [{ ...conDiagrama, objetivo: 'O1' }] }, { objetivos: [objetivo('O1')] });
    expect(aprobar(mesa, 'E2').aprobado.objetivos).toStrictEqual([objetivo('O1', [conDiagrama])]);
  });

  it('@MATE-4.4 un ejemplo que iba aparte y no tiene fuente entra sin la propiedad `fuente`, ni siquiera con undefined', () => {
    const aparte = { ...ejemplo('E2'), objetivo: 'O1' };
    const mesa = mesaDe({ ejemplos_resueltos: [aparte] }, { objetivos: [objetivo('O1')] });
    const nueva = aprobar(mesa, 'E2');
    // `toStrictEqual` distingue una propiedad ausente de una que vale `undefined`.
    expect(nueva.aprobado.objetivos).toStrictEqual([objetivo('O1', [ejemplo('E2')])]);
  });

  it('@MATE-4.4 no mete `ejemplos_resueltos` en el borrador si el objetivo no los tiene', () => {
    expect(aprobar(mesaDe({ objetivos: [objetivo('O2')] }), 'O2').borrador).not.toHaveProperty('ejemplos_resueltos');
  });

  it('@MATE-4.4 un objetivo con ejemplos, sin `ejemplos_resueltos` en la raíz, deja aparte solo sus ejemplos', () => {
    const nueva = aprobar(mesaDe({ objetivos: [objetivo('O2', [ejemplo('E1'), ejemplo('E2')])] }), 'O2');
    expect(nueva.borrador.objetivos).toStrictEqual([]);
    expect(nueva.borrador.ejemplos_resueltos).toStrictEqual([
      { ...ejemplo('E1'), objetivo: 'O2' },
      { ...ejemplo('E2'), objetivo: 'O2' },
    ]);
  });

  it('@MATE-4.4 un ejemplo que va aparte entra solo en su objetivo, aunque haya dos o más aprobados; los demás no cambian', () => {
    const mesa = mesaDe(
      { ejemplos_resueltos: [{ ...ejemplo('E9', FUENTE_BUENA), objetivo: 'O2' }] },
      { objetivos: [objetivo('O1'), objetivo('O2')] },
    );
    const nueva = aprobar(mesa, 'E9');
    expect(nueva.aprobado.objetivos).toStrictEqual([objetivo('O1'), objetivo('O2', [ejemplo('E9', FUENTE_BUENA)])]);
    expect(nueva.aprobado.objetivos[0]).toBe(mesa.aprobado.objetivos[0]);
    expect(nueva.borrador.ejemplos_resueltos).toStrictEqual([]);
  });

  it.each([['I7'], ['E2']])(
    '%s no se aprueba si su objetivo O4 sigue pendiente, aunque ya haya objetivos aprobados: objetivo_pendiente (regla que la feature no cubre)',
    (id) => {
      const mesa = mesaDe(
        {
          objetivos: [objetivo('O4')],
          ejemplos_resueltos: [{ ...ejemplo('E2'), objetivo: 'O4' }],
          items: [item('I7', FUENTE_BUENA, 'O4')],
        },
        { objetivos: [objetivo('O1')] },
      );
      expect(rechazado(mesa, { tipo: 'aprobar', pieza: id })).toMatchObject({ ok: false, causa: 'objetivo_pendiente' });
    },
  );

  it.each([['I7'], ['E1'], ['E2']])(
    '%s no se aprueba si su objetivo está pendiente: objetivo_pendiente (regla que la feature no cubre)',
    (id) => {
      const mesa = mesaDe({
        objetivos: [objetivo('O2', [ejemplo('E1')])],
        ejemplos_resueltos: [{ ...ejemplo('E2'), objetivo: 'O3' }],
        items: [item('I7', FUENTE_BUENA, 'O2')],
      });
      expect(rechazado(mesa, { tipo: 'aprobar', pieza: id })).toMatchObject({ ok: false, causa: 'objetivo_pendiente' });
    },
  );
});

describe('aplicar: descartar', () => {
  it('@MATE-4.5 la pieza sale del borrador y el aprobado no cambia', () => {
    const nueva = aplicado(MESA, { tipo: 'descartar', pieza: 'I8' });
    expect(ids(nueva.borrador.items)).toStrictEqual(['I7', 'I9', 'I10']);
    expect(nueva.aprobado).toBe(MESA.aprobado);
  });

  it('@MATE-4.5 un objetivo se va con sus ejemplos y sus ítems (regla que la feature no cubre)', () => {
    const mesa = mesaDe({
      objetivos: [objetivo('O1', [ejemplo('E1')]), objetivo('O2')],
      ejemplos_resueltos: [
        { ...ejemplo('E2'), objetivo: 'O1' },
        { ...ejemplo('E3'), objetivo: 'O3' },
      ],
      items: [item('I7'), item('I8', undefined, 'O3')],
    });
    const nueva = aplicado(mesa, { tipo: 'descartar', pieza: 'O1' });
    expect(ids(nueva.borrador.objetivos)).toStrictEqual(['O2']);
    expect(ids(nueva.borrador.ejemplos_resueltos ?? [])).toStrictEqual(['E3']);
    expect(ids(nueva.borrador.items)).toStrictEqual(['I8']);
  });

  it('@MATE-4.5 un ejemplo, dentro de su objetivo o aparte, sale sin tocar lo demás', () => {
    const mesa = mesaDe({
      objetivos: [objetivo('O1', [ejemplo('E1'), ejemplo('E2')])],
      ejemplos_resueltos: [{ ...ejemplo('E3'), objetivo: 'O9' }],
    });
    const sinDentro = aplicado(mesa, { tipo: 'descartar', pieza: 'E1' });
    expect(ids(sinDentro.borrador.objetivos[0]?.ejemplos_resueltos ?? [])).toStrictEqual(['E2']);
    const sinAparte = aplicado(mesa, { tipo: 'descartar', pieza: 'E3' });
    expect(sinAparte.borrador.ejemplos_resueltos).toStrictEqual([]);
    expect(sinAparte.borrador.objetivos).toBe(mesa.borrador.objetivos);
  });

  it('@MATE-4.5 un ejemplo no se lleva los ejemplos del otro objetivo pendiente, y ese objetivo no cambia', () => {
    const mesa = mesaDe({
      objetivos: [objetivo('O1', [ejemplo('E1'), ejemplo('E2')]), objetivo('O2', [ejemplo('E3')])],
    });
    const nueva = aplicado(mesa, { tipo: 'descartar', pieza: 'E1' });
    expect(ids(nueva.borrador.objetivos[0]?.ejemplos_resueltos ?? [])).toStrictEqual(['E2']);
    expect(ids(nueva.borrador.objetivos[1]?.ejemplos_resueltos ?? [])).toStrictEqual(['E3']);
    expect(nueva.borrador.objetivos[1]).toBe(mesa.borrador.objetivos[1]);
  });

  it('descartar un objetivo sin `ejemplos_resueltos` en la raíz no falla, y el borrador tampoco los tiene después (regla que la feature no cubre)', () => {
    const mesa = mesaDe({ objetivos: [objetivo('O1'), objetivo('O2')], items: [item('I7', undefined, 'O1')] });
    const nueva = aplicado(mesa, { tipo: 'descartar', pieza: 'O1' });
    expect(ids(nueva.borrador.objetivos)).toStrictEqual(['O2']);
    expect(nueva.borrador.items).toStrictEqual([]);
    expect(nueva.borrador).not.toHaveProperty('ejemplos_resueltos');
  });
});

describe('aplicar: corregir', () => {
  const corregido = { ...item('I7', FUENTE_BUENA), enunciado: 'Enunciado corregido de I7' };

  it('@MATE-4.6 la pieza corregida ocupa el mismo sitio del borrador y el aprobado no cambia', () => {
    const nueva = aplicado(MESA, { tipo: 'corregir', pieza: 'I8', corregida: { ...item('I8'), enunciado: 'Nuevo' } });
    expect(nueva.borrador.items.map((pieza) => pieza.enunciado)).toStrictEqual([
      'Enunciado de I7',
      'Nuevo',
      'Enunciado de I9',
      'Enunciado de I10',
    ]);
    expect(nueva.aprobado).toBe(MESA.aprobado);
  });

  it('@MATE-4.7 las marcas se calculan de nuevo con la pieza corregida', () => {
    const corregida = { ...item('I9'), fuente: FUENTE_BUENA };
    const nueva = aplicado(MESA, { tipo: 'corregir', pieza: 'I9', corregida });
    expect(agrupadas(nueva, 'cita_no_encontrada')).toStrictEqual([]);
    expect(ids(nueva.borrador.items)).toContain('I9');
  });

  it('@MATE-4.8 una corrección sin el formato del contenido se rechaza con el campo que falta', () => {
    const sinFeedback = Object.fromEntries(Object.entries(corregido).filter(([clave]) => clave !== 'feedback'));
    const resultado = rechazado(MESA, { tipo: 'corregir', pieza: 'I7', corregida: sinFeedback });
    expect(resultado).toMatchObject({ ok: false, campo: 'feedback' });
    // «en el ítem I7», no «de el ítem I7»: la pieza ya lleva su artículo.
    expect(resultado.motivo).toBe('No se guarda la corrección: falta o no es válido «feedback» en el ítem I7.');
  });

  it.each<[string, unknown]>([
    ['un texto', 'texto'],
    ['null', null],
    ['un objeto sin id', Object.fromEntries(Object.entries(corregido).filter(([clave]) => clave !== 'id'))],
  ])(
    '@MATE-4.8 una corrección que es %s falla en «id» y nombra la pieza por su id, I7 (regla que la feature no cubre, aprobada por el dueño el 30-10-2026)',
    (_descripcion, corregida) => {
      const resultado = rechazado(MESA, { tipo: 'corregir', pieza: 'I7', corregida });
      expect(resultado).toMatchObject({ ok: false, campo: 'id' });
      expect(resultado.motivo).toBe('No se guarda la corrección: falta o no es válido «id» en el ítem I7.');
    },
  );

  it('@MATE-4.8 un ejemplo corregido sin id se nombra por el suyo y con su objetivo (regla que la feature no cubre)', () => {
    const mesa = mesaDe({ ejemplos_resueltos: [{ ...ejemplo('E2'), objetivo: 'O1' }] });
    const resultado = rechazado(mesa, { tipo: 'corregir', pieza: 'E2', corregida: { pasos: ['Nuevo paso'] } });
    expect(resultado).toMatchObject({ ok: false, campo: 'id' });
    expect(resultado.motivo).toBe(
      'No se guarda la corrección: falta o no es válido «id» en el ejemplo resuelto E2 de O1.',
    );
  });

  it('cambiar el id se rechaza con el campo «id» (regla que la feature no cubre)', () => {
    const resultado = rechazado(MESA, { tipo: 'corregir', pieza: 'I7', corregida: { ...corregido, id: 'I99' } });
    expect(resultado).toMatchObject({ ok: false, campo: 'id' });
    expect(resultado.motivo).toBe('No se guarda la corrección: no se puede cambiar el id de «I7».');
  });

  it('@MATE-4.6 un ejemplo que va aparte conserva su objetivo, venga o no en la corrección', () => {
    const mesa = mesaDe(
      { ejemplos_resueltos: [{ ...ejemplo('E2'), objetivo: 'O1' }] },
      { objetivos: [objetivo('O1')] },
    );
    const corregida = { id: 'E2', pasos: ['Nuevo paso'] };
    const nueva = aplicado(mesa, { tipo: 'corregir', pieza: 'E2', corregida });
    expect(nueva.borrador.ejemplos_resueltos).toStrictEqual([{ ...corregida, objetivo: 'O1' }]);
  });

  it('@MATE-4.6 un ejemplo de dentro de su objetivo se corrige en su sitio, sin `objetivo`', () => {
    const mesa = mesaDe({ objetivos: [objetivo('O1', [ejemplo('E1'), ejemplo('E2')])] });
    const corregida = { id: 'E1', pasos: ['Nuevo paso'] };
    const nueva = aplicado(mesa, { tipo: 'corregir', pieza: 'E1', corregida });
    expect(nueva.borrador.objetivos).toStrictEqual([objetivo('O1', [corregida, ejemplo('E2')])]);
  });

  it('@MATE-4.8 un ejemplo mal corregido se nombra con su objetivo en el motivo', () => {
    const mesa = mesaDe({ ejemplos_resueltos: [{ ...ejemplo('E2'), objetivo: 'O1' }] });
    const resultado = rechazado(mesa, { tipo: 'corregir', pieza: 'E2', corregida: { id: 'E2', pasos: [] } });
    expect(resultado).toMatchObject({ ok: false, campo: 'pasos' });
    expect(resultado.motivo).toContain('E2 de O1');
  });
});

describe('aplicar: pieza que no está en el borrador', () => {
  it.each<Accion>([
    { tipo: 'aprobar', pieza: 'I99' },
    { tipo: 'descartar', pieza: 'I99' },
    { tipo: 'corregir', pieza: 'I99', corregida: item('I99') },
  ])('@MATE-4.4 la acción «$tipo» se rechaza con pieza_no_encontrada', (accion) => {
    expect(rechazado(MESA, accion)).toMatchObject({ ok: false, causa: 'pieza_no_encontrada' });
  });
});

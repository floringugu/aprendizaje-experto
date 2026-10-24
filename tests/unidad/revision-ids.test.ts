import { describe, expect, it } from 'vitest';
import { idRepetido } from '../../src/aplicacion/revision.ts';
import { ITEMS, aplicado, ejemplo, item, mesaDe, objetivo, rechazado, tarea } from './revision-fabricas.ts';

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

  it.each([
    ['una tarea', { tareas: [tarea('X1')] }],
    ['un ejemplo de dentro de un objetivo', { objetivos: [objetivo('O1', [ejemplo('X1')])] }],
  ])('@MATE-4.6 un id del borrador que ya está en el aprobado como %s se repite (regla que la feature no cubre)', (_, aprobado) => {
    expect(idRepetido(mesaDe({ items: [item('X1')] }, aprobado))).toBe('X1');
  });

  it('@MATE-4.6 el aprobado que repite ids entre sus propias piezas no cuenta (regla que la feature no cubre)', () => {
    const aprobado = { objetivos: [objetivo('O1', [ejemplo('E1')]), objetivo('O2', [ejemplo('E1')])] };
    expect(idRepetido(mesaDe({ items: [item('I7')] }, aprobado))).toBeUndefined();
  });

  it('@MATE-4.6 con dos ids repetidos da el primero en el orden de revisar, no el que salió antes (regla que la feature no cubre)', () => {
    // Al recorrer I1, I2, I2, I1 el primero que ya había salido es I2, aunque I1 salió antes.
    const mesa = mesaDe({ items: [item('I1'), item('I2'), item('I2'), item('I1')] });
    expect(idRepetido(mesa)).toBe('I2');
  });
});

describe('aplicar: corregir con ids y objetivos', () => {
  const mesa = mesaDe(
    { objetivos: [objetivo('O2', [ejemplo('E1')])], items: [item('I7', undefined, 'O1')] },
    { objetivos: [objetivo('O1', [ejemplo('E5')]), objetivo('O3')] },
  );
  const corregirObjetivo = (ejemplos: unknown[]) => ({
    tipo: 'corregir' as const,
    pieza: 'O2',
    corregida: { ...objetivo('O2'), ejemplos_resueltos: ejemplos },
  });

  it.each([
    ['una pieza del borrador', [ejemplo('I7')]],
    ['una pieza del aprobado', [ejemplo('E5')]],
    ['otro ejemplo suyo', [ejemplo('E8'), ejemplo('E8')]],
  ])('@MATE-4.6 un objetivo corregido con un ejemplo que choca con %s se rechaza con el campo «id» (regla que la feature no cubre)', (_, ejemplos) => {
    expect(rechazado(mesa, corregirObjetivo(ejemplos))).toMatchObject({ ok: false, campo: 'id' });
  });

  it('@MATE-4.6 el motivo nombra el id repetido y la mesa no cambia (regla que la feature no cubre)', () => {
    const resultado = rechazado(mesa, corregirObjetivo([ejemplo('E5')]));
    expect(resultado.motivo).toBe('No se guarda la corrección: el id «E5» ya lo usa otra pieza.');
  });

  it('@MATE-4.6 un objetivo corregido que conserva sus ejemplos no choca consigo mismo (regla que la feature no cubre)', () => {
    const nueva = aplicado(mesa, corregirObjetivo([ejemplo('E1')]));
    expect(nueva.borrador.objetivos).toStrictEqual([objetivo('O2', [ejemplo('E1')])]);
  });

  it('@MATE-4.6 un ítem con un objetivo que no existe se rechaza con el campo «objetivo» (regla que la feature no cubre)', () => {
    const resultado = rechazado(mesa, { tipo: 'corregir', pieza: 'I7', corregida: item('I7', undefined, 'O9') });
    expect(resultado).toMatchObject({ ok: false, campo: 'objetivo' });
    expect(resultado.motivo).toBe('No se guarda la corrección: el objetivo «O9» no está ni en el borrador ni en el aprobado.');
  });

  it.each([['O2', 'pendiente del borrador'], ['O3', 'del aprobado']])(
    '@MATE-4.6 un ítem puede pasar al objetivo %s (%s) (regla que la feature no cubre)',
    (destino) => {
      const nueva = aplicado(mesa, { tipo: 'corregir', pieza: 'I7', corregida: item('I7', undefined, destino) });
      expect(nueva.borrador.items).toStrictEqual([item('I7', undefined, destino)]);
    },
  );

  it('@MATE-4.8 con un formato que falla y un objetivo inexistente, el rechazo es el del formato (regla que la feature no cubre)', () => {
    const sinFeedback = Object.fromEntries(
      Object.entries(item('I7', undefined, 'O9')).filter(([clave]) => clave !== 'feedback'),
    );
    expect(rechazado(mesa, { tipo: 'corregir', pieza: 'I7', corregida: sinFeedback })).toMatchObject({
      ok: false,
      campo: 'feedback',
    });
  });
});

import { describe, expect, it } from 'vitest';
import { aplicado, ejemplo, item, mesaDe, objetivo, rechazado } from './revision-fabricas.ts';

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
  ])(
    '@MATE-4.6 un objetivo corregido con un ejemplo que choca con %s se rechaza con el campo «id» (regla que la feature no cubre)',
    (_, ejemplos) => {
      expect(rechazado(mesa, corregirObjetivo(ejemplos))).toMatchObject({ ok: false, campo: 'id' });
    },
  );

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
    expect(resultado.motivo).toBe(
      'No se guarda la corrección: el objetivo «O9» no está ni en el borrador ni en el aprobado.',
    );
  });

  it.each([
    ['O2', 'pendiente del borrador'],
    ['O3', 'del aprobado'],
  ])('@MATE-4.6 un ítem puede pasar al objetivo %s (%s) (regla que la feature no cubre)', (destino) => {
    const nueva = aplicado(mesa, { tipo: 'corregir', pieza: 'I7', corregida: item('I7', undefined, destino) });
    expect(nueva.borrador.items).toStrictEqual([item('I7', undefined, destino)]);
  });

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

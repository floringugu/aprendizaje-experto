import { describe, expect, it } from 'vitest';
import { avisoDeModelo } from '../../scripts/arnes/comun/fases.ts';

describe('avisoDeModelo', () => {
  it('no avisa si la conversación usa el modelo de la fase, o si no se sabe cuál usa', () => {
    expect(avisoDeModelo('impl', 'claude-opus-5-5')).toBeUndefined();
    expect(avisoDeModelo('specs', 'claude-sonnet-5-5')).toBeUndefined();
    expect(avisoDeModelo('aceptacion', undefined)).toBeUndefined();
  });

  it('avisa si la conversación usa otro modelo', () => {
    expect(avisoDeModelo('aceptacion', 'claude-opus-5-5')).toBe(
      'esta conversación usa claude-opus-5-5 y la fase aceptacion pide sonnet (cámbialo con /model)',
    );
  });
});

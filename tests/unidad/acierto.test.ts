import { describe, expect, it } from 'vitest';
import { aciertoSinAyuda, llegaAlUmbral, ultimoIntentoPorItem } from '../../src/dominio/acierto.ts';

describe('ultimoIntentoPorItem', () => {
  it('@DIAG-2.2 un intento posterior sustituye al anterior del mismo ítem', () => {
    const ultimo = ultimoIntentoPorItem([
      { item: 'I1', correcta: false },
      { item: 'I2', correcta: true },
      { item: 'I1', correcta: true },
    ]);
    expect(ultimo).toEqual(
      new Map([
        ['I1', true],
        ['I2', true],
      ]),
    );
  });
});

describe('aciertoSinAyuda', () => {
  it('@DIAG-2.2 es la fracción de ítems cuyo último intento fue correcto', () => {
    const intentos = new Map([
      ['I1', true],
      ['I2', false],
      ['I3', true],
      ['I4', true],
    ]);
    expect(aciertoSinAyuda(['I1', 'I2', 'I3', 'I4'], intentos)).toBe(0.75);
  });

  it('@DIAG-2.2 no existe mientras algún ítem no tenga intento', () => {
    expect(aciertoSinAyuda(['I1', 'I2'], new Map([['I1', true]]))).toBeUndefined();
  });

  it('@DIAG-2.2 no existe si no hay ítems', () => {
    expect(aciertoSinAyuda([], new Map([['I1', true]]))).toBeUndefined();
  });

  it('@DIAG-2.2 solo cuenta los ítems pedidos', () => {
    const intentos = new Map([
      ['I1', true],
      ['OTRO', false],
    ]);
    expect(aciertoSinAyuda(['I1'], intentos)).toBe(1);
  });
});

describe('llegaAlUmbral', () => {
  it('@DIAG-2.2 un acierto igual al umbral lo supera; uno menor, no', () => {
    expect(llegaAlUmbral(17 / 20, 0.85)).toBe(true);
    expect(llegaAlUmbral(16 / 20, 0.85)).toBe(false);
  });

  it('@DIAG-2.2 sin acierto medido no se llega al umbral', () => {
    expect(llegaAlUmbral(undefined, 0)).toBe(false);
  });
});

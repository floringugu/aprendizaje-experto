import { describe, expect, it } from 'vitest';
import { esCorrecta, respuestaMostrada } from '../../src/dominio/correccion.ts';

const ESCRITA = { aceptadas: ['a', 'b'] } as const;
const ELECCION = { opciones: ['x', 'y', 'z'], correcta: 'y' };

describe('esCorrecta', () => {
  it('@DIAG-1.2 acepta cualquiera de las respuestas escritas que da el contenido', () => {
    expect(esCorrecta('b', ESCRITA)).toBe(true);
  });

  it('@DIAG-1.2 rechaza una respuesta escrita que el contenido no da por buena', () => {
    expect(esCorrecta('c', ESCRITA)).toBe(false);
  });

  it('@DIAG-1.2 en una pregunta de opciones solo acepta la correcta', () => {
    expect(esCorrecta('y', ELECCION)).toBe(true);
    expect(esCorrecta('x', ELECCION)).toBe(false);
  });

  describe('respuesta escrita', () => {
    const REGLA = { aceptadas: ['regla de tres', 'proporción'] } as const;

    it('@RECU-3.1 no distingue mayúsculas de minúsculas', () => {
      expect(esCorrecta('PROPORCIÓN', REGLA)).toBe(true);
    });

    it('@RECU-3.1 trata varios espacios seguidos como uno', () => {
      expect(esCorrecta('Regla  de  Tres', REGLA)).toBe(true);
    });

    it('@RECU-3.1 reduce los espacios a uno, pero no los quita', () => {
      expect(esCorrecta('reglade tres', REGLA)).toBe(false);
    });

    it('@RECU-3.2 ignora los espacios al principio y al final', () => {
      expect(esCorrecta('  proporción ', REGLA)).toBe(true);
    });

    it('@RECU-3.1 también normaliza lo que da por bueno el contenido', () => {
      expect(esCorrecta('regla de tres', { aceptadas: ['  Regla  de  Tres '] })).toBe(true);
    });

    it('@RECU-3.1 sigue rechazando una respuesta distinta', () => {
      expect(esCorrecta('regla de cuatro', REGLA)).toBe(false);
    });

    it('@RECU-3.1 conserva los acentos: no se ignoran', () => {
      expect(esCorrecta('proporcion', REGLA)).toBe(false);
    });
  });
});

describe('respuestaMostrada', () => {
  it('@RECU-2.1 en una pregunta de opciones es la opción correcta', () => {
    expect(respuestaMostrada(ELECCION)).toBe('y');
  });

  it('@RECU-2.1 en una respuesta escrita es la primera de las aceptadas', () => {
    expect(respuestaMostrada(ESCRITA)).toBe('a');
  });
});

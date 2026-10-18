import { describe, expect, it } from 'vitest';
import { esCorrecta, respuestasAceptadas } from '../../src/dominio/correccion.ts';

const ESCRITA = { aceptadas: ['a', 'b'] };
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
});

describe('respuestasAceptadas', () => {
  it('@DIAG-1.2 son las aceptadas, o la opción correcta', () => {
    expect(respuestasAceptadas(ESCRITA)).toEqual(['a', 'b']);
    expect(respuestasAceptadas(ELECCION)).toEqual(['y']);
  });
});

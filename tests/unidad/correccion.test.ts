import { describe, expect, it } from 'vitest';
import { esCorrecta, falloNumerico, respuestaMostrada } from '../../src/dominio/correccion.ts';
import { FORMATO_DE_UN_NUMERO } from '../../src/dominio/numero-escrito.ts';

const ESCRITA = { aceptadas: ['a', 'b'] } as const;
const ELECCION = { opciones: ['x', 'y', 'z'], correcta: 'y' };

// Los ítems numéricos de features/recuperacion.feature (regla RECU-5) y el parámetro «tolerancia_numerica_relativa».
const I3 = { valor: 9.81, unidades: ['m/s²', 'm/s^2', 'm/s2'] } as const;
const I4 = { valor: 6.674e-11, unidades: ['N·m²/kg²', 'N m2/kg2'] } as const;
const I5 = { valor: 12 } as const;
const I6 = { valor: 100, unidades: ['kPa'], tolerancia: 0.05 } as const;
const POR_DEFECTO = 0.01;

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

  it('@RECU-5.11 en un ítem numérico con unidades es el valor con coma, un espacio y la primera unidad', () => {
    expect(respuestaMostrada(I3)).toBe('9,81 m/s²');
    expect(respuestaMostrada(I4)).toBe('6,674e-11 N·m²/kg²');
  });

  it('@RECU-5.11 en un ítem numérico sin unidades es solo el valor', () => {
    expect(respuestaMostrada(I5)).toBe('12');
  });

  it('@RECU-5.11 una respuesta con valor es numérica aunque traiga también respuestas escritas', () => {
    const mixta = { valor: 12, aceptadas: ['doce'] } as const;
    expect(respuestaMostrada(mixta)).toBe('12');
  });
});

type ItemNumerico = Parameters<typeof falloNumerico>[1];

/** Si la respuesta a un ítem numérico se corrige como acertada. */
function acierta(respuesta: string, item: ItemNumerico, toleranciaPorDefecto = POR_DEFECTO): boolean {
  return falloNumerico(respuesta, item, toleranciaPorDefecto) === undefined;
}

describe('falloNumerico: el valor', () => {
  it.each([
    ['9,81 m/s²', true],
    ['9,8 m/s²', true],
    ['9,9 m/s²', true],
    ['9,72 m/s²', true],
    ['9,91 m/s²', false],
    ['9,71 m/s²', false],
    ['10 m/s²', false],
  ])('@RECU-5.1 «%s» como respuesta a I3 es correcta: %s', (respuesta, correcta) => {
    expect(acierta(respuesta, I3)).toBe(correcta);
  });

  it.each([
    ['100 kPa', true],
    ['95 kPa', true],
    ['105 kPa', true],
    ['94,9 kPa', false],
    ['105,1 kPa', false],
  ])('@RECU-5.2 «%s» como respuesta a I6 es correcta: %s', (respuesta, correcta) => {
    expect(acierta(respuesta, I6)).toBe(correcta);
  });

  it('@RECU-5.2 la tolerancia del ítem manda sobre la del parámetro, sea mayor o menor', () => {
    expect(acierta('95 kPa', I6, POR_DEFECTO)).toBe(true);
    expect(acierta('99,5 kPa', I6, 0.001)).toBe(true);
    expect(acierta('94,9 kPa', I6, 0.5)).toBe(false);
  });

  it('@RECU-5.2 una tolerancia propia de 0 es una tolerancia, no su ausencia: manda sobre el parámetro', () => {
    const exacto = { valor: 9.81, tolerancia: 0 } as const;
    expect(acierta('9,81', exacto)).toBe(true);
    expect(acierta('9,8', exacto)).toBe(false);
  });

  it('@RECU-5.3 con el parámetro en 0,05, «10,2 m/s²» vale por I3', () => {
    expect(acierta('10,2 m/s²', I3, 0.05)).toBe(true);
  });

  it('@RECU-5.3 con el parámetro en 0,01, «10,2 m/s²» no vale por I3', () => {
    expect(acierta('10,2 m/s²', I3, POR_DEFECTO)).toBe(false);
  });

  it.each([
    ['9,81 m/s²', true],
    ['9.81 m/s²', true],
    ['9,810 m/s²', true],
    ['98,1 m/s²', false],
  ])('@RECU-5.4 «%s» como respuesta a I3 es correcta: %s', (respuesta, correcta) => {
    expect(acierta(respuesta, I3)).toBe(correcta);
  });

  it.each([
    ['6,674e-11 N·m²/kg²', true],
    ['6,67E-11 N·m²/kg²', true],
    ['6,674·10^-11 N·m²/kg²', true],
    ['6,674×10⁻¹¹ N·m²/kg²', true],
    ['0,00000000006674 N·m²/kg²', true],
    ['6,674e-10 N·m²/kg²', false],
    ['6,674·10^11 N·m²/kg²', false],
  ])('@RECU-5.5 «%s» como respuesta a I4 es correcta: %s', (respuesta, correcta) => {
    expect(acierta(respuesta, I4)).toBe(correcta);
  });

  it('@RECU-5.1 con valor 0 el margen es 0: solo vale 0', () => {
    const cero = { valor: 0 } as const;
    expect(acierta('0', cero)).toBe(true);
    expect(acierta('0,0', cero)).toBe(true);
    expect(acierta('0,0001', cero)).toBe(false);
    expect(acierta('-0,0001', cero)).toBe(false);
  });

  it('@RECU-5.1 el redondeo de los números no deja fuera el límite: 0,33 y 0,27 valen por 0,3 con el 10 %', () => {
    const tresDecimas = { valor: 0.3, tolerancia: 0.1 } as const;
    expect(acierta('0,33', tresDecimas)).toBe(true);
    expect(acierta('0,27', tresDecimas)).toBe(true);
    expect(acierta('0,331', tresDecimas)).toBe(false);
    expect(acierta('0,269', tresDecimas)).toBe(false);
  });

  it('@RECU-5.1 la holgura del redondeo crece con el tamaño de los números: 7,07 y 6,93 valen por 7 con el 1 %', () => {
    const siete = { valor: 7, tolerancia: 0.01 } as const;
    expect(acierta('7,07', siete)).toBe(true);
    expect(acierta('6,93', siete)).toBe(true);
    expect(acierta('7,071', siete)).toBe(false);
    expect(acierta('6,929', siete)).toBe(false);
  });

  it('@RECU-5.1 con un valor negativo el margen es el mismo por los dos lados: -5 con el 10 %', () => {
    const menosCinco = { valor: -5, tolerancia: 0.1 } as const;
    expect(acierta('-5,5', menosCinco)).toBe(true);
    expect(acierta('-4,5', menosCinco)).toBe(true);
    expect(acierta('−5', menosCinco)).toBe(true);
    expect(acierta('-5,6', menosCinco)).toBe(false);
    expect(acierta('-4,4', menosCinco)).toBe(false);
    expect(acierta('5', menosCinco)).toBe(false);
  });

  it('@RECU-5.10 un número que no cabe en un `number` no vale por ningún valor', () => {
    expect(acierta('1e999', I5)).toBe(false);
    expect(falloNumerico('1e999', I5, POR_DEFECTO)).toStrictEqual({ valor: 'ilegible', formato: FORMATO_DE_UN_NUMERO });
  });
});

describe('falloNumerico: la unidad', () => {
  it.each([
    ['9,81 m/s²', true],
    ['9,81 m/s^2', true],
    ['9,81 m/s2', true],
    ['9,81m/s²', true],
    ['9,81 m / s²', true],
    ['9,81 M/S²', false],
    ['9,81 m/s', false],
    ['9,81 km/s²', false],
  ])('@RECU-5.6 «%s» como respuesta a I3 es correcta: %s', (respuesta, correcta) => {
    expect(acierta(respuesta, I3)).toBe(correcta);
  });

  it('@RECU-5.6 las unidades del contenido también se comparan sin espacios', () => {
    expect(acierta('6,674e-11 N m2/kg2', I4)).toBe(true);
    expect(acierta('6,674e-11 Nm2/kg2', I4)).toBe(true);
    expect(acierta('6,674e-11 N·m²/kg²', I4)).toBe(true);
    expect(acierta('6,674e-11 N m2 / kg2', I4)).toBe(true);
  });

  it('@RECU-5.6 distingue mayúsculas de minúsculas en la unidad', () => {
    expect(acierta('100 kPa', I6)).toBe(true);
    expect(acierta('100 kpa', I6)).toBe(false);
    expect(acierta('100 KPA', I6)).toBe(false);
  });

  it('@RECU-5.7 una unidad equivalente que el contenido no da no se convierte', () => {
    expect(falloNumerico('100000 Pa', I6, POR_DEFECTO)).toStrictEqual({
      valor: 'distinto',
      margen: 0.05,
      unidad: 'distinta',
    });
    expect(falloNumerico('100 Pa', I6, POR_DEFECTO)).toStrictEqual({ unidad: 'distinta' });
  });

  it.each([
    ['12', true],
    ['12,0', true],
    ['12 m', false],
    ['13', false],
  ])('@RECU-5.8 «%s» como respuesta a I5 es correcta: %s', (respuesta, correcta) => {
    expect(acierta(respuesta, I5)).toBe(correcta);
  });

  it('@RECU-5.9 una respuesta sin unidad es incorrecta aunque el valor valga', () => {
    expect(falloNumerico('9,81', I3, POR_DEFECTO)).toStrictEqual({ unidad: 'falta' });
  });

  it('@RECU-5.13 un ítem sin unidades respondido con una unidad: la unidad sobra', () => {
    expect(falloNumerico('12 m', I5, POR_DEFECTO)).toStrictEqual({ unidad: 'sobra' });
  });
});

describe('falloNumerico: qué parte falla', () => {
  it('@RECU-5.10 lo que no se lee como un número falla solo en el valor y dice cómo se escribe', () => {
    const respuestas = ['muy rápido', 'm/s²', '1.000,5 m/s²', '9,8,1 m/s²', '1 000 m/s²', '', '9,81,'];
    for (const respuesta of respuestas) {
      expect(falloNumerico(respuesta, I3, POR_DEFECTO)).toStrictEqual({
        valor: 'ilegible',
        formato: FORMATO_DE_UN_NUMERO,
      });
    }
  });

  it('@RECU-5.10 un ilegible no lleva ni unidad ni margen, aunque falte o sobre la unidad', () => {
    for (const [respuesta, item] of [
      ['muy rápido', I3],
      ['muy rápido', I5],
      ['m/s²', I5],
    ] as const) {
      const fallo = falloNumerico(respuesta, item, POR_DEFECTO);
      expect(Object.keys(fallo ?? {}).sort()).toStrictEqual(['formato', 'valor']);
    }
  });

  it.each([
    ['12 m/s²', { valor: 'distinto', margen: 0.01 }],
    ['9,81 m/s', { unidad: 'distinta' }],
    ['12 m/s', { valor: 'distinto', margen: 0.01, unidad: 'distinta' }],
    ['9,81', { unidad: 'falta' }],
    ['12', { valor: 'distinto', margen: 0.01, unidad: 'falta' }],
  ])('@RECU-5.11 el fallo de «%s» como respuesta a I3 es solo %j', (respuesta, fallo) => {
    expect(falloNumerico(respuesta, I3, POR_DEFECTO)).toStrictEqual(fallo);
  });

  it('@RECU-5.11 si solo falla la unidad, no hay margen ni formato', () => {
    const fallo = falloNumerico('9,81 m/s', I3, POR_DEFECTO);
    expect(Object.keys(fallo ?? {})).toStrictEqual(['unidad']);
  });

  it('@RECU-5.11 si solo falla el valor, no hay unidad ni formato', () => {
    const fallo = falloNumerico('12 m/s²', I3, POR_DEFECTO);
    expect(Object.keys(fallo ?? {}).sort()).toStrictEqual(['margen', 'valor']);
  });

  it('@RECU-5.11 una respuesta correcta no tiene fallo', () => {
    expect(falloNumerico('9,81 m/s²', I3, POR_DEFECTO)).toBeUndefined();
    expect(falloNumerico('12', I5, POR_DEFECTO)).toBeUndefined();
  });

  it('@RECU-5.12 si falla el valor, el margen es la tolerancia por defecto', () => {
    expect(falloNumerico('9,5 m/s²', I3, POR_DEFECTO)).toStrictEqual({ valor: 'distinto', margen: 0.01 });
    expect(falloNumerico('9,0 m/s²', I3, 0.05)).toStrictEqual({ valor: 'distinto', margen: 0.05 });
  });

  it('@RECU-5.12 si el ítem trae tolerancia, el margen es la del ítem y no la del parámetro', () => {
    expect(falloNumerico('90 kPa', I6, POR_DEFECTO)).toStrictEqual({ valor: 'distinto', margen: 0.05 });
    expect(falloNumerico('90 kPa', I6, 0.5)).toStrictEqual({ valor: 'distinto', margen: 0.05 });
  });
});

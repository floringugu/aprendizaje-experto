import { describe, expect, it } from 'vitest';
import { falloDeLaPiezaSuelta } from '../../src/aplicacion/formato-contenido.ts';
import { comprobarFallos, enItem, enRespuesta, falloDe, item, ITEM } from './formato-contenido-piezas.ts';

describe('validarContenido: respuesta de un ítem', () => {
  comprobarFallos([
    ['una respuesta que falta', enItem({ respuesta: undefined }), ITEM, 'respuesta'],
    ['una respuesta que no es un objeto', enRespuesta('a'), ITEM, 'respuesta'],
    ['una respuesta sin opciones ni aceptadas', enRespuesta({ correcta: 'a' }), ITEM, 'respuesta'],
    ['unas opciones vacías', enRespuesta({ opciones: [], correcta: 'a' }), ITEM, 'opciones'],
    ['unas opciones que no son una lista', enRespuesta({ opciones: 'a', correcta: 'a' }), ITEM, 'opciones'],
    ['una opción que no es un texto', enRespuesta({ opciones: ['a', 1], correcta: 'a' }), ITEM, 'opciones'],
    ['una opción vacía', enRespuesta({ opciones: ['a', ''], correcta: 'a' }), ITEM, 'opciones'],
    ['una correcta que falta', enRespuesta({ opciones: ['a', 'b'] }), ITEM, 'correcta'],
    ['una correcta que no es una opción', enRespuesta({ opciones: ['a'], correcta: 'c' }), ITEM, 'correcta'],
    ['@RECU-2.1 unas aceptadas vacías', enRespuesta({ aceptadas: [] }), ITEM, 'aceptadas'],
    ['@RECU-2.1 unas aceptadas que no son una lista', enRespuesta({ aceptadas: 'x' }), ITEM, 'aceptadas'],
    ['@RECU-2.1 una aceptada que no es un texto', enRespuesta({ aceptadas: ['x', 3] }), ITEM, 'aceptadas'],
    ['@RECU-2.1 una aceptada vacía', enRespuesta({ aceptadas: [''] }), ITEM, 'aceptadas'],
    [
      '@RECU-2.1 aceptadas vacías con opciones',
      enRespuesta({ opciones: ['a'], correcta: 'a', aceptadas: [] }),
      ITEM,
      'aceptadas',
    ],
  ]);
});

// Una respuesta numérica es la que trae `valor`, `unidades` o `tolerancia` (@RECU-5, @MATE-2.12, @MATE-2.13).
describe('validarContenido: respuesta numérica', () => {
  comprobarFallos([
    ['@MATE-2.12 solo unas unidades, sin valor, falla en valor', enRespuesta({ unidades: ['m'] }), ITEM, 'valor'],
    ['@MATE-2.12 solo una tolerancia, sin valor, falla en valor', enRespuesta({ tolerancia: 0.05 }), ITEM, 'valor'],
    ['@MATE-2.12 un valor «nueve» escrito como texto', enRespuesta({ valor: 'nueve' }), ITEM, 'valor'],
    ['@MATE-2.12 un valor «9,81» escrito como texto', enRespuesta({ valor: '9,81' }), ITEM, 'valor'],
    ['@RECU-5 un valor nulo cuenta como un valor que no es un número', enRespuesta({ valor: null }), ITEM, 'valor'],
    ['@RECU-5 un valor NaN', enRespuesta({ valor: Number.NaN }), ITEM, 'valor'],
    ['@RECU-5 un valor infinito', enRespuesta({ valor: Number.POSITIVE_INFINITY }), ITEM, 'valor'],
    ['@MATE-2.12 unas unidades vacías', enRespuesta({ valor: 9.81, unidades: [] }), ITEM, 'unidades'],
    ['@RECU-5 una unidad vacía', enRespuesta({ valor: 9.81, unidades: ['m', ''] }), ITEM, 'unidades'],
    ['@RECU-5 una unidad que no es un texto', enRespuesta({ valor: 9.81, unidades: ['m', 3] }), ITEM, 'unidades'],
    ['@RECU-5 unas unidades que no son una lista', enRespuesta({ valor: 9.81, unidades: 'm' }), ITEM, 'unidades'],
    ['@MATE-2.12 una tolerancia 1,5', enRespuesta({ valor: 9.81, tolerancia: 1.5 }), ITEM, 'tolerancia'],
    ['@MATE-2.12 una tolerancia -0,1', enRespuesta({ valor: 9.81, tolerancia: -0.1 }), ITEM, 'tolerancia'],
    [
      '@MATE-2.12 una tolerancia «5 %» escrita como texto',
      enRespuesta({ valor: 9.81, tolerancia: '5 %' }),
      ITEM,
      'tolerancia',
    ],
    // Un texto que sí se puede leer como número tampoco vale: la tolerancia tiene que ser un número.
    [
      '@RECU-5 una tolerancia «0.05» escrita como texto',
      enRespuesta({ valor: 9.81, tolerancia: '0.05' }),
      ITEM,
      'tolerancia',
    ],
    ['@RECU-5 una tolerancia NaN', enRespuesta({ valor: 9.81, tolerancia: Number.NaN }), ITEM, 'tolerancia'],
    ['@RECU-5 una tolerancia nula', enRespuesta({ valor: 9.81, tolerancia: null }), ITEM, 'tolerancia'],
    ['@MATE-2.12 un valor 0 con la tolerancia 0,05', enRespuesta({ valor: 0, tolerancia: 0.05 }), ITEM, 'tolerancia'],
    ['@RECU-5 un valor 0 con la tolerancia 0', enRespuesta({ valor: 0, tolerancia: 0 }), ITEM, 'tolerancia'],
    [
      '@RECU-5 un valor 0 con una tolerancia que además no es válida',
      enRespuesta({ valor: 0, tolerancia: 2 }),
      ITEM,
      'tolerancia',
    ],
    // Se miran en el orden valor, unidades, tolerancia.
    ['@RECU-5 sin valor y con unas unidades vacías falla antes en valor', enRespuesta({ unidades: [] }), ITEM, 'valor'],
    [
      '@RECU-5 con unas unidades vacías y una tolerancia no válida falla antes en unidades',
      enRespuesta({ valor: 9.81, unidades: [], tolerancia: 2 }),
      ITEM,
      'unidades',
    ],
    [
      '@RECU-5 con el valor 0, unas unidades vacías y una tolerancia falla antes en unidades',
      enRespuesta({ valor: 0, unidades: [], tolerancia: 0.05 }),
      ITEM,
      'unidades',
    ],
    // Una respuesta que mezcla grupos comprueba cada uno, en el orden opciones, aceptadas, numérica.
    [
      '@RECU-5 unas opciones válidas con un valor que no es un número fallan en valor',
      enRespuesta({ opciones: ['a', 'b'], correcta: 'a', valor: 'nueve' }),
      ITEM,
      'valor',
    ],
    [
      '@RECU-5 unas opciones vacías con un valor válido fallan antes en opciones',
      enRespuesta({ opciones: [], valor: 1 }),
      ITEM,
      'opciones',
    ],
    [
      '@RECU-5 unas aceptadas válidas con un valor que no es un número fallan en valor',
      enRespuesta({ aceptadas: ['x'], valor: 'nueve' }),
      ITEM,
      'valor',
    ],
    [
      '@RECU-5 unas aceptadas vacías con un valor que no es un número fallan antes en aceptadas',
      enRespuesta({ aceptadas: [], valor: 'nueve' }),
      ITEM,
      'aceptadas',
    ],
  ]);

  it.each([
    ['@MATE-2.13 un valor con varias unidades', { valor: 9.81, unidades: ['m/s²', 'm/s2'] }],
    ['@MATE-2.13 un valor con unidades y tolerancia', { valor: 9.81, unidades: ['m/s²', 'm/s2'], tolerancia: 0.02 }],
    ['@RECU-5 un valor sin unidades ni tolerancia', { valor: 12 }],
    ['@RECU-5 un valor con solo unidades', { valor: 12, unidades: ['kg'] }],
    ['@RECU-5 un valor con solo tolerancia', { valor: 12, tolerancia: 0.02 }],
    // Los dos extremos del margen valen: 0 es exacto y 1 es el 100 %.
    ['@RECU-5 una tolerancia 0', { valor: 12, tolerancia: 0 }],
    ['@RECU-5 una tolerancia 1', { valor: 12, tolerancia: 1 }],
    ['@RECU-5 un valor 0 sin tolerancia', { valor: 0 }],
    ['@RECU-5 un valor 0 con unidades y sin tolerancia', { valor: 0, unidades: ['m'] }],
    ['@RECU-5 un valor negativo', { valor: -273.15, unidades: ['°C'] }],
    ['@RECU-5 un valor negativo con tolerancia', { valor: -3, tolerancia: 0.5 }],
    [
      '@RECU-5 unas unidades y una tolerancia que valen undefined cuentan como ausentes',
      { valor: 12, unidades: undefined, tolerancia: undefined },
    ],
    ['@RECU-5 un valor 0 con una tolerancia undefined', { valor: 0, tolerancia: undefined }],
    ['@RECU-5 unas opciones válidas con un valor válido', { opciones: ['a', 'b'], correcta: 'a', valor: 1 }],
    ['@RECU-5 unas aceptadas válidas con un valor válido', { aceptadas: ['x'], valor: 1, unidades: ['m'] }],
  ])('D16 %s valen', (_descripcion, respuesta) => {
    expect(falloDe(enRespuesta(respuesta))).toBeUndefined();
  });

  it('@MATE-2.12 una pieza suelta de tipo ítem numérica mal formada falla igual en valor', () => {
    const mal = item({ respuesta: { valor: 'nueve', unidades: ['m/s²'] } });
    expect(falloDeLaPiezaSuelta('item', mal)).toStrictEqual({ pieza: ITEM, falta: 'valor' });
  });

  it('@MATE-2.12 una pieza suelta de tipo ítem con valor 0 y tolerancia falla en tolerancia', () => {
    const mal = item({ respuesta: { valor: 0, tolerancia: 0.05 } });
    expect(falloDeLaPiezaSuelta('item', mal)).toStrictEqual({ pieza: ITEM, falta: 'tolerancia' });
  });

  it('@MATE-2.13 una pieza suelta de tipo ítem numérica bien formada cumple el formato', () => {
    const bien = item({ respuesta: { valor: 9.81, unidades: ['m/s²', 'm/s2'], tolerancia: 0.02 } });
    expect(falloDeLaPiezaSuelta('item', bien)).toBeUndefined();
  });
});

// Dos opciones que `normalizar` (la de la corrección) deja iguales son la misma opción (@MATE-2.5).
describe('validarContenido: opciones repetidas', () => {
  comprobarFallos([
    [
      '@MATE-2.5 «La regla R1» y «la regla  R1» (doble espacio) son la misma opción',
      enRespuesta({ opciones: ['La regla R1', 'la regla  R1'], correcta: 'La regla R1' }),
      ITEM,
      'opciones',
    ],
    [
      '@MATE-2.5 dos opciones que solo cambian en las mayúsculas',
      enRespuesta({ opciones: ['Sí', 'SÍ'], correcta: 'Sí' }),
      ITEM,
      'opciones',
    ],
    [
      '@MATE-2.5 dos opciones que solo cambian en los espacios del principio o del final',
      enRespuesta({ opciones: ['a', '  a '], correcta: 'a' }),
      ITEM,
      'opciones',
    ],
    [
      '@MATE-2.5 una opción repetida que no es contigua',
      enRespuesta({ opciones: ['a', 'b', 'A'], correcta: 'a' }),
      ITEM,
      'opciones',
    ],
    [
      '@MATE-2.5 opciones repetidas con una correcta que no está: falla antes en opciones',
      enRespuesta({ opciones: ['a', 'A'], correcta: 'c' }),
      ITEM,
      'opciones',
    ],
  ]);

  it.each([
    ['@MATE-2.5 opciones distintas', ['a', 'b', 'c']],
    // La normalización no quita tildes: «proporción» y «proporcion» son opciones distintas.
    ['@MATE-2.5 opciones que solo cambian en una tilde', ['proporción', 'proporcion']],
    ['@MATE-2.5 opciones con palabras separadas de otra forma', ['la regla R1', 'laregla R1']],
  ])('D16 %s valen', (_descripcion, opciones) => {
    expect(falloDe(enRespuesta({ opciones, correcta: opciones[0] }))).toBeUndefined();
  });

  it('@MATE-2.5 las aceptadas repetidas no son un fallo', () => {
    expect(falloDe(enRespuesta({ aceptadas: ['a', 'A', ' a'] }))).toBeUndefined();
  });

  it('@MATE-2.5 una pieza suelta de tipo ítem con opciones repetidas falla igual en opciones', () => {
    const repetido = item({ respuesta: { opciones: ['La regla R1', 'la regla  R1'], correcta: 'La regla R1' } });
    expect(falloDeLaPiezaSuelta('item', repetido)).toStrictEqual({ pieza: ITEM, falta: 'opciones' });
  });

  it('@MATE-2.5 una pieza suelta de tipo ítem con opciones distintas cumple el formato', () => {
    expect(falloDeLaPiezaSuelta('item', item())).toBeUndefined();
  });
});

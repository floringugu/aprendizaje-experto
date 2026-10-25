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

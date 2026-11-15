import { describe, expect, it } from 'vitest';
import { incorporarEntrega } from '../../src/aplicacion/redaccion.ts';
import { entregaCon } from './redaccion-fabricas.ts';
import { FUENTE_BUENA, item, mesaDe, objetivo } from './revision-fabricas.ts';

// Un ítem numérico es un ítem normal cuya `respuesta` lleva `valor`, `unidades` y `tolerancia` en vez de
// opciones. Las reglas de cada propiedad ya las prueba `formato-contenido-respuesta.test.ts`; aquí se prueba
// lo que `incorporarEntrega` hace con el resultado: apartar el ítem mal formado con su falta, o dejarlo
// entrar tal cual, con su fuente.

describe('incorporarEntrega: ítem numérico', () => {
  const mesa = mesaDe({}, { objetivos: [objetivo('O1')] });
  const UNIDADES = ['m/s²', 'm/s2'];
  /** Un ítem de O1 con esa respuesta; la respuesta es `unknown` para poder darla mal formada. */
  const numericoCon = (respuesta: unknown): Record<string, unknown> => ({ ...item('I9', FUENTE_BUENA), respuesta });

  // Cada fila: lo que se describe, la respuesta numérica y la primera propiedad que le falla.
  const MALAS: [string, unknown, string][] = [
    ['sin valor', { unidades: UNIDADES }, 'valor'],
    ['con el valor «nueve»', { valor: 'nueve', unidades: UNIDADES }, 'valor'],
    ['con el valor «9,81» escrito como texto', { valor: '9,81', unidades: UNIDADES }, 'valor'],
    ['con las unidades vacías', { valor: 9.81, unidades: [] }, 'unidades'],
    ['con la tolerancia 1,5', { valor: 9.81, unidades: UNIDADES, tolerancia: 1.5 }, 'tolerancia'],
    ['con la tolerancia -0,1', { valor: 9.81, unidades: UNIDADES, tolerancia: -0.1 }, 'tolerancia'],
    [
      'con la tolerancia «5 %» escrita como texto',
      { valor: 9.81, unidades: UNIDADES, tolerancia: '5 %' },
      'tolerancia',
    ],
    ['con el valor 0 y la tolerancia 0,05', { valor: 0, unidades: UNIDADES, tolerancia: 0.05 }, 'tolerancia'],
  ];

  it.each(MALAS)(
    '@MATE-2.12 un ítem numérico %s se aparta con la falta de esa propiedad, sola, y el ítem bueno entra',
    (_, respuesta, falta) => {
      const entrega = entregaCon({ items: [item('I2'), numericoCon(respuesta)] });
      const resultado = incorporarEntrega(mesa, entrega);
      expect(resultado.apartadas).toStrictEqual([{ falta }]);
      expect(resultado.borrador).toStrictEqual({ ...mesa.borrador, items: [item('I2')] });
    },
  );

  const BUENAS: [string, Record<string, unknown>][] = [
    ['con valor y unidades', { valor: 9.81, unidades: UNIDADES }],
    ['con valor, unidades y la tolerancia 0,02', { valor: 9.81, unidades: UNIDADES, tolerancia: 0.02 }],
    ['con valor y sin unidades', { valor: 9.81 }],
    ['con la tolerancia 0', { valor: 9.81, unidades: UNIDADES, tolerancia: 0 }],
    ['con la tolerancia 1', { valor: 9.81, unidades: UNIDADES, tolerancia: 1 }],
    ['con el valor 0 y sin tolerancia', { valor: 0, unidades: UNIDADES }],
  ];

  it.each(BUENAS)(
    '@MATE-2.13 un ítem numérico %s entra tal cual, con su respuesta y su fuente, y no se aparta nada',
    (_, respuesta) => {
      const numerico = numericoCon(respuesta);
      const resultado = incorporarEntrega(mesa, entregaCon({ items: [numerico] }));
      expect(resultado.borrador.items).toStrictEqual([numerico]);
      expect(resultado.apartadas).toStrictEqual([]);
    },
  );
});

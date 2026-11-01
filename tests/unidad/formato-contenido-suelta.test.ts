import { describe, expect, it } from 'vitest';
import { falloDeLaPiezaSuelta, lugarDelFallo, type TipoDePieza } from '../../src/aplicacion/formato-contenido.ts';
import {
  categoria,
  CATEGORIA,
  ejemplo,
  EJEMPLO,
  FUENTE,
  FUENTE_DEL_ITEM,
  item,
  ITEM,
  objetivo,
  OBJETIVO,
  sin,
  tarea,
  TAREA,
  type Pieza,
} from './formato-contenido-piezas.ts';

// Cómo se nombra la fuente de la categoría de los contenidos de prueba.
const FUENTE_DE_LA_CATEGORIA = 'la fuente de la categoría C1';

describe('falloDeLaPiezaSuelta', () => {
  /** Un ejemplo que va aparte lleva el `objetivo` del que cuelga. */
  const ejemploAparte = (cambios: Pieza = {}): Pieza => ejemplo({ objetivo: 'O2', ...cambios });

  it.each<[TipoDePieza, Pieza]>([
    ['objetivo', objetivo({ fuente: FUENTE })],
    ['ejemplo', ejemploAparte({ fuente: FUENTE })],
    ['item', item({ fuente: FUENTE })],
    ['categoria', categoria({ fuente: FUENTE })],
    ['tarea', tarea({ fuente: FUENTE })],
  ])('@MATE-2.3 una pieza que cumple el formato (%s) no tiene fallo', (tipo, pieza) => {
    expect(falloDeLaPiezaSuelta(tipo, pieza)).toBeUndefined();
  });

  it('@MATE-2.3 el objetivo de un ejemplo que va aparte no cuenta como propiedad de más', () => {
    expect(falloDeLaPiezaSuelta('ejemplo', ejemploAparte())).toBeUndefined();
    expect(falloDeLaPiezaSuelta('ejemplo', ejemplo())).toBeUndefined();
  });

  it.each<[string, TipoDePieza, unknown, string, string]>([
    ['un ítem sin feedback', 'item', sin(item(), 'feedback'), ITEM, 'feedback'],
    ['una tarea con la rúbrica vacía', 'tarea', tarea({ rubrica: [] }), TAREA, 'rubrica'],
    ['una categoría sin descripción', 'categoria', sin(categoria(), 'descripcion'), CATEGORIA, 'descripcion'],
    ['un objetivo sin instrucción', 'objetivo', sin(objetivo(), 'instruccion'), OBJETIVO, 'instruccion'],
    [
      'un ejemplo de dentro de un objetivo',
      'objetivo',
      objetivo({ ejemplos_resueltos: [ejemplo({ pasos: [] })] }),
      EJEMPLO,
      'pasos',
    ],
    ['un ejemplo que va aparte, nombrado por su objetivo', 'ejemplo', ejemploAparte({ pasos: [] }), EJEMPLO, 'pasos'],
    ['la fuente de un ítem', 'item', item({ fuente: sin(FUENTE, 'lugar') }), FUENTE_DEL_ITEM, 'lugar'],
    [
      'la fuente de una categoría',
      'categoria',
      categoria({ fuente: sin(FUENTE, 'lugar') }),
      FUENTE_DE_LA_CATEGORIA,
      'lugar',
    ],
  ])('@MATE-4.8 devuelve el fallo de %s', (...fila) => {
    const [, tipo, pieza, nombre, falta] = fila;
    expect(falloDeLaPiezaSuelta(tipo, pieza)).toStrictEqual({ pieza: nombre, falta });
  });

  it.each<[TipoDePieza, Pieza, string]>([
    ['objetivo', objetivo({ diagrama: 'graph TD; A-->B' }), OBJETIVO],
    ['ejemplo', ejemploAparte({ diagrama: 'graph TD; A-->B' }), EJEMPLO],
  ])('@MATE-2.7 una pieza suelta (%s) con un diagrama que no es SVG falla en diagrama', (tipo, pieza, nombre) => {
    expect(falloDeLaPiezaSuelta(tipo, pieza)).toStrictEqual({ pieza: nombre, falta: 'diagrama' });
  });

  it.each<[TipoDePieza, Pieza]>([
    ['objetivo', objetivo({ diagrama: '<svg></svg>' })],
    ['ejemplo', ejemploAparte({ diagrama: '<svg></svg>' })],
  ])('@MATE-2.7 una pieza suelta (%s) con un diagrama SVG no tiene fallo', (tipo, pieza) => {
    expect(falloDeLaPiezaSuelta(tipo, pieza)).toBeUndefined();
  });

  it.each([true, false])('@MATE-2.8 un ítem con «reservado» igual a %s cumple el formato', (reservado) => {
    expect(falloDeLaPiezaSuelta('item', item({ reservado }))).toBeUndefined();
  });

  it('@MATE-2.8 un ítem sin «reservado» cumple el formato, también con el campo a undefined', () => {
    expect(falloDeLaPiezaSuelta('item', item())).toBeUndefined();
    expect(falloDeLaPiezaSuelta('item', item({ reservado: undefined }))).toBeUndefined();
  });

  it.each(['sí', 'true', 1, 0, null, [], {}])(
    '@MATE-2.9 un ítem con «reservado» igual a %j falla en reservado',
    (reservado) => {
      expect(falloDeLaPiezaSuelta('item', item({ reservado }))).toStrictEqual({ pieza: ITEM, falta: 'reservado' });
    },
  );

  it('@MATE-2.9 «reservado» solo lo mira un ítem: en las demás piezas es una propiedad de más', () => {
    expect(falloDeLaPiezaSuelta('categoria', categoria({ reservado: 'sí' }))).toBeUndefined();
    expect(falloDeLaPiezaSuelta('tarea', tarea({ reservado: 'sí' }))).toBeUndefined();
  });

  it('@MATE-4.8 un ejemplo sin objetivo se nombra como de «su objetivo»', () => {
    expect(falloDeLaPiezaSuelta('ejemplo', ejemplo({ pasos: [] }))).toStrictEqual({
      pieza: 'el ejemplo resuelto E1 de su objetivo',
      falta: 'pasos',
    });
  });

  it.each<[TipoDePieza, string]>([
    ['objetivo', 'el objetivo 1'],
    ['ejemplo', 'el ejemplo resuelto 1 de su objetivo'],
    ['item', 'el ítem 1'],
    ['categoria', 'la categoría 1'],
    ['tarea', 'la tarea 1'],
  ])('@MATE-4.8 lo que no es un objeto (%s) falla en id, como la primera de su lista', (tipo, nombre) => {
    expect(falloDeLaPiezaSuelta(tipo, 'texto')).toStrictEqual({ pieza: nombre, falta: 'id' });
  });

  // Una pieza sin `id` válido: lo que no es un objeto y un objeto al que le falta el `id`. Cada fila dice
  // el `id` de la corrección, cómo se nombra la pieza con él y cómo se nombra sin él.
  const PIEZAS_SIN_ID: Record<TipoDePieza, Pieza> = {
    objetivo: sin(objetivo(), 'id'),
    ejemplo: sin(ejemplo(), 'id'),
    item: sin(item(), 'id'),
    categoria: sin(categoria(), 'id'),
    tarea: sin(tarea(), 'id'),
  };
  const NOMBRES_SIN_ID: [TipoDePieza, string, string, string][] = [
    ['objetivo', 'O7', 'el objetivo O7', 'el objetivo 1'],
    ['ejemplo', 'E9', 'el ejemplo resuelto E9 de su objetivo', 'el ejemplo resuelto 1 de su objetivo'],
    ['item', 'I7', 'el ítem I7', 'el ítem 1'],
    ['categoria', 'C1', 'la categoría C1', 'la categoría 1'],
    ['tarea', 'T3', 'la tarea T3', 'la tarea 1'],
  ];

  it.each(NOMBRES_SIN_ID)(
    '@MATE-4.8 lo que no es un objeto (%s) se nombra con el id que viene, «%s»',
    (tipo, id, nombreConId) => {
      expect(falloDeLaPiezaSuelta(tipo, 'texto', id)).toStrictEqual({ pieza: nombreConId, falta: 'id' });
    },
  );

  it.each(NOMBRES_SIN_ID)(
    '@MATE-4.8 una pieza sin id (%s) se nombra con el id que viene, «%s», y sin él, por su posición',
    (...fila) => {
      const [tipo, id, nombreConId, nombreSinId] = fila;
      const pieza = PIEZAS_SIN_ID[tipo];
      expect(falloDeLaPiezaSuelta(tipo, pieza, id)).toStrictEqual({ pieza: nombreConId, falta: 'id' });
      expect(falloDeLaPiezaSuelta(tipo, pieza)).toStrictEqual({ pieza: nombreSinId, falta: 'id' });
    },
  );

  it.each<[string, TipoDePieza, Pieza, string, string]>([
    ['un objetivo', 'objetivo', sin(objetivo(), 'instruccion'), OBJETIVO, 'instruccion'],
    ['un ejemplo que va aparte', 'ejemplo', ejemploAparte({ pasos: [] }), EJEMPLO, 'pasos'],
    ['un ítem', 'item', sin(item(), 'feedback'), ITEM, 'feedback'],
    ['una categoría', 'categoria', sin(categoria(), 'descripcion'), CATEGORIA, 'descripcion'],
    ['una tarea', 'tarea', tarea({ rubrica: [] }), TAREA, 'rubrica'],
    ['la fuente de un ítem', 'item', item({ fuente: sin(FUENTE, 'lugar') }), FUENTE_DEL_ITEM, 'lugar'],
  ])('@MATE-4.8 %s con un id válido distinto del que viene se nombra por el suyo', (...fila) => {
    const [, tipo, pieza, nombre, falta] = fila;
    expect(falloDeLaPiezaSuelta(tipo, pieza, 'X99')).toStrictEqual({ pieza: nombre, falta });
  });

  it('@MATE-4.8 el id que viene es el de la pieza, no el de los ejemplos que lleva dentro un objetivo', () => {
    const conEjemploSinId = objetivo({ ejemplos_resueltos: [sin(ejemplo(), 'id')] });
    expect(falloDeLaPiezaSuelta('objetivo', conEjemploSinId, 'O7')).toStrictEqual({
      pieza: 'el ejemplo resuelto 1 de O2',
      falta: 'id',
    });
  });
});

describe('lugarDelFallo', () => {
  it('@MATE-4.8 dice la propiedad y la pieza con «en», para no contraer el artículo de la pieza en «de el»', () => {
    expect(lugarDelFallo({ pieza: 'el ítem I7', falta: 'feedback' })).toBe('«feedback» en el ítem I7');
    expect(lugarDelFallo({ pieza: 'la tarea T3', falta: 'rubrica' })).toBe('«rubrica» en la tarea T3');
  });

  it('@MATE-4.8 un fallo en la raíz, sin pieza, solo dice la propiedad', () => {
    expect(lugarDelFallo({ falta: 'dominio' })).toBe('«dominio»');
  });
});

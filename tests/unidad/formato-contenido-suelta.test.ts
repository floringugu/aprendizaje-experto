import { describe, expect, it } from 'vitest';
import { falloDeLaPiezaSuelta, lugarDelFallo, type TipoDePieza } from '../../src/aplicacion/formato-contenido.ts';
import {
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

describe('falloDeLaPiezaSuelta', () => {
  /** Un ejemplo que va aparte lleva el `objetivo` del que cuelga. */
  const ejemploAparte = (cambios: Pieza = {}): Pieza => ejemplo({ objetivo: 'O2', ...cambios });

  it.each<[TipoDePieza, Pieza]>([
    ['objetivo', objetivo({ fuente: FUENTE })],
    ['ejemplo', ejemploAparte({ fuente: FUENTE })],
    ['item', item({ fuente: FUENTE })],
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
    ['tarea', 'la tarea 1'],
  ])('@MATE-4.8 lo que no es un objeto (%s) falla en id, como la primera de su lista', (tipo, nombre) => {
    expect(falloDeLaPiezaSuelta(tipo, 'texto')).toStrictEqual({ pieza: nombre, falta: 'id' });
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

import { describe, expect, it } from 'vitest';
import { validarContenido } from '../../src/aplicacion/formato-contenido.ts';
import { BorradorContenido, criterioPorDefecto } from '../aceptacion/soporte/contenido.ts';
import {
  categoria,
  CATEGORIA,
  comprobarFallos,
  contenido,
  criterio,
  ejemplo,
  EJEMPLO,
  enCategoria,
  enEjemplo,
  enItem,
  enNiveles,
  enObjetivo,
  enRubrica,
  enTarea,
  falloDe,
  FUENTE,
  FUENTE_DE_LA_TAREA,
  FUENTE_DEL_EJEMPLO,
  FUENTE_DEL_ITEM,
  FUENTE_DEL_OBJETIVO,
  item,
  ITEM,
  nivel,
  objetivo,
  OBJETIVO,
  sin,
  tarea,
  TAREA,
  type Pieza,
} from './formato-contenido-piezas.ts';

describe('validarContenido: contenido que cumple el formato', () => {
  it('D16 un contenido válido pasa y se devuelve el mismo objeto, sin copiarlo', () => {
    const leido = contenido();
    const resultado = validarContenido(leido);
    expect(resultado.ok).toBe(true);
    expect(resultado.ok ? resultado.valor : undefined).toBe(leido);
  });

  it('D16 las propiedades de más se ignoran, en cualquier pieza', () => {
    const conDeMas = (pieza: Pieza): Pieza => ({ ...pieza, borrador: 'sobra' });
    const leido = contenido({
      sobra: true,
      objetivos: [conDeMas(objetivo({ ejemplos_resueltos: [conDeMas(ejemplo())], fuente: conDeMas(FUENTE) }))],
      categorias: [conDeMas(categoria())],
      items: [conDeMas(item({ respuesta: conDeMas({ opciones: ['a'], correcta: 'a' }) }))],
      tareas: [conDeMas(tarea({ rubrica: [conDeMas(criterio({ niveles: [conDeMas(nivel())] }))] }))],
    });
    expect(falloDe(leido)).toBeUndefined();
  });

  it('D16 las listas de la raíz y los ejemplos resueltos pueden estar vacíos', () => {
    const vacio = contenido({ objetivos: [], categorias: [], items: [], tareas: [] });
    expect(falloDe(vacio)).toBeUndefined();
    expect(falloDe(enObjetivo({ ejemplos_resueltos: [] }))).toBeUndefined();
  });

  it('D16 las propiedades opcionales pueden venir, con la fuente en cada pieza que la admite', () => {
    const leido = contenido({
      objetivos: [objetivo({ fuente: FUENTE, ejemplos_resueltos: [ejemplo({ fuente: FUENTE })] })],
      categorias: [categoria({ grupo_parecidas: 'G1' })],
      items: [item({ categoria: 'C1', fuente: FUENTE }), item({ respuesta: { aceptadas: ['x', 'y'] } })],
      tareas: [tarea({ fuente: FUENTE })],
    });
    expect(falloDe(leido)).toBeUndefined();
  });

  it('D16 una propiedad opcional que vale undefined cuenta como ausente', () => {
    const leido = contenido({
      objetivos: [objetivo({ fuente: undefined })],
      categorias: [categoria({ grupo_parecidas: undefined })],
      items: [item({ categoria: undefined, fuente: undefined })],
      tareas: [tarea({ fuente: undefined })],
    });
    expect(falloDe(leido)).toBeUndefined();
  });

  it('D16 el contenido que montan los escenarios de aceptación cumple el formato', () => {
    const borrador = new BorradorContenido('mate');
    borrador.agregarItems('O1', 2, { diagnostico: true });
    borrador.hacerIntercalables(2);
    borrador.fijarTareas(['T1', 'T2']);
    borrador.fijarRubrica('T2', [criterioPorDefecto('Planteamiento'), criterioPorDefecto('Resultado')]);
    expect(borrador.objetivos.map((actual) => actual.id)).toStrictEqual(['O1', 'O2', 'O3']);
    expect(falloDe(borrador.toContenido())).toBeUndefined();
  });
});

describe('validarContenido: la raíz', () => {
  it.each([null, 'texto', 7, []])('D16 si lo leído no es un objeto (%j), falla en dominio', (leido) => {
    expect(falloDe(leido)).toStrictEqual({ falta: 'dominio' });
  });

  it.each([
    ['falta', sin(contenido(), 'dominio')],
    ['está vacío', contenido({ dominio: '' })],
    ['no es un texto', contenido({ dominio: 5 })],
  ])('D16 dominio %s: falla en dominio, sin pieza', (_caso, leido) => {
    expect(falloDe(leido)).toStrictEqual({ falta: 'dominio' });
  });

  it.each(['objetivos', 'categorias', 'items', 'tareas'])(
    'D16 si %s falta o no es una lista, falla en él',
    (nombre) => {
      expect(falloDe(sin(contenido(), nombre))).toStrictEqual({ falta: nombre });
      expect(falloDe(contenido({ [nombre]: { id: 'X' } }))).toStrictEqual({ falta: nombre });
    },
  );

  it('D16 devuelve el primer fallo en el orden del fichero: dominio, objetivos, categorías, ítems y tareas', () => {
    const roto = contenido({ categorias: [categoria({ id: '' })], items: [item({ tipo: 'x' })], tareas: 'no' });
    expect(falloDe(roto)).toStrictEqual({ pieza: 'la categoría 1', falta: 'id' });
    const conObjetivoRoto = { ...roto, objetivos: [objetivo({ instruccion: '' })] };
    expect(falloDe(conObjetivoRoto)).toStrictEqual({ pieza: OBJETIVO, falta: 'instruccion' });
  });
});

describe('validarContenido: objetivos y ejemplos resueltos', () => {
  comprobarFallos([
    ['un objetivo que no es un objeto', contenido({ objetivos: ['O1'] }), 'el objetivo 1', 'id'],
    ['un objetivo sin id', contenido({ objetivos: [objetivo(), sin(objetivo(), 'id')] }), 'el objetivo 2', 'id'],
    ['una instrucción vacía', enObjetivo({ instruccion: '' }), OBJETIVO, 'instruccion'],
    ['ejemplos_resueltos que falta', enObjetivo({ ejemplos_resueltos: undefined }), OBJETIVO, 'ejemplos_resueltos'],
    ['ejemplos_resueltos sin lista', enObjetivo({ ejemplos_resueltos: ejemplo() }), OBJETIVO, 'ejemplos_resueltos'],
    ['un ejemplo que no es un objeto', enObjetivo({ ejemplos_resueltos: ['E1'] }), 'el ejemplo resuelto 1 de O2', 'id'],
    ['un ejemplo sin id', enObjetivo({ ejemplos_resueltos: [ejemplo(), {}] }), 'el ejemplo resuelto 2 de O2', 'id'],
    ['unos pasos vacíos', enEjemplo({ pasos: [] }), EJEMPLO, 'pasos'],
    ['unos pasos que faltan', enEjemplo({ pasos: undefined }), EJEMPLO, 'pasos'],
    ['un paso que no es un texto', enEjemplo({ pasos: ['P1', 2] }), EJEMPLO, 'pasos'],
    ['un paso vacío', enEjemplo({ pasos: [''] }), EJEMPLO, 'pasos'],
    [
      'los ejemplos van antes que la fuente',
      enObjetivo({ fuente: 'x', ejemplos_resueltos: [{ id: 'E1' }] }),
      EJEMPLO,
      'pasos',
    ],
  ]);
});

describe('validarContenido: diagrama de objetivos y ejemplos resueltos', () => {
  const SVG = '<svg viewBox="0 0 10 10"><circle r="4"/></svg>';
  const colocaciones: [string, (diagrama: unknown) => Pieza, string][] = [
    ['objetivo', (diagrama) => enObjetivo({ diagrama }), OBJETIVO],
    ['ejemplo', (diagrama) => enEjemplo({ diagrama }), EJEMPLO],
  ];

  it.each(colocaciones)('@MATE-2.7 un diagrama SVG con atributos y varias líneas vale en el %s', (_donde, en) => {
    expect(falloDe(en(SVG))).toBeUndefined();
    expect(falloDe(en('<svg>\n  <g/>\n</svg>'))).toBeUndefined();
    expect(falloDe(en('<svg></svg>'))).toBeUndefined();
  });

  it.each(colocaciones)('@MATE-2.7 un diagrama ausente o undefined vale en el %s', (_donde, en) => {
    expect(falloDe(en(undefined))).toBeUndefined();
    const sinDiagrama = contenido({ objetivos: [objetivo()] });
    expect(falloDe(sinDiagrama)).toBeUndefined();
  });

  const invalidos: [string, unknown][] = [
    ['un texto vacío', ''],
    ['código de Mermaid', 'graph TD; A-->B'],
    ['un número', 7],
    ['null', null],
    ['un objeto', { svg: SVG }],
    ['un texto con espacios delante', ` ${SVG}`],
    ['un texto con un salto de línea al final', `${SVG}\n`],
    ['un texto que empieza bien pero no acaba en </svg>', '<svg><g/>'],
    ['un texto que acaba bien pero no empieza por <svg', '<g/></svg>'],
    ['un SVG en mayúsculas', '<SVG></SVG>'],
  ];

  it.each(invalidos)('@MATE-2.7 %s no vale como diagrama, ni en el objetivo ni en el ejemplo', (_caso, diagrama) => {
    for (const [, en, pieza] of colocaciones) {
      expect(falloDe(en(diagrama))).toStrictEqual({ pieza, falta: 'diagrama' });
    }
  });

  it('@MATE-2.7 el diagrama se mira después de la instrucción y de los pasos, y antes que la fuente', () => {
    const malo = 'graph TD; A-->B';
    expect(falloDe(enObjetivo({ instruccion: '', diagrama: malo }))).toStrictEqual({
      pieza: OBJETIVO,
      falta: 'instruccion',
    });
    expect(falloDe(enEjemplo({ pasos: [], diagrama: malo }))).toStrictEqual({ pieza: EJEMPLO, falta: 'pasos' });
    expect(falloDe(enObjetivo({ diagrama: malo, fuente: 'x' }))).toStrictEqual({ pieza: OBJETIVO, falta: 'diagrama' });
    expect(falloDe(enEjemplo({ diagrama: malo, fuente: 'x' }))).toStrictEqual({ pieza: EJEMPLO, falta: 'diagrama' });
  });
});

describe('validarContenido: categorías', () => {
  comprobarFallos([
    ['una categoría que no es un objeto', contenido({ categorias: [categoria(), 'C2'] }), 'la categoría 2', 'id'],
    ['una categoría sin id', enCategoria({ id: undefined }), 'la categoría 1', 'id'],
    ['un grupo_parecidas vacío', enCategoria({ grupo_parecidas: '' }), CATEGORIA, 'grupo_parecidas'],
    ['un grupo_parecidas que no es un texto', enCategoria({ grupo_parecidas: 1 }), CATEGORIA, 'grupo_parecidas'],
  ]);

  it.each([
    ['que falta', contenido({ categorias: [sin(categoria(), 'descripcion')] })],
    ['que vale undefined', enCategoria({ descripcion: undefined })],
    ['vacía', enCategoria({ descripcion: '' })],
    ['que no es un texto', enCategoria({ descripcion: 3 })],
    ['vacía, con un grupo_parecidas también vacío', enCategoria({ descripcion: '', grupo_parecidas: '' })],
  ])('@MATE-2.3 una descripción %s falla en descripcion', (_caso, leido) => {
    expect(falloDe(leido)).toStrictEqual({ pieza: CATEGORIA, falta: 'descripcion' });
  });
});

describe('validarContenido: ítems', () => {
  comprobarFallos([
    ['un ítem que no es un objeto', contenido({ items: [item(), item({ id: 'I10' }), 3] }), 'el ítem 3', 'id'],
    ['un ítem sin id', enItem({ id: '' }), 'el ítem 1', 'id'],
    ['un objetivo que falta', enItem({ objetivo: undefined }), ITEM, 'objetivo'],
    ['una categoría vacía', enItem({ categoria: '' }), ITEM, 'categoria'],
    ['un tipo que no es hecho ni problema', enItem({ tipo: 'otro' }), ITEM, 'tipo'],
    ['un diagnostico que no es un booleano', enItem({ diagnostico: 'sí' }), ITEM, 'diagnostico'],
    ['un enunciado vacío', enItem({ enunciado: '' }), ITEM, 'enunciado'],
    ['un feedback que falta', enItem({ feedback: undefined }), ITEM, 'feedback'],
    ['el tipo se mira antes que el enunciado', enItem({ tipo: 'x', enunciado: '' }), ITEM, 'tipo'],
    ['la respuesta se mira antes que el feedback', enItem({ respuesta: {}, feedback: '' }), ITEM, 'respuesta'],
    ['el feedback se mira antes que la fuente', enItem({ feedback: '', fuente: 'x' }), ITEM, 'feedback'],
  ]);
});

describe('validarContenido: tareas y rúbrica', () => {
  comprobarFallos([
    ['una tarea que no es un objeto', contenido({ tareas: [tarea(), null] }), 'la tarea 2', 'id'],
    ['una tarea sin id', enTarea({ id: undefined }), 'la tarea 1', 'id'],
    ['un enunciado de tarea vacío', enTarea({ enunciado: '' }), TAREA, 'enunciado'],
    ['una rúbrica que falta', enRubrica(undefined), TAREA, 'rubrica'],
    ['una rúbrica vacía', enRubrica([]), TAREA, 'rubrica'],
    ['una rúbrica que no es una lista', enRubrica(criterio()), TAREA, 'rubrica'],
    ['un criterio que no es un objeto', enRubrica([criterio(), 'Planteamiento']), TAREA, 'rubrica'],
    ['un criterio con el texto vacío', enRubrica([criterio({ criterio: '' })]), TAREA, 'criterio'],
    ['unos niveles que faltan', enNiveles(undefined), TAREA, 'niveles'],
    ['unos niveles vacíos', enNiveles([]), TAREA, 'niveles'],
    ['un nivel que no es un objeto', enNiveles([nivel(), 1]), TAREA, 'niveles'],
    ['un nivel que no es un número', enNiveles([nivel({ nivel: '1' })]), TAREA, 'nivel'],
    ['un nivel que falta', enNiveles([nivel({ nivel: undefined })]), TAREA, 'nivel'],
    ['un descriptor vacío', enNiveles([nivel(), nivel({ descriptor: '' })]), TAREA, 'descriptor'],
    ['un fallo en el segundo criterio', enRubrica([criterio(), criterio({ niveles: [] })]), TAREA, 'niveles'],
  ]);
});

describe('validarContenido: fuente', () => {
  comprobarFallos([
    ['una fuente que no es un objeto', enItem({ fuente: 'apuntes' }), ITEM, 'fuente'],
    ['una fuente null', enTarea({ fuente: null }), TAREA, 'fuente'],
    ['un ítem con la fuente sin documento', enItem({ fuente: sin(FUENTE, 'documento') }), FUENTE_DEL_ITEM, 'documento'],
    ['una tarea con un lugar vacío', enTarea({ fuente: { ...FUENTE, lugar: '' } }), FUENTE_DE_LA_TAREA, 'lugar'],
    [
      'un objetivo con un fragmento numérico',
      enObjetivo({ fuente: { ...FUENTE, fragmento: 4 } }),
      FUENTE_DEL_OBJETIVO,
      'fragmento',
    ],
    [
      'un ejemplo con la fuente sin documento',
      enEjemplo({ fuente: sin(FUENTE, 'documento') }),
      FUENTE_DEL_EJEMPLO,
      'documento',
    ],
    ['documento se mira antes que lugar', enItem({ fuente: { lugar: '' } }), FUENTE_DEL_ITEM, 'documento'],
  ]);
});

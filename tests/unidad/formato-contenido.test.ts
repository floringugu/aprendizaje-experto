import { describe, expect, it } from 'vitest';
import { validarContenido } from '../../src/aplicacion/formato-contenido.ts';
import { BorradorContenido, criterioPorDefecto } from '../aceptacion/soporte/contenido.ts';

// Las piezas se construyen como las leería `leerContenido` de un fichero JSON: objetos sin tipar.
// Un cambio a `undefined` equivale a que la propiedad falte: la validación no distingue una cosa de la otra.
type Pieza = Record<string, unknown>;

const FUENTE: Pieza = { documento: 'apuntes.pdf', lugar: 'página 12', fragmento: 'texto citado' };

// Cómo nombra la validación las piezas de los contenidos de prueba.
const OBJETIVO = 'el objetivo O2';
const EJEMPLO = 'el ejemplo resuelto E1 de O2';
const CATEGORIA = 'la categoría C1';
const ITEM = 'el ítem I9';
const TAREA = 'la tarea T3';
// Y las fuentes de esas piezas.
const FUENTE_DEL_OBJETIVO = 'la fuente del objetivo O2';
const FUENTE_DEL_EJEMPLO = 'la fuente del ejemplo resuelto E1 de O2';
const FUENTE_DEL_ITEM = 'la fuente del ítem I9';
const FUENTE_DE_LA_TAREA = 'la fuente de la tarea T3';

function nivel(cambios: Pieza = {}): Pieza {
  return { nivel: 0, descriptor: 'Descriptor', ...cambios };
}
function criterio(cambios: Pieza = {}): Pieza {
  return { criterio: 'Planteamiento', niveles: [nivel()], ...cambios };
}
function tarea(cambios: Pieza = {}): Pieza {
  return { id: 'T3', enunciado: 'Enunciado', rubrica: [criterio()], ...cambios };
}
function ejemplo(cambios: Pieza = {}): Pieza {
  return { id: 'E1', pasos: ['P1', 'P2'], ...cambios };
}
function objetivo(cambios: Pieza = {}): Pieza {
  return { id: 'O2', instruccion: 'Instrucción', ejemplos_resueltos: [ejemplo()], ...cambios };
}
function categoria(cambios: Pieza = {}): Pieza {
  return { id: 'C1', ...cambios };
}
function item(cambios: Pieza = {}): Pieza {
  return {
    id: 'I9',
    objetivo: 'O2',
    tipo: 'hecho',
    diagnostico: false,
    enunciado: 'Enunciado',
    respuesta: { opciones: ['a', 'b'], correcta: 'a' },
    feedback: 'Feedback',
    ...cambios,
  };
}
function contenido(cambios: Pieza = {}): Pieza {
  const piezas = { objetivos: [objetivo()], categorias: [categoria()], items: [item()], tareas: [tarea()] };
  return { dominio: 'mate', ...piezas, ...cambios };
}
/** La pieza sin esa propiedad, como si el autor no la hubiera escrito. */
function sin(pieza: Pieza, nombre: string): Pieza {
  return Object.fromEntries(Object.entries(pieza).filter(([clave]) => clave !== nombre));
}

// Un contenido válido salvo la pieza que se indica, para ver qué falla en ella.
const enObjetivo = (cambios: Pieza): Pieza => contenido({ objetivos: [objetivo(cambios)] });
const enEjemplo = (cambios: Pieza): Pieza => enObjetivo({ ejemplos_resueltos: [ejemplo(cambios)] });
const enCategoria = (cambios: Pieza): Pieza => contenido({ categorias: [categoria(cambios)] });
const enItem = (cambios: Pieza): Pieza => contenido({ items: [item(cambios)] });
const enRespuesta = (respuesta: unknown): Pieza => enItem({ respuesta });
const enTarea = (cambios: Pieza): Pieza => contenido({ tareas: [tarea(cambios)] });
const enRubrica = (rubrica: unknown): Pieza => enTarea({ rubrica });
const enNiveles = (niveles: unknown): Pieza => enRubrica([criterio({ niveles })]);

function falloDe(leido: unknown): unknown {
  const resultado = validarContenido(leido);
  return resultado.ok ? undefined : resultado.fallo;
}

/** Descripción, lo leído, y la pieza y la propiedad que se espera que fallen. */
type Fila = [descripcion: string, leido: unknown, pieza: string, falta: string];

function comprobarFallos(filas: readonly Fila[]): void {
  it.each(filas)('D16 %s', (...fila) => {
    const [, leido, pieza, falta] = fila;
    expect(falloDe(leido)).toStrictEqual({ pieza, falta });
  });
}

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

describe('validarContenido: categorías', () => {
  comprobarFallos([
    ['una categoría que no es un objeto', contenido({ categorias: [categoria(), 'C2'] }), 'la categoría 2', 'id'],
    ['una categoría sin id', enCategoria({ id: undefined }), 'la categoría 1', 'id'],
    ['un grupo_parecidas vacío', enCategoria({ grupo_parecidas: '' }), CATEGORIA, 'grupo_parecidas'],
    ['un grupo_parecidas que no es un texto', enCategoria({ grupo_parecidas: 1 }), CATEGORIA, 'grupo_parecidas'],
  ]);
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

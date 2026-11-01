import { describe, expect, it } from 'vitest';
import type { ContenidoDominio } from '../../src/aplicacion/contenido.ts';
import { aprobadoParaLaIa, incorporarEntrega, peticionDeReservados } from '../../src/aplicacion/redaccion.ts';
import { ejemploAparte, entregaCon, faltas } from './redaccion-fabricas.ts';
import {
  categoria,
  ejemplo,
  FUENTE_BUENA,
  item,
  itemDeCategoria,
  mesaDe,
  objetivo,
  tarea,
} from './revision-fabricas.ts';

describe('aprobadoParaLaIa', () => {
  const aprobado: ContenidoDominio = {
    dominio: 'ficticio',
    objetivos: [objetivo('O1', [ejemplo('E1')], FUENTE_BUENA), objetivo('O2')],
    categorias: [
      { ...categoria('C1', FUENTE_BUENA), grupo_parecidas: 'G1' },
      categoria('C2'),
      { ...categoria('C3'), grupo_parecidas: 'G1' },
    ],
    items: [item('I1'), item('I2')],
    tareas: [tarea('T2', FUENTE_BUENA), tarea('T1')],
  };

  it('@MATE-2.2 da solo los campos que la IA necesita, en el orden del contenido (regla que la feature no cubre)', () => {
    expect(aprobadoParaLaIa(aprobado)).toStrictEqual({
      objetivos: [
        { id: 'O1', instruccion: 'Instrucción de O1' },
        { id: 'O2', instruccion: 'Instrucción de O2' },
      ],
      categorias: [
        { id: 'C1', descripcion: 'Descripción de C1', grupo_parecidas: 'G1' },
        { id: 'C2', descripcion: 'Descripción de C2' },
        { id: 'C3', descripcion: 'Descripción de C3', grupo_parecidas: 'G1' },
      ],
      tareas: [
        { id: 'T2', enunciado: 'Enunciado de T2' },
        { id: 'T1', enunciado: 'Enunciado de T1' },
      ],
    });
  });

  it('@MATE-2.2 un contenido sin piezas da tres listas vacías (regla que la feature no cubre)', () => {
    const vacio: ContenidoDominio = { dominio: 'ficticio', objetivos: [], categorias: [], items: [], tareas: [] };
    expect(aprobadoParaLaIa(vacio)).toStrictEqual({ objetivos: [], categorias: [], tareas: [] });
  });
});

describe('peticionDeReservados', () => {
  const mesa = mesaDe(
    {
      objetivos: [objetivo('O3')],
      items: [item('I9', undefined, 'O1'), item('I10', undefined, 'O3'), item('I8', undefined, 'O1')],
    },
    {
      objetivos: [objetivo('O1'), objetivo('O2')],
      items: [item('I1', undefined, 'O1'), item('I2', undefined, 'O2'), item('I3', undefined, 'O1')],
    },
  );

  it('@MATE-2.10 pide el objetivo y los enunciados de sus ítems, primero los aprobados y después los pendientes', () => {
    expect(peticionDeReservados(mesa, 'O1')).toStrictEqual({
      objetivo: 'O1',
      enunciados: ['Enunciado de I1', 'Enunciado de I3', 'Enunciado de I9', 'Enunciado de I8'],
    });
  });

  it('@MATE-2.10 un objetivo solo del borrador vale: sus enunciados son los de los ítems pendientes', () => {
    expect(peticionDeReservados(mesa, 'O3')).toStrictEqual({ objetivo: 'O3', enunciados: ['Enunciado de I10'] });
  });

  it('@MATE-2.10 un objetivo sin ítems da una lista de enunciados vacía', () => {
    const sinItems = mesaDe({}, { objetivos: [objetivo('O1')] });
    expect(peticionDeReservados(sinItems, 'O1')).toStrictEqual({ objetivo: 'O1', enunciados: [] });
  });

  it.each(['O9', 'I1', 'C1'])(
    '@MATE-2.10 da undefined si «%s» no es un objetivo del aprobado ni del borrador',
    (id) => {
      const conCategoria = mesaDe({ categorias: [categoria('C1')] }, { items: [item('I1')] });
      expect(peticionDeReservados(conCategoria, id)).toBeUndefined();
    },
  );
});

describe('incorporarEntrega: qué se lee', () => {
  const mesa = mesaDe({ items: [item('I7')] }, { objetivos: [objetivo('O1')] });

  it.each<[string, unknown]>([
    ['null', null],
    ['undefined', undefined],
    ['un texto', 'texto'],
    ['un número', 5],
    ['una lista', [item('I1')]],
  ])('@MATE-2.3 una entrega que es %s no aporta nada', (_, entrega) => {
    expect(incorporarEntrega(mesa, entrega)).toStrictEqual({ borrador: mesa.borrador, apartadas: [] });
  });

  it('@MATE-2.3 una lista que falta, o que no es una lista, no aporta nada y las demás se leen', () => {
    const entrega = entregaCon({ objetivos: { id: 'O2' }, items: 'no', categorias: null, tareas: [tarea('T1')] });
    const resultado = incorporarEntrega(mesa, entrega);
    expect(resultado.borrador).toStrictEqual({ ...mesa.borrador, tareas: [tarea('T1')] });
    expect(resultado.apartadas).toStrictEqual([]);
  });

  it('@MATE-2.3 el dominio y las propiedades que no son listas de piezas se ignoran', () => {
    const resultado = incorporarEntrega(mesa, { dominio: 'otro', comentario: 'hola', items: [item('I1')] });
    expect(resultado.borrador).toStrictEqual({ ...mesa.borrador, items: [item('I7'), item('I1')] });
    expect(resultado.apartadas).toStrictEqual([]);
  });

  it('@MATE-2.3 una entrega vacía devuelve un borrador igual al de la mesa, que no se toca', () => {
    const resultado = incorporarEntrega(mesa, entregaCon({}));
    expect(resultado.borrador).toStrictEqual(mesa.borrador);
    expect(resultado.borrador).not.toBe(mesa.borrador);
  });

  it('@MATE-2.1 no cambia la entrega que recibe', () => {
    const entrega = entregaCon({
      objetivos: [objetivo('O1', [ejemplo('E1')])],
      ejemplos_resueltos: [ejemploAparte('E2', 'O1')],
      items: [
        { ...item('I7'), diagnostico: true },
        { ...item('I8'), feedback: '' },
      ],
      categorias: [categoria('C1')],
      tareas: [{ ...tarea('T1'), antes_de: 'T9' }],
    });
    const antes = structuredClone(entrega);
    incorporarEntrega(mesa, entrega);
    expect(entrega).toStrictEqual(antes);
  });

  it('@MATE-2.3 las apartadas siguen el orden de las listas de la entrega, no el de sus claves', () => {
    const entrega = {
      tareas: [{ ...tarea('T1'), rubrica: [] }],
      categorias: [{ ...categoria('C1'), descripcion: '' }],
      items: [
        { ...item('I1'), feedback: '' },
        { ...item('I2'), respuesta: 'no' },
      ],
      ejemplos_resueltos: [{ ...ejemploAparte('E1', 'O1'), pasos: [] }],
      objetivos: [{ ...objetivo('O2'), instruccion: '' }],
    };
    expect(faltas(incorporarEntrega(mesa, entrega))).toStrictEqual([
      'instruccion',
      'pasos',
      'feedback',
      'respuesta',
      'descripcion',
      'rubrica',
    ]);
  });
});

describe('incorporarEntrega: formato', () => {
  const mesa = mesaDe({}, { objetivos: [objetivo('O1')] });
  const svgMalo = 'graph TD; A-->B';

  // Cada fila: la lista de la entrega, la pieza buena, la mala y lo que le falta. La pieza buena de los
  // ejemplos que van aparte cuelga de un objetivo que no está en la entrega, así que acaba en la raíz del
  // borrador con el mismo nombre de lista; el resto, en la lista que se llama igual que en la entrega.
  const BUENA = {
    objetivos: objetivo('O2', [ejemplo('E2')]),
    ejemplos_resueltos: ejemploAparte('E3', 'O1'),
    items: item('I2'),
    categorias: categoria('C2'),
    tareas: tarea('T2'),
  };
  const MALAS: [string, keyof typeof BUENA, unknown, string][] = [
    ['un objetivo sin instrucción', 'objetivos', { ...objetivo('O3'), instruccion: undefined }, 'instruccion'],
    ['un objetivo con un ejemplo sin pasos', 'objetivos', objetivo('O3', [{ ...ejemplo('E9'), pasos: [] }]), 'pasos'],
    ['un objetivo con un diagrama que no es SVG', 'objetivos', { ...objetivo('O3'), diagrama: svgMalo }, 'diagrama'],
    ['un objetivo con una fuente sin lugar', 'objetivos', { ...objetivo('O3'), fuente: { documento: 'a' } }, 'lugar'],
    ['un ejemplo sin pasos', 'ejemplos_resueltos', { ...ejemploAparte('E9', 'O1'), pasos: undefined }, 'pasos'],
    [
      'un ejemplo con un diagrama que no es SVG',
      'ejemplos_resueltos',
      { ...ejemploAparte('E9', 'O1'), diagrama: svgMalo },
      'diagrama',
    ],
    ['un ejemplo sin objetivo', 'ejemplos_resueltos', { ...ejemplo('E9') }, 'objetivo'],
    ['un ejemplo con el objetivo vacío', 'ejemplos_resueltos', ejemploAparte('E9', ''), 'objetivo'],
    [
      'un ejemplo con un objetivo que no es un texto',
      'ejemplos_resueltos',
      { ...ejemplo('E9'), objetivo: 5 },
      'objetivo',
    ],
    ['un ítem sin respuesta', 'items', { ...item('I9'), respuesta: undefined }, 'respuesta'],
    ['un ítem sin feedback', 'items', { ...item('I9'), feedback: undefined }, 'feedback'],
    [
      'un ítem con dos opciones iguales',
      'items',
      { ...item('I9'), respuesta: { opciones: ['La regla R1', 'la regla  R1'], correcta: 'La regla R1' } },
      'opciones',
    ],
    ['un ítem con «reservado» igual a «sí»', 'items', { ...item('I9'), reservado: 'sí' }, 'reservado'],
    [
      'un ítem con una fuente sin fragmento',
      'items',
      { ...item('I9'), fuente: { documento: 'a', lugar: 'b' } },
      'fragmento',
    ],
    ['una categoría sin descripción', 'categorias', { ...categoria('C9'), descripcion: undefined }, 'descripcion'],
    ['una tarea sin rúbrica', 'tareas', { ...tarea('T9'), rubrica: undefined }, 'rubrica'],
    [
      'una tarea con un nivel sin descriptor',
      'tareas',
      { ...tarea('T9'), rubrica: [{ criterio: 'C', niveles: [{ nivel: 0 }] }] },
      'descriptor',
    ],
    ['un objetivo que no es un objeto', 'objetivos', 'texto', 'id'],
    ['un ejemplo que no es un objeto', 'ejemplos_resueltos', 5, 'id'],
    ['un ítem que no es un objeto', 'items', null, 'id'],
    ['una categoría que no es un objeto', 'categorias', ['C9'], 'id'],
    ['una tarea sin id', 'tareas', { ...tarea('T9'), id: undefined }, 'id'],
  ];

  it.each(MALAS)('@MATE-2.3 %s se aparta con su falta, sola, y la pieza buena entra', (...fila) => {
    const [, lista, mala, falta] = fila;
    const entrega = entregaCon({ [lista]: [BUENA[lista], mala] });
    const resultado = incorporarEntrega(mesa, entrega);
    expect(resultado.apartadas).toStrictEqual([{ falta }]);
    expect(resultado.borrador).toStrictEqual({ ...mesa.borrador, [lista]: [BUENA[lista]] });
  });

  it('@MATE-2.3 una pieza que falla no entra ni se cuenta más de una vez si le fallan varias cosas', () => {
    const casiNada = { id: 'I9', objetivo: 'O1' };
    const resultado = incorporarEntrega(mesa, entregaCon({ items: [casiNada] }));
    expect(resultado.borrador.items).toStrictEqual([]);
    expect(resultado.apartadas).toHaveLength(1);
  });

  it('@MATE-2.3 un objetivo que falla se aparta entero, con los ejemplos que lleva dentro', () => {
    const malo = { ...objetivo('O3', [ejemplo('E1'), ejemplo('E2')]), instruccion: '' };
    const resultado = incorporarEntrega(mesa, entregaCon({ objetivos: [malo] }));
    expect(resultado.borrador.objetivos).toStrictEqual([]);
    expect(resultado.apartadas).toStrictEqual([{ falta: 'instruccion' }]);
  });

  it('@MATE-2.3 conserva las propiedades de más de una pieza válida, como las deja la validación', () => {
    // El diagrama no está en los tipos del contenido, solo en el formato: la pieza se escribe como el JSON de la IA.
    const ejemploConDiagrama: Record<string, unknown> = { ...ejemplo('E2'), diagrama: '<svg></svg>' };
    const conDiagrama = { ...objetivo('O2'), ejemplos_resueltos: [ejemploConDiagrama], diagrama: '<svg></svg>' };
    const conExtra = { ...item('I2', FUENTE_BUENA), nota: 'de más' };
    const resultado = incorporarEntrega(mesa, entregaCon({ objetivos: [conDiagrama], items: [conExtra] }));
    expect(resultado.borrador.objetivos).toStrictEqual([conDiagrama]);
    expect(resultado.borrador.items).toStrictEqual([conExtra]);
  });
});

describe('incorporarEntrega: diagnóstico y reservado', () => {
  const mesa = mesaDe({}, { objetivos: [objetivo('O1')] });

  it.each<[string, Record<string, unknown>]>([
    ['verdadero', { ...item('I2'), diagnostico: true }],
    ['ausente', { ...item('I2'), diagnostico: undefined }],
    ['un texto', { ...item('I2'), diagnostico: 'sí' }],
    ['un número', { ...item('I2'), diagnostico: 1 }],
    ['nulo', { ...item('I2'), diagnostico: null }],
  ])('@MATE-2.6 un ítem con el diagnóstico %s entra con diagnostico a falso y sin apartar', (_, recibido) => {
    const resultado = incorporarEntrega(mesa, entregaCon({ items: [recibido] }));
    expect(resultado.borrador.items).toStrictEqual([item('I2')]);
    expect(resultado.apartadas).toStrictEqual([]);
  });

  it('@MATE-2.6 el diagnóstico de la IA tampoco cuenta para apartar un ítem que falla por otra cosa', () => {
    const recibido = { ...item('I2'), diagnostico: 'sí', feedback: '' };
    const resultado = incorporarEntrega(mesa, entregaCon({ items: [recibido] }));
    expect(resultado.borrador.items).toStrictEqual([]);
    expect(faltas(resultado)).toStrictEqual(['feedback']);
  });

  it.each([true, false])('@MATE-2.8 un ítem con «reservado» igual a %s entra con la marca tal cual', (reservado) => {
    const recibido = { ...item('I2'), reservado };
    const resultado = incorporarEntrega(mesa, entregaCon({ items: [recibido] }));
    expect(resultado.borrador.items).toStrictEqual([{ ...item('I2'), reservado }]);
    expect(resultado.apartadas).toStrictEqual([]);
  });

  it('@MATE-2.8 un ítem sin «reservado» entra sin él', () => {
    const resultado = incorporarEntrega(mesa, entregaCon({ items: [itemDeCategoria('I2', 'C1')] }));
    expect(resultado.borrador.items).toStrictEqual([itemDeCategoria('I2', 'C1')]);
  });

  it.each([null, 1, 'true', []])(
    '@MATE-2.9 un ítem con «reservado» igual a %j se aparta con la falta «reservado»',
    (reservado) => {
      const resultado = incorporarEntrega(mesa, entregaCon({ items: [{ ...item('I2'), reservado }] }));
      expect(resultado.borrador.items).toStrictEqual([]);
      expect(resultado.apartadas).toStrictEqual([{ falta: 'reservado' }]);
    },
  );
});

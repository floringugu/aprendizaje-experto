import { describe, expect, it } from 'vitest';
import type { Marcador } from '../../src/dominio/citas.ts';
import type {
  ContenidoDominio,
  EjemploResueltoContenido,
  Fuente,
  ItemContenido,
  ObjetivoContenido,
  TareaContenido,
} from '../../src/aplicacion/contenido.ts';
import { aplicar, revisar, type Accion, type BorradorDominio, type Mesa } from '../../src/aplicacion/revision.ts';
import type { Resultado } from '../../src/aplicacion/resultado.ts';

const FUENTE_BUENA: Fuente = { documento: 'apuntes.pdf', lugar: 'página 12', fragmento: 'buena' };
const FUENTE_MALA: Fuente = { ...FUENTE_BUENA, fragmento: 'mala' };

/** Marcador hecho a mano: sin fuente es `sin_fuente`, el fragmento «mala» no se encuentra y el resto no lleva marca. */
const marcador: Marcador = (fuente) => {
  if (fuente === undefined) return 'sin_fuente';
  return fuente.fragmento === 'mala' ? 'cita_no_encontrada' : undefined;
};

const conFuente = (fuente: Fuente | undefined): { fuente?: Fuente } => (fuente === undefined ? {} : { fuente });

function item(id: string, fuente?: Fuente, objetivo = 'O1'): ItemContenido {
  const respuesta = { opciones: ['a', 'b'], correcta: 'a' };
  const base = { id, objetivo, tipo: 'hecho', diagnostico: false, enunciado: `Enunciado de ${id}`, respuesta };
  return { ...(base as Omit<ItemContenido, 'feedback'>), feedback: 'Feedback', ...conFuente(fuente) };
}
function ejemplo(id: string, fuente?: Fuente): EjemploResueltoContenido {
  return { id, pasos: ['P1'], ...conFuente(fuente) };
}
function objetivo(id: string, ejemplos: EjemploResueltoContenido[] = [], fuente?: Fuente): ObjetivoContenido {
  return { id, instruccion: `Instrucción de ${id}`, ejemplos_resueltos: ejemplos, ...conFuente(fuente) };
}
function tarea(id: string): TareaContenido {
  const rubrica = [{ criterio: 'Planteamiento', niveles: [{ nivel: 0, descriptor: 'Descriptor' }] }];
  return { id, enunciado: `Enunciado de ${id}`, rubrica };
}

/** Congela la mesa entera: si el código intenta cambiarla en vez de copiarla, el test falla con un error. */
function congelar<T>(valor: T): T {
  if (typeof valor === 'object' && valor !== null) {
    Object.values(valor).forEach(congelar);
    Object.freeze(valor);
  }
  return valor;
}

const VACIO: ContenidoDominio = { dominio: 'ficticio', objetivos: [], categorias: [], items: [], tareas: [] };
function mesaDe(borrador: Partial<BorradorDominio>, aprobado: Partial<ContenidoDominio> = {}): Mesa {
  return congelar({ borrador: { ...VACIO, ...borrador }, aprobado: { ...VACIO, ...aprobado } });
}

/** Los ítems de los escenarios de MATE-4 y MATE-5: I7 e I10 sin marca, I8 sin fuente e I9 con cita no encontrada. */
const ITEMS = [item('I7', FUENTE_BUENA), item('I8'), item('I9', FUENTE_MALA), item('I10', FUENTE_BUENA)];
const MESA = mesaDe({ items: ITEMS }, { objetivos: [objetivo('O1')] });

const ids = (piezas: readonly { readonly id: string }[]): string[] => piezas.map(({ id }) => id);

function exito(resultado: Resultado<Mesa>): Mesa {
  if (!resultado.ok) throw new Error(`Se esperaba éxito y fue un rechazo: ${resultado.motivo}`);
  return resultado.valor;
}
const aplicado = (mesa: Mesa, accion: Accion): Mesa => exito(aplicar(mesa, accion, marcador));
function rechazado(mesa: Mesa, accion: Accion): Extract<Resultado<Mesa>, { ok: false }> {
  const resultado = aplicar(mesa, accion, marcador);
  if (resultado.ok) throw new Error('Se esperaba un rechazo');
  return resultado;
}
const aprobar = (mesa: Mesa, pieza: string): Mesa => aplicado(mesa, { tipo: 'aprobar', pieza });

/** Cada grupo como [objetivo, ids de sus piezas]. */
function agrupadas(mesa: Mesa, filtro: Parameters<typeof revisar>[2] = 'pendientes'): unknown[] {
  return revisar(mesa, marcador, filtro).grupos.map(({ objetivo: grupo, piezas }) => [grupo, ids(piezas)]);
}

describe('revisar: agrupación y orden', () => {
  it('@MATE-4.1 las piezas se agrupan por objetivo', () => {
    const mesa = mesaDe({ items: [...ITEMS, item('I11', undefined, 'O2')] });
    expect(agrupadas(mesa)).toStrictEqual([
      ['O1', ['I7', 'I8', 'I9', 'I10']],
      ['O2', ['I11']],
    ]);
  });

  it('@MATE-4.1 cada pieza trae su marca: ninguna, o una', () => {
    const [grupo] = revisar(MESA, marcador, 'pendientes').grupos;
    expect(grupo?.piezas).toStrictEqual([
      { id: 'I7', tipo: 'item', marcas: [] },
      { id: 'I8', tipo: 'item', marcas: ['sin_fuente'] },
      { id: 'I9', tipo: 'item', marcas: ['cita_no_encontrada'] },
      { id: 'I10', tipo: 'item', marcas: [] },
    ]);
  });

  it('@MATE-4.1 el orden es: objetivos con sus ejemplos, ejemplos aparte, ítems; las tareas, en un grupo sin objetivo al final', () => {
    const mesa = mesaDe({
      objetivos: [objetivo('O2', [ejemplo('E1')])],
      ejemplos_resueltos: [{ ...ejemplo('E2'), objetivo: 'O1' }],
      items: [item('I7'), item('I8', undefined, 'O2')],
      tareas: [tarea('T1')],
    });
    expect(agrupadas(mesa)).toStrictEqual([
      ['O2', ['O2', 'E1', 'I8']],
      ['O1', ['E2', 'I7']],
      [undefined, ['T1']],
    ]);
    expect(revisar(mesa, marcador, 'pendientes').grupos.at(-1)).not.toHaveProperty('objetivo');
  });
});

describe('revisar: filtros y botón en bloque', () => {
  it.each([
    ['pendientes', ['I7', 'I8', 'I9', 'I10']],
    ['sin_fuente', ['I8']],
    ['cita_no_encontrada', ['I9']],
  ] as const)('@MATE-4.2 el filtro «%s» muestra solo %j', (filtro, esperadas) => {
    expect(agrupadas(MESA, filtro)).toStrictEqual([['O1', esperadas]]);
  });

  it('@MATE-4.2 un grupo sin piezas no sale con el filtro', () => {
    const mesa = mesaDe({ items: [item('I7', FUENTE_BUENA), item('I8', undefined, 'O2')] });
    expect(agrupadas(mesa, 'sin_fuente')).toStrictEqual([['O2', ['I8']]]);
  });

  it.each(['pendientes', 'sin_fuente', 'cita_no_encontrada'] as const)(
    '@MATE-5.1 el botón cuenta las piezas sin marca (2) con el filtro «%s»',
    (filtro) => {
      expect(revisar(MESA, marcador, filtro).aprobablesEnBloque).toBe(2);
    },
  );

  it('@MATE-5.4 si todas las pendientes tienen marca, no hay nada que aprobar en bloque', () => {
    const mesa = mesaDe({ items: [item('I8'), item('I9', FUENTE_MALA)] });
    expect(revisar(mesa, marcador, 'pendientes').aprobablesEnBloque).toBe(0);
  });

  it('@MATE-5.1 las piezas sin marca de un objetivo pendiente con marca no cuentan (regla que la feature no cubre)', () => {
    const mesa = mesaDe({ objetivos: [objetivo('O2')], items: [item('I7', FUENTE_BUENA, 'O2')] });
    expect(revisar(mesa, marcador, 'pendientes').aprobablesEnBloque).toBe(0);
  });
});

describe('aplicar: aprobar', () => {
  it('@MATE-4.4 la pieza pasa del borrador al aprobado, con su fuente', () => {
    const nueva = aprobar(MESA, 'I7');
    expect(ids(nueva.borrador.items)).toStrictEqual(['I8', 'I9', 'I10']);
    expect(nueva.aprobado.items).toStrictEqual([item('I7', FUENTE_BUENA)]);
  });

  it.each([['I8'], ['I9']])('@MATE-5.3 una pieza marcada (%s) se aprueba sola, con o sin fuente', (id) => {
    const nueva = aprobar(MESA, id);
    expect(nueva.aprobado.items).toStrictEqual(ITEMS.filter((pieza) => pieza.id === id));
    expect(ids(nueva.borrador.items)).not.toContain(id);
  });

  it('@MATE-4.4 lo que entra en el aprobado va al final y lo demás se queda donde estaba', () => {
    const nueva = aprobar(aprobar(MESA, 'I10'), 'I7');
    expect(ids(nueva.aprobado.items)).toStrictEqual(['I10', 'I7']);
    expect(nueva.aprobado.objetivos).toBe(MESA.aprobado.objetivos);
  });

  it('@MATE-4.4 una tarea entra en las tareas del aprobado', () => {
    const nueva = aprobar(mesaDe({ tareas: [tarea('T1'), tarea('T2')] }), 'T2');
    expect(ids(nueva.aprobado.tareas)).toStrictEqual(['T2']);
    expect(ids(nueva.borrador.tareas)).toStrictEqual(['T1']);
  });

  it('@MATE-4.4 un objetivo entra sin sus ejemplos, que siguen pendientes y van aparte con su objetivo', () => {
    const previo = { ...ejemplo('E0'), objetivo: 'O1' };
    const mesa = mesaDe({
      objetivos: [objetivo('O2', [ejemplo('E1', FUENTE_BUENA)], FUENTE_BUENA)],
      ejemplos_resueltos: [previo],
    });
    const nueva = aprobar(mesa, 'O2');
    expect(nueva.aprobado.objetivos).toStrictEqual([objetivo('O2', [], FUENTE_BUENA)]);
    expect(nueva.borrador.objetivos).toStrictEqual([]);
    expect(nueva.borrador.ejemplos_resueltos).toStrictEqual([
      previo,
      { ...ejemplo('E1', FUENTE_BUENA), objetivo: 'O2' },
    ]);
  });

  it('@MATE-4.4 un ejemplo que iba aparte entra dentro de su objetivo, sin `objetivo` y con su fuente', () => {
    const aparte = { ...ejemplo('E2', FUENTE_BUENA), objetivo: 'O1' };
    const mesa = mesaDe({ ejemplos_resueltos: [aparte] }, { objetivos: [objetivo('O1', [ejemplo('E1')])] });
    const nueva = aprobar(mesa, 'E2');
    expect(nueva.aprobado.objetivos).toStrictEqual([objetivo('O1', [ejemplo('E1'), ejemplo('E2', FUENTE_BUENA)])]);
    expect(nueva.borrador.ejemplos_resueltos).toStrictEqual([]);
  });

  it('@MATE-4.4 no mete `ejemplos_resueltos` en el borrador si el objetivo no los tiene', () => {
    expect(aprobar(mesaDe({ objetivos: [objetivo('O2')] }), 'O2').borrador).not.toHaveProperty('ejemplos_resueltos');
  });

  it.each([['I7'], ['E1'], ['E2']])(
    '%s no se aprueba si su objetivo está pendiente: objetivo_pendiente (regla que la feature no cubre)',
    (id) => {
      const mesa = mesaDe({
        objetivos: [objetivo('O2', [ejemplo('E1')])],
        ejemplos_resueltos: [{ ...ejemplo('E2'), objetivo: 'O3' }],
        items: [item('I7', FUENTE_BUENA, 'O2')],
      });
      expect(rechazado(mesa, { tipo: 'aprobar', pieza: id })).toMatchObject({ ok: false, causa: 'objetivo_pendiente' });
    },
  );
});

describe('aplicar: aprobar_sin_marca', () => {
  it('@MATE-5.2 aprueba las piezas sin marca, en orden, y deja las marcadas pendientes', () => {
    const nueva = aplicado(MESA, { tipo: 'aprobar_sin_marca' });
    expect(ids(nueva.aprobado.items)).toStrictEqual(['I7', 'I10']);
    expect(ids(nueva.borrador.items)).toStrictEqual(['I8', 'I9']);
  });

  it('@MATE-5.4 sin piezas sin marca devuelve la misma mesa', () => {
    const mesa = mesaDe({ items: [item('I8'), item('I9', FUENTE_MALA)] });
    expect(aplicado(mesa, { tipo: 'aprobar_sin_marca' })).toBe(mesa);
  });

  it('@MATE-5.2 aprueba primero los objetivos, y con ellos entran sus ejemplos e ítems sin marca', () => {
    const mesa = mesaDe({
      objetivos: [objetivo('O2', [ejemplo('E1', FUENTE_BUENA)], FUENTE_BUENA)],
      items: [item('I7', FUENTE_BUENA, 'O2'), item('I8', undefined, 'O2')],
      tareas: [tarea('T1')],
    });
    const aprobables = revisar(mesa, marcador, 'pendientes').aprobablesEnBloque;
    const nueva = aplicado(mesa, { tipo: 'aprobar_sin_marca' });
    expect(nueva.aprobado.objetivos).toStrictEqual([objetivo('O2', [ejemplo('E1', FUENTE_BUENA)], FUENTE_BUENA)]);
    expect(ids(nueva.aprobado.items)).toStrictEqual(['I7']);
    expect(ids(nueva.aprobado.tareas)).toStrictEqual([]);
    // El número del botón es lo que se aprueba: el objetivo, su ejemplo y I7. T1 y I8 llevan marca.
    expect(aprobables).toBe(3);
    expect(ids(nueva.borrador.items)).toStrictEqual(['I8']);
  });

  it('@MATE-5.2 una pieza sin marca de un objetivo pendiente con marca no entra (regla que la feature no cubre)', () => {
    const mesa = mesaDe({ objetivos: [objetivo('O2')], items: [item('I7', FUENTE_BUENA, 'O2')] });
    expect(aplicado(mesa, { tipo: 'aprobar_sin_marca' })).toBe(mesa);
  });
});

describe('aplicar: descartar', () => {
  it('@MATE-4.5 la pieza sale del borrador y el aprobado no cambia', () => {
    const nueva = aplicado(MESA, { tipo: 'descartar', pieza: 'I8' });
    expect(ids(nueva.borrador.items)).toStrictEqual(['I7', 'I9', 'I10']);
    expect(nueva.aprobado).toBe(MESA.aprobado);
  });

  it('@MATE-4.5 un objetivo se va con sus ejemplos y sus ítems (regla que la feature no cubre)', () => {
    const mesa = mesaDe({
      objetivos: [objetivo('O1', [ejemplo('E1')]), objetivo('O2')],
      ejemplos_resueltos: [
        { ...ejemplo('E2'), objetivo: 'O1' },
        { ...ejemplo('E3'), objetivo: 'O3' },
      ],
      items: [item('I7'), item('I8', undefined, 'O3')],
    });
    const nueva = aplicado(mesa, { tipo: 'descartar', pieza: 'O1' });
    expect(ids(nueva.borrador.objetivos)).toStrictEqual(['O2']);
    expect(ids(nueva.borrador.ejemplos_resueltos ?? [])).toStrictEqual(['E3']);
    expect(ids(nueva.borrador.items)).toStrictEqual(['I8']);
  });

  it('@MATE-4.5 un ejemplo, dentro de su objetivo o aparte, sale sin tocar lo demás', () => {
    const mesa = mesaDe({
      objetivos: [objetivo('O1', [ejemplo('E1'), ejemplo('E2')])],
      ejemplos_resueltos: [{ ...ejemplo('E3'), objetivo: 'O9' }],
    });
    const sinDentro = aplicado(mesa, { tipo: 'descartar', pieza: 'E1' });
    expect(ids(sinDentro.borrador.objetivos[0]?.ejemplos_resueltos ?? [])).toStrictEqual(['E2']);
    const sinAparte = aplicado(mesa, { tipo: 'descartar', pieza: 'E3' });
    expect(sinAparte.borrador.ejemplos_resueltos).toStrictEqual([]);
    expect(sinAparte.borrador.objetivos).toBe(mesa.borrador.objetivos);
  });
});

describe('aplicar: corregir', () => {
  const corregido = { ...item('I7', FUENTE_BUENA), enunciado: 'Enunciado corregido de I7' };

  it('@MATE-4.6 la pieza corregida ocupa el mismo sitio del borrador y el aprobado no cambia', () => {
    const nueva = aplicado(MESA, { tipo: 'corregir', pieza: 'I8', corregida: { ...item('I8'), enunciado: 'Nuevo' } });
    expect(nueva.borrador.items.map((pieza) => pieza.enunciado)).toStrictEqual([
      'Enunciado de I7',
      'Nuevo',
      'Enunciado de I9',
      'Enunciado de I10',
    ]);
    expect(nueva.aprobado).toBe(MESA.aprobado);
  });

  it('@MATE-4.7 las marcas se calculan de nuevo con la pieza corregida', () => {
    const corregida = { ...item('I9'), fuente: FUENTE_BUENA };
    const nueva = aplicado(MESA, { tipo: 'corregir', pieza: 'I9', corregida });
    expect(agrupadas(nueva, 'cita_no_encontrada')).toStrictEqual([]);
    expect(ids(nueva.borrador.items)).toContain('I9');
  });

  it('@MATE-4.8 una corrección sin el formato del contenido se rechaza con el campo que falta', () => {
    const sinFeedback = Object.fromEntries(Object.entries(corregido).filter(([clave]) => clave !== 'feedback'));
    const resultado = rechazado(MESA, { tipo: 'corregir', pieza: 'I7', corregida: sinFeedback });
    expect(resultado).toMatchObject({ ok: false, campo: 'feedback' });
    expect(resultado.motivo).toContain('feedback');
  });

  it.each([['texto'], [null], [{ ...corregido, id: 'I99' }]])(
    'cambiar el id, o una corrección que ni es un objeto, se rechaza con el campo «id» (regla que la feature no cubre)',
    (corregida) => {
      expect(rechazado(MESA, { tipo: 'corregir', pieza: 'I7', corregida })).toMatchObject({ ok: false, campo: 'id' });
    },
  );

  it('@MATE-4.6 un ejemplo que va aparte conserva su objetivo, venga o no en la corrección', () => {
    const mesa = mesaDe(
      { ejemplos_resueltos: [{ ...ejemplo('E2'), objetivo: 'O1' }] },
      { objetivos: [objetivo('O1')] },
    );
    const corregida = { id: 'E2', pasos: ['Nuevo paso'] };
    const nueva = aplicado(mesa, { tipo: 'corregir', pieza: 'E2', corregida });
    expect(nueva.borrador.ejemplos_resueltos).toStrictEqual([{ ...corregida, objetivo: 'O1' }]);
  });

  it('@MATE-4.6 un ejemplo de dentro de su objetivo se corrige en su sitio, sin `objetivo`', () => {
    const mesa = mesaDe({ objetivos: [objetivo('O1', [ejemplo('E1'), ejemplo('E2')])] });
    const corregida = { id: 'E1', pasos: ['Nuevo paso'] };
    const nueva = aplicado(mesa, { tipo: 'corregir', pieza: 'E1', corregida });
    expect(nueva.borrador.objetivos).toStrictEqual([objetivo('O1', [corregida, ejemplo('E2')])]);
  });

  it('@MATE-4.8 un ejemplo mal corregido se nombra con su objetivo en el motivo', () => {
    const mesa = mesaDe({ ejemplos_resueltos: [{ ...ejemplo('E2'), objetivo: 'O1' }] });
    const resultado = rechazado(mesa, { tipo: 'corregir', pieza: 'E2', corregida: { id: 'E2', pasos: [] } });
    expect(resultado).toMatchObject({ ok: false, campo: 'pasos' });
    expect(resultado.motivo).toContain('E2 de O1');
  });
});

describe('aplicar: pieza que no está en el borrador', () => {
  it.each<Accion>([
    { tipo: 'aprobar', pieza: 'I99' },
    { tipo: 'descartar', pieza: 'I99' },
    { tipo: 'corregir', pieza: 'I99', corregida: item('I99') },
  ])('@MATE-4.4 la acción «$tipo» se rechaza con pieza_no_encontrada', (accion) => {
    expect(rechazado(MESA, accion)).toMatchObject({ ok: false, causa: 'pieza_no_encontrada' });
  });
});

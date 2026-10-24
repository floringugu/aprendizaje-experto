import { describe, expect, it } from 'vitest';
import { guardarDocumento } from '../../src/aplicacion/material-guardado.ts';
import type { Ficheros } from '../../src/aplicacion/puertos.ts';
import type { Resultado } from '../../src/aplicacion/resultado.ts';
import { crearRevisionDelMaterial, type CasosDeRevision } from '../../src/aplicacion/revision-del-material.ts';
import type { Mesa } from '../../src/aplicacion/mesa.ts';
import type { Revision } from '../../src/aplicacion/revision.ts';
import { ficherosEnMemoria } from './ficheros-en-memoria.ts';
import { FUENTE_BUENA, ITEMS, MESA, ids, item, mesaDe, objetivo } from './revision-fabricas.ts';

const DOMINIO = 'ficticio';
const BORRADOR = `contenido/borradores/${DOMINIO}.json`;
const APROBADO = `contenido/${DOMINIO}.json`;

const codificar = (valor: unknown): Uint8Array => new TextEncoder().encode(JSON.stringify(valor, null, '  '));

function jsonDe(contenidos: ReadonlyMap<string, Uint8Array>, ruta: string): unknown {
  const bytes = contenidos.get(ruta);
  if (bytes === undefined) throw new Error(`Falta el fichero ${ruta}`);
  return JSON.parse(new TextDecoder().decode(bytes));
}

/** Los ficheros de `mesa`, tal como los dejaría la aplicación, y los casos de la revisión sobre ellos. */
function preparar(mesa: Mesa = MESA) {
  const { ficheros, contenidos } = ficherosEnMemoria();
  ficheros.escribir(BORRADOR, codificar(mesa.borrador));
  ficheros.escribir(APROBADO, codificar(mesa.aprobado));
  return { ficheros, contenidos, casos: crearRevisionDelMaterial(ficheros) };
}

/** El documento «apuntes.pdf», con el fragmento «buena» (FUENTE_BUENA): sin él, ninguna cita se encuentra. */
function guardarApuntes(ficheros: Ficheros): void {
  guardarDocumento(ficheros, DOMINIO, {
    nombre: 'apuntes.pdf',
    bytes: new Uint8Array(),
    paginas: ['Esta página dice buena.'],
  });
}

/** Copia las referencias de los ficheros: si algo se escribe después, aunque sea lo mismo, la referencia cambia. */
const instantanea = (contenidos: ReadonlyMap<string, Uint8Array>): Map<string, Uint8Array> => new Map(contenidos);

/** Nada se ha escrito desde la instantánea: ni un fichero nuevo, ni una referencia distinta (`toBe`). */
function expectSinEscribir(contenidos: ReadonlyMap<string, Uint8Array>, antes: ReadonlyMap<string, Uint8Array>): void {
  expect(contenidos.size).toBe(antes.size);
  for (const [ruta, bytes] of antes) expect(contenidos.get(ruta)).toBe(bytes);
}

function revision(resultado: Resultado<Revision>): Revision {
  if (!resultado.ok) throw new Error(`Se esperaba éxito y fue un rechazo: ${resultado.motivo}`);
  return resultado.valor;
}

const abrir = (casos: CasosDeRevision, filtro?: 'pendientes' | 'sin_fuente' | 'cita_no_encontrada'): Revision =>
  revision(casos.abrirRevision(filtro === undefined ? { dominio: DOMINIO } : { dominio: DOMINIO, filtro }));

const grupos = (resultado: Revision): unknown[] =>
  resultado.grupos.map(({ objetivo: grupo, piezas }) => [grupo, ids(piezas)]);

const OK = { ok: true, valor: null };

describe('abrirRevision', () => {
  it('@MATE-4.1 agrupa las piezas pendientes por objetivo', () => {
    const mesa = mesaDe(
      { items: [...ITEMS, item('I11', undefined, 'O2')] },
      { objetivos: [objetivo('O1'), objetivo('O2')] },
    );
    const { casos } = preparar(mesa);
    expect(grupos(abrir(casos))).toStrictEqual([
      ['O1', ['I7', 'I8', 'I9', 'I10']],
      ['O2', ['I11']],
    ]);
  });

  it.each([
    ['pendientes', ['I7', 'I8', 'I9', 'I10']],
    ['sin_fuente', ['I8']],
    ['cita_no_encontrada', ['I9']],
  ] as const)('@MATE-4.2 con el filtro %s solo salen las piezas que corresponden', (filtro, esperadas) => {
    const { ficheros, casos } = preparar();
    guardarApuntes(ficheros);
    const piezas = abrir(casos, filtro).grupos.flatMap((grupo) => ids(grupo.piezas));
    expect(piezas).toStrictEqual(esperadas);
  });

  it('@MATE-4.2 sin filtro salen todas las pendientes', () => {
    const { ficheros, casos } = preparar();
    guardarApuntes(ficheros);
    expect(abrir(casos)).toStrictEqual(abrir(casos, 'pendientes'));
  });

  it('@MATE-5.1 cuenta las piezas que aprobaría «Aprobar las N sin marca»', () => {
    const { ficheros, casos } = preparar();
    guardarApuntes(ficheros);
    expect(abrir(casos).aprobablesEnBloque).toBe(2);
  });

  it('abrir la revisión no escribe nada (regla que la feature no cubre)', () => {
    const { ficheros, contenidos, casos } = preparar();
    guardarApuntes(ficheros);
    const antes = instantanea(contenidos);
    abrir(casos, 'cita_no_encontrada');
    expectSinEscribir(contenidos, antes);
  });

  it('@MATE-4.7 las marcas se recalculan al abrir: una cita que no estaba pasa a encontrarse', () => {
    const { ficheros, casos } = preparar();
    const marcasDeI7 = (): unknown =>
      abrir(casos)
        .grupos.flatMap((grupo) => grupo.piezas)
        .find((pieza) => pieza.id === 'I7')?.marcas;
    expect(marcasDeI7()).toStrictEqual(['cita_no_encontrada']);
    guardarApuntes(ficheros);
    expect(marcasDeI7()).toStrictEqual([]);
  });

  it('sin borrador, la revisión está vacía (regla que la feature no cubre)', () => {
    const { contenidos, casos } = preparar();
    contenidos.delete(BORRADOR);
    expect(abrir(casos)).toStrictEqual({ grupos: [], aprobablesEnBloque: 0 });
  });
});

const LLAMADAS_QUE_LEEN_LA_MESA: readonly (readonly [string, (casos: CasosDeRevision) => Resultado<unknown>])[] = [
  ['abrirRevision', (casos) => casos.abrirRevision({ dominio: DOMINIO })],
  ['aprobarPieza', (casos) => casos.aprobarPieza({ dominio: DOMINIO, pieza: 'I7' })],
  ['aprobarSinMarca', (casos) => casos.aprobarSinMarca({ dominio: DOMINIO })],
  ['descartarPieza', (casos) => casos.descartarPieza({ dominio: DOMINIO, pieza: 'I7' })],
  ['corregirPieza', (casos) => casos.corregirPieza({ dominio: DOMINIO, pieza: 'I7', corregida: item('I7') })],
];

/** Cada situación en la que la mesa no se puede leer, con lo que se estropea y lo que debe decir el rechazo. */
const MESAS_ROTAS = [
  {
    nombre: 'el aprobado no existe',
    estropear: (contenidos: Map<string, Uint8Array>) => contenidos.delete(APROBADO),
    rechazo: { motivo: expect.stringContaining('No existe el dominio «ficticio»') as unknown },
  },
  {
    nombre: 'el aprobado no cumple el formato',
    estropear: (contenidos: Map<string, Uint8Array>) =>
      contenidos.set(APROBADO, codificar({ ...MESA.aprobado, items: [{ ...item('I1'), feedback: '' }] })),
    rechazo: { motivo: expect.stringMatching(/no cumple el formato.*«feedback» en el ítem I1/) as unknown },
  },
  {
    nombre: 'el aprobado no es JSON',
    estropear: (contenidos: Map<string, Uint8Array>) =>
      contenidos.set(APROBADO, new TextEncoder().encode('esto no es JSON')),
    rechazo: { motivo: expect.stringContaining('No se puede leer contenido/ficticio.json') as unknown },
  },
  {
    nombre: 'un id está repetido entre el borrador y el aprobado',
    estropear: (contenidos: Map<string, Uint8Array>) =>
      contenidos.set(APROBADO, codificar({ ...MESA.aprobado, items: [item('I7')] })),
    rechazo: { causa: 'id_repetido', motivo: expect.stringContaining('«I7»') as unknown },
  },
];

describe('rechazos al leer la mesa (reglas que la feature no cubre)', () => {
  describe.each(MESAS_ROTAS)('cuando $nombre', ({ estropear, rechazo }) => {
    it.each(LLAMADAS_QUE_LEEN_LA_MESA)('%s rechaza y no escribe nada (regla que la feature no cubre)', (_, llamar) => {
      const { contenidos, casos } = preparar();
      estropear(contenidos);
      const antes = instantanea(contenidos);
      expect(llamar(casos)).toMatchObject({ ok: false, ...rechazo });
      expectSinEscribir(contenidos, antes);
    });
  });
});

describe('las acciones sobre una pieza', () => {
  it('@MATE-4.4 aprobarPieza escribe los dos ficheros, con la pieza movida y con su fuente', () => {
    const { contenidos, casos } = preparar();
    const antes = instantanea(contenidos);
    expect(casos.aprobarPieza({ dominio: DOMINIO, pieza: 'I7' })).toStrictEqual(OK);
    expect(contenidos.get(BORRADOR)).not.toBe(antes.get(BORRADOR));
    expect(contenidos.get(APROBADO)).not.toBe(antes.get(APROBADO));
    const aprobado = jsonDe(contenidos, APROBADO);
    expect(aprobado).toStrictEqual({ ...MESA.aprobado, items: [item('I7', FUENTE_BUENA)] });
    expect(jsonDe(contenidos, BORRADOR)).toStrictEqual({ ...MESA.borrador, items: ITEMS.slice(1) });
  });

  it('los ficheros se escriben en JSON sangrado con dos espacios (regla que la feature no cubre)', () => {
    const { contenidos, casos } = preparar();
    casos.aprobarPieza({ dominio: DOMINIO, pieza: 'I7' });
    const texto = new TextDecoder().decode(contenidos.get(APROBADO));
    expect(texto).toBe(JSON.stringify({ ...MESA.aprobado, items: [item('I7', FUENTE_BUENA)] }, null, '  '));
  });

  it('@MATE-5.2 aprobarSinMarca aprueba las piezas sin marca y deja las marcadas pendientes', () => {
    const { ficheros, contenidos, casos } = preparar();
    guardarApuntes(ficheros);
    expect(casos.aprobarSinMarca({ dominio: DOMINIO })).toStrictEqual(OK);
    expect(jsonDe(contenidos, APROBADO)).toStrictEqual({
      ...MESA.aprobado,
      items: [item('I7', FUENTE_BUENA), item('I10', FUENTE_BUENA)],
    });
    expect(jsonDe(contenidos, BORRADOR)).toStrictEqual({ ...MESA.borrador, items: [ITEMS[1], ITEMS[2]] });
  });

  it('@MATE-4.5 descartarPieza saca la pieza del borrador y el aprobado queda igual', () => {
    const { contenidos, casos } = preparar();
    expect(casos.descartarPieza({ dominio: DOMINIO, pieza: 'I8' })).toStrictEqual(OK);
    expect(ids((jsonDe(contenidos, BORRADOR) as Mesa['borrador']).items)).toStrictEqual(['I7', 'I9', 'I10']);
    expect(jsonDe(contenidos, APROBADO)).toStrictEqual(MESA.aprobado);
  });

  it('@MATE-4.6 corregirPieza deja la pieza corregida pendiente, en su sitio, y el aprobado queda igual', () => {
    const { contenidos, casos } = preparar();
    const corregida = { ...item('I7', FUENTE_BUENA), enunciado: 'Otro enunciado' };
    expect(casos.corregirPieza({ dominio: DOMINIO, pieza: 'I7', corregida })).toStrictEqual(OK);
    expect(jsonDe(contenidos, BORRADOR)).toStrictEqual({ ...MESA.borrador, items: [corregida, ...ITEMS.slice(1)] });
    expect(jsonDe(contenidos, APROBADO)).toStrictEqual(MESA.aprobado);
  });

  it('@MATE-4.7 al corregir una pieza, sus marcas se vuelven a calcular al abrir', () => {
    const { ficheros, casos } = preparar();
    guardarApuntes(ficheros);
    const corregida = item('I9', FUENTE_BUENA);
    casos.corregirPieza({ dominio: DOMINIO, pieza: 'I9', corregida });
    const piezas = abrir(casos).grupos.flatMap((grupo) => grupo.piezas);
    expect(piezas.find((pieza) => pieza.id === 'I9')?.marcas).toStrictEqual([]);
  });

  it('@MATE-4.8 una corrección sin el formato del contenido no escribe nada y rechaza con su campo', () => {
    const { contenidos, casos } = preparar();
    const antes = instantanea(contenidos);
    const corregida = { ...item('I7', FUENTE_BUENA), feedback: '' };
    expect(casos.corregirPieza({ dominio: DOMINIO, pieza: 'I7', corregida })).toMatchObject({
      ok: false,
      campo: 'feedback',
    });
    expectSinEscribir(contenidos, antes);
  });

  it.each([
    ['pieza_no_encontrada', 'I99'],
    ['objetivo_pendiente', 'I11'],
  ])('devuelve el rechazo %s de aplicar tal cual y no escribe nada (regla que la feature no cubre)', (causa, pieza) => {
    const mesa = mesaDe({ items: [...ITEMS, item('I11', undefined, 'O2')] }, MESA.aprobado);
    const { contenidos, casos } = preparar(mesa);
    const antes = instantanea(contenidos);
    expect(casos.aprobarPieza({ dominio: DOMINIO, pieza })).toMatchObject({ ok: false, causa });
    expectSinEscribir(contenidos, antes);
  });

  it('el rechazo de una corrección conserva el campo de aplicar (regla que la feature no cubre)', () => {
    const { contenidos, casos } = preparar();
    const antes = instantanea(contenidos);
    const corregida = item('I99', FUENTE_BUENA);
    expect(casos.corregirPieza({ dominio: DOMINIO, pieza: 'I7', corregida })).toMatchObject({ ok: false, campo: 'id' });
    expectSinEscribir(contenidos, antes);
  });
});

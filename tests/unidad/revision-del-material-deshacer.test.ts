import { describe, expect, it } from 'vitest';
import { crearRevisionDelMaterial, type CasosDeRevision } from '../../src/aplicacion/revision-del-material.ts';
import { ficherosEnMemoria } from './ficheros-en-memoria.ts';
import { FUENTE_BUENA, MESA, item } from './revision-fabricas.ts';

const OK = { ok: true, valor: null };
const NADA_QUE_DESHACER = { ok: false, causa: 'nada_que_deshacer' };

const rutasDe = (dominio: string): { readonly borrador: string; readonly aprobado: string } => ({
  borrador: `contenido/borradores/${dominio}.json`,
  aprobado: `contenido/${dominio}.json`,
});

const codificar = (valor: unknown): Uint8Array => new TextEncoder().encode(JSON.stringify(valor, null, '  '));

/**
 * Los ficheros de uno o más dominios con la mesa de MATE-4 (I7 a I10 pendientes, O1 aprobado), sin
 * material guardado: todas las piezas llevan marca. Cada `crearRevisionDelMaterial` es una persona distinta.
 */
function montar(...dominios: readonly string[]) {
  const { ficheros, contenidos } = ficherosEnMemoria();
  for (const dominio of dominios) {
    const rutas = rutasDe(dominio);
    ficheros.escribir(rutas.borrador, codificar({ ...MESA.borrador, dominio }));
    ficheros.escribir(rutas.aprobado, codificar({ ...MESA.aprobado, dominio }));
  }
  return { ficheros, contenidos, casos: crearRevisionDelMaterial(ficheros) };
}

/** Lo que hay en los dos ficheros del dominio ahora, para compararlo con lo que había antes. */
function ficherosDe(
  contenidos: ReadonlyMap<string, Uint8Array>,
  dominio: string,
): { readonly borrador: Uint8Array | undefined; readonly aprobado: Uint8Array | undefined } {
  const rutas = rutasDe(dominio);
  return { borrador: contenidos.get(rutas.borrador), aprobado: contenidos.get(rutas.aprobado) };
}

const aprobarI7 = (casos: CasosDeRevision, dominio = 'ficticio') => casos.aprobarPieza({ dominio, pieza: 'I7' });
const descartarI8 = (casos: CasosDeRevision, dominio = 'ficticio') => casos.descartarPieza({ dominio, pieza: 'I8' });
const deshacer = (casos: CasosDeRevision, dominio = 'ficticio') => casos.deshacer({ dominio });

describe('deshacer', () => {
  it.each([
    ['aprobar', (casos: CasosDeRevision) => aprobarI7(casos)],
    ['descartar', (casos: CasosDeRevision) => descartarI8(casos)],
    [
      'corregir',
      (casos: CasosDeRevision) =>
        casos.corregirPieza({
          dominio: 'ficticio',
          pieza: 'I7',
          corregida: { ...item('I7', FUENTE_BUENA), enunciado: 'Otro' },
        }),
    ],
  ])('@MATE-4.9 vuelve los dos ficheros a sus bytes de antes de %s', (_, accion) => {
    const { contenidos, casos } = montar('ficticio');
    const antes = ficherosDe(contenidos, 'ficticio');
    expect(accion(casos)).toStrictEqual(OK);
    expect(ficherosDe(contenidos, 'ficticio')).not.toStrictEqual(antes);
    expect(deshacer(casos)).toStrictEqual(OK);
    expect(ficherosDe(contenidos, 'ficticio')).toStrictEqual(antes);
  });

  it('@MATE-4.10 solo deshace la última acción, y un segundo deshacer rechaza con nada_que_deshacer', () => {
    const { contenidos, casos } = montar('ficticio');
    descartarI8(casos);
    const trasDescartar = ficherosDe(contenidos, 'ficticio');
    aprobarI7(casos);
    expect(deshacer(casos)).toStrictEqual(OK);
    expect(ficherosDe(contenidos, 'ficticio')).toStrictEqual(trasDescartar);
    expect(deshacer(casos)).toMatchObject(NADA_QUE_DESHACER);
    expect(ficherosDe(contenidos, 'ficticio')).toStrictEqual(trasDescartar);
  });

  it('@MATE-4.10 una acción nueva sustituye lo que había en el hueco', () => {
    const { contenidos, casos } = montar('ficticio');
    aprobarI7(casos);
    const trasAprobar = ficherosDe(contenidos, 'ficticio');
    casos.aprobarPieza({ dominio: 'ficticio', pieza: 'I10' });
    expect(deshacer(casos)).toStrictEqual(OK);
    expect(ficherosDe(contenidos, 'ficticio')).toStrictEqual(trasAprobar);
  });

  it('@MATE-4.10 rechaza con nada_que_deshacer si no ha habido ninguna acción, sin escribir nada', () => {
    const { contenidos, casos } = montar('ficticio');
    const antes = ficherosDe(contenidos, 'ficticio');
    expect(deshacer(casos)).toMatchObject(NADA_QUE_DESHACER);
    expect(ficherosDe(contenidos, 'ficticio')).toStrictEqual(antes);
  });
});

describe('deshacer cuando alguien más ha cambiado los ficheros (regla que la feature no cubre)', () => {
  it.each(['borrador', 'aprobado'] as const)(
    'rechaza con nada_que_deshacer si cambió el %s después de la acción, y no restaura nada (regla que la feature no cubre)',
    (fichero) => {
      const { ficheros, contenidos, casos } = montar('ficticio');
      aprobarI7(casos);
      ficheros.escribir(rutasDe('ficticio')[fichero], codificar({ ...MESA.borrador, items: [], tareas: [] }));
      const trasElCambio = ficherosDe(contenidos, 'ficticio');
      expect(deshacer(casos)).toMatchObject(NADA_QUE_DESHACER);
      expect(ficherosDe(contenidos, 'ficticio')).toStrictEqual(trasElCambio);
    },
  );
});

describe('el hueco de deshacer se vacía y se compara byte a byte (reglas que la feature no cubre)', () => {
  it.each(['borrador', 'aprobado'] as const)(
    'rechaza con nada_que_deshacer si el %s cambió un byte sin cambiar de longitud',
    (fichero) => {
      const { ficheros, contenidos, casos } = montar('ficticio');
      aprobarI7(casos);
      const ruta = rutasDe('ficticio')[fichero];
      const texto = new TextDecoder().decode(contenidos.get(ruta));
      // «Enunciado» pasa a «enunciado»: el mismo número de bytes, un byte distinto.
      ficheros.escribir(ruta, new TextEncoder().encode(texto.replace('Enunciado', 'enunciado')));
      const trasElCambio = ficherosDe(contenidos, 'ficticio');
      expect(deshacer(casos)).toMatchObject(NADA_QUE_DESHACER);
      expect(ficherosDe(contenidos, 'ficticio')).toStrictEqual(trasElCambio);
    },
  );

  it('tras deshacer no queda nada que deshacer, aunque los ficheros vuelvan a lo que escribió la acción', () => {
    const { ficheros, contenidos, casos } = montar('ficticio');
    aprobarI7(casos);
    const trasAprobar = new Map(contenidos);
    expect(deshacer(casos)).toStrictEqual(OK);
    for (const [ruta, bytes] of trasAprobar) ficheros.escribir(ruta, bytes);
    expect(deshacer(casos)).toMatchObject(NADA_QUE_DESHACER);
  });
});

describe('lo que no cambia la mesa no toca el hueco (reglas que la feature no cubre)', () => {
  it('un rechazo de aplicar no escribe ni toca el hueco: deshacer deshace la acción anterior', () => {
    const { contenidos, casos } = montar('ficticio');
    const antes = ficherosDe(contenidos, 'ficticio');
    descartarI8(casos);
    const trasDescartar = ficherosDe(contenidos, 'ficticio');
    expect(casos.aprobarPieza({ dominio: 'ficticio', pieza: 'I99' })).toMatchObject({
      ok: false,
      causa: 'pieza_no_encontrada',
    });
    expect(ficherosDe(contenidos, 'ficticio')).toStrictEqual(trasDescartar);
    expect(deshacer(casos)).toStrictEqual(OK);
    expect(ficherosDe(contenidos, 'ficticio')).toStrictEqual(antes);
  });

  it('aprobar en bloque sin nada que aprobar no escribe ni toca el hueco', () => {
    const { contenidos, casos } = montar('ficticio');
    const antes = ficherosDe(contenidos, 'ficticio');
    descartarI8(casos);
    const trasDescartar = ficherosDe(contenidos, 'ficticio');
    // Sin material guardado todas las piezas llevan marca: no hay ninguna sin marca que aprobar.
    expect(casos.aprobarSinMarca({ dominio: 'ficticio' })).toStrictEqual(OK);
    // `toBe` compara la referencia: si la aplicación hubiera reescrito un fichero, aunque con los mismos bytes,
    // sería otro objeto.
    const ahora = ficherosDe(contenidos, 'ficticio');
    expect(ahora.borrador).toBe(trasDescartar.borrador);
    expect(ahora.aprobado).toBe(trasDescartar.aprobado);
    expect(deshacer(casos)).toStrictEqual(OK);
    expect(ficherosDe(contenidos, 'ficticio')).toStrictEqual(antes);
  });
});

describe('los huecos de deshacer (reglas que la feature no cubre)', () => {
  it('son por dominio: deshacer en uno no toca el otro', () => {
    const { contenidos, casos } = montar('ficticio', 'otro');
    const antesDeOtro = ficherosDe(contenidos, 'otro');
    aprobarI7(casos, 'ficticio');
    descartarI8(casos, 'otro');
    expect(deshacer(casos, 'otro')).toStrictEqual(OK);
    expect(ficherosDe(contenidos, 'otro')).toStrictEqual(antesDeOtro);
    expect(deshacer(casos, 'otro')).toMatchObject(NADA_QUE_DESHACER);
    // El hueco de «ficticio» sigue ahí: su acción se deshace por separado.
    expect(deshacer(casos, 'ficticio')).toStrictEqual(OK);
  });

  it('dos llamadas a crearRevisionDelMaterial no comparten huecos', () => {
    const { ficheros, casos: unaPersona } = montar('ficticio');
    const otraPersona = crearRevisionDelMaterial(ficheros);
    aprobarI7(unaPersona);
    expect(deshacer(otraPersona)).toMatchObject(NADA_QUE_DESHACER);
    expect(deshacer(unaPersona)).toStrictEqual(OK);
  });
});

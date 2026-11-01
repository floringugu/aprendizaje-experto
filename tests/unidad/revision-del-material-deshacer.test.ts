import { describe, expect, it } from 'vitest';
import { crearRevisionDelMaterial, type CasosDeRevision } from '../../src/aplicacion/revision-del-material.ts';
import { ficherosEnMemoria } from './ficheros-en-memoria.ts';
import { FUENTE_BUENA, MESA, codificar, escribirMesa, externosDe, item } from './revision-fabricas.ts';

const OK = { ok: true, valor: null };
// El motivo tiene que decir algo (`\S`: al menos un carácter que no sea un espacio), como en los rechazos del material.
const NADA_QUE_DESHACER = { ok: false, causa: 'nada_que_deshacer', motivo: expect.stringMatching(/\S/) as unknown };

const rutasDe = (dominio: string): { readonly borrador: string; readonly aprobado: string } => ({
  borrador: `contenido/borradores/${dominio}.json`,
  aprobado: `contenido/${dominio}.json`,
});

/**
 * Los ficheros de uno o más dominios con la mesa de MATE-4 (I7 a I10 pendientes, O1 aprobado), sin
 * material guardado: todas las piezas llevan marca. Cada `crearRevisionDelMaterial` es una persona distinta.
 */
function montar(...dominios: readonly string[]) {
  const { ficheros, contenidos } = ficherosEnMemoria();
  for (const dominio of dominios) {
    escribirMesa(ficheros, MESA, dominio);
  }
  return { ficheros, contenidos, casos: crearRevisionDelMaterial(externosDe(ficheros)) };
}

/** Los bytes de un fichero que tiene que existir. */
function bytesDe(contenidos: ReadonlyMap<string, Uint8Array>, ruta: string): Uint8Array {
  const bytes = contenidos.get(ruta);
  if (bytes === undefined) throw new Error(`Falta el fichero ${ruta}`);
  return bytes;
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

/**
 * Aprueba I7, deja el fichero como lo cambie `estropear` y comprueba que deshacer rechaza sin tocar nada.
 * Devuelve los ficheros tal como quedaron.
 */
function expectSinDeshacerTras(
  fichero: 'borrador' | 'aprobado',
  estropear: (contenidos: Map<string, Uint8Array>, ruta: string) => void,
): ReturnType<typeof ficherosDe> {
  const { contenidos, casos } = montar('ficticio');
  aprobarI7(casos);
  estropear(contenidos, rutasDe('ficticio')[fichero]);
  const trasElCambio = ficherosDe(contenidos, 'ficticio');
  expect(deshacer(casos)).toMatchObject(NADA_QUE_DESHACER);
  expect(ficherosDe(contenidos, 'ficticio')).toStrictEqual(trasElCambio);
  return trasElCambio;
}

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

  it.each(['borrador', 'aprobado'] as const)(
    'rechaza con nada_que_deshacer si el %s se recortó (los mismos bytes del principio, pero menos), y no restaura nada',
    (fichero) => {
      expectSinDeshacerTras(fichero, (contenidos, ruta) =>
        contenidos.set(ruta, bytesDe(contenidos, ruta).slice(0, -1)),
      );
    },
  );

  it.each(['borrador', 'aprobado'] as const)(
    'rechaza con nada_que_deshacer si el %s se borró después de la acción, y no lo vuelve a crear',
    (fichero) => {
      const trasElCambio = expectSinDeshacerTras(fichero, (contenidos, ruta) => contenidos.delete(ruta));
      expect(trasElCambio[fichero]).toBeUndefined();
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
    const otraPersona = crearRevisionDelMaterial(externosDe(ficheros));
    aprobarI7(unaPersona);
    expect(deshacer(otraPersona)).toMatchObject(NADA_QUE_DESHACER);
    expect(deshacer(unaPersona)).toStrictEqual(OK);
  });
});

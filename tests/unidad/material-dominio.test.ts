import { describe, expect, it, vi } from 'vitest';
import { anadirMaterial, listarMaterial } from '../../src/aplicacion/material.ts';
import { contenidoDeFicheros, mismaMesa, type ParDeBytes } from '../../src/aplicacion/mesa-guardada.ts';
import type { Ficheros } from '../../src/aplicacion/puertos.ts';
import { crearRevisionDelMaterial, type CasosDeRevision } from '../../src/aplicacion/revision-del-material.ts';
import { ficherosEnMemoria } from './ficheros-en-memoria.ts';
import { codificar, externosDe } from './revision-fabricas.ts';

// Un dominio con el que, sin validar, se escribiría fuera de la carpeta de datos.
const FUERA = '../fuera';
const RECHAZO_DE_DOMINIO = { ok: false, campo: 'dominio', motivo: expect.stringMatching(/\S/) as unknown };

/** Ficheros en memoria que apuntan cada ruta que se lee o se escribe. */
function ficherosEspiados() {
  const { ficheros } = ficherosEnMemoria();
  const leer = vi.fn((ruta: string) => ficheros.leer(ruta));
  const escribir = vi.fn((ruta: string, bytes: Uint8Array) => {
    ficheros.escribir(ruta, bytes);
  });
  const espiados: Ficheros = { leer, escribir };
  return { ficheros: espiados, leer, escribir };
}

/** Un LibreOffice y una web que no se esperan: si se llamaran, el rechazo del dominio no habría sido el primero. */
const externosSinUso = (ficheros: Ficheros) => ({
  ficheros,
  libreOffice: {
    instalado: () => Promise.reject(new Error('No se pregunta por LibreOffice')),
    convertirAPdf: () => Promise.reject(new Error('No se convierte')),
  },
  web: { descargar: () => Promise.reject(new Error('No se descarga')) },
});

type LlamadaALaRevision = (casos: CasosDeRevision) => unknown;

const LLAMADAS_A_LA_REVISION: readonly (readonly [string, LlamadaALaRevision])[] = [
  ['abrirRevision', (casos) => casos.abrirRevision({ dominio: FUERA })],
  ['aprobarPieza', (casos) => casos.aprobarPieza({ dominio: FUERA, pieza: 'I7' })],
  ['descartarPieza', (casos) => casos.descartarPieza({ dominio: FUERA, pieza: 'I7' })],
  ['corregirPieza', (casos) => casos.corregirPieza({ dominio: FUERA, pieza: 'I7', corregida: {} })],
  ['deshacer', (casos) => casos.deshacer({ dominio: FUERA })],
];

describe('el dominio que sale de la carpeta de datos', () => {
  it('@MATE-1.1 anadirMaterial de un fichero rechaza con campo dominio, antes que el nombre, y no lee ni escribe nada', async () => {
    const { ficheros, leer, escribir } = ficherosEspiados();
    const bytes = new Uint8Array([1]);
    // El nombre también está mal (lleva «/»): el rechazo que se ve tiene que ser el del dominio.
    const resultado = await anadirMaterial(externosSinUso(ficheros), { dominio: FUERA, nombre: 'a/b.pdf', bytes });
    expect(resultado).toMatchObject(RECHAZO_DE_DOMINIO);
    expect(leer).not.toHaveBeenCalled();
    expect(escribir).not.toHaveBeenCalled();
  });

  it('@MATE-1.5 anadirMaterial de una URL rechaza con campo dominio y no lee ni escribe nada', async () => {
    const { ficheros, leer, escribir } = ficherosEspiados();
    const resultado = await anadirMaterial(externosSinUso(ficheros), { dominio: FUERA, url: 'https://ejemplo.org' });
    expect(resultado).toMatchObject(RECHAZO_DE_DOMINIO);
    expect(leer).not.toHaveBeenCalled();
    expect(escribir).not.toHaveBeenCalled();
  });

  it('@MATE-1.1 listarMaterial rechaza con campo dominio y no lee nada', () => {
    const { ficheros, leer } = ficherosEspiados();
    expect(listarMaterial(ficheros, { dominio: FUERA })).toMatchObject(RECHAZO_DE_DOMINIO);
    expect(leer).not.toHaveBeenCalled();
  });

  it('@MATE-1.1 listarMaterial de un dominio válido sin material sigue dando la lista vacía', () => {
    expect(listarMaterial(ficherosEspiados().ficheros, { dominio: 'ficticio' })).toStrictEqual({ ok: true, valor: [] });
  });

  it.each(LLAMADAS_A_LA_REVISION)(
    '@MATE-4.1 %s rechaza con campo dominio y no lee ni escribe nada',
    (_caso, llamar) => {
      const { ficheros, leer, escribir } = ficherosEspiados();
      expect(llamar(crearRevisionDelMaterial(externosDe(ficheros)))).toMatchObject(RECHAZO_DE_DOMINIO);
      expect(leer).not.toHaveBeenCalled();
      expect(escribir).not.toHaveBeenCalled();
    },
  );
});

describe('contenidoDeFicheros', () => {
  it('@MATE-6.1 un dominio sin fichero da undefined', () => {
    expect(contenidoDeFicheros(ficherosEnMemoria().ficheros)('ficticio')).toBeUndefined();
  });

  it('@MATE-6.1 un fichero con JSON da el valor, sin validar', () => {
    const { ficheros } = ficherosEnMemoria();
    ficheros.escribir('contenido/ficticio.json', codificar({ cualquier: 'cosa' }));
    expect(contenidoDeFicheros(ficheros)('ficticio')).toStrictEqual({ cualquier: 'cosa' });
  });

  it('@MATE-6.1 un fichero que no es JSON da su texto, para que se rechace como un contenido sin formato', () => {
    const { ficheros } = ficherosEnMemoria();
    ficheros.escribir('contenido/ficticio.json', new TextEncoder().encode('esto no es JSON'));
    expect(contenidoDeFicheros(ficheros)('ficticio')).toBe('esto no es JSON');
  });

  it('@MATE-6.1 lee el fichero en cada llamada, no una vez', () => {
    const { ficheros } = ficherosEnMemoria();
    const leerContenido = contenidoDeFicheros(ficheros);
    expect(leerContenido('ficticio')).toBeUndefined();
    ficheros.escribir('contenido/ficticio.json', codificar([1]));
    expect(leerContenido('ficticio')).toStrictEqual([1]);
  });

  it('@MATE-6.1 un error que no es de JSON no se esconde', () => {
    const roto: Ficheros = {
      leer: () => {
        throw new RangeError('disco roto');
      },
      escribir: () => undefined,
    };
    expect(() => contenidoDeFicheros(roto)('ficticio')).toThrow('disco roto');
  });
});

describe('mismaMesa', () => {
  const PAR: ParDeBytes = { borrador: codificar({ b: 1 }), aprobado: codificar({ a: 1 }) };

  /** Ficheros con el borrador y el aprobado del par; cada uno puede faltar. */
  function conFicheros(borrador: Uint8Array | undefined, aprobado: Uint8Array | undefined): Ficheros {
    const { ficheros } = ficherosEnMemoria();
    if (borrador !== undefined) ficheros.escribir('contenido/borradores/ficticio.json', borrador);
    if (aprobado !== undefined) ficheros.escribir('contenido/ficticio.json', aprobado);
    return ficheros;
  }

  it('@MATE-4.9 es cierto si los dos ficheros tienen los bytes del par', () => {
    expect(mismaMesa(conFicheros(PAR.borrador, PAR.aprobado), 'ficticio', PAR)).toBe(true);
  });

  it('@MATE-4.10 es falso si cambia un solo byte del borrador o del aprobado', () => {
    expect(mismaMesa(conFicheros(codificar({ b: 2 }), PAR.aprobado), 'ficticio', PAR)).toBe(false);
    expect(mismaMesa(conFicheros(PAR.borrador, codificar({ a: 2 })), 'ficticio', PAR)).toBe(false);
  });

  it('@MATE-4.10 es falso si uno de los ficheros no existe', () => {
    expect(mismaMesa(conFicheros(PAR.borrador, undefined), 'ficticio', PAR)).toBe(false);
    expect(mismaMesa(conFicheros(undefined, PAR.aprobado), 'ficticio', PAR)).toBe(false);
  });

  it('@MATE-4.10 es falso si un fichero es un prefijo del esperado', () => {
    const prefijo = PAR.aprobado.slice(0, 3);
    expect(mismaMesa(conFicheros(PAR.borrador, prefijo), 'ficticio', PAR)).toBe(false);
  });
});

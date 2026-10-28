import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  anotarTramo,
  avisoDeRelevoPendiente,
  avisoParaClaude,
  carrilesConRelevo,
  leerRegistroContexto,
  MARCA_RELEVO,
  MOTIVO_EDICION_TRAS_RELEVO,
  NOTA_TRAS_RELEVO,
  puedePasarElRelevo,
  tokensDeContexto,
  tramoDeContexto,
  ultimoTramo,
} from '../../scripts/arnes/comun/relevo.ts';
import type { TramoAnotado } from '../../scripts/arnes/comun/relevo.ts';
import { directorioTemporal, escribirFicheros } from './temporal.ts';

/** Una línea del transcript con la respuesta de una llamada al modelo. */
function respuesta(entrada: number, cacheLeida: number, extra: Record<string, unknown> = {}): string {
  return JSON.stringify({
    type: 'assistant',
    message: {
      usage: { input_tokens: entrada, cache_creation_input_tokens: 500, cache_read_input_tokens: cacheLeida },
    },
    ...extra,
  });
}

function tramo(sesion: string, valor: number): TramoAnotado {
  return { fecha: '2026-10-24T10:00:00.000Z', sesion, tokens: 145_000, tramo: valor };
}

describe('tokensDeContexto', () => {
  it('suma la entrada y la caché de la última respuesta de la conversación principal', () => {
    const transcript = [
      JSON.stringify({ type: 'user', message: { content: 'hola' } }),
      respuesta(10, 50_000),
      respuesta(20, 90_000),
      // Las respuestas de un subagente no cuentan: tienen su propio contexto.
      respuesta(30, 300_000, { isSidechain: true }),
      // Una línea cortada (el transcript se está escribiendo) se salta.
      '{"type":"assistant","message":{"usage":{"input_tok',
      '',
    ].join('\n');
    expect(tokensDeContexto(transcript)).toBe(20 + 500 + 90_000);
  });

  it('da undefined si aún no hay ninguna respuesta con su uso', () => {
    expect(tokensDeContexto('')).toBeUndefined();
    expect(tokensDeContexto(JSON.stringify({ type: 'assistant', message: { usage: {} } }))).toBeUndefined();
  });
});

describe('tramoDeContexto', () => {
  it.each([
    [144_999, 0],
    [145_000, 1],
    [164_999, 1],
    [165_000, 2],
    [210_000, 4],
  ])('%i tokens están en el tramo %i', (tokens, esperado) => {
    expect(tramoDeContexto(tokens)).toBe(esperado);
  });
});

describe('puedePasarElRelevo', () => {
  it('solo deja parar con [RELEVO] desde el umbral', () => {
    expect(puedePasarElRelevo(144_999)).toBe(false);
    expect(puedePasarElRelevo(145_000)).toBe(true);
  });
});

describe('registro de tramos', () => {
  it('guarda los tramos y devuelve el último de cada conversación', () => {
    const raiz = directorioTemporal();
    escribirFicheros(raiz, { '.claude/.vacio': '' });
    anotarTramo(raiz, tramo('a', 1));
    anotarTramo(raiz, tramo('b', 3));
    anotarTramo(raiz, tramo('a', 2));
    const registro = leerRegistroContexto(raiz);
    expect(ultimoTramo(registro, 'a')).toBe(2);
    expect(ultimoTramo(registro, 'b')).toBe(3);
    expect(ultimoTramo(registro, 'c')).toBe(0);
  });

  it('guarda el carril del tramo si lo tiene', () => {
    const raiz = directorioTemporal();
    escribirFicheros(raiz, { '.claude/.vacio': '' });
    anotarTramo(raiz, { ...tramo('a', 1), carril: 'mate-pasos' });
    anotarTramo(raiz, tramo('b', 1));
    expect(leerRegistroContexto(raiz).map(({ carril }) => carril)).toEqual(['mate-pasos', undefined]);
  });
});

describe('carrilesConRelevo', () => {
  it('encuentra los checkouts con un reports/relevo.md, en el orden dado', () => {
    const [principal, pasos, revision] = [directorioTemporal(), directorioTemporal(), directorioTemporal()];
    escribirFicheros(revision, { 'reports/relevo.md': '# Relevo\n\nFalta el paso 3.\n' });
    escribirFicheros(principal, { 'reports/relevo.md': '' });
    escribirFicheros(pasos, { 'reports/otro.md': '' });
    expect(carrilesConRelevo([principal, pasos, revision])).toEqual([principal, revision]);
  });

  it('no encuentra ninguno sin relevos', () => {
    expect(carrilesConRelevo([directorioTemporal()])).toEqual([]);
    expect(carrilesConRelevo([])).toEqual([]);
  });
});

describe('avisoDeRelevoPendiente', () => {
  it('da la ruta absoluta del relevo de cada checkout y pide borrarlo al leerlo', () => {
    const aviso = avisoDeRelevoPendiente(['/repo', '/repo-mate-pasos']);
    expect(aviso).toContain(
      `${path.join('/repo', 'reports/relevo.md')}, ${path.join('/repo-mate-pasos', 'reports/relevo.md')}.`,
    );
    expect(aviso).toMatch(/lee primero el relevo y bórralo/);
  });
});

describe('avisoParaClaude', () => {
  it('da el tamaño en miles y pide terminar con la marca', () => {
    const aviso = avisoParaClaude(151_400, '/repo');
    expect(aviso).toContain('151 k tokens (umbral: 145 k)');
    expect(aviso).toContain(MARCA_RELEVO);
  });

  it('pide rangos de líneas y las búsquedas hechas, no ficheros enteros', () => {
    const aviso = avisoParaClaude(151_400, '/repo');
    expect(aviso).toContain('rangos fichero:líneas');
    expect(aviso).toMatch(/búsquedas que ya has hecho y lo que dieron/);
  });

  it('pide escribir el relevo en la ruta absoluta del checkout de la conversación', () => {
    expect(avisoParaClaude(151_400, '/repo-mate-pasos')).toContain(
      `en ${path.join('/repo-mate-pasos', 'reports/relevo.md')}:`,
    );
  });
});

describe('después del relevo', () => {
  it('el aviso a Claude dice que no podrá editar más', () => {
    expect(avisoParaClaude(151_400, '/repo')).toMatch(/ya no podrá editar/);
  });

  it('al editar, Claude ve que el relevo está pasado y cómo acabar', () => {
    expect(MOTIVO_EDICION_TRAS_RELEVO).toContain(MARCA_RELEVO);
    expect(MOTIVO_EDICION_TRAS_RELEVO).toContain('[DECISIÓN PENDIENTE]');
  });

  it('con el Stop en rojo, la nota dice que la marca no vale otra vez y que pare con una decisión', () => {
    expect(NOTA_TRAS_RELEVO).toMatch(/no vale otra vez/);
    expect(NOTA_TRAS_RELEVO).toContain('[DECISIÓN PENDIENTE]');
  });
});

import { describe, expect, it } from 'vitest';
import {
  anotarTramo,
  areasConRelevo,
  avisoParaClaude,
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
  return { fecha: '2026-10-24T10:00:00.000Z', sesion, tokens: 120_000, tramo: valor };
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
    [119_999, 0],
    [120_000, 1],
    [139_999, 1],
    [140_000, 2],
    [185_000, 4],
  ])('%i tokens están en el tramo %i', (tokens, esperado) => {
    expect(tramoDeContexto(tokens)).toBe(esperado);
  });
});

describe('puedePasarElRelevo', () => {
  it('solo deja parar con [RELEVO] desde el umbral', () => {
    expect(puedePasarElRelevo(119_999)).toBe(false);
    expect(puedePasarElRelevo(120_000)).toBe(true);
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
});

describe('areasConRelevo', () => {
  it('encuentra las áreas con una sección «## Relevo», sin contar la plantilla', () => {
    const raiz = directorioTemporal();
    escribirFicheros(raiz, {
      'docs/areas/RECU.md': '# RECU\n\n## Relevo\n\nFalta el paso 3.\n',
      'docs/areas/MAST.md': '# MAST\n\n## Relevo   \n',
      'docs/areas/DIAG.md': '# DIAG\n\nEl relevo se apunta al final.\n### Relevo\n',
      'docs/areas/plantilla.md': '# Plantilla\n\n## Relevo\n',
    });
    expect(areasConRelevo(raiz)).toEqual(['MAST', 'RECU']);
  });

  it('no encuentra ninguna si no existe la carpeta de áreas', () => {
    expect(areasConRelevo(directorioTemporal())).toEqual([]);
  });
});

describe('avisoParaClaude', () => {
  it('da el tamaño en miles y pide terminar con la marca', () => {
    const aviso = avisoParaClaude(126_400);
    expect(aviso).toContain('126 k tokens (umbral: 120 k)');
    expect(aviso).toContain(MARCA_RELEVO);
  });
});

describe('después del relevo', () => {
  it('el aviso a Claude dice que no podrá editar más', () => {
    expect(avisoParaClaude(126_400)).toMatch(/ya no podrá editar/);
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

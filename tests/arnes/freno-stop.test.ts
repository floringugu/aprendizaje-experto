import { describe, expect, it } from 'vitest';
import {
  errorDeEntorno,
  motivoDeBloqueo,
  motivoDeBloqueoDelImplementador,
  pasoQueFalla,
} from '../../scripts/arnes/comun/freno-stop.ts';
import type { Fallo, FalloDelImplementador } from '../../scripts/arnes/comun/freno-stop.ts';

const SALIDA_UNIDAD =
  'FAIL tests/unidad/a.test.ts\n✗ Falla el paso «unidad».\nmake: *** [Makefile:40: check] Error 1\n';

function fallo(cambios: Partial<Fallo> = {}): Fallo {
  return {
    objetivo: 'check',
    paso: 'unidad',
    entorno: undefined,
    bloqueosSeguidos: 1,
    salida: SALIDA_UNIDAD,
    ...cambios,
  };
}

describe('pasoQueFalla', () => {
  it('lee el paso de la línea que imprime el Makefile', () => {
    expect(pasoQueFalla(SALIDA_UNIDAD)).toBe('unidad');
    expect(pasoQueFalla('…\n✗ Falla el paso «codigo-muerto».\n')).toBe('codigo-muerto');
  });

  it('devuelve «desconocido» si make falla antes de llegar a un paso', () => {
    expect(pasoQueFalla('make: *** No rule to make target')).toBe('desconocido');
  });
});

describe('errorDeEntorno', () => {
  it.each([
    ['Error: listen EADDRINUSE: address already in use :::3000', 'EADDRINUSE'],
    ["Error: EACCES: permission denied, open '/x'", 'EACCES'],
    ['Error: ENOSPC: System limit for number of file watchers reached', 'ENOSPC'],
    ['bash: line 1: tsc: command not found', 'COMANDO'],
    ['sh: 1: knip: not found', 'COMANDO'],
  ])('reconoce un error del entorno: %s', (salida, codigo) => {
    expect(errorDeEntorno(salida)?.codigo).toBe(codigo);
  });

  it('no confunde un fallo del código con uno del entorno', () => {
    expect(errorDeEntorno(SALIDA_UNIDAD)).toBeUndefined();
    expect(errorDeEntorno('AssertionError: expected "not found" to be "found"')).toBeUndefined();
  });
});

describe('motivoDeBloqueo', () => {
  it('por defecto pide arreglar la causa y añade la salida de make', () => {
    const motivo = motivoDeBloqueo(fallo());
    expect(motivo).toMatch(/^make check falla en el paso «unidad»/);
    expect(motivo).toMatch(/Arregla la causa, no la comprobación/);
    expect(motivo).toMatch(/Últimas líneas de make check:\n\nFAIL tests\/unidad\/a\.test\.ts/);
  });

  it('en el tercer bloqueo seguido pide el mecanismo del fallo en una frase', () => {
    expect(motivoDeBloqueo(fallo({ bloqueosSeguidos: 2 }))).not.toMatch(/mecanismo/);
    const motivo = motivoDeBloqueo(fallo({ bloqueosSeguidos: 3 }));
    expect(motivo).toMatch(/bloqueo n\.º 3 seguido del paso «unidad»/);
    expect(motivo).toMatch(/en una sola frase el mecanismo exacto del fallo/);
    expect(motivo).toMatch(/\[DECISIÓN PENDIENTE\]/);
  });

  it('si falla «integridad», no deja tocar nada y pide darle al dueño los comandos', () => {
    const motivo = motivoDeBloqueo(fallo({ paso: 'integridad', bloqueosSeguidos: 5 }));
    expect(motivo).toMatch(/Falla el paso «integridad»/);
    expect(motivo).toMatch(/git commit/);
    expect(motivo).not.toMatch(/sumas/);
    expect(motivo).not.toMatch(/mecanismo/);
  });

  it('si el fallo es del entorno, avisa de que no es su código, aunque sea el tercer bloqueo', () => {
    const entorno = errorDeEntorno('listen EADDRINUSE');
    const motivo = motivoDeBloqueo(fallo({ entorno, bloqueosSeguidos: 3 }));
    expect(motivo).toMatch(/problema del entorno \(EADDRINUSE\)/);
    expect(motivo).toMatch(/No es tu código: no lo toques/);
    expect(motivo).toMatch(/\[DECISIÓN PENDIENTE\]/);
  });

  it('recorta la salida de make a sus últimas 150 líneas', () => {
    const salida = Array.from({ length: 400 }, (_, indice) => `línea ${String(indice + 1)}`).join('\n');
    const motivo = motivoDeBloqueo(fallo({ salida }));
    expect(motivo).toMatch(/línea 251\n/);
    expect(motivo).not.toMatch(/línea 250\n/);
    expect(motivo.endsWith('línea 400')).toBe(true);
  });
});

function falloDelImplementador(cambios: Partial<FalloDelImplementador> = {}): FalloDelImplementador {
  return { paso: 'unidad', entorno: undefined, bloqueo: 1, salida: SALIDA_UNIDAD, ...cambios };
}

describe('motivoDeBloqueoDelImplementador', () => {
  it('en el primer bloqueo pide arreglar la causa en los ficheros del encargo y añade la salida de make', () => {
    const motivo = motivoDeBloqueoDelImplementador(falloDelImplementador());
    expect(motivo).toMatch(/^make check-implementador falla en el paso «unidad»/);
    expect(motivo).toMatch(/Arregla la causa en los ficheros de tu encargo/);
    expect(motivo).not.toMatch(/último intento/);
    expect(motivo).toMatch(/Últimas líneas de make check-implementador:\n\nFAIL tests\/unidad\/a\.test\.ts/);
  });

  it('en el segundo bloqueo avisa de que es el último intento y pide el mecanismo del fallo', () => {
    const motivo = motivoDeBloqueoDelImplementador(falloDelImplementador({ bloqueo: 2 }));
    expect(motivo).toMatch(/Es tu último intento/);
    expect(motivo).toMatch(/en una sola frase el mecanismo/);
    expect(motivo).toMatch(/devuelve el encargo en ROJO/);
  });

  it('si el fallo es del entorno, pide devolver el encargo sin tocar nada', () => {
    const motivo = motivoDeBloqueoDelImplementador(falloDelImplementador({ entorno: errorDeEntorno('EACCES') }));
    expect(motivo).toMatch(/problema del entorno \(EACCES\)/);
    expect(motivo).toMatch(/No es tu código: no lo toques/);
    expect(motivo).toMatch(/\[DECISIÓN PENDIENTE\]/);
  });
});

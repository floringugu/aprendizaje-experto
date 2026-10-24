import { describe, expect, it } from 'vitest';
import {
  anotarEvento,
  bloqueosDelAgente,
  leerRegistroEnrutador,
  parsearRegistroEnrutador,
  ultimoModeloDeLaTarea,
} from '../../scripts/arnes/comun/registro-enrutador.ts';
import type { BloqueoAnotado, EncargoAnotado } from '../../scripts/arnes/comun/registro-enrutador.ts';
import { directorioTemporal, escribirFicheros } from './temporal.ts';

function encargo(tarea: string, modelo: string, sesion = 'a'): EncargoAnotado {
  return {
    tipo: 'encargo',
    fecha: '2026-10-24T10:00:00.000Z',
    sesion,
    tarea,
    modelo,
    ficheros: ['src/dominio/fases.ts', 'tests/unidad/fases.test.ts'],
  };
}

function bloqueo(agente: string): BloqueoAnotado {
  return { tipo: 'bloqueo', fecha: '2026-10-24T10:05:00.000Z', sesion: 'a', agente, paso: 'unidad' };
}

describe('parsearRegistroEnrutador', () => {
  it('lee los encargos y los bloqueos, y se salta las líneas cortadas y las incompletas', () => {
    const texto = [
      JSON.stringify(encargo('MAST-3', 'haiku')),
      '{"tipo":"encargo","sesion":"a","ta',
      JSON.stringify({ tipo: 'encargo', sesion: 'a', tarea: 'MAST-3' }),
      JSON.stringify({ tipo: 'bloqueo', sesion: 'a', paso: 'lint' }),
      JSON.stringify({ tipo: 'otro', sesion: 'a', agente: 'x' }),
      '',
      JSON.stringify(bloqueo('x')),
    ].join('\n');
    expect(parsearRegistroEnrutador(texto)).toEqual([encargo('MAST-3', 'haiku'), bloqueo('x')]);
  });
});

describe('anotarEvento y leerRegistroEnrutador', () => {
  it('devuelve un registro vacío si el fichero aún no existe', () => {
    expect(leerRegistroEnrutador(directorioTemporal())).toEqual([]);
  });

  it('añade cada evento al final y lo lee igual que se escribió', () => {
    const raiz = directorioTemporal();
    escribirFicheros(raiz, { '.claude/.vacio': '' });
    anotarEvento(raiz, encargo('MAST-3', 'haiku'));
    anotarEvento(raiz, bloqueo('x'));
    expect(leerRegistroEnrutador(raiz)).toEqual([encargo('MAST-3', 'haiku'), bloqueo('x')]);
  });
});

describe('ultimoModeloDeLaTarea', () => {
  const registro = [
    encargo('MAST-3', 'haiku'),
    bloqueo('x'),
    encargo('MAST-3', 'sonnet'),
    encargo('MAST-4', 'haiku'),
    encargo('MAST-3', 'haiku', 'b'),
  ];

  it('devuelve el modelo del último encargo de esa tarea en esa conversación', () => {
    expect(ultimoModeloDeLaTarea(registro, 'a', 'MAST-3')).toBe('sonnet');
    expect(ultimoModeloDeLaTarea(registro, 'b', 'MAST-3')).toBe('haiku');
  });

  it('devuelve undefined si la tarea no se ha encargado en esa conversación', () => {
    expect(ultimoModeloDeLaTarea(registro, 'a', 'MAST-5')).toBeUndefined();
    expect(ultimoModeloDeLaTarea(registro, 'c', 'MAST-3')).toBeUndefined();
  });
});

describe('bloqueosDelAgente', () => {
  it('cuenta solo los bloqueos de ese subagente', () => {
    const registro = [bloqueo('x'), encargo('MAST-3', 'haiku'), bloqueo('y'), bloqueo('x')];
    expect(bloqueosDelAgente(registro, 'x')).toBe(2);
    expect(bloqueosDelAgente(registro, 'z')).toBe(0);
  });
});

import { describe, expect, it } from 'vitest';
import { enrutar, leerEncargo, modeloInicial, subagentesEnCurso } from '../../scripts/arnes/comun/enrutador.ts';
import type { ContextoEnrutador, Enrutado } from '../../scripts/arnes/comun/enrutador.ts';
import type { EncargoAnotado } from '../../scripts/arnes/comun/registro-enrutador.ts';

const PROMPT_DE_DOMINIO = 'Tarea: MAST-3\nFicheros: src/dominio/fases.ts, tests/unidad/fases.test.ts\n\nImplementa…';
const PROMPT_DE_APLICACION = 'Tarea: MAST-4\nFicheros: src/aplicacion/progreso.ts\n\nImplementa…';

function contexto(cambios: Partial<ContextoEnrutador> = {}): ContextoEnrutador {
  return { fase: 'impl', sesion: 'a', registro: [], ...cambios };
}

function llamada(agente: string, prompt: string, otros: Record<string, unknown> = {}): Record<string, unknown> {
  return { subagent_type: agente, description: 'Encargo', prompt, ...otros };
}

function anotado(tarea: string, modelo: string, sesion = 'a'): EncargoAnotado {
  return { tipo: 'encargo', fecha: '2026-10-24T10:00:00.000Z', sesion, tarea, modelo, ficheros: [] };
}

/** La entrada con la que se lanzaría el subagente, si el enrutador la reescribe. */
function entradaReescrita(enrutado: Enrutado): Record<string, unknown> | undefined {
  return enrutado.tipo === 'reescribir' ? enrutado.entrada : undefined;
}

function motivoDelBloqueo(enrutado: Enrutado): string {
  return enrutado.tipo === 'bloquear' ? enrutado.motivo : '';
}

describe('leerEncargo', () => {
  it('lee la tarea y los ficheros, separados por comas o espacios, con las rutas normalizadas', () => {
    const prompt =
      'Hazlo así.\nTarea: MAST-3\nFicheros: ./src/dominio/fases.ts,tests/unidad/fases.test.ts  src/aplicacion/x.ts\n';
    expect(leerEncargo(prompt)).toEqual({
      tarea: 'MAST-3',
      ficheros: ['src/dominio/fases.ts', 'tests/unidad/fases.test.ts', 'src/aplicacion/x.ts'],
    });
  });

  it.each([
    ['sin la línea «Tarea:»', 'Ficheros: src/dominio/fases.ts'],
    ['sin la línea «Ficheros:»', 'Tarea: MAST-3'],
    ['con una tarea de dos palabras', 'Tarea: MAST 3\nFicheros: src/dominio/fases.ts'],
    ['con la lista de ficheros vacía', 'Tarea: MAST-3\nFicheros: , ,'],
  ])('no lee ningún encargo %s', (_caso, prompt) => {
    expect(leerEncargo(prompt)).toBeUndefined();
  });
});

describe('modeloInicial', () => {
  it('elige Haiku si solo toca tests unitarios y como mucho un fichero del dominio', () => {
    expect(modeloInicial(['src/dominio/fases.ts', 'tests/unidad/fases.test.ts'])).toBe('haiku');
    expect(modeloInicial(['tests/unidad/fases.test.ts'])).toBe('haiku');
  });

  it('elige Sonnet si toca la aplicación o varios ficheros del dominio', () => {
    expect(modeloInicial(['src/aplicacion/progreso.ts', 'tests/unidad/fases.test.ts'])).toBe('sonnet');
    expect(modeloInicial(['src/dominio/fases.ts', 'src/dominio/acierto.ts'])).toBe('sonnet');
  });
});

describe('enrutar: implementador', () => {
  it('fija el modelo de la regla por encima del que pase Claude, quita el esfuerzo y conserva lo demás', () => {
    const enrutado = enrutar(
      llamada('implementador', PROMPT_DE_DOMINIO, { model: 'opus', effort: 'max', isolation: 'worktree' }),
      contexto(),
    );
    expect(entradaReescrita(enrutado)).toEqual(
      llamada('implementador', PROMPT_DE_DOMINIO, { isolation: 'worktree', model: 'haiku' }),
    );
    expect(enrutado).toMatchObject({
      encargo: { tarea: 'MAST-3', ficheros: ['src/dominio/fases.ts', 'tests/unidad/fases.test.ts'], modelo: 'haiku' },
      aviso: expect.stringMatching(/^Enrutador: la tarea MAST-3 va a haiku/) as unknown,
    });
  });

  it('encarga a Sonnet lo que toca la aplicación', () => {
    expect(entradaReescrita(enrutar(llamada('implementador', PROMPT_DE_APLICACION), contexto()))).toMatchObject({
      model: 'sonnet',
    });
  });

  it('un reencargo de la misma tarea en la misma conversación sube de Haiku a Sonnet', () => {
    const enrutado = enrutar(
      llamada('implementador', PROMPT_DE_DOMINIO),
      contexto({ registro: [anotado('MAST-3', 'haiku')] }),
    );
    expect(entradaReescrita(enrutado)).toMatchObject({ model: 'sonnet' });
    expect(enrutado).toMatchObject({
      aviso: expect.stringMatching(/reencargo: la vez anterior fue a haiku/) as unknown,
    });
  });

  it('después de Sonnet no hay más escalones: bloquea y pide hacerlo o parar con la marca', () => {
    const enrutado = enrutar(
      llamada('implementador', PROMPT_DE_APLICACION),
      contexto({ registro: [anotado('MAST-4', 'sonnet')] }),
    );
    expect(enrutado.tipo).toBe('bloquear');
    expect(motivoDelBloqueo(enrutado)).toMatch(/MAST-4 ya se encargó a Sonnet/);
    expect(motivoDelBloqueo(enrutado)).toMatch(/\[DECISIÓN PENDIENTE\]/);
  });

  it('no cuentan los encargos de otra conversación ni los de otra tarea', () => {
    const registro = [anotado('MAST-3', 'sonnet', 'b'), anotado('MAST-2', 'sonnet')];
    expect(
      entradaReescrita(enrutar(llamada('implementador', PROMPT_DE_DOMINIO), contexto({ registro }))),
    ).toMatchObject({ model: 'haiku' });
  });

  it('bloquea el encargo fuera de la fase impl', () => {
    const enrutado = enrutar(llamada('implementador', PROMPT_DE_DOMINIO), contexto({ fase: 'specs' }));
    expect(motivoDelBloqueo(enrutado)).toMatch(/solo trabaja en la fase impl/);
  });

  it('bloquea el encargo sin las líneas «Tarea:» y «Ficheros:» y enseña el formato', () => {
    const enrutado = enrutar(llamada('implementador', 'Implementa las fases.'), contexto());
    expect(motivoDelBloqueo(enrutado)).toMatch(/Tarea: <ÁREA>-<n>\nFicheros: /);
  });

  it('bloquea las rutas fuera de src/ y tests/unidad/, también las que salen con «..»', () => {
    const prompt = 'Tarea: MAST-3\nFicheros: src/../docs/plan.md, tests/aceptacion/pasos.ts, src/dominio/fases.ts';
    const motivo = motivoDelBloqueo(enrutar(llamada('implementador', prompt), contexto()));
    expect(motivo).toMatch(/el encargo incluye: docs\/plan\.md, tests\/aceptacion\/pasos\.ts\./);
  });
});

describe('enrutar: otros subagentes', () => {
  it('a los revisores les quita el modelo y el esfuerzo para que valgan los de su cabecera', () => {
    const enrutado = enrutar(llamada('revisor-codigo', 'Revisa MAST.', { model: 'haiku', effort: 'low' }), contexto());
    expect(entradaReescrita(enrutado)).toEqual(llamada('revisor-codigo', 'Revisa MAST.'));
    expect(enrutado).toMatchObject({ aviso: expect.stringMatching(/se ha quitado model y effort/) as unknown });
  });

  it('no cambia nada si el revisor no lleva modelo ni esfuerzo', () => {
    expect(enrutar(llamada('revisor-evidencia', 'Revisa.'), contexto())).toEqual({ tipo: 'sin-cambios' });
  });

  it('no toca los demás subagentes ni una entrada que no es un objeto', () => {
    expect(enrutar(llamada('Explore', 'Busca.', { model: 'haiku' }), contexto())).toEqual({ tipo: 'sin-cambios' });
    expect(enrutar({ prompt: PROMPT_DE_DOMINIO }, contexto())).toEqual({ tipo: 'sin-cambios' });
    expect(enrutar(null, contexto())).toEqual({ tipo: 'sin-cambios' });
  });
});

describe('subagentesEnCurso', () => {
  it('cuenta solo las tareas de fondo que son subagentes', () => {
    const tareas = [{ type: 'subagent', agent_type: 'implementador' }, { type: 'shell' }, { type: 'subagent' }];
    expect(subagentesEnCurso(tareas)).toBe(2);
  });

  it('devuelve 0 si no hay tareas de fondo o el campo no es una lista', () => {
    expect(subagentesEnCurso([])).toBe(0);
    expect(subagentesEnCurso(undefined)).toBe(0);
    expect(subagentesEnCurso('subagent')).toBe(0);
  });
});

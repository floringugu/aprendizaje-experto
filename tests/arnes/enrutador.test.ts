import { describe, expect, it } from 'vitest';
import { enrutar } from '../../scripts/arnes/comun/enrutador.ts';
import type { ContextoEnrutador, Enrutado } from '../../scripts/arnes/comun/enrutador.ts';

function contexto(cambios: Partial<ContextoEnrutador> = {}): ContextoEnrutador {
  return { fase: 'impl', ...cambios };
}

function llamada(agente: string, prompt: string, otros: Record<string, unknown> = {}): Record<string, unknown> {
  return { subagent_type: agente, description: 'Encargo', prompt, ...otros };
}

/** La entrada con la que se lanzaría el subagente, si el enrutador la reescribe. */
function entradaReescrita(enrutado: Enrutado): Record<string, unknown> | undefined {
  return enrutado.tipo === 'reescribir' ? enrutado.entrada : undefined;
}

function motivoDelBloqueo(enrutado: Enrutado): string {
  return enrutado.tipo === 'bloquear' ? enrutado.motivo : '';
}

describe('enrutar: implementador', () => {
  it('le quita el modelo y el esfuerzo que pase Claude, para que valga el de su cabecera, y conserva lo demás', () => {
    const enrutado = enrutar(
      llamada('implementador', 'Implementa fases.ts.', { model: 'opus', effort: 'max', isolation: 'worktree' }),
      contexto(),
    );
    expect(entradaReescrita(enrutado)).toEqual(
      llamada('implementador', 'Implementa fases.ts.', { isolation: 'worktree' }),
    );
    expect(enrutado).toMatchObject({ aviso: expect.stringMatching(/se ha quitado model y effort/) as unknown });
  });

  it('no cambia nada si el encargo no lleva modelo ni esfuerzo, y no pide etiquetas ni lista de ficheros', () => {
    expect(enrutar(llamada('implementador', 'Implementa las fases.'), contexto())).toEqual({ tipo: 'sin-cambios' });
  });

  it('bloquea el encargo fuera de la fase impl', () => {
    const enrutado = enrutar(llamada('implementador', 'Implementa.'), contexto({ fase: 'specs' }));
    expect(motivoDelBloqueo(enrutado)).toMatch(/solo trabaja en la fase impl/);
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

  it('a los demás subagentes sin modelo les da Haiku si solo buscan, y Sonnet si no', () => {
    expect(entradaReescrita(enrutar(llamada('Explore', 'Busca.'), contexto()))).toEqual(
      llamada('Explore', 'Busca.', { model: 'haiku' }),
    );
    expect(entradaReescrita(enrutar(llamada('Plan', 'Diseña.'), contexto()))).toEqual(
      llamada('Plan', 'Diseña.', { model: 'sonnet' }),
    );
    const sinTipo = enrutar({ prompt: 'Investiga.' }, contexto());
    expect(entradaReescrita(sinTipo)).toEqual({ prompt: 'Investiga.', model: 'sonnet' });
    expect(sinTipo).toMatchObject({ aviso: expect.stringMatching(/general-purpose va a sonnet/) as unknown });
  });

  it('respeta el modelo que pase Claude, no toca un fork ni una entrada que no es un objeto', () => {
    expect(enrutar(llamada('Explore', 'Busca.', { model: 'sonnet' }), contexto())).toEqual({ tipo: 'sin-cambios' });
    expect(enrutar(llamada('fork', 'Sigue.'), contexto())).toEqual({ tipo: 'sin-cambios' });
    expect(enrutar(null, contexto())).toEqual({ tipo: 'sin-cambios' });
  });
});

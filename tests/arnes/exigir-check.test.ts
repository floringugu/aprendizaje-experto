import { describe, expect, it } from 'vitest';
import {
  motivoDeBloqueo,
  motivoDeBloqueoDelImplementador,
  pasoQueFalla,
  subeAGitHub,
} from '../../scripts/arnes/comun/exigir-check.ts';
import type { Fallo } from '../../scripts/arnes/comun/exigir-check.ts';

const SALIDA_UNIDAD =
  'FAIL tests/unidad/a.test.ts\n✗ Falla el paso «unidad».\nmake: *** [Makefile:40: check] Error 1\n';

function fallo(cambios: Partial<Fallo> = {}): Fallo {
  return { objetivo: 'check', paso: 'unidad', salida: SALIDA_UNIDAD, ...cambios };
}

describe('subeAGitHub', () => {
  it.each([
    'git push -u origin HEAD',
    'git push',
    'git add -A && git commit -m x && git push',
    'gh pr create --fill',
    'gh  pr\tcreate --title x',
    // La puerta es textual: también comprueba si el comando solo nombra el push.
    'echo "git push"',
  ])('reconoce un comando que sube a GitHub: %s', (comando) => {
    expect(subeAGitHub(comando)).toBe(true);
  });

  it.each([
    'git status',
    'git commit -m "push the change"',
    'gh pr view',
    'gh pr checks --watch',
    'gh pr merge --auto --rebase',
    'git pushd',
    'npm run push',
    // Limitación conocida: con opciones entre git y push, se escapa (docs/plan.md §11).
    'git -C ../otro push',
  ])('deja pasar sin comprobar lo que no sube a GitHub: %s', (comando) => {
    expect(subeAGitHub(comando)).toBe(false);
  });
});

describe('pasoQueFalla', () => {
  it('lee el paso de la línea que imprime el Makefile', () => {
    expect(pasoQueFalla(SALIDA_UNIDAD)).toBe('unidad');
    expect(pasoQueFalla('…\n✗ Falla el paso «codigo-muerto».\n')).toBe('codigo-muerto');
  });

  it('devuelve «desconocido» si make falla antes de llegar a un paso', () => {
    expect(pasoQueFalla('make: *** No rule to make target')).toBe('desconocido');
  });
});

describe('motivoDeBloqueo', () => {
  it('dice que no puede subir a GitHub, pide arreglar la causa y añade la salida de make', () => {
    const motivo = motivoDeBloqueo(fallo());
    expect(motivo).toMatch(/^make check falla en el paso «unidad»: no puedes hacer git push ni gh pr create/);
    expect(motivo).toMatch(/Arregla la causa, no la comprobación/);
    expect(motivo).toContain('[DECISIÓN PENDIENTE]');
    expect(motivo).toMatch(/Últimas líneas de make check:\n\nFAIL tests\/unidad\/a\.test\.ts/);
  });

  it('recorta la salida de make a sus últimas 150 líneas', () => {
    const salida = Array.from({ length: 400 }, (_, indice) => `línea ${String(indice + 1)}`).join('\n');
    const motivo = motivoDeBloqueo(fallo({ salida }));
    expect(motivo).toMatch(/línea 251\n/);
    expect(motivo).not.toMatch(/línea 250\n/);
    expect(motivo.endsWith('línea 400')).toBe(true);
  });
});

describe('motivoDeBloqueoDelImplementador', () => {
  it('pide arreglar la causa en los ficheros del encargo y añade la salida de make', () => {
    const motivo = motivoDeBloqueoDelImplementador({ paso: 'unidad', salida: SALIDA_UNIDAD });
    expect(motivo).toMatch(/^make check-implementador falla en el paso «unidad»/);
    expect(motivo).toMatch(/Arregla la causa en los ficheros de tu encargo/);
    expect(motivo).toMatch(/Últimas líneas de make check-implementador:\n\nFAIL tests\/unidad\/a\.test\.ts/);
  });

  it('avisa de que es el único intento y pide el mecanismo del fallo antes de devolverlo en rojo', () => {
    const motivo = motivoDeBloqueoDelImplementador({ paso: 'unidad', salida: SALIDA_UNIDAD });
    expect(motivo).toMatch(/Es tu único intento/);
    expect(motivo).toMatch(/en una sola frase el mecanismo/);
    expect(motivo).toMatch(/devuelve el encargo en ROJO/);
  });
});

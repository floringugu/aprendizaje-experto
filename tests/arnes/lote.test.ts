import { describe, expect, it } from 'vitest';
import {
  avisoDeLote,
  crearLote,
  estadoDelLote,
  loteDeLaNoche,
  lotesDeOrigen,
  lotesVivos,
  resumenDelLote,
  textoDelLote,
} from '../../scripts/arnes/comun/lote.ts';
import { RAMA_DE_ORIGEN, traerOrigen } from '../../scripts/arnes/comun/ramas.ts';
import { fusionarLoteComoGitHub, gitBien, otroPrFusionado, prFusionadoEnLote, principalConOrigen } from './origen.ts';
import { repositorioConCommit } from './temporal.ts';
import { texto } from './tickets-de-prueba.ts';

const LOTE = 'lote/1';
const RAMA = 'impl/MATE/pasos';

/** Carpeta principal con `ficheros` en main y la rama lote/1 recién creada en origin. */
function conLote(ficheros: Readonly<Record<string, string>> = {}): string {
  const principal = principalConOrigen(ficheros);
  expect(crearLote(principal, LOTE)).toBeUndefined();
  return principal;
}

/** Carpeta principal cuyo lote/1 ya ha recibido el PR de RAMA con `ficheros`; queda en RAMA. */
function conLoteVivo(ficheros: Readonly<Record<string, string>> = { 'src/a.ts': 'a\n' }): string {
  const principal = conLote();
  prFusionadoEnLote(principal, { rama: RAMA, lote: LOTE, ficheros });
  return principal;
}

/** GitHub fusiona el lote en main y `principal` lo trae. */
function fusionarLote(principal: string): void {
  fusionarLoteComoGitHub(principal, LOTE);
  expect(traerOrigen(principal)).toBeUndefined();
}

function commitDe(principal: string, referencia: string): string {
  return gitBien(principal, ['rev-parse', referencia]).trim();
}

describe('crearLote y lotesDeOrigen', () => {
  it('crea la rama en origin, en el commit de origin/main, y la trae', () => {
    const principal = principalConOrigen({});
    otroPrFusionado(principal);
    expect(traerOrigen(principal)).toBeUndefined();
    expect(crearLote(principal, LOTE)).toBeUndefined();
    expect(commitDe(principal, `origin/${LOTE}`)).toBe(commitDe(principal, RAMA_DE_ORIGEN));
    expect(gitBien(principal, ['ls-remote', '--heads', 'origin', LOTE])).toContain('refs/heads/lote/1');
    // La rama local main, que sigue en el primer commit, no cuenta.
    expect(commitDe(principal, 'main')).not.toBe(commitDe(principal, RAMA_DE_ORIGEN));
  });

  it('dice el motivo si origin no la deja crear', () => {
    expect(crearLote(repositorioConCommit({ 'a.txt': '' }), LOTE)).toMatch(/no se ha podido crear lote\/1 en origin: /);
  });

  it('lista las ramas de lote de origin por su número, sin las que no lo son', () => {
    const principal = principalConOrigen({});
    expect(lotesDeOrigen(principal)).toEqual([]);
    for (const rama of ['lote/10', 'lote/2', 'lote/otra']) expect(crearLote(principal, rama)).toBeUndefined();
    expect(lotesDeOrigen(principal)).toEqual(['lote/2', 'lote/10']);
  });
});

describe('estadoDelLote, lotesVivos y loteDeLaNoche', () => {
  it('sin lotes en origin, la noche usa lote/1, que aún no existe', () => {
    const principal = principalConOrigen({});
    expect(lotesVivos(principal)).toEqual([]);
    expect(loteDeLaNoche(principal)).toEqual({ rama: LOTE, existe: false });
  });

  it('nuevo mientras está en el commit de main: la noche lo usa, y no espera al dueño', () => {
    const principal = conLote();
    expect(estadoDelLote(principal, LOTE)).toBe('nuevo');
    expect(lotesVivos(principal)).toEqual([]);
    expect(loteDeLaNoche(principal)).toEqual({ rama: LOTE, existe: true });
  });

  it('vivo cuando ha recibido un PR que main no tiene: la noche sigue en él', () => {
    const principal = conLoteVivo();
    expect(estadoDelLote(principal, LOTE)).toBe('vivo');
    expect(lotesVivos(principal)).toEqual([LOTE]);
    expect(loteDeLaNoche(principal)).toEqual({ rama: LOTE, existe: true });
  });

  it('fusionado cuando GitHub ha copiado sus commits en main: la noche pasa al número siguiente', () => {
    const principal = conLoteVivo();
    fusionarLote(principal);
    expect(estadoDelLote(principal, LOTE)).toBe('fusionado');
    expect(lotesVivos(principal)).toEqual([]);
    expect(loteDeLaNoche(principal)).toEqual({ rama: 'lote/2', existe: false });
  });

  it('fusionado también si no recibió nada y main siguió adelante: nacería atrasado', () => {
    const principal = conLote();
    otroPrFusionado(principal);
    expect(traerOrigen(principal)).toBeUndefined();
    expect(estadoDelLote(principal, LOTE)).toBe('fusionado');
    expect(loteDeLaNoche(principal)).toEqual({ rama: 'lote/2', existe: false });
  });
});

describe('resumenDelLote', () => {
  it('los tickets que el lote da por hechos y main no, y los ficheros que cambia desde que salió de main', () => {
    const principal = conLote({
      'docs/tickets/uno.md': texto(),
      'docs/tickets/dos.md': texto(),
      'docs/tickets/viejo.md': texto({ estado: 'hecho' }),
    });
    const ficheros = { 'docs/tickets/uno.md': texto({ estado: 'hecho' }), 'src/a.ts': 'a\n' };
    prFusionadoEnLote(principal, { rama: RAMA, lote: LOTE, ficheros });
    // Lo que entra en main después de salir el lote no es del lote.
    otroPrFusionado(principal);
    expect(traerOrigen(principal)).toBeUndefined();
    expect(resumenDelLote(principal, LOTE)).toEqual({
      lote: LOTE,
      tickets: ['uno'],
      ficheros: ['docs/tickets/uno.md', 'src/a.ts'],
    });
  });
});

describe('textoDelLote', () => {
  const CREAR =
    "gh pr create --base main --head lote/1 --title 'Lote 1: lo que la noche fusionó en lote/1' --body 'Aceptación e impl";

  it('con PR: los tickets, los ficheros y el bloque que lo fusiona con bypass y actualiza la carpeta principal', () => {
    const resumen = { lote: LOTE, tickets: ['uno', 'dos'], ficheros: ['src/a.ts', 'tests/unidad/a.test.ts'] };
    expect(textoDelLote(resumen, 57, '/home/yo/proyecto')).toBe(
      [
        'Rama lote/1, sin fusionar en main: 2 tickets hechos (uno, dos).',
        '  PR #57 hacia main: ahí das el visto bueno al lote entero.',
        '  Ficheros (2):',
        '    src/a.ts',
        '    tests/unidad/a.test.ts',
        '  Para fusionarlo:',
        '    cd /home/yo/proyecto',
        '    gh pr checks 57 --watch',
        '    gh pr merge 57 --rebase --admin',
        '    git pull --ff-only',
      ].join('\n'),
    );
  });

  it('sin PR, el bloque empieza por abrirlo; con package-lock.json, acaba con npm ci', () => {
    const resumen = { lote: LOTE, tickets: ['uno'], ficheros: ['package-lock.json'] };
    const lineas = textoDelLote(resumen, undefined, '/home/yo/proyecto').split('\n');
    expect(lineas.slice(0, 2)).toEqual([
      'Rama lote/1, sin fusionar en main: 1 ticket hecho (uno).',
      '  Sin PR abierto hacia main.',
    ]);
    const comandos = lineas.slice(lineas.indexOf('  Para fusionarlo:') + 1).map((linea) => linea.trim());
    expect(comandos[1]?.startsWith(CREAR)).toBe(true);
    expect([comandos[0], ...comandos.slice(2)]).toEqual([
      'cd /home/yo/proyecto',
      'gh pr checks lote/1 --watch',
      'gh pr merge lote/1 --rebase --admin',
      'git pull --ff-only',
      'npm ci',
    ]);
  });

  it('un lote sin tickets hechos lo dice sin paréntesis', () => {
    const texto = textoDelLote({ lote: LOTE, tickets: [], ficheros: [] }, 57, '/p');
    expect(texto).toContain('Rama lote/1, sin fusionar en main: 0 tickets hechos.\n');
  });
});

describe('avisoDeLote', () => {
  it('nada en una rama que sale de main', () => {
    const principal = conLote();
    expect(avisoDeLote(principal)).toBeUndefined();
  });

  it('en una rama de un lote vivo: el PR va al lote y lleva siempre la fusión automática', () => {
    const aviso = avisoDeLote(conLoteVivo());
    expect(aviso).toMatch(/^Este carril sale de la rama de lote lote\/1, no de main/);
    expect(aviso).toContain('actívale siempre «gh pr merge --auto --rebase»');
  });

  it('en una rama de un lote que ya está en main: cómo pasarla a main', () => {
    const principal = conLoteVivo();
    fusionarLote(principal);
    const aviso = avisoDeLote(principal);
    expect(aviso).toMatch(/^Este carril salió de la rama de lote lote\/1, que ya está en main/);
    expect(aviso).toContain('«git rebase --onto origin/main origin/lote/1»');
    expect(aviso).toContain('«git config --unset branch.impl/MATE/pasos.gh-merge-base»');
  });
});

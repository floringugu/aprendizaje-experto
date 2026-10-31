import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { fijarFase } from '../../scripts/arnes/comun/ajustes-locales.ts';
import { anuncioDelCarril } from '../../scripts/arnes/comun/anuncio-carril.ts';
import { commit, gitBien, principalConOrigen } from './origen.ts';
import { escribirFicheros, repositorioConCommit, repositorioConWorktree } from './temporal.ts';
import { texto } from './tickets-de-prueba.ts';

/** La carpeta principal y el carril «pasos», en la fase specs del área MATE. */
function carrilPasos(): { principal: string; carril: string } {
  const { principal, worktree } = repositorioConWorktree((carpeta) => `${path.basename(carpeta)}-pasos`);
  fijarFase(worktree, { fase: 'specs', area: 'MATE' });
  return { principal, carril: worktree };
}

function entrarEn(principal: string, ruta: string, cwd = principal): unknown {
  return { cwd, tool_name: 'EnterWorktree', tool_input: { path: ruta } };
}

describe('anuncioDelCarril', () => {
  it('anuncia el carril, su ruta absoluta, la fase, el área, el make del push y el modelo', () => {
    const { principal, carril } = carrilPasos();
    const anuncio = anuncioDelCarril(principal, entrarEn(principal, carril));
    expect(anuncio?.paraElDueno).toBe(
      'Carril pasos: fase specs (sonnet, esfuerzo high) · área en curso: MATE · git push exige make check-specs.',
    );
    expect(anuncio?.paraClaude).toContain(`en el carril «pasos» (${carril}), en la fase «specs»`);
    expect(anuncio?.paraClaude).toContain('Área en curso: MATE.');
    expect(anuncio?.paraClaude).toContain('gh pr create exigen «make check-specs» en verde en este carril');
    expect(anuncio?.paraClaude).toContain('«/model sonnet»');
    expect(anuncio?.paraClaude).toContain(`van con ruta absoluta (${carril}/…)`);
    expect(anuncio?.paraClaude).not.toMatch(/Relevo pendiente/);
    expect(anuncio?.paraClaude).not.toContain('Ticket del carril');
  });

  it('con ticket en el carril, dice su título, «Hecho cuando», «Leer primero» y «toca»', () => {
    const { principal, carril } = carrilPasos();
    const cuerpo =
      '# Pasos reservados\n\n**Qué:** algo.\n**Hecho cuando:** make check\nen verde.\n**Leer primero:** MATE.md.\n';
    escribirFicheros(carril, { 'docs/tickets/pasos.md': texto({ toca: '[src/a.ts, tests/unidad/]' }, cuerpo) });
    const paraClaude = anuncioDelCarril(principal, entrarEn(principal, carril))?.paraClaude;
    expect(paraClaude).toContain('Ticket del carril (docs/tickets/pasos.md): «Pasos reservados».');
    expect(paraClaude).toContain(
      'Hecho cuando: make check en verde.\nLeer primero: MATE.md.\nToca: src/a.ts, tests/unidad/.',
    );
    expect(paraClaude).not.toContain('Se solapa');
  });

  it('con ticket, dice con qué carriles abiertos se solapa su huella', () => {
    const principal = principalConOrigen({ 'src/a.ts': '', 'docs/tickets/pasos.md': texto({ toca: '[src/a.ts]' }) });
    gitBien(principal, ['fetch', '--quiet', 'origin']);
    gitBien(principal, ['worktree', 'add', '--quiet', '-b', 'impl/MATE/pasos', `${principal}-pasos`, 'origin/main']);
    gitBien(principal, ['worktree', 'add', '--quiet', '-b', 'impl/MATE/otro', `${principal}-otro`, 'origin/main']);
    commit(`${principal}-otro`, 'trabajo', { 'src/a.ts': 'cambio' });
    expect(anuncioDelCarril(principal, entrarEn(principal, `${principal}-pasos`))?.paraClaude).toContain(
      'Se solapa con los carriles abiertos otro (src/a.ts).',
    );
  });

  it('sin .github/CODEOWNERS, avisa de que no hay lista blanca', () => {
    const { principal, carril } = carrilPasos();
    expect(anuncioDelCarril(principal, entrarEn(principal, carril))?.paraClaude).toContain(
      'El carril no tiene lista blanca (.github/CODEOWNERS): todo PR espera al visto bueno del dueño.',
    );
  });

  it('la lista blanca son las líneas sin dueño de .github/CODEOWNERS, sin las vacías ni los comentarios', () => {
    const { principal, carril } = carrilPasos();
    escribirFicheros(carril, {
      '.github/CODEOWNERS':
        '# Lo último gana\n* @dueno\n/src/\n\n#/features/\n  /tests/unidad/  \n**/package.json @dueno\n',
    });
    expect(anuncioDelCarril(principal, entrarEn(principal, carril))?.paraClaude).toContain(
      'se fusiona solo: /src/, /tests/unidad/. Lo demás espera al visto bueno del dueño.',
    );
  });

  it('avisa del relevo pendiente del carril, con su ruta absoluta', () => {
    const { principal, carril } = carrilPasos();
    escribirFicheros(carril, { 'reports/relevo.md': '# Relevo\n' });
    const anuncio = anuncioDelCarril(principal, entrarEn(principal, carril));
    expect(anuncio?.paraElDueno).toMatch(/ · relevo pendiente\.$/);
    expect(anuncio?.paraClaude).toContain(`Relevo pendiente en ${path.join(carril, 'reports/relevo.md')}`);
  });

  it('resuelve una ruta relativa contra el cwd de la entrada', () => {
    const { principal, carril } = carrilPasos();
    const cwd = path.join(principal, 'src');
    expect(anuncioDelCarril(principal, entrarEn(principal, path.relative(cwd, carril), cwd))?.paraClaude).toContain(
      `«pasos» (${carril})`,
    );
  });

  it('no anuncia nada sin path, en otro repositorio ni en la carpeta principal', () => {
    const { principal } = carrilPasos();
    expect(anuncioDelCarril(principal, { cwd: principal, tool_input: {} })).toBeUndefined();
    expect(anuncioDelCarril(principal, entrarEn(principal, repositorioConCommit({ 'a.ts': '' })))).toBeUndefined();
    expect(anuncioDelCarril(principal, entrarEn(principal, principal))).toBeUndefined();
  });
});

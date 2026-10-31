import { mkdirSync, realpathSync, symlinkSync } from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import type { Fase } from '../../scripts/arnes/comun/fases.ts';
import {
  motivoBloqueoBash,
  motivoBloqueoDeLaEntrada,
  motivoBloqueoFichero,
} from '../../scripts/arnes/comun/guardia.ts';
import type { ContextoGuardia } from '../../scripts/arnes/comun/guardia.ts';
import { directorioTemporal, escribirFicheros } from './temporal.ts';

// Las rutas se calculan al cargar el módulo, no en beforeAll: los it.each leen sus valores antes.
const padre = realpathSync(directorioTemporal());
const principal = path.join(padre, 'principal');
const pasos = path.join(padre, 'principal-pasos');
const otro = path.join(padre, 'principal-otro');
/** Un carril dentro de la carpeta principal, como los de EnterWorktree. */
const anidado = path.join(principal, '.claude/worktrees/x');
/** Un directorio hermano que no es un carril. */
const copia = path.join(padre, 'principal-copia');
const home = realpathSync(directorioTemporal());

function desde(checkout: string, fase: Fase = 'impl'): ContextoGuardia {
  return { principal, carriles: [pasos, otro, anidado], checkout, fase, home };
}

beforeAll(() => {
  for (const checkout of [principal, pasos, otro, anidado, copia]) {
    escribirFicheros(checkout, {
      'src/a.ts': '',
      'docs/informe.md': '# informe',
      'features/a.feature': '',
      'tests/aceptacion/pasos.ts': '',
    });
  }
  mkdirSync(path.join(pasos, 'src/enlaces'));
  symlinkSync(otro, path.join(pasos, 'src/enlaces/otro'));
  symlinkSync(path.join(otro, 'docs/informe.md'), path.join(pasos, 'src/enlaces/informe.md'));
  symlinkSync(path.join(pasos, 'features/a.feature'), path.join(pasos, 'src/enlaces/a.feature'));
  symlinkSync(path.join(pasos, 'tests/aceptacion'), path.join(pasos, 'src/enlaces/aceptacion'));
});

describe('motivoBloqueoFichero', () => {
  it('deja editar el carril propio y la carpeta principal', () => {
    expect(motivoBloqueoFichero(path.join(pasos, 'src/a.ts'), desde(pasos))).toBeUndefined();
    expect(motivoBloqueoFichero(path.join(pasos, 'src/nuevo/b.ts'), desde(pasos))).toBeUndefined();
    expect(motivoBloqueoFichero(path.join(principal, 'src/a.ts'), desde(pasos))).toBeUndefined();
  });

  it('bloquea otro carril, dice cuál es y pide parar con una decisión', () => {
    const motivo = motivoBloqueoFichero(path.join(otro, 'src/a.ts'), desde(pasos));
    expect(motivo).toContain(`No se puede tocar ${otro}: es otro carril`);
    expect(motivo).toMatch(/\[DECISIÓN PENDIENTE\]/);
  });

  it('distingue un carril anidado de la carpeta principal que lo contiene', () => {
    expect(motivoBloqueoFichero(path.join(anidado, 'src/a.ts'), desde(pasos))).toContain(anidado);
    expect(motivoBloqueoFichero(path.join(anidado, 'src/a.ts'), desde(anidado))).toBeUndefined();
    expect(motivoBloqueoFichero(path.join(principal, 'src/a.ts'), desde(anidado))).toBeUndefined();
  });

  it('desde la carpeta principal, todos los carriles son ajenos', () => {
    for (const carril of [pasos, otro, anidado]) {
      expect(motivoBloqueoFichero(path.join(carril, 'src/a.ts'), desde(principal))).toMatch(/es otro carril/);
    }
  });

  it('no confunde con un carril un directorio hermano cuyo nombre empieza igual', () => {
    expect(motivoBloqueoFichero(path.join(copia, 'src/a.ts'), desde(pasos))).toBeUndefined();
  });

  it('sigue los enlaces simbólicos, también a directorios', () => {
    expect(motivoBloqueoFichero(path.join(pasos, 'src/enlaces/informe.md'), desde(pasos))).toMatch(/es otro carril/);
    expect(motivoBloqueoFichero(path.join(pasos, 'src/enlaces/otro/src/a.ts'), desde(pasos))).toMatch(/es otro carril/);
  });

  it('no deja salir del carril con «..»', () => {
    expect(motivoBloqueoFichero(`${pasos}/src/../../principal-otro/src/a.ts`, desde(pasos))).toMatch(/es otro carril/);
  });

  it.each([
    path.join(principal, '.git/config'),
    path.join(principal, '.git'),
    path.join(pasos, '.git'),
    path.join(anidado, '.git'),
    path.join(otro, '.git/hooks/pre-commit'),
  ])('bloquea el .git/ de cualquier checkout: %s', (ruta) => {
    expect(motivoBloqueoFichero(ruta, desde(pasos))).toMatch(/No se puede tocar \.git\//);
  });

  it('bloquea ~/.claude/ salvo la memoria de un proyecto y los planes', () => {
    expect(motivoBloqueoFichero(path.join(home, '.claude/settings.json'), desde(pasos))).toMatch(/~\/\.claude\//);
    expect(motivoBloqueoFichero(path.join(home, '.claude/projects/p/memory/nota.md'), desde(pasos))).toBeUndefined();
    expect(motivoBloqueoFichero(path.join(home, '.claude/plans/plan.md'), desde(pasos))).toBeUndefined();
  });

  it('no se mete con ficheros de fuera del repositorio', () => {
    expect(motivoBloqueoFichero(path.join(home, 'notas.txt'), desde(pasos))).toBeUndefined();
  });
});

describe('motivoBloqueoFichero: rutas de cada fase', () => {
  // La tabla entera se prueba en rutas-fase.test.ts; aquí, una ruta prohibida y una permitida por fase.
  it.each([
    ['impl', 'features/a.feature'],
    ['impl', 'tests/aceptacion/pasos.ts'],
    ['aceptacion', 'config/parametros.json'],
    ['specs', 'src/a.ts'],
  ] as const)('la fase %s no puede tocar %s, y lo dice con la ruta, el porqué y la decisión', (fase, ruta) => {
    const motivo = motivoBloqueoFichero(path.join(pasos, ruta), desde(pasos, fase));
    expect(motivo).toMatch(new RegExp(`^La fase ${fase} no puede tocar ${ruta}: .+, que escribe la fase `));
    expect(motivo).toMatch(/\[DECISIÓN PENDIENTE\]/);
  });

  it.each([
    ['impl', 'src/a.ts'],
    ['impl', 'config/alcance.json'],
    ['aceptacion', 'tests/aceptacion/pasos.ts'],
    ['specs', 'features/a.feature'],
  ] as const)('la fase %s sí puede tocar %s', (fase, ruta) => {
    expect(motivoBloqueoFichero(path.join(pasos, ruta), desde(pasos, fase))).toBeUndefined();
  });

  it('aplica la fase de la conversación también en la carpeta principal', () => {
    expect(motivoBloqueoFichero(path.join(principal, 'features/a.feature'), desde(pasos))).toMatch(/fase impl/);
    expect(motivoBloqueoFichero(path.join(principal, 'src/a.ts'), desde(anidado, 'specs'))).toMatch(/fase specs/);
  });

  it('sigue los enlaces simbólicos hasta la ruta de otra fase, también a directorios', () => {
    expect(motivoBloqueoFichero(path.join(pasos, 'src/enlaces/a.feature'), desde(pasos))).toContain(
      'no puede tocar features/a.feature',
    );
    expect(motivoBloqueoFichero(path.join(pasos, 'src/enlaces/aceptacion/nuevo.ts'), desde(pasos))).toContain(
      'no puede tocar tests/aceptacion/nuevo.ts',
    );
  });
});

describe('motivoBloqueoDeLaEntrada', () => {
  it('niega al subagente implementador las rutas de otra fase, con la ruta relativa al checkout', () => {
    const entrada = {
      cwd: pasos,
      agent_id: 'a1b2',
      agent_type: 'implementador',
      tool_name: 'Write',
      tool_input: { file_path: 'tests/aceptacion/pasos.ts', content: '' },
    };
    expect(motivoBloqueoDeLaEntrada(entrada, desde(pasos))).toMatch(/^La fase impl no puede tocar tests\/aceptacion/);
    const enSuEncargo = { ...entrada, tool_input: { file_path: path.join(pasos, 'src/a.ts'), content: '' } };
    expect(motivoBloqueoDeLaEntrada(enSuEncargo, desde(pasos))).toBeUndefined();
  });

  it('mira la ruta del cuaderno en NotebookEdit y el comando en Bash', () => {
    const cuaderno = { tool_name: 'NotebookEdit', tool_input: { notebook_path: 'features/a.ipynb' } };
    expect(motivoBloqueoDeLaEntrada(cuaderno, desde(pasos))).toMatch(/no puede tocar features\/a\.ipynb/);
    const bash = { tool_name: 'Bash', tool_input: { command: 'cat ~/.claude/settings.json' } };
    expect(motivoBloqueoDeLaEntrada(bash, desde(pasos))).toMatch(/~\/\.claude\//);
  });

  it('bloquea por seguridad una edición sin ruta', () => {
    expect(motivoBloqueoDeLaEntrada({ tool_name: 'Edit', tool_input: {} }, desde(pasos))).toMatch(/por seguridad/);
  });
});

describe('motivoBloqueoBash', () => {
  it.each([
    'cat ~/.claude/settings.json',
    'cat "$HOME/.claude/CLAUDE.md"',
    'ls ${HOME}/.claude',
    'cat ~/.claude/projects/../settings.json',
    'rm -rf ~/.claude',
  ])('bloquea ~/.claude/ fuera de projects/ y plans/: %s', (comando) => {
    expect(motivoBloqueoBash(comando, desde(pasos))).toMatch(/~\/\.claude\//);
  });

  it('reconoce también la ruta absoluta del home', () => {
    expect(motivoBloqueoBash(`cat ${home}/.claude/settings.json`, desde(pasos))).toMatch(/~\/\.claude\//);
  });

  it.each([
    ['env -u CLAUDECODE git commit -m x', /entorno/],
    ['CLAUDECODE= git commit -m x', /entorno/],
    ['env -i PATH=/usr/bin make fase F=specs', /entorno/],
    ['claude --settings \'{"disableAllHooks":true}\'', /hooks/],
    ['npm install left-pad', /comparten el node_modules/],
    ['npm i -D left-pad', /comparten el node_modules/],
  ])('bloquea las salidas del arnés: %s', (comando, motivo) => {
    expect(motivoBloqueoBash(comando, desde(pasos))).toMatch(motivo);
  });

  it.each([
    `cat ${otro}/src/a.ts`,
    'cat ../principal-otro/src/a.ts',
    'cd .. && ls principal-otro',
    'git -C ~/principal-otro status',
    `ls ${path.relative(pasos, anidado)}`,
  ])('bloquea un comando que nombra otro carril: %s', (comando) => {
    expect(motivoBloqueoBash(comando, desde(pasos))).toMatch(/es otro carril/);
  });

  it('desde la carpeta principal, nombra un carril anidado por su ruta relativa', () => {
    expect(motivoBloqueoBash('ls .claude/worktrees/x/src', desde(principal))).toContain(anidado);
  });

  it.each([
    `cat ${pasos}/src/a.ts`,
    `cat ${principal}/src/a.ts`,
    'cat ../principal/src/a.ts',
    'ls ../principal-otro-2',
    'ls ../principal-copia',
    'ls .git',
    'git commit --no-verify -m x',
    'git apply x.patch',
    'cat ~/.claude/projects/p/tool-results/x.txt',
    'ls ~/.claude/plans/',
    'cat ~/.claude.json',
    'make check',
    'npm run lint',
    'git status',
  ])('deja pasar un comando normal: %s', (comando) => {
    expect(motivoBloqueoBash(comando, desde(pasos))).toBeUndefined();
  });
});

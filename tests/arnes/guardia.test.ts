import { mkdirSync, symlinkSync } from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { motivoBloqueoBash, motivoBloqueoFichero } from '../../scripts/arnes/comun/guardia.ts';
import type { ContextoGuardia } from '../../scripts/arnes/comun/guardia.ts';
import { parsearProtegidas } from '../../scripts/arnes/comun/protegidas.ts';
import type { Fase } from '../../scripts/arnes/comun/protegidas.ts';
import { directorioTemporal, escribirFicheros } from './temporal.ts';

const PROTEGIDAS = `
docs/investigacion.md
features/ @specs
config/parametros.json @specs
.gitignore
.claude/
`;

let raiz = '';
let home = '';

function contexto(fase: Fase = 'impl'): ContextoGuardia {
  return { raiz, home, entradas: parsearProtegidas(PROTEGIDAS), fase };
}

beforeAll(() => {
  raiz = directorioTemporal();
  home = directorioTemporal();
  escribirFicheros(raiz, { 'docs/investigacion.md': '# informe', 'src/dominio/a.ts': '' });
  mkdirSync(path.join(raiz, 'src', 'enlaces'));
  symlinkSync(path.join(raiz, 'docs', 'investigacion.md'), path.join(raiz, 'src', 'enlaces', 'informe.md'));
  symlinkSync(path.join(raiz, 'docs'), path.join(raiz, 'src', 'enlaces', 'docs'));
});

describe('motivoBloqueoFichero', () => {
  it('bloquea una ruta protegida y dice cómo se cambia: con una propuesta que aplica el dueño', () => {
    const motivo = motivoBloqueoFichero(path.join(raiz, 'docs/investigacion.md'), contexto());
    expect(motivo).toMatch(/«docs\/investigacion\.md» está protegida/);
    expect(motivo).toMatch(/reports\/propuestas\//);
    expect(motivo).toMatch(/comandos exactos/);
    expect(motivo).toMatch(/\[DECISIÓN PENDIENTE\]/);
  });

  it('bloquea un fichero nuevo dentro de un directorio protegido y dice en qué fase se edita', () => {
    expect(motivoBloqueoFichero(path.join(raiz, 'features/nueva.feature'), contexto())).toMatch(
      /conversación con la fase specs/,
    );
  });

  it('deja escribir en features/ solo en la fase specs', () => {
    expect(motivoBloqueoFichero(path.join(raiz, 'features/nueva.feature'), contexto('specs'))).toBeUndefined();
    expect(motivoBloqueoFichero(path.join(raiz, 'docs/investigacion.md'), contexto('specs'))).toBeDefined();
  });

  it('deja editar el código de la aplicación', () => {
    expect(motivoBloqueoFichero(path.join(raiz, 'src/dominio/a.ts'), contexto())).toBeUndefined();
    expect(motivoBloqueoFichero(path.join(raiz, 'src/dominio/nuevo.ts'), contexto())).toBeUndefined();
  });

  it('sigue los enlaces simbólicos, también a directorios', () => {
    expect(motivoBloqueoFichero(path.join(raiz, 'src/enlaces/informe.md'), contexto())).toBeDefined();
    expect(motivoBloqueoFichero(path.join(raiz, 'src/enlaces/docs/investigacion.md'), contexto())).toBeDefined();
  });

  it('no deja salir del directorio con «..»', () => {
    expect(motivoBloqueoFichero(`${raiz}/src/../docs/investigacion.md`, contexto())).toBeDefined();
  });

  it('bloquea .git/', () => {
    expect(motivoBloqueoFichero(path.join(raiz, '.git/hooks/pre-commit'), contexto())).toMatch(/\.git\//);
  });

  it('bloquea ~/.claude/ salvo la memoria de un proyecto', () => {
    expect(motivoBloqueoFichero(path.join(home, '.claude/settings.json'), contexto())).toMatch(/~\/\.claude\//);
    expect(motivoBloqueoFichero(path.join(home, '.claude/projects/p/memory/nota.md'), contexto())).toBeUndefined();
  });

  it('no se mete con ficheros de fuera del repositorio', () => {
    expect(motivoBloqueoFichero(path.join(home, 'notas.txt'), contexto())).toBeUndefined();
  });
});

describe('motivoBloqueoBash', () => {
  it.each([
    'cat docs/investigacion.md',
    'sed -i s/a/b/ ./docs/investigacion.md',
    'cd docs && cp /tmp/x investigacion.md',
    'echo "Escenario" >> features/dominio.feature',
    'rm -rf features',
    "python3 -c \"open('config/parametros.json','w')\"",
    'cat .claude/settings.json',
    'echo x > .gitignore',
  ])('bloquea un comando que nombra una ruta protegida: %s', (comando) => {
    const motivo = motivoBloqueoBash(comando, contexto());
    expect(motivo).toMatch(/ruta protegida/);
    expect(motivo).toMatch(/reports\/propuestas\//);
  });

  it.each([
    ['git commit --no-verify -m x', /pre-commit/],
    ['git commit -nm x', /pre-commit/],
    ['git config core.hooksPath /dev/null', /hooksPath/],
    ['env -u CLAUDECODE git commit -m x', /entorno/],
    ['CLAUDECODE= git commit -m x', /entorno/],
    ['env -i PATH=/usr/bin make sumas', /entorno/],
    ['ARNES_FASE=specs make check', /ARNES_FASE/],
    ['npm install left-pad', /dependencias/],
    ['npm i -D left-pad', /dependencias/],
    ['ls .git/hooks', /\.git\//],
    ['git apply reports/propuestas/x.patch', /las aplica el dueño/],
    ['git apply --3way x.patch', /las aplica el dueño/],
    ['git -C /tmp/clon am x.patch', /las aplica el dueño/],
    ['patch -p1 < x.patch', /las aplica el dueño/],
    ['cd /tmp && patch -p1 < x.patch', /las aplica el dueño/],
  ])('bloquea las salidas del arnés: %s', (comando, motivo) => {
    expect(motivoBloqueoBash(comando, contexto())).toMatch(motivo);
  });

  it.each([
    'make check',
    'npm run lint',
    'git status',
    'git diff src/dominio/a.ts',
    'cat .gitignore-de-otro',
    'grep -rn MAST src/',
    'npx vitest run tests/unidad',
    // Preparar una propuesta sí está permitido: editar un clon y guardar el parche.
    'git -C /tmp/clon add -A',
    'git -C /tmp/clon diff --cached --binary > reports/propuestas/x.patch',
    'ls reports/propuestas/',
  ])('deja pasar un comando normal: %s', (comando) => {
    expect(motivoBloqueoBash(comando, contexto())).toBeUndefined();
  });

  it('deja nombrar features/ en la fase specs, pero no el informe', () => {
    expect(motivoBloqueoBash('ls features/', contexto('specs'))).toBeUndefined();
    expect(motivoBloqueoBash('cat docs/investigacion.md', contexto('specs'))).toBeDefined();
  });
});

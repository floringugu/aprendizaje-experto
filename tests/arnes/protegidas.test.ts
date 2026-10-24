import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import {
  cubre,
  entradaQueBloquea,
  faseDeEntorno,
  ficherosVigilados,
  parsearProtegidas,
} from '../../scripts/arnes/comun/protegidas.ts';
import { directorioTemporal, escribirFicheros } from './temporal.ts';

const TEXTO = `
# comentario
docs/investigacion.md
features/ @specs   # se edita en la etapa 2
tests/aceptacion/ @aceptacion
`;

describe('parsearProtegidas', () => {
  it('lee rutas y anotaciones, e ignora comentarios y líneas vacías', () => {
    expect(parsearProtegidas(TEXTO)).toEqual([
      { ruta: 'docs/investigacion.md', desbloqueadaEn: undefined },
      { ruta: 'features/', desbloqueadaEn: 'specs' },
      { ruta: 'tests/aceptacion/', desbloqueadaEn: 'aceptacion' },
    ]);
  });

  it('admite @impl: la deuda de diseño se edita en la fase impl', () => {
    expect(parsearProtegidas('docs/deuda-diseno.md @impl')).toEqual([
      { ruta: 'docs/deuda-diseno.md', desbloqueadaEn: 'impl' },
    ]);
  });

  it('rechaza una anotación que no es una fase', () => {
    expect(() => parsearProtegidas('features/ @todas')).toThrow(/anotación no válida/);
    expect(() => parsearProtegidas('features/ specs')).toThrow(/anotación no válida/);
  });
});

describe('cubre', () => {
  it('una entrada de directorio cubre el directorio y todo lo que hay dentro', () => {
    const entrada = { ruta: 'features/', desbloqueadaEn: undefined };
    expect(cubre(entrada, 'features')).toBe(true);
    expect(cubre(entrada, 'features/a/b.feature')).toBe(true);
    expect(cubre(entrada, 'features-viejas/a.feature')).toBe(false);
  });

  it('una entrada de fichero solo cubre ese fichero', () => {
    const entrada = { ruta: 'docs/arnes.md', desbloqueadaEn: undefined };
    expect(cubre(entrada, 'docs/arnes.md')).toBe(true);
    expect(cubre(entrada, 'docs/arnes.md.bak')).toBe(false);
    expect(cubre(entrada, 'docs/arnes-verificacion.md')).toBe(false);
  });
});

describe('entradaQueBloquea', () => {
  const entradas = parsearProtegidas(TEXTO);

  it('bloquea lo protegido en la fase impl', () => {
    expect(entradaQueBloquea('features/a.feature', entradas, 'impl')?.ruta).toBe('features/');
    expect(entradaQueBloquea('docs/investigacion.md', entradas, 'specs')?.ruta).toBe('docs/investigacion.md');
  });

  it('deja pasar una ruta en la fase que la desbloquea, y solo en esa', () => {
    expect(entradaQueBloquea('features/a.feature', entradas, 'specs')).toBeUndefined();
    expect(entradaQueBloquea('features/a.feature', entradas, 'aceptacion')).toBeDefined();
    expect(entradaQueBloquea('tests/aceptacion/pasos.ts', entradas, 'aceptacion')).toBeUndefined();
  });

  it('deja editar en impl la ruta anotada con @impl, y la bloquea en las demás fases', () => {
    const deuda = parsearProtegidas('docs/deuda-diseno.md @impl');
    expect(entradaQueBloquea('docs/deuda-diseno.md', deuda, 'impl')).toBeUndefined();
    expect(entradaQueBloquea('docs/deuda-diseno.md', deuda, 'specs')?.ruta).toBe('docs/deuda-diseno.md');
  });

  it('no bloquea lo que no está en la lista', () => {
    expect(entradaQueBloquea('src/dominio/dominio.ts', entradas, 'impl')).toBeUndefined();
  });
});

describe('faseDeEntorno', () => {
  it('es impl si no se indica', () => {
    expect(faseDeEntorno({})).toBe('impl');
  });

  it('acepta las tres fases y rechaza cualquier otra', () => {
    expect(faseDeEntorno({ ARNES_FASE: 'specs' })).toBe('specs');
    expect(faseDeEntorno({ ARNES_FASE: 'aceptacion' })).toBe('aceptacion');
    expect(() => faseDeEntorno({ ARNES_FASE: 'libre' })).toThrow(/no es válida/);
  });
});

describe('ficherosVigilados', () => {
  const entradas = parsearProtegidas('docs/a.md\nfeatures/ @specs\n.claude/\n');

  it('lista los ficheros reales de los directorios protegidos, sin los ignorados ni los que la fase desbloquea', () => {
    const raiz = directorioTemporal();
    spawnSync('git', ['init', '--quiet'], { cwd: raiz });
    escribirFicheros(raiz, {
      '.gitignore': '.claude/settings.local.json\n',
      'docs/a.md': 'a',
      'features/x.feature': 'x',
      '.claude/settings.json': '{}',
      '.claude/settings.local.json': '{}',
      'src/libre.ts': '',
    });
    expect(ficherosVigilados(raiz, entradas, 'impl')).toEqual([
      '.claude/settings.json',
      'docs/a.md',
      'features/x.feature',
    ]);
    expect(ficherosVigilados(raiz, entradas, 'specs')).toEqual(['.claude/settings.json', 'docs/a.md']);
  });
});

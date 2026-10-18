import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { parsearProtegidas } from '../../scripts/arnes/comun/protegidas.ts';
import {
  calcularSumas,
  compararSumas,
  describirDiferencia,
  ficherosVigilados,
  parsearSumas,
  serializarSumas,
  sha256,
  sumasVigiladas,
} from '../../scripts/arnes/comun/sumas.ts';
import { directorioTemporal, escribirFicheros } from './temporal.ts';

const SUMA_A = sha256('a');
const SUMA_B = sha256('b');

describe('formato de las sumas', () => {
  it('es el de sha256sum, ordenado por ruta, y se puede leer de vuelta', () => {
    const sumas = new Map([
      ['z.txt', SUMA_B],
      ['a.txt', SUMA_A],
    ]);
    const texto = serializarSumas(sumas);
    expect(texto).toBe(`${SUMA_A}  a.txt\n${SUMA_B}  z.txt\n`);
    expect(parsearSumas(texto)).toEqual(new Map([...sumas].reverse()));
  });

  it('ignora las líneas que no son sumas', () => {
    expect(parsearSumas(`basura\n${SUMA_A}  a.txt\n\n`).size).toBe(1);
  });
});

describe('compararSumas', () => {
  it('detecta ficheros cambiados, sin suma y desaparecidos', () => {
    const esperadas = new Map([
      ['igual', SUMA_A],
      ['cambiado', SUMA_A],
      ['borrado', SUMA_A],
    ]);
    const actuales = new Map([
      ['igual', SUMA_A],
      ['cambiado', SUMA_B],
      ['nuevo', SUMA_A],
    ]);
    expect(compararSumas(esperadas, actuales)).toEqual([
      { ruta: 'borrado', tipo: 'falta' },
      { ruta: 'cambiado', tipo: 'cambiado' },
      { ruta: 'nuevo', tipo: 'sin-suma' },
    ]);
  });

  it('describe cada diferencia', () => {
    expect(describirDiferencia({ ruta: 'x', tipo: 'cambiado' })).toBe('x: ha cambiado respecto a su suma');
  });
});

describe('qué se vigila en cada fase', () => {
  const entradas = parsearProtegidas('docs/a.md\nfeatures/ @specs\n.claude/\n');

  it('sumasVigiladas quita lo que la fase desbloquea y el propio fichero de sumas', () => {
    const sumas = new Map([
      ['docs/a.md', SUMA_A],
      ['features/x.feature', SUMA_A],
      ['.claude/sumas.sha256', SUMA_A],
      ['src/libre.ts', SUMA_A],
    ]);
    expect([...sumasVigiladas(sumas, entradas, 'impl').keys()]).toEqual(['docs/a.md', 'features/x.feature']);
    expect([...sumasVigiladas(sumas, entradas, 'specs').keys()]).toEqual(['docs/a.md']);
  });

  it('ficherosVigilados lista los ficheros reales de los directorios protegidos', () => {
    const raiz = directorioTemporal();
    spawnSync('git', ['init', '--quiet'], { cwd: raiz });
    escribirFicheros(raiz, {
      'docs/a.md': 'a',
      'features/x.feature': 'x',
      '.claude/settings.json': '{}',
      '.claude/sumas.sha256': '',
      'src/libre.ts': '',
    });
    expect(ficherosVigilados(raiz, entradas, 'impl')).toEqual([
      '.claude/settings.json',
      'docs/a.md',
      'features/x.feature',
    ]);
    expect(ficherosVigilados(raiz, entradas, 'specs')).toEqual(['.claude/settings.json', 'docs/a.md']);
    expect(calcularSumas(raiz, ['docs/a.md', 'no-existe'])).toEqual(new Map([['docs/a.md', SUMA_A]]));
  });
});

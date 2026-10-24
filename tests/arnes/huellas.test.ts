import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  almacenDeHuellas,
  describirRestauracion,
  ficherosConHuella,
  restaurarCambios,
  tomarHuellas,
} from '../../scripts/arnes/comun/huellas.ts';
import type { Vigilancia } from '../../scripts/arnes/comun/huellas.ts';
import { parsearProtegidas } from '../../scripts/arnes/comun/protegidas.ts';
import type { Fase } from '../../scripts/arnes/comun/protegidas.ts';
import { directorioTemporal, escribirFicheros, gitEn } from './temporal.ts';

const ENTRADAS = parsearProtegidas('docs/informe.md\nfeatures/ @specs\n.claude/\n');
const AHORA = new Date('2026-10-24T10:15:30.123Z');
const APARTADOS = 'reports/huellas/2026-10-24T10-15-30Z-toolu_1';
const AJUSTES_LOCALES = JSON.stringify({ env: { ARNES_FASE: 'impl' }, permissions: { allow: [] } });

let raiz = '';

function vigilancia(idComando = 'toolu_1'): Vigilancia {
  return { raiz, almacen: almacenDeHuellas(raiz), idComando };
}

function rutas(fase: Fase = 'impl'): string[] {
  return ficherosConHuella(raiz, ENTRADAS, fase);
}

function leer(ruta: string): string {
  return readFileSync(path.join(raiz, ruta), 'utf8');
}

function escribir(ruta: string, contenido: string): void {
  writeFileSync(path.join(raiz, ruta), contenido);
}

/** Lo que hace el hook alrededor de un comando: huellas en PreToolUse, restauración en PostToolUse. */
function alrededorDe(comando: () => void, idComando = 'toolu_1'): ReturnType<typeof restaurarCambios> {
  tomarHuellas(vigilancia(idComando), rutas(), AHORA);
  comando();
  return restaurarCambios(vigilancia(idComando), rutas(), AHORA);
}

beforeEach(() => {
  raiz = directorioTemporal();
  spawnSync('git', ['init', '--quiet'], { cwd: raiz });
  escribirFicheros(raiz, {
    '.gitignore': '.claude/settings.local.json\nreports/\n',
    'docs/informe.md': '# informe',
    'features/a.feature': 'a',
    '.claude/settings.json': '{}',
    '.claude/settings.local.json': AJUSTES_LOCALES,
    'src/libre.ts': '',
  });
});

describe('ficherosConHuella', () => {
  it('añade los ajustes locales, aunque git los ignore', () => {
    expect(rutas()).toEqual([
      '.claude/settings.json',
      '.claude/settings.local.json',
      'docs/informe.md',
      'features/a.feature',
    ]);
  });

  it('deja fuera lo que la fase desbloquea', () => {
    expect(rutas('specs')).not.toContain('features/a.feature');
  });
});

describe('almacenDeHuellas', () => {
  it('está dentro de .git/, que Claude no puede nombrar', () => {
    expect(almacenDeHuellas(raiz)).toBe(path.join(raiz, '.git', 'arnes-huellas'));
  });
});

describe('restaurarCambios', () => {
  it('devuelve a como estaba un fichero cambiado y aparta la versión del comando', () => {
    const restauracion = alrededorDe(() => {
      escribir('docs/informe.md', '# cambiado');
    });
    expect(restauracion?.diferencias).toEqual([{ ruta: 'docs/informe.md', tipo: 'cambiado' }]);
    expect(leer('docs/informe.md')).toBe('# informe');
    expect(leer(`${APARTADOS}/docs/informe.md`)).toBe('# cambiado');
  });

  it('vuelve a poner un directorio borrado', () => {
    const restauracion = alrededorDe(() => {
      rmSync(path.join(raiz, 'features'), { recursive: true });
    });
    expect(restauracion?.diferencias).toEqual([{ ruta: 'features/a.feature', tipo: 'falta' }]);
    expect(leer('features/a.feature')).toBe('a');
  });

  it('quita un fichero nuevo dentro de un directorio protegido y lo aparta', () => {
    const restauracion = alrededorDe(() => {
      escribir('features/nueva.feature', 'nueva');
    });
    expect(restauracion?.diferencias).toEqual([{ ruta: 'features/nueva.feature', tipo: 'sin-suma' }]);
    expect(existsSync(path.join(raiz, 'features/nueva.feature'))).toBe(false);
    expect(leer(`${APARTADOS}/features/nueva.feature`)).toBe('nueva');
  });

  it('no toca nada si el comando no cambió rutas protegidas', () => {
    const restauracion = alrededorDe(() => {
      escribir('src/libre.ts', 'export {};');
    });
    expect(restauracion?.diferencias).toEqual([]);
    expect(leer('src/libre.ts')).toBe('export {};');
    expect(existsSync(path.join(raiz, 'reports'))).toBe(false);
  });

  it('no vigila lo que la fase desbloquea', () => {
    tomarHuellas(vigilancia(), rutas('specs'), AHORA);
    escribir('features/a.feature', 'b');
    expect(restaurarCambios(vigilancia(), rutas('specs'), AHORA)?.diferencias).toEqual([]);
    expect(leer('features/a.feature')).toBe('b');
  });

  it('deja los permisos que Claude Code guarda en los ajustes locales', () => {
    const conPermiso = JSON.stringify({ env: { ARNES_FASE: 'impl' }, permissions: { allow: ['Bash(ls:*)'] } });
    const restauracion = alrededorDe(() => {
      escribir('.claude/settings.local.json', conPermiso);
    });
    expect(restauracion?.diferencias).toEqual([]);
    expect(leer('.claude/settings.local.json')).toBe(conPermiso);
  });

  it('deshace un cambio de fase en los ajustes locales', () => {
    const restauracion = alrededorDe(() => {
      escribir('.claude/settings.local.json', JSON.stringify({ env: { ARNES_FASE: 'specs' } }));
    });
    expect(restauracion?.diferencias).toEqual([{ ruta: '.claude/settings.local.json', tipo: 'cambiado' }]);
    expect(leer('.claude/settings.local.json')).toBe(AJUSTES_LOCALES);
  });

  it('si el comando cambia un fichero por un enlace, quita el enlace sin escribir en su destino', () => {
    const fuera = path.join(directorioTemporal(), 'fuera.txt');
    writeFileSync(fuera, 'fuera');
    alrededorDe(() => {
      rmSync(path.join(raiz, 'docs/informe.md'));
      symlinkSync(fuera, path.join(raiz, 'docs/informe.md'));
    });
    expect(lstatSync(path.join(raiz, 'docs/informe.md')).isSymbolicLink()).toBe(false);
    expect(leer('docs/informe.md')).toBe('# informe');
    expect(readFileSync(fuera, 'utf8')).toBe('fuera');
  });

  it('devuelve undefined si no hay huellas de antes, también si ya se usaron', () => {
    expect(restaurarCambios(vigilancia(), rutas(), AHORA)).toBeUndefined();
    alrededorDe(() => undefined);
    expect(restaurarCambios(vigilancia(), rutas(), AHORA)).toBeUndefined();
  });

  it('borra las huellas de más de un día, de comandos que no llegaron a ejecutarse', () => {
    tomarHuellas(vigilancia('toolu_viejo'), rutas(), AHORA);
    const pasadoManana = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    tomarHuellas(vigilancia('toolu_nuevo'), rutas(), pasadoManana);
    expect(restaurarCambios(vigilancia('toolu_viejo'), rutas(), AHORA)).toBeUndefined();
    expect(restaurarCambios(vigilancia('toolu_nuevo'), rutas(), AHORA)).toBeDefined();
  });

  it('no acepta un tool_use_id que no sirva como nombre de fichero', () => {
    expect(() => {
      tomarHuellas(vigilancia('../x'), rutas(), AHORA);
    }).toThrow(/tool_use_id/);
  });
});

describe('restaurarCambios y el último commit', () => {
  function commitear(): void {
    gitEn(raiz, ['add', '-A']);
    gitEn(raiz, ['commit', '--quiet', '-m', 'dueño']);
  }

  it('deja un fichero que el comando deja igual que en HEAD (el dueño commitea durante el comando)', () => {
    commitear();
    const restauracion = alrededorDe(() => {
      escribir('docs/informe.md', '# del dueño');
      commitear();
    });
    expect(restauracion?.diferencias).toEqual([]);
    expect(leer('docs/informe.md')).toBe('# del dueño');
    expect(existsSync(path.join(raiz, 'reports'))).toBe(false);
  });

  it('deja un fichero nuevo que el comando deja igual que en HEAD', () => {
    commitear();
    const restauracion = alrededorDe(() => {
      escribir('features/nueva.feature', 'nueva');
      commitear();
    });
    expect(restauracion?.diferencias).toEqual([]);
    expect(leer('features/nueva.feature')).toBe('nueva');
  });

  it('sigue deshaciendo lo que difiere de HEAD mientras deja lo que el dueño commitea', () => {
    commitear();
    const restauracion = alrededorDe(() => {
      escribir('features/a.feature', 'del dueño');
      commitear();
      escribir('docs/informe.md', '# cambiado');
    });
    expect(restauracion?.diferencias).toEqual([{ ruta: 'docs/informe.md', tipo: 'cambiado' }]);
    expect(leer('docs/informe.md')).toBe('# informe');
    expect(leer('features/a.feature')).toBe('del dueño');
  });

  it('vuelve a poner un fichero borrado, también si HEAD lo tiene', () => {
    commitear();
    const restauracion = alrededorDe(() => {
      rmSync(path.join(raiz, 'docs/informe.md'));
    });
    expect(restauracion?.diferencias).toEqual([{ ruta: 'docs/informe.md', tipo: 'falta' }]);
    expect(leer('docs/informe.md')).toBe('# informe');
  });
});

describe('describirRestauracion', () => {
  it('dice qué ha pasado con cada fichero y dónde está la versión del comando', () => {
    const texto = describirRestauracion({
      diferencias: [
        { ruta: 'docs/informe.md', tipo: 'cambiado' },
        { ruta: 'features/a.feature', tipo: 'falta' },
      ],
      apartados: 'reports/huellas/x',
    });
    expect(texto).toMatch(/docs\/informe\.md: lo cambió el comando y ha vuelto a como estaba/);
    expect(texto).toMatch(/features\/a\.feature: lo borró el comando/);
    expect(texto).toMatch(/reports\/huellas\/x\//);
  });

  it('no habla de versiones apartadas si el comando solo borró', () => {
    const texto = describirRestauracion({ diferencias: [{ ruta: 'a', tipo: 'falta' }], apartados: 'r' });
    expect(texto).not.toMatch(/versión/);
  });
});

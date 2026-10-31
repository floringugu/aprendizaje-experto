import { spawnSync } from 'node:child_process';
import { copyFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { motivoRutaDeOtraFase, problemaDeAlcance } from '../../scripts/arnes/rutas-fase.ts';
import { commit, gitBien } from './origen.ts';
import { directorioTemporal, repositorioConCommit } from './temporal.ts';

const SCRIPT = path.join(import.meta.dirname, '../../scripts/arnes/rutas-fase.ts');

describe('motivoRutaDeOtraFase', () => {
  it.each([
    ['impl', 'features/a.feature', 'features/ es la especificación, que escribe la fase specs'],
    [
      'impl',
      'tests/aceptacion/pasos.ts',
      'tests/aceptacion/ son los steps de aceptación, que escribe la fase aceptacion',
    ],
    ['impl', 'config/parametros.json', 'config/parametros.json son los parámetros de la especificación'],
    ['impl', 'config/peticion-ia.md', 'config/peticion-ia.md es la petición a la IA'],
    ['aceptacion', 'features/a.feature', 'features/'],
    ['aceptacion', 'config/parametros.json', 'config/parametros.json'],
    ['aceptacion', 'config/peticion-ia.md', 'config/peticion-ia.md'],
    ['specs', 'src/dominio/a.ts', 'src/ es el código, que escribe la fase impl'],
    ['specs', 'tests/unidad/a.test.ts', 'tests/unidad/ son los tests unitarios'],
    ['specs', 'tests/aceptacion/pasos.ts', 'tests/aceptacion/'],
    ['impl', 'features', 'features/'],
  ] as const)('la fase %s no puede tocar %s', (fase, ruta, motivo) => {
    expect(motivoRutaDeOtraFase(fase, ruta)).toContain(motivo);
  });

  it.each([
    ['impl', 'src/dominio/a.ts'],
    ['impl', 'tests/unidad/a.test.ts'],
    ['impl', 'config/alcance.json'],
    ['impl', 'docs/areas/MATE.md'],
    ['impl', 'tests/arnes/guardia.test.ts'],
    ['aceptacion', 'tests/aceptacion/pasos.ts'],
    ['aceptacion', 'src/aplicacion/a.ts'],
    ['specs', 'features/a.feature'],
    ['specs', 'config/parametros.json'],
    ['specs', 'config/peticion-ia.md'],
    ['specs', 'config/alcance.json'],
  ] as const)('la fase %s sí puede tocar %s', (fase, ruta) => {
    expect(motivoRutaDeOtraFase(fase, ruta)).toBeUndefined();
  });

  it.each([
    'features-viejas/a.feature',
    'tests/aceptacion-vieja/a.ts',
    'config/parametros.json.bak',
    'docs/features/a.md',
  ])('no confunde con una ruta protegida otra que empieza igual: %s', (ruta) => {
    expect(motivoRutaDeOtraFase('impl', ruta)).toBeUndefined();
  });
});

describe('problemaDeAlcance', () => {
  const alcance = (datos: unknown): string => `${JSON.stringify(datos, undefined, 2)}\n`;
  const base = alcance({ areas_cerradas: ['RECU'], escenarios_en_rojo: { DIAG: ['DIAG-2.4', 'DIAG-2.5'] } });

  it.each([
    [
      'añade un área a areas_cerradas',
      { areas_cerradas: ['RECU', 'DIAG'], escenarios_en_rojo: { DIAG: ['DIAG-2.4', 'DIAG-2.5'] } },
    ],
    ['quita la entrada de un área de escenarios_en_rojo', { areas_cerradas: ['RECU', 'DIAG'], escenarios_en_rojo: {} }],
    ['quita un ID de escenarios_en_rojo', { areas_cerradas: ['RECU'], escenarios_en_rojo: { DIAG: ['DIAG-2.5'] } }],
    ['quita escenarios_en_rojo entero', { areas_cerradas: ['RECU'] }],
    [
      'cambia el orden de las claves',
      { escenarios_en_rojo: { DIAG: ['DIAG-2.4', 'DIAG-2.5'] }, areas_cerradas: ['RECU'] },
    ],
  ])('la fase impl puede hacerlo si %s', (_caso, cabeza) => {
    expect(problemaDeAlcance('impl', base, alcance(cabeza))).toBeUndefined();
  });

  it('la fase impl puede crearlo con un área cerrada, y cambiar solo el formato', () => {
    expect(problemaDeAlcance('impl', undefined, alcance({ areas_cerradas: ['RECU'] }))).toBeUndefined();
    expect(problemaDeAlcance('impl', base, JSON.stringify(JSON.parse(base)))).toBeUndefined();
  });

  it.each([
    [
      'quita un área de areas_cerradas',
      alcance({ areas_cerradas: [], escenarios_en_rojo: { DIAG: ['DIAG-2.4'] } }),
      /quita o cambia áreas/,
    ],
    ['cambia un área de areas_cerradas', alcance({ areas_cerradas: ['MATE'] }), /quita o cambia áreas/],
    ['deja areas_cerradas sin ser una lista', alcance({ areas_cerradas: 'RECU' }), /quita o cambia áreas/],
    [
      'añade un ID a escenarios_en_rojo',
      alcance({ areas_cerradas: ['RECU'], escenarios_en_rojo: { DIAG: ['DIAG-2.4', 'DIAG-2.6'] } }),
      /añade o cambia entradas/,
    ],
    [
      'añade un área a escenarios_en_rojo',
      alcance({ areas_cerradas: ['RECU'], escenarios_en_rojo: { MATE: ['MATE-2.1'] } }),
      /añade o cambia entradas/,
    ],
    ['añade otra clave', alcance({ areas_cerradas: ['RECU'], otra: 1 }), /cambia otra$/],
    ['lo deja sin ser un objeto JSON', '[]', /no es un objeto JSON/],
    ['lo deja sin ser JSON', '{', /no es un objeto JSON/],
    ['lo borra', undefined, /lo borra/],
  ])('la fase impl no puede hacerlo si %s', (_caso, cabeza, detalle) => {
    const problema = problemaDeAlcance('impl', base, cabeza);
    expect(problema).toMatch(
      /^la fase impl solo puede añadir áreas a areas_cerradas y quitar entradas de escenarios_en_rojo/,
    );
    expect(problema).toMatch(detalle);
  });

  it('las fases specs y aceptacion pueden cambiarlo como quieran', () => {
    expect(problemaDeAlcance('specs', base, undefined)).toBeUndefined();
    expect(
      problemaDeAlcance('aceptacion', base, alcance({ escenarios_en_rojo: { MATE: ['MATE-2.1'] } })),
    ).toBeUndefined();
  });
});

describe('node scripts/arnes/rutas-fase.ts <rama> <base> <cabeza>', () => {
  /** Lo ejecuta como la CI: copiado fuera del repositorio, desde el checkout de la cabeza. */
  function ejecutar(raiz: string, argumentos: readonly string[]): { codigo: number | null; salida: string } {
    const copia = path.join(directorioTemporal(), 'rutas-fase.ts');
    copyFileSync(SCRIPT, copia);
    const { status, stdout, stderr } = spawnSync('node', [copia, ...argumentos], { cwd: raiz, encoding: 'utf8' });
    return { codigo: status, salida: stdout + stderr };
  }

  /** Repositorio con main y una rama que sale de él; devuelve la raíz y el SHA de main al salir. */
  function conRama(): { raiz: string; base: string } {
    const raiz = repositorioConCommit({
      'src/a.ts': '',
      'features/a.feature': '',
      'config/alcance.json': '{ "areas_cerradas": ["RECU"] }\n',
    });
    const base = gitBien(raiz, ['rev-parse', 'HEAD']).trim();
    gitBien(raiz, ['checkout', '--quiet', '-b', 'rama']);
    return { raiz, base };
  }

  it('no importa nada del repositorio, solo módulos de Node', () => {
    const importaciones = [...readFileSync(SCRIPT, 'utf8').matchAll(/^import .* from '([^']+)';$/gm)].map(
      ([, de]) => de,
    );
    expect(importaciones.length).toBeGreaterThan(0);
    expect(importaciones.every((de) => de?.startsWith('node:'))).toBe(true);
  });

  it('deja pasar un PR de impl que solo toca su código y cierra un área', () => {
    const { raiz, base } = conRama();
    commit(raiz, 'código', { 'src/a.ts': 'export {};', 'docs/areas/MATE.md': '# MATE' });
    commit(raiz, 'cierre', { 'config/alcance.json': '{ "areas_cerradas": ["RECU", "MATE"] }\n' });
    const { codigo, salida } = ejecutar(raiz, ['impl/MATE/pasos', base, 'HEAD']);
    expect(salida).toContain('impl/MATE/pasos: el PR solo toca lo que puede tocar la fase impl.');
    expect(codigo).toBe(0);
  });

  it('rechaza un PR de impl que toca la spec en otro commit, o reabre un área, con una línea por fichero', () => {
    const { raiz, base } = conRama();
    commit(raiz, 'código', { 'src/a.ts': 'export {};' });
    commit(raiz, 'spec', { 'features/a.feature': 'Feature: a', 'config/alcance.json': '{ "areas_cerradas": [] }' });
    const { codigo, salida } = ejecutar(raiz, ['impl/MATE/pasos-2', base, 'HEAD']);
    expect(salida).toContain('impl/MATE/pasos-2: el PR toca lo que la fase impl no puede tocar.');
    expect(salida).toContain('  - features/a.feature: features/ es la especificación, que escribe la fase specs.');
    expect(salida).toMatch(
      / {2}- config\/alcance\.json: la fase impl solo puede .* quita o cambia áreas de areas_cerradas\./,
    );
    expect(salida).not.toContain('src/a.ts');
    expect(codigo).toBe(1);
  });

  it('ve las dos rutas de un renombrado y aplica la fase de la rama', () => {
    const { raiz, base } = conRama();
    gitBien(raiz, ['mv', 'features/a.feature', 'src/a.feature']);
    gitBien(raiz, ['commit', '--quiet', '-m', 'mueve']);
    const enImpl = ejecutar(raiz, ['impl/MATE/pasos', base, 'HEAD']);
    expect(enImpl.salida).toContain('- features/a.feature');
    expect(enImpl.salida).not.toContain('- src/a.feature');
    const enSpecs = ejecutar(raiz, ['specs/MATE/pasos', base, 'HEAD']);
    expect(enSpecs.salida).toContain('- src/a.feature: src/ es el código');
    expect(enSpecs.codigo).toBe(1);
  });

  it('no cuenta como del PR lo que main recibió después de que saliera la rama', () => {
    const { raiz } = conRama();
    commit(raiz, 'código', { 'src/a.ts': 'export {};' });
    gitBien(raiz, ['checkout', '--quiet', '-']);
    commit(raiz, 'spec en main', { 'features/a.feature': 'Feature: a' });
    const main = gitBien(raiz, ['rev-parse', 'HEAD']).trim();
    const { codigo, salida } = ejecutar(raiz, ['impl/MATE/pasos', main, 'rama']);
    expect(salida).toContain('el PR solo toca lo que puede tocar la fase impl.');
    expect(codigo).toBe(0);
  });

  it.each([
    [['ci/arnes', 'HEAD', 'HEAD'], /La rama «ci\/arnes» no empieza por impl\/, specs\/ ni aceptacion\//],
    [['impl/MATE/pasos', 'HEAD'], /^Uso: /],
    [['impl/MATE/pasos', 'no-existe', 'HEAD'], /git merge-base ha fallado/],
  ])('falla con %j', (argumentos, mensaje) => {
    const { raiz } = conRama();
    const { codigo, salida } = ejecutar(raiz, argumentos);
    expect(salida).toMatch(mensaje);
    expect(codigo).not.toBe(0);
  });
});

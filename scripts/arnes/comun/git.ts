// Llamadas a git que usa el arnés.
import { spawnSync } from 'node:child_process';

export interface ResultadoGit {
  readonly codigo: number;
  readonly salida: string;
}

export function git(raiz: string, argumentos: readonly string[]): ResultadoGit {
  const resultado = spawnSync('git', argumentos, { cwd: raiz, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return { codigo: resultado.status ?? 1, salida: resultado.stdout };
}

/** Ficheros versionados y no versionados (sin los ignorados) bajo las rutas dadas. */
export function ficherosVisiblesParaGit(raiz: string, rutas: readonly string[]): string[] {
  const { codigo, salida } = git(raiz, [
    'ls-files',
    '-z',
    '--cached',
    '--others',
    '--exclude-standard',
    '--',
    ...rutas,
  ]);
  if (codigo !== 0) throw new Error('git ls-files ha fallado. ¿Estás dentro del repositorio?');
  return [...new Set(salida.split('\0').filter((ruta) => ruta !== ''))].sort();
}

export function hayCommits(raiz: string): boolean {
  return git(raiz, ['rev-parse', '--verify', '--quiet', 'HEAD']).codigo === 0;
}

/** Contenido de un fichero en un commit o en el índice («:ruta»). undefined si no existe. */
export function contenidoEnGit(raiz: string, referencia: string): Buffer | undefined {
  const resultado = spawnSync('git', ['show', referencia], { cwd: raiz, maxBuffer: 64 * 1024 * 1024 });
  return resultado.status === 0 ? resultado.stdout : undefined;
}

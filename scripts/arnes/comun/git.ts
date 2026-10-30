// Llamadas a git que usa el arnés.
import { spawnSync } from 'node:child_process';

export interface ResultadoGit {
  readonly codigo: number;
  readonly salida: string;
  /** Lo que git escribe en stderr: el motivo si falla. */
  readonly errores: string;
}

export function git(raiz: string, argumentos: readonly string[]): ResultadoGit {
  const resultado = spawnSync('git', argumentos, { cwd: raiz, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return { codigo: resultado.status ?? 1, salida: resultado.stdout, errores: resultado.stderr };
}

/** ¿El árbol de trabajo difiere del último commit? Cuenta los ficheros cambiados, borrados y nuevos, no los ignorados. */
export function hayCambiosSinCommitear(raiz: string): boolean {
  const { codigo, salida } = git(raiz, ['status', '--porcelain']);
  if (codigo !== 0) throw new Error('git status ha fallado. ¿Estás dentro del repositorio?');
  return salida.trim() !== '';
}

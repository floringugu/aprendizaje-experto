// Llamadas a git que usa el arnés.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

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

/** ¿El árbol de trabajo difiere del último commit? Cuenta los ficheros cambiados, borrados y nuevos, no los ignorados. */
export function hayCambiosSinCommitear(raiz: string): boolean {
  const { codigo, salida } = git(raiz, ['status', '--porcelain']);
  if (codigo !== 0) throw new Error('git status ha fallado. ¿Estás dentro del repositorio?');
  return salida.trim() !== '';
}

/**
 * Cómo está un fichero en el árbol de trabajo frente al último commit:
 *   igual: está en los dos con el mismo contenido;
 *   cambiado: está en los dos con distinto contenido;
 *   nuevo: solo está en el árbol de trabajo (versionado o no);
 *   borrado: solo está en el último commit;
 *   ausente: no está en ninguno.
 */
type EstadoConHead = 'igual' | 'cambiado' | 'nuevo' | 'borrado' | 'ausente';

/** Ficheros del último commit (vacío si aún no hay commits). */
export function ficherosDeHead(raiz: string): string[] {
  return [...identificadoresDeHead(raiz).keys()].sort();
}

/** Estado de cada ruta frente al último commit. Sin commits, todo lo que existe es nuevo. */
export function estadoConHead(raiz: string, rutas: readonly string[]): Map<string, EstadoConHead> {
  const enHead = identificadoresDeHead(raiz);
  const enDisco = rutas.filter((ruta) => existsSync(path.join(raiz, ruta)));
  const ahora = identificadoresDeDisco(raiz, enDisco);
  return new Map(
    rutas.map((ruta) => {
      const antes = enHead.get(ruta);
      const despues = ahora.get(ruta);
      if (antes === undefined) return [ruta, despues === undefined ? 'ausente' : 'nuevo'];
      if (despues === undefined) return [ruta, 'borrado'];
      return [ruta, antes === despues ? 'igual' : 'cambiado'];
    }),
  );
}

/** Ruta → id del blob en el último commit. */
function identificadoresDeHead(raiz: string): Map<string, string> {
  if (!hayCommits(raiz)) return new Map();
  const { codigo, salida } = git(raiz, ['ls-tree', '-r', '-z', 'HEAD']);
  if (codigo !== 0) throw new Error('git ls-tree ha fallado. ¿Estás dentro del repositorio?');
  const identificadores = new Map<string, string>();
  for (const entrada of salida.split('\0')) {
    // «<modo> <tipo> <id>\t<ruta>»
    const coincidencia = /^\d+ \w+ (\w+)\t(.+)$/s.exec(entrada);
    if (coincidencia?.[1] !== undefined && coincidencia[2] !== undefined) {
      identificadores.set(coincidencia[2], coincidencia[1]);
    }
  }
  return identificadores;
}

/** Ruta → id que tendría el blob de su contenido actual (git hash-object, sin escribirlo). */
function identificadoresDeDisco(raiz: string, rutas: readonly string[]): Map<string, string> {
  if (rutas.length === 0) return new Map();
  const { codigo, salida } = git(raiz, ['hash-object', '--', ...rutas]);
  const identificadores = salida.split('\n').filter((linea) => linea !== '');
  if (codigo !== 0 || identificadores.length !== rutas.length) {
    throw new Error('git hash-object ha fallado. ¿Estás dentro del repositorio?');
  }
  return new Map(rutas.map((ruta, indice) => [ruta, identificadores[indice] ?? '']));
}

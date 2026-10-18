import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

/** Ficheros con esa extensión bajo el directorio, relativos a la raíz y ordenados. */
export function listarFicheros(raiz: string, directorio: string, extension: string): string[] {
  const absoluto = path.join(raiz, directorio);
  if (!existsSync(absoluto)) return [];
  return readdirSync(absoluto, { recursive: true, encoding: 'utf8' })
    .filter((relativo) => relativo.endsWith(extension) && !relativo.split(path.sep).includes('node_modules'))
    .map((relativo) => path.posix.join(directorio, relativo.split(path.sep).join('/')))
    .sort();
}

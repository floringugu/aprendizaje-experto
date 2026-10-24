// Directorios temporales para los tests del arnés que necesitan ficheros reales.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function directorioTemporal(): string {
  return mkdtempSync(path.join(os.tmpdir(), 'arnes-test-'));
}

/** Crea los ficheros (ruta relativa → contenido) dentro de la raíz, con sus directorios. */
export function escribirFicheros(raiz: string, ficheros: Readonly<Record<string, string>>): void {
  for (const [ruta, contenido] of Object.entries(ficheros)) {
    const absoluta = path.join(raiz, ruta);
    mkdirSync(path.dirname(absoluta), { recursive: true });
    writeFileSync(absoluta, contenido);
  }
}

export function gitEn(raiz: string, argumentos: readonly string[]): void {
  // La identidad va en la llamada: la máquina que pasa los tests puede no tener una configurada.
  spawnSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', ...argumentos], { cwd: raiz });
}

/** Repositorio temporal con un primer commit de esos ficheros (ruta relativa → contenido). */
export function repositorioConCommit(ficheros: Readonly<Record<string, string>>): string {
  const raiz = directorioTemporal();
  gitEn(raiz, ['init', '--quiet']);
  escribirFicheros(raiz, ficheros);
  gitEn(raiz, ['add', '-A']);
  gitEn(raiz, ['commit', '--quiet', '-m', 'inicial']);
  return raiz;
}

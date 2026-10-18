// Directorios temporales para los tests del arnés que necesitan ficheros reales.
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

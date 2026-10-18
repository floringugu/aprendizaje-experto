// Sumas SHA-256 de los ficheros protegidos (.claude/sumas.sha256).
// El formato es el de `sha256sum`, así el dueño puede comprobarlas a mano con `sha256sum -c`.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ficherosVisiblesParaGit } from './git.ts';
import { entradaQueBloquea, RUTA_SUMAS } from './protegidas.ts';
import type { EntradaProtegida, Fase } from './protegidas.ts';

/** Ruta relativa → suma SHA-256 en hexadecimal. */
export type Sumas = ReadonlyMap<string, string>;

export interface Diferencia {
  readonly ruta: string;
  readonly tipo: 'cambiado' | 'sin-suma' | 'falta';
}

export function sha256(contenido: string | Buffer): string {
  return createHash('sha256').update(contenido).digest('hex');
}

export function parsearSumas(texto: string): Sumas {
  const sumas = new Map<string, string>();
  for (const linea of texto.split('\n')) {
    const coincidencia = /^([0-9a-f]{64}) {2}(.+)$/.exec(linea);
    if (coincidencia?.[1] !== undefined && coincidencia[2] !== undefined) {
      sumas.set(coincidencia[2], coincidencia[1]);
    }
  }
  return sumas;
}

export function serializarSumas(sumas: Sumas): string {
  const rutas = [...sumas.keys()].sort();
  return rutas.map((ruta) => `${sumas.get(ruta) ?? ''}  ${ruta}\n`).join('');
}

/**
 * Ficheros protegidos que hay que vigilar en esta fase. Los que la fase desbloquea
 * se quedan fuera (se están editando legítimamente), y también el propio fichero
 * de sumas, que no puede contener su propia suma: lo vigila la comparación con HEAD.
 */
export function ficherosVigilados(raiz: string, entradas: readonly EntradaProtegida[], fase: Fase): string[] {
  const directorios = entradas.filter((entrada) => entrada.ruta.endsWith('/')).map((entrada) => entrada.ruta);
  const ficheros = entradas.filter((entrada) => !entrada.ruta.endsWith('/')).map((entrada) => entrada.ruta);
  const candidatos = new Set([...ficheros, ...ficherosVisiblesParaGit(raiz, directorios)]);
  return [...candidatos]
    .filter((ruta) => ruta !== RUTA_SUMAS && entradaQueBloquea(ruta, entradas, fase) !== undefined)
    .sort();
}

/** Sumas actuales en disco. Un fichero que no existe no aparece (luego sale como «falta»). */
export function calcularSumas(raiz: string, rutas: readonly string[]): Sumas {
  const sumas = new Map<string, string>();
  for (const ruta of rutas) {
    const absoluta = path.join(raiz, ruta);
    if (existsSync(absoluta)) sumas.set(ruta, sha256(readFileSync(absoluta)));
  }
  return sumas;
}

/** Deja solo las sumas de rutas que siguen protegidas y bloqueadas en esta fase. */
export function sumasVigiladas(sumas: Sumas, entradas: readonly EntradaProtegida[], fase: Fase): Sumas {
  return new Map(
    [...sumas].filter(([ruta]) => ruta !== RUTA_SUMAS && entradaQueBloquea(ruta, entradas, fase) !== undefined),
  );
}

export function compararSumas(esperadas: Sumas, actuales: Sumas): Diferencia[] {
  const diferencias: Diferencia[] = [];
  for (const [ruta, suma] of actuales) {
    const esperada = esperadas.get(ruta);
    if (esperada === undefined) diferencias.push({ ruta, tipo: 'sin-suma' });
    else if (esperada !== suma) diferencias.push({ ruta, tipo: 'cambiado' });
  }
  for (const ruta of esperadas.keys()) {
    if (!actuales.has(ruta)) diferencias.push({ ruta, tipo: 'falta' });
  }
  return diferencias.sort((a, b) => a.ruta.localeCompare(b.ruta));
}

export function describirDiferencia(diferencia: Diferencia): string {
  const descripciones = {
    cambiado: 'ha cambiado respecto a su suma',
    'sin-suma': 'está protegido pero no tiene suma',
    falta: 'tiene suma pero ya no existe',
  } as const;
  return `${diferencia.ruta}: ${descripciones[diferencia.tipo]}`;
}

// Lectura de .claude/protegidas.txt y decisión de si una ruta está bloqueada.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ficherosVisiblesParaGit } from './git.ts';

export const RUTA_PROTEGIDAS = '.claude/protegidas.txt';

/**
 * Fase de trabajo de la conversación, en la variable ARNES_FASE. El dueño la fija antes de
 * abrirla con «make fase» (scripts/arnes/fijar-fase.ts), que la guarda en .claude/settings.local.json.
 * - specs: etapa 2, se pueden escribir features/ y config/parametros.json.
 * - aceptacion: etapa 3, se pueden escribir los steps de tests/aceptacion/.
 * - impl: resto del tiempo; todo lo protegido está bloqueado.
 */
export const FASES = ['specs', 'aceptacion', 'impl'] as const;
export type Fase = (typeof FASES)[number];

export interface EntradaProtegida {
  /** Ruta relativa a la raíz. Termina en «/» si protege un directorio entero. */
  readonly ruta: string;
  /** Fase en la que la ruta se puede editar (anotación «@fase»), si la tiene. */
  readonly desbloqueadaEn: Fase | undefined;
}

export function esFase(valor: string): valor is Fase {
  return (FASES as readonly string[]).includes(valor);
}

export function faseDeEntorno(entorno: NodeJS.ProcessEnv): Fase {
  const valor = entorno['ARNES_FASE'] ?? 'impl';
  if (!esFase(valor)) {
    throw new Error(`ARNES_FASE=${valor} no es válida. Usa specs, aceptacion o impl.`);
  }
  return valor;
}

export function parsearProtegidas(texto: string): EntradaProtegida[] {
  const entradas: EntradaProtegida[] = [];
  for (const lineaBruta of texto.split('\n')) {
    const linea = lineaBruta.replace(/#.*$/, '').trim();
    if (linea === '') continue;
    const [ruta = '', anotacion] = linea.split(/\s+/);
    entradas.push({ ruta, desbloqueadaEn: parsearAnotacion(anotacion, linea) });
  }
  return entradas;
}

function parsearAnotacion(anotacion: string | undefined, linea: string): Fase | undefined {
  if (anotacion === undefined) return undefined;
  const fase = anotacion.slice(1);
  if (!anotacion.startsWith('@') || !esFase(fase)) {
    throw new Error(`${RUTA_PROTEGIDAS}: anotación no válida en «${linea}». Usa @specs o @aceptacion.`);
  }
  return fase;
}

export function leerProtegidas(raiz: string): EntradaProtegida[] {
  return parsearProtegidas(readFileSync(path.join(raiz, RUTA_PROTEGIDAS), 'utf8'));
}

/** ¿La entrada cubre la ruta? La ruta va relativa a la raíz y con «/» como separador. */
export function cubre(entrada: EntradaProtegida, rutaRelativa: string): boolean {
  if (entrada.ruta.endsWith('/')) {
    return rutaRelativa === entrada.ruta.slice(0, -1) || rutaRelativa.startsWith(entrada.ruta);
  }
  return rutaRelativa === entrada.ruta;
}

/** Primera entrada que bloquea la ruta en esta fase, o undefined si se puede tocar. */
export function entradaQueBloquea(
  rutaRelativa: string,
  entradas: readonly EntradaProtegida[],
  fase: Fase,
): EntradaProtegida | undefined {
  return entradas.find((entrada) => cubre(entrada, rutaRelativa) && entrada.desbloqueadaEn !== fase);
}

/**
 * Ficheros protegidos que hay que vigilar en esta fase: los de la lista y los que git ve dentro
 * de los directorios protegidos (los ignorados no). Los que la fase desbloquea se quedan fuera:
 * se están editando legítimamente.
 */
export function ficherosVigilados(raiz: string, entradas: readonly EntradaProtegida[], fase: Fase): string[] {
  const directorios = entradas.filter((entrada) => entrada.ruta.endsWith('/')).map((entrada) => entrada.ruta);
  const ficheros = entradas.filter((entrada) => !entrada.ruta.endsWith('/')).map((entrada) => entrada.ruta);
  const candidatos = new Set([...ficheros, ...ficherosVisiblesParaGit(raiz, directorios)]);
  return [...candidatos].filter((ruta) => entradaQueBloquea(ruta, entradas, fase) !== undefined).sort();
}

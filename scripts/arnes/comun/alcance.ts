// Qué áreas se comprueban: las cerradas (config/alcance.json) y el área en curso de esta
// conversación (variable ARNES_AREA, que «make fase» guarda en .claude/settings.local.json).
// El resto de las áreas está fuera de alcance. Cada worktree tiene su propia área en curso.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { idDe, leerFeatures } from './gherkin.ts';
import type { Fase } from './protegidas.ts';

const RUTA_ALCANCE = 'config/alcance.json';

export interface Alcance {
  /** Áreas implementadas y aceptadas: sus escenarios deben seguir en verde. */
  readonly cerradas: readonly string[];
  /** Área que se implementa en esta conversación, si el dueño la fijó. */
  readonly enCurso: string | undefined;
}

function esArea(valor: string): boolean {
  return /^[A-Z]{2,6}$/.test(valor);
}

/** Las áreas cerradas del fichero (ninguna si no existe) y el área en curso de `entorno`. */
export function leerAlcance(raiz: string, entorno: NodeJS.ProcessEnv): Alcance {
  return { cerradas: leerAreasCerradas(raiz), enCurso: areaEnCursoDeEntorno(entorno) };
}

function leerAreasCerradas(raiz: string): string[] {
  const ruta = path.join(raiz, RUTA_ALCANCE);
  if (!existsSync(ruta)) return [];
  const datos: unknown = JSON.parse(readFileSync(ruta, 'utf8'));
  const areas = (datos as { areas_cerradas?: unknown }).areas_cerradas;
  if (!Array.isArray(areas) || !areas.every((area) => typeof area === 'string' && esArea(area))) {
    throw new Error(`${RUTA_ALCANCE}: «areas_cerradas» debe ser una lista de prefijos, p. ej. ["MAST"].`);
  }
  return areas as string[];
}

function areaEnCursoDeEntorno(entorno: NodeJS.ProcessEnv): string | undefined {
  const valor = entorno['ARNES_AREA'];
  if (valor === undefined || valor === '') return undefined;
  if (!esArea(valor)) throw new Error(`ARNES_AREA=${valor} no es un prefijo de área. Usa, por ejemplo, MATE.`);
  return valor;
}

/** Áreas cerradas más la del área en curso, sin repetir. Con `conEnCurso` false, solo las cerradas (regresión). */
export function areasEnAlcance(alcance: Alcance, conEnCurso: boolean): string[] {
  const enCurso = conEnCurso && alcance.enCurso !== undefined ? [alcance.enCurso] : [];
  return [...new Set([...alcance.cerradas, ...enCurso])];
}

/** Prefijo de área de un ID: «MAST» en «MAST-1.2». */
export function areaDe(id: string): string {
  return id.split('-')[0] ?? id;
}

/**
 * Expresión de etiquetas para Cucumber que deja solo las áreas en alcance. Sin ninguna, una etiqueta
 * que no existe: una expresión vacía ejecutaría todas.
 */
export function expresionEtiquetasCucumber(areas: readonly string[]): string {
  if (areas.length === 0) return '@SIN_AREAS_EN_ALCANCE';
  return areas.map((area) => `@${area}`).join(' or ');
}

/** Prefijos de los Feature de features/, ordenados. */
function areasDeFeatures(raiz: string): string[] {
  const areas = leerFeatures(raiz).elementos.flatMap((elemento) =>
    elemento.tipo === 'Feature' ? (idDe(elemento) ?? []) : [],
  );
  return [...new Set(areas)].toSorted((a, b) => a.localeCompare(b));
}

/**
 * Por qué la fase y el área en curso no valen para una conversación nueva, o undefined si valen.
 * La fase aceptacion necesita área; el área tiene que existir en features/ y no estar cerrada.
 */
export function problemaDeFaseYArea(raiz: string, fase: Fase, area: string | undefined): string | undefined {
  if (area === undefined) {
    return fase === 'aceptacion' ? 'La fase aceptacion necesita el área en curso (A=<ÁREA>).' : undefined;
  }
  if (!esArea(area)) return `«${area}» no es un prefijo de área (por ejemplo, MATE).`;
  const existentes = areasDeFeatures(raiz);
  if (!existentes.includes(area)) return `El área ${area} no existe en features/. Hay: ${existentes.join(', ')}.`;
  if (leerAreasCerradas(raiz).includes(area)) return `El área ${area} ya está cerrada (config/alcance.json).`;
  return undefined;
}

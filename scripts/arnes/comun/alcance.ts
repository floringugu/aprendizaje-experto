// config/alcance.json: áreas (prefijos de Feature) que aún no se implementan.
// Por defecto todo está en alcance. El dueño saca un área de la lista cuando toca implementarla.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const RUTA_ALCANCE = 'config/alcance.json';

export function leerAreasFueraDeAlcance(raiz: string): string[] {
  const ruta = path.join(raiz, RUTA_ALCANCE);
  if (!existsSync(ruta)) return [];
  const datos: unknown = JSON.parse(readFileSync(ruta, 'utf8'));
  const areas = (datos as { areas_fuera_de_alcance?: unknown }).areas_fuera_de_alcance;
  if (!Array.isArray(areas) || !areas.every((area) => typeof area === 'string')) {
    throw new Error(`${RUTA_ALCANCE}: «areas_fuera_de_alcance» debe ser una lista de prefijos, p. ej. ["CALI"].`);
  }
  return areas;
}

/** Prefijo de área de un ID: «MAST» en «MAST-1.2». */
export function areaDe(id: string): string {
  return id.split('-')[0] ?? id;
}

/** Expresión de etiquetas para Cucumber que deja fuera las áreas sin implementar. */
export function expresionEtiquetasCucumber(areasFuera: readonly string[]): string {
  if (areasFuera.length === 0) return '';
  return `not (${areasFuera.map((area) => `@${area}`).join(' or ')})`;
}

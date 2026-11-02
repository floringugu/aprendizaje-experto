// Qué escenarios se comprueban: los de las áreas cerradas (config/alcance.json) y los del área en
// curso del checkout (faseYAreaDelCheckout en checkout.ts). El resto de las áreas está fuera de
// alcance. Cada worktree tiene su propia área en curso. Un área cerrada se cambia sin reabrirla: los
// escenarios que specs le añade o le cambia son sus pendientes (su lista de escenarios_en_rojo), y
// solo se comprueban donde es el área en curso, hasta que impl vacía la lista (docs/plan.md §6).
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { esArea, faseYAreaDelCheckout } from './checkout.ts';
import type { Fase } from './fases.ts';
import { idDe, leerFeatures } from './gherkin.ts';

const RUTA_ALCANCE = 'config/alcance.json';

export interface AreasCerradas {
  /** Áreas implementadas y aceptadas: sus escenarios deben seguir en verde, salvo los pendientes. */
  readonly cerradas: readonly string[];
  /** Los IDs de escenarios_en_rojo de las áreas cerradas: los que specs ha añadido o cambiado y aún no pasan. */
  readonly pendientes: readonly string[];
}

export interface Alcance extends AreasCerradas {
  /** Área que se implementa en el checkout, si el dueño la fijó. */
  readonly enCurso: string | undefined;
}

/** Las áreas cerradas del fichero (ninguna si no existe), sus pendientes y el área en curso del checkout `raiz`. */
export function leerAlcance(raiz: string): Alcance {
  return { ...leerAreasCerradas(raiz), enCurso: faseYAreaDelCheckout(raiz).area };
}

function leerTexto(raiz: string): string | undefined {
  const ruta = path.join(raiz, RUTA_ALCANCE);
  return existsSync(ruta) ? readFileSync(ruta, 'utf8') : undefined;
}

function datosDe(texto: string | undefined): Record<string, unknown> {
  return texto === undefined ? {} : (JSON.parse(texto) as Record<string, unknown>);
}

function leerAreasCerradas(raiz: string): AreasCerradas {
  return areasCerradasDe(leerTexto(raiz));
}

/**
 * Las áreas cerradas y sus pendientes según el texto de config/alcance.json, de este checkout o de
 * origin/main; ninguna sin texto (no hay fichero). Lanza si el fichero no vale.
 */
export function areasCerradasDe(texto: string | undefined): AreasCerradas {
  if (texto === undefined) return { cerradas: [], pendientes: [] };
  const datos = datosDe(texto);
  const cerradas = datos['areas_cerradas'];
  if (!Array.isArray(cerradas) || !cerradas.every((area) => typeof area === 'string' && esArea(area))) {
    throw new Error(`${RUTA_ALCANCE}: «areas_cerradas» debe ser una lista de prefijos, p. ej. ["MAST"].`);
  }
  const areas = cerradas as string[];
  return { cerradas: areas, pendientes: areas.flatMap((area) => listaEnRojo(datos, area) ?? []) };
}

/**
 * Los escenarios de `area` que deben fallar en la etapa 3 (`escenarios_en_rojo` en config/alcance.json),
 * o undefined si el área no tiene lista y fallan todos. En un área cerrada son sus pendientes: el resto
 * ya pasaba, y eso no es un Then vacío.
 */
export function escenariosEnRojo(raiz: string, area: string): readonly string[] | undefined {
  return listaEnRojo(datosDe(leerTexto(raiz)), area);
}

function listaEnRojo(datos: Record<string, unknown>, area: string): string[] | undefined {
  const lista = (datos['escenarios_en_rojo'] as Record<string, unknown> | undefined)?.[area];
  if (lista === undefined) return undefined;
  if (!Array.isArray(lista) || !lista.every((id) => typeof id === 'string' && areaDe(id) === area)) {
    throw new Error(
      `${RUTA_ALCANCE}: «escenarios_en_rojo.${area}» debe ser una lista de IDs de ${area}, p. ej. ["${area}-1.1"].`,
    );
  }
  return lista as string[];
}

/** ¿Tiene `area` pendientes, escenarios que specs le ha añadido o cambiado después de cerrarla? */
export function tienePendientes(alcance: AreasCerradas, area: string): boolean {
  return alcance.pendientes.some((id) => areaDe(id) === area);
}

/** Una dependencia de área se cumple con el área cerrada y sin pendientes. */
export function areaCumplida(alcance: AreasCerradas, area: string): boolean {
  return alcance.cerradas.includes(area) && !tienePendientes(alcance, area);
}

/** Qué escenarios se comprueban: los de `areas`, salvo los `excluidos`. */
export interface Seleccion {
  readonly areas: readonly string[];
  readonly excluidos: readonly string[];
}

/**
 * Las áreas cerradas más la del área en curso, sin repetir, y fuera los pendientes de las cerradas,
 * salvo los del área en curso: los demás aún no pasan. Con `conEnCurso` false, solo las cerradas y
 * sin ningún pendiente (regresión).
 */
export function seleccionEnAlcance(alcance: Alcance, conEnCurso: boolean): Seleccion {
  const enCurso = conEnCurso ? alcance.enCurso : undefined;
  return {
    areas: [...new Set([...alcance.cerradas, ...(enCurso === undefined ? [] : [enCurso])])],
    excluidos: alcance.pendientes.filter((id) => areaDe(id) !== enCurso),
  };
}

/** ¿Se comprueba el ID `id` (de un Feature, una Rule o un Scenario)? */
export function estaEnAlcance(seleccion: Seleccion, id: string): boolean {
  return seleccion.areas.includes(areaDe(id)) && !seleccion.excluidos.includes(id);
}

/** Prefijo de área de un ID: «MAST» en «MAST-1.2». */
export function areaDe(id: string): string {
  return id.split('-')[0] ?? id;
}

/**
 * Expresión de etiquetas para Cucumber que deja solo la selección: sus áreas, sin los excluidos. Sin
 * áreas, una etiqueta que no existe: una expresión vacía ejecutaría todas.
 */
export function expresionEtiquetasCucumber({ areas, excluidos }: Seleccion): string {
  if (areas.length === 0) return '@SIN_AREAS_EN_ALCANCE';
  const deLasAreas = areas.map((area) => `@${area}`).join(' or ');
  if (excluidos.length === 0) return deLasAreas;
  return `(${deLasAreas}) and not (${excluidos.map((id) => `@${id}`).join(' or ')})`;
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
 * La fase aceptacion necesita área; el área tiene que existir en features/ y, si está cerrada, valer
 * para la fase (problemaDeAreaCerrada).
 */
export function problemaDeFaseYArea(raiz: string, fase: Fase, area: string | undefined): string | undefined {
  if (area === undefined) {
    return fase === 'aceptacion' ? 'La fase aceptacion necesita el área en curso (A=<ÁREA>).' : undefined;
  }
  return problemaDeArea(raiz, area) ?? problemaDeAreaCerrada(leerAreasCerradas(raiz), fase, area);
}

/**
 * Por qué no se trabaja en el área cerrada `area` en la fase `fase`, o undefined si se puede o si no
 * está cerrada. specs la cambia cuando quiere; aceptacion e impl, solo si tiene pendientes.
 */
export function problemaDeAreaCerrada(alcance: AreasCerradas, fase: Fase, area: string): string | undefined {
  if (fase === 'specs' || !alcance.cerradas.includes(area) || tienePendientes(alcance, area)) return undefined;
  return `El área ${area} ya está cerrada y no tiene pendientes (escenarios_en_rojo en ${RUTA_ALCANCE}): para cambiarla, empieza por specs.`;
}

/**
 * Por qué `area` no es un área de features/, o undefined si lo es. No mira si está cerrada: la rama
 * del PR que cierra un área ya la lleva en areas_cerradas.
 */
export function problemaDeArea(raiz: string, area: string): string | undefined {
  if (!esArea(area)) return `«${area}» no es un prefijo de área (por ejemplo, MATE).`;
  const existentes = areasDeFeatures(raiz);
  if (!existentes.includes(area)) return `El área ${area} no existe en features/. Hay: ${existentes.join(', ')}.`;
  return undefined;
}

/**
 * Por qué no se puede cerrar el área `pedida` (make cerrar-area A=<ÁREA>) en el checkout, o undefined
 * si se puede: tiene que ser su área en curso, que es la que comprueban la aceptación y la cobertura.
 */
export function problemaDelAreaACerrar(raiz: string, pedida: string): string | undefined {
  if (pedida === '') return 'Uso: make cerrar-area A=<ÁREA>';
  const { area } = faseYAreaDelCheckout(raiz);
  if (area === pedida) return undefined;
  return area === undefined
    ? `Este checkout no tiene área en curso. Fíjala con make fase F=impl A=${pedida}.`
    : `El área en curso de este checkout es ${area}, no ${pedida}.`;
}

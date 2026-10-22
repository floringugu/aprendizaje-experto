// Lectura de features/ y validación de sus etiquetas de ID y de procedencia.
//
// Convención de IDs (aprobada en docs/plan.md):
//   Feature  @MAST       prefijo de 2 a 6 mayúsculas
//   Rule     @MAST-1     prefijo del Feature + número
//   Scenario @MAST-1.2   ID de la Rule + «.» + número (o prefijo-n.m si no hay Rule)
// Procedencia: al menos una etiqueta @evidencia-<sección del informe> o @extrapolacion.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { AstBuilder, GherkinClassicTokenMatcher, Parser } from '@cucumber/gherkin';
import { IdGenerator } from '@cucumber/messages';
import type { Feature, Rule, Scenario, Tag } from '@cucumber/messages';
import { listarFicheros } from './ficheros.ts';

export type TipoElemento = 'Feature' | 'Rule' | 'Scenario';

export interface ElementoGherkin {
  readonly tipo: TipoElemento;
  readonly nombre: string;
  readonly etiquetas: readonly string[];
  readonly fichero: string;
  readonly linea: number;
  /** Etiquetas de ID del elemento padre (Feature o Rule); vacío en un Feature. */
  readonly idsPadre: readonly string[];
}

export interface ProblemaSpec {
  readonly fichero: string;
  readonly linea: number;
  readonly mensaje: string;
}

export interface LecturaFeatures {
  readonly elementos: readonly ElementoGherkin[];
  readonly problemas: readonly ProblemaSpec[];
}

const PATRON_ID = /^@([A-Z]{2,6})(?:-(\d+)(?:\.(\d+))?)?$/;
const PATRON_EVIDENCIA = /^@evidencia-(.+)$/;
const ETIQUETA_EXTRAPOLACION = '@extrapolacion';

export function leerFeatures(raiz: string, directorio = 'features'): LecturaFeatures {
  const elementos: ElementoGherkin[] = [];
  const problemas: ProblemaSpec[] = [];
  for (const fichero of listarFicheros(raiz, directorio, '.feature')) {
    try {
      elementos.push(...elementosDeFeature(readFileSync(path.join(raiz, fichero), 'utf8'), fichero));
    } catch (error) {
      problemas.push({ fichero, linea: 1, mensaje: `No se puede leer el Gherkin: ${String(error)}` });
    }
  }
  return { elementos, problemas };
}

/** Árbol de un fichero .feature, o undefined si está vacío. El idioma por defecto es el español. */
export function parsearFeature(texto: string): Feature | undefined {
  const parser = new Parser(new AstBuilder(IdGenerator.uuid()), new GherkinClassicTokenMatcher('es'));
  return parser.parse(texto).feature;
}

/** Elementos (Feature, Rules y Scenarios) de un fichero .feature. */
export function elementosDeFeature(texto: string, fichero: string): ElementoGherkin[] {
  const feature = parsearFeature(texto);
  if (feature === undefined) return [];
  const elementoFeature = crearElemento('Feature', feature, { fichero, idsPadre: [] });
  const dentroDelFeature: Ubicacion = { fichero, idsPadre: idsDe(elementoFeature) };
  const resto = feature.children.flatMap((hijo) => {
    if (hijo.rule !== undefined) return elementosDeRule(hijo.rule, dentroDelFeature);
    if (hijo.scenario !== undefined) return [crearElemento('Scenario', hijo.scenario, dentroDelFeature)];
    return [];
  });
  return [elementoFeature, ...resto];
}

/** Dónde está un elemento: su fichero y los IDs de su padre. */
interface Ubicacion {
  readonly fichero: string;
  readonly idsPadre: readonly string[];
}

function elementosDeRule(rule: Rule, ubicacion: Ubicacion): ElementoGherkin[] {
  const elementoRule = crearElemento('Rule', rule, ubicacion);
  const dentroDeLaRule: Ubicacion = { fichero: ubicacion.fichero, idsPadre: idsDe(elementoRule) };
  const escenarios = rule.children.flatMap((hijo) =>
    hijo.scenario === undefined ? [] : [crearElemento('Scenario', hijo.scenario, dentroDeLaRule)],
  );
  return [elementoRule, ...escenarios];
}

function crearElemento(tipo: TipoElemento, nodo: Feature | Rule | Scenario, ubicacion: Ubicacion): ElementoGherkin {
  return {
    tipo,
    nombre: nodo.name,
    etiquetas: nodo.tags.map((etiqueta: Tag) => etiqueta.name),
    fichero: ubicacion.fichero,
    linea: nodo.location.line,
    idsPadre: ubicacion.idsPadre,
  };
}

function idsDe(elemento: Pick<ElementoGherkin, 'etiquetas'>): string[] {
  return elemento.etiquetas.filter((etiqueta) => PATRON_ID.test(etiqueta));
}

/** El ID único del elemento sin «@», o undefined si no tiene exactamente uno. */
export function idDe(elemento: Pick<ElementoGherkin, 'etiquetas'>): string | undefined {
  const ids = idsDe(elemento);
  return ids.length === 1 ? ids[0]?.slice(1) : undefined;
}

export function validarElementos(
  elementos: readonly ElementoGherkin[],
  secciones: ReadonlySet<string>,
): ProblemaSpec[] {
  const problemas = elementos.flatMap((elemento) => [
    ...problemasDeId(elemento),
    ...problemasDeProcedencia(elemento, secciones),
  ]);
  return [...problemas, ...problemasDeDuplicados(elementos)];
}

function problemasDeId(elemento: ElementoGherkin): ProblemaSpec[] {
  const ids = idsDe(elemento);
  if (ids.length !== 1) {
    return [
      problema(
        elemento,
        `${elemento.tipo} «${elemento.nombre}» necesita exactamente un ID (tiene ${String(ids.length)}).`,
      ),
    ];
  }
  const id = ids[0] ?? '';
  const esperado = formaEsperada(elemento);
  if (!esperado.patron.test(id)) {
    return [
      problema(
        elemento,
        `El ID ${id} de ${elemento.tipo} «${elemento.nombre}» debe tener la forma ${esperado.ejemplo}.`,
      ),
    ];
  }
  return [];
}

function formaEsperada(elemento: ElementoGherkin): { patron: RegExp; ejemplo: string } {
  // Si el padre no tiene un ID válido, ese error ya se informa en el padre.
  const padre = (elemento.idsPadre[0] ?? '@XXXX').slice(1);
  if (elemento.tipo === 'Feature') return { patron: /^@[A-Z]{2,6}$/, ejemplo: '@MAST' };
  if (elemento.tipo === 'Rule') return { patron: new RegExp(`^@${padre}-\\d+$`), ejemplo: `@${padre}-1` };
  // Un Scenario cuelga de una Rule (padre «MAST-1») o directamente del Feature (padre «MAST»).
  const dentroDeRule = padre.includes('-');
  return dentroDeRule
    ? { patron: new RegExp(`^@${padre}\\.\\d+$`), ejemplo: `@${padre}.1` }
    : { patron: new RegExp(`^@${padre}-\\d+\\.\\d+$`), ejemplo: `@${padre}-1.1` };
}

function problemasDeProcedencia(elemento: ElementoGherkin, secciones: ReadonlySet<string>): ProblemaSpec[] {
  const evidencias = elemento.etiquetas.flatMap((etiqueta) => PATRON_EVIDENCIA.exec(etiqueta)?.[1] ?? []);
  const esExtrapolacion = elemento.etiquetas.includes(ETIQUETA_EXTRAPOLACION);
  const problemas = evidencias
    .filter((seccion) => !secciones.has(seccion))
    .map((seccion) => problema(elemento, `@evidencia-${seccion}: el informe no tiene la sección ${seccion}.`));
  if (evidencias.length === 0 && !esExtrapolacion) {
    problemas.push(
      problema(
        elemento,
        `${elemento.tipo} «${elemento.nombre}» necesita procedencia: @evidencia-<sección> o @extrapolacion.`,
      ),
    );
  }
  return problemas;
}

function problemasDeDuplicados(elementos: readonly ElementoGherkin[]): ProblemaSpec[] {
  const vistos = new Map<string, ElementoGherkin>();
  const problemas: ProblemaSpec[] = [];
  for (const elemento of elementos) {
    const id = idDe(elemento);
    if (id === undefined) continue;
    const anterior = vistos.get(id);
    if (anterior !== undefined) {
      problemas.push(problema(elemento, `El ID @${id} ya se usa en ${anterior.fichero}:${String(anterior.linea)}.`));
    }
    vistos.set(id, elemento);
  }
  return problemas;
}

function problema(elemento: ElementoGherkin, mensaje: string): ProblemaSpec {
  return { fichero: elemento.fichero, linea: elemento.linea, mensaje };
}

/** Procedencia legible: «evidencia-2.2, extrapolacion». */
export function procedenciaDe(elemento: ElementoGherkin): string {
  return elemento.etiquetas
    .filter((etiqueta) => PATRON_EVIDENCIA.test(etiqueta) || etiqueta === ETIQUETA_EXTRAPOLACION)
    .map((etiqueta) => etiqueta.slice(1))
    .join(', ');
}

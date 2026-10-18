// Validación de config/parametros.json: cada parámetro dice de dónde sale y si es extrapolación.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const RUTA_PARAMETROS = 'config/parametros.json';

/**
 * Vocabulario del informe (Nota metodológica) más «extrapolación del autor» para los
 * valores que el informe propone sin evidencia detrás (sección 4, «Qué es extrapolación»).
 */
const NIVELES_DE_EVIDENCIA = ['bien establecido', 'prometedor', 'especulativo', 'extrapolación del autor'];

const CAMPOS_PERMITIDOS = ['descripcion', 'valor', 'seccion', 'nivel_evidencia', 'extrapolacion', 'nota'];

export function leerParametros(raiz: string): unknown {
  const ruta = path.join(raiz, RUTA_PARAMETROS);
  if (!existsSync(ruta)) return {};
  return JSON.parse(readFileSync(ruta, 'utf8')) as unknown;
}

export function validarParametros(datos: unknown, secciones: ReadonlySet<string>): string[] {
  if (!esObjeto(datos)) return [`${RUTA_PARAMETROS} debe ser un objeto { "nombre_parametro": { … } }.`];
  return Object.entries(datos).flatMap(([nombre, parametro]) =>
    problemasDeParametro(parametro, secciones).map((problema) => `${RUTA_PARAMETROS} → ${nombre}: ${problema}`),
  );
}

function problemasDeParametro(parametro: unknown, secciones: ReadonlySet<string>): string[] {
  if (!esObjeto(parametro))
    return ['debe ser un objeto con descripcion, valor, seccion, nivel_evidencia y extrapolacion.'];
  return [
    ...problemasDeCampos(parametro),
    ...problemasDeSeccion(parametro['seccion'], secciones),
    ...problemasDeNivel(parametro),
  ];
}

function problemasDeCampos(parametro: Readonly<Record<string, unknown>>): string[] {
  const problemas = Object.keys(parametro)
    .filter((campo) => !CAMPOS_PERMITIDOS.includes(campo))
    .map((campo) => `campo desconocido «${campo}». Los permitidos son: ${CAMPOS_PERMITIDOS.join(', ')}.`);
  if (!esTextoNoVacio(parametro['descripcion'])) problemas.push('falta «descripcion» (qué controla el parámetro).');
  if (parametro['valor'] === undefined || parametro['valor'] === null) problemas.push('falta «valor».');
  if (typeof parametro['extrapolacion'] !== 'boolean') problemas.push('«extrapolacion» debe ser true o false.');
  return problemas;
}

function problemasDeSeccion(seccion: unknown, secciones: ReadonlySet<string>): string[] {
  if (!Array.isArray(seccion) || seccion.length === 0 || !seccion.every((s) => typeof s === 'string')) {
    return ['«seccion» debe ser una lista no vacía de secciones del informe, p. ej. ["4", "2.2"].'];
  }
  return seccion.filter((s) => !secciones.has(s)).map((s) => `la sección «${s}» no existe en docs/investigacion.md.`);
}

function problemasDeNivel(parametro: Readonly<Record<string, unknown>>): string[] {
  const nivel = parametro['nivel_evidencia'];
  if (typeof nivel !== 'string' || !NIVELES_DE_EVIDENCIA.includes(nivel)) {
    return [`«nivel_evidencia» debe ser uno de: ${NIVELES_DE_EVIDENCIA.join(', ')}.`];
  }
  const esExtrapolacion = parametro['extrapolacion'] === true;
  if (nivel === 'extrapolación del autor' && !esExtrapolacion) {
    return ['un valor con nivel «extrapolación del autor» debe tener "extrapolacion": true.'];
  }
  if (esExtrapolacion && !esTextoNoVacio(parametro['nota'])) {
    return ['una extrapolación necesita «nota»: qué dice el informe y qué parte del valor no está probada.'];
  }
  return [];
}

function esObjeto(valor: unknown): valor is Readonly<Record<string, unknown>> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function esTextoNoVacio(valor: unknown): boolean {
  return typeof valor === 'string' && valor.trim() !== '';
}

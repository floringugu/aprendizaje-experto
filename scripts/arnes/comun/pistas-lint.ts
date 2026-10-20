// Cómo arreglar cada problema de ESLint. ESLint no deja personalizar los mensajes
// de sus reglas, así que el arnés añade esta pista debajo de cada uno.

/** Reglas de límites que el arnés configura a propósito; todas deben tener pista (lo comprueba un test). */
export const REGLAS_DE_LIMITES = [
  'complexity',
  'max-lines-per-function',
  'max-params',
  'max-depth',
  'max-lines',
  'max-nested-callbacks',
] as const;

const PISTAS: Readonly<Record<string, string>> = {
  complexity:
    'Demasiados caminos posibles (if, ?:, &&, ||, bucles, case). Extrae cada decisión a una función con ' +
    'nombre, usa retornos tempranos o cambia una cadena de if/else por una tabla (objeto o Map).',
  'max-lines-per-function':
    'La función es demasiado larga. Divídela en pasos con nombre: cada función hace una sola cosa ' +
    'y se lee de un vistazo.',
  'max-params':
    'Demasiados parámetros. Agrúpalos en un objeto con nombre (p. ej. { alumno, item, fecha }) ' +
    'o revisa si la función hace más de una cosa.',
  'max-depth':
    'Demasiado anidamiento. Usa retornos tempranos (if (!x) return) o extrae el bloque interior a una función.',
  'max-lines': 'El fichero es demasiado largo. Sepáralo en módulos por responsabilidad dentro de la misma capa.',
  'max-nested-callbacks': 'Demasiadas funciones anidadas. Extrae los callbacks interiores a funciones con nombre.',
  'no-restricted-syntax':
    'Construcción prohibida por el arnés; el mensaje dice cuál. Números sueltos en src/: el umbral va en ' +
    'config/parametros.json y la constante técnica en src/dominio/unidades.ts. Tests: nada de .skip/.only/.todo. ' +
    'Steps de Cucumber: si falta la aplicación, el paso falla; no devuelve "pending" ni "skipped".',
  'no-warning-comments':
    'Comentario que desactiva una herramienta del arnés (jscpd, Stryker, cobertura, knip). Arregla la causa: ' +
    'duplicación, mutante superviviente o código muerto.',
  'no-console': 'Nada de console en src/. Devuelve el dato y deja que la capa de interfaz lo muestre.',
  'id-denylist':
    'Nombre vago (datos, info, aux, tmp…): no dice qué contiene. Usa un nombre que diga qué es, con las ' +
    'palabras del dominio (p. ej. itemsDelObjetivo, aciertoSinAyuda). Si no encuentras uno preciso, ' +
    'quizá la variable o la función hace más de una cosa.',
  '@typescript-eslint/ban-ts-comment':
    'No silencies al compilador (@ts-ignore, @ts-expect-error, @ts-nocheck). Corrige el tipo.',
  '@typescript-eslint/no-explicit-any':
    'Nada de any. Usa unknown y estrecha el tipo con comprobaciones, o define la interfaz que corresponda.',
  '@typescript-eslint/no-non-null-assertion':
    'Nada de «!» para callar a TypeScript. Comprueba el valor (if (x === undefined) …) o usa ?? con un valor por defecto.',
  '@typescript-eslint/no-floating-promises':
    'Promesa sin esperar. Añade await, o .catch() si de verdad no hay que esperarla.',
  '@typescript-eslint/no-unused-vars': 'Variable, parámetro o import sin usar. Bórralo.',
  '@typescript-eslint/restrict-template-expressions':
    'Dentro de `${}` solo van textos. Convierte el valor de forma explícita: String(n), n.toFixed(2)…',
};

const PREFIJO_TS = '@typescript-eslint/';
const GRUPO_NO_UNSAFE =
  'Valor sin tipo (any) que se propaga. Tipa el origen del dato o valídalo y estréchalo desde unknown.';

export function pistaPara(regla: string | null): string {
  if (regla === null) return 'Error de sintaxis o de configuración: lee el mensaje y corrige el fichero.';
  const pista = PISTAS[regla];
  if (pista !== undefined) return pista;
  if (regla.startsWith(`${PREFIJO_TS}no-unsafe-`)) return GRUPO_NO_UNSAFE;
  const documentacion = regla.startsWith(PREFIJO_TS)
    ? `https://typescript-eslint.io/rules/${regla.slice(PREFIJO_TS.length)}`
    : `https://eslint.org/docs/latest/rules/${regla}`;
  return `Lee la explicación y los ejemplos de la regla en ${documentacion}`;
}

export function tienePistaPropia(regla: string): boolean {
  return PISTAS[regla] !== undefined;
}

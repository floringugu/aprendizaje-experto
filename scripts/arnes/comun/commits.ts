// Reglas del hook pre-commit (las aplica scripts/arnes/regla-commits.ts).
import { entradaQueBloquea, RUTA_SUMAS } from './protegidas.ts';
import type { EntradaProtegida } from './protegidas.ts';
import { parsearSumas, sha256 } from './sumas.ts';

export type Categoria = 'especificacion' | 'codigo' | 'otro';

const PREFIJOS_ESPECIFICACION = ['features/', 'tests/aceptacion/', 'config/'];
const PREFIJOS_CODIGO = ['src/', 'tests/unidad/'];

export function categoriaDe(ruta: string): Categoria {
  if (PREFIJOS_ESPECIFICACION.some((prefijo) => ruta.startsWith(prefijo))) return 'especificacion';
  if (PREFIJOS_CODIGO.some((prefijo) => ruta.startsWith(prefijo))) return 'codigo';
  return 'otro';
}

export function problemaDeMezcla(rutas: readonly string[]): string | undefined {
  const especificacion = rutas.filter((ruta) => categoriaDe(ruta) === 'especificacion');
  const codigo = rutas.filter((ruta) => categoriaDe(ruta) === 'codigo');
  if (especificacion.length === 0 || codigo.length === 0) return undefined;
  return (
    'Este commit mezcla especificación y código. Haz dos commits: uno solo de especificación ' +
    `(${especificacion.join(', ')}) y otro de código (${codigo.join(', ')}).`
  );
}

export function problemaDeAutoria(
  rutas: readonly string[],
  entradas: readonly EntradaProtegida[],
  esClaudeCode: boolean,
): string | undefined {
  if (!esClaudeCode) return undefined;
  const protegidas = rutas.filter((ruta) => entradaQueBloquea(ruta, entradas, 'impl') !== undefined);
  if (protegidas.length === 0) return undefined;
  return `Los ficheros protegidos los commitea el dueño, no Claude Code: ${protegidas.join(', ')}.`;
}

export interface FicheroPreparado {
  readonly ruta: string;
  /** Contenido en el índice; undefined si el commit lo borra. */
  readonly contenido: Buffer | undefined;
}

/** Comprueba que cada fichero protegido del commit coincide con las sumas que van en el mismo commit. */
export function problemasDeSumas(
  preparados: readonly FicheroPreparado[],
  sumasPreparadas: string | undefined,
  entradas: readonly EntradaProtegida[],
): string[] {
  const protegidos = preparados.filter(
    ({ ruta }) => ruta !== RUTA_SUMAS && entradaQueBloquea(ruta, entradas, 'impl') !== undefined,
  );
  if (protegidos.length === 0) return [];
  if (sumasPreparadas === undefined) return [`Faltan las sumas (${RUTA_SUMAS}). Ejecuta make sumas.`];
  const sumas = parsearSumas(sumasPreparadas);
  return protegidos.flatMap(({ ruta, contenido }) => {
    const esperada = sumas.get(ruta);
    if (contenido === undefined) return esperada === undefined ? [] : [`${ruta} se borra pero sigue en las sumas.`];
    return esperada === sha256(contenido) ? [] : [`${ruta} no coincide con su suma. Ejecuta make sumas y añádelas.`];
  });
}

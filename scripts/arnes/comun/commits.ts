// Reglas del hook pre-commit (las aplica scripts/arnes/regla-commits.ts).
import { entradaQueBloquea } from './protegidas.ts';
import type { EntradaProtegida } from './protegidas.ts';

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

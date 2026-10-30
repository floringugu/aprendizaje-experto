// La regla de mezcla de los commits: ninguno lleva a la vez especificación y código. La aplica
// scripts/arnes/regla-commits.ts a lo preparado o a cada commit de un rango (el job «mezcla» de la CI).
import { git } from './git.ts';

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

/** El problema de mezcla de lo preparado (git diff --cached), si lo hay. Lanza si git falla. */
export function problemasDeLoPreparado(raiz: string): string[] {
  // --no-renames: un renombrado aparece como borrado + alta, y se comprueban las dos rutas.
  const rutas = rutasDe(raiz, ['diff', '--cached', '--name-only', '--no-renames', '-z']);
  const problema = problemaDeMezcla(rutas);
  return problema === undefined ? [] : [problema];
}

/**
 * Un problema por cada commit de `rango` («<base>..<cabeza>») que mezcla, del más antiguo al más nuevo,
 * con su SHA corto y su título delante. Un merge no lista ficheros, así que pasa: con la historia
 * lineal de main no los hay. Lanza si git falla.
 */
export function problemasDelRango(raiz: string, rango: string): string[] {
  const commits = salidaDe(raiz, ['rev-list', '--reverse', rango])
    .split('\n')
    .filter((sha) => sha !== '');
  return commits.flatMap((sha) => {
    const problema = problemaDeMezcla(
      rutasDe(raiz, ['diff-tree', '--root', '-r', '--no-commit-id', '--name-only', '--no-renames', '-z', sha]),
    );
    if (problema === undefined) return [];
    return [`${salidaDe(raiz, ['log', '-1', '--format=%h «%s»', sha]).trim()}: ${problema}`];
  });
}

function rutasDe(raiz: string, argumentos: readonly string[]): string[] {
  return salidaDe(raiz, argumentos)
    .split('\0')
    .filter((ruta) => ruta !== '');
}

function salidaDe(raiz: string, argumentos: readonly string[]): string {
  const { codigo, salida, errores } = git(raiz, argumentos);
  if (codigo !== 0) throw new Error(`git ${argumentos.slice(0, 2).join(' ')} ha fallado:\n${errores}`);
  return salida;
}

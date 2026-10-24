// Hook pre-commit de git (.githooks/pre-commit). Rechaza el commit si:
//   - mezcla especificación (features/, tests/aceptacion/, config/) y código (src/, tests/unidad/);
//   - Claude Code intenta commitear un fichero protegido.
import { problemaDeAutoria, problemaDeMezcla } from './comun/commits.ts';
import { git } from './comun/git.ts';
import { leerProtegidas } from './comun/protegidas.ts';
import { RAIZ } from './comun/raiz.ts';

function principal(): number {
  // --no-renames: un renombrado aparece como borrado + alta, y se comprueban las dos rutas.
  const { codigo, salida } = git(RAIZ, ['diff', '--cached', '--name-only', '--no-renames', '-z']);
  if (codigo !== 0) {
    console.error('No se pueden leer los cambios preparados (git diff --cached).');
    return 1;
  }
  const rutas = salida.split('\0').filter((ruta) => ruta !== '');
  const entradas = leerProtegidas(RAIZ);
  const problemas = [
    problemaDeMezcla(rutas),
    problemaDeAutoria(rutas, entradas, process.env['CLAUDECODE'] !== undefined),
  ].filter((problema) => problema !== undefined);
  if (problemas.length === 0) return 0;
  console.error(`Commit rechazado:\n${problemas.map((problema) => `  - ${problema}`).join('\n')}`);
  return 1;
}

process.exitCode = principal();

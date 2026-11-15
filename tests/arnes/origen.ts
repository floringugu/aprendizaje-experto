// Repositorios de prueba para los carriles: la carpeta principal y un origin bare que hace de GitHub,
// con las fusiones de PR que hace GitHub (rebase: commits nuevos en main, con otro SHA).
import { realpathSync } from 'node:fs';
import path from 'node:path';
import { git } from '../../scripts/arnes/comun/git.ts';
import { fijarLoteDeLaRama } from '../../scripts/arnes/comun/ramas.ts';
import { directorioTemporal, escribirFicheros } from './temporal.ts';

/** git con una identidad (la máquina que pasa los tests puede no tener una). Lanza si falla. */
export function gitBien(raiz: string, argumentos: readonly string[]): string {
  const identidad = ['-c', 'user.name=Test', '-c', 'user.email=test@example.com'];
  const { codigo, salida, errores } = git(raiz, [...identidad, ...argumentos]);
  if (codigo !== 0) throw new Error(`git ${argumentos.join(' ')} ha fallado:\n${errores}`);
  return salida;
}

export function commit(raiz: string, mensaje: string, ficheros: Readonly<Record<string, string>>): void {
  escribirFicheros(raiz, ficheros);
  gitBien(raiz, ['add', '-A']);
  gitBien(raiz, ['commit', '--quiet', '-m', mensaje]);
}

/**
 * «<padre>/principal», en main, con un primer commit de `ficheros` ya subido a «<padre>/origen.git».
 * Su .gitignore deja fuera node_modules, los ajustes locales y reports/, como el del proyecto.
 */
export function principalConOrigen(ficheros: Readonly<Record<string, string>>): string {
  const padre = realpathSync(directorioTemporal());
  const origen = path.join(padre, 'origen.git');
  const principal = path.join(padre, 'principal');
  gitBien(padre, ['init', '--quiet', '--bare', '-b', 'main', origen]);
  gitBien(padre, ['init', '--quiet', '-b', 'main', principal]);
  commit(principal, 'inicial', { '.gitignore': 'node_modules\n.claude/settings.local.json\nreports/\n', ...ficheros });
  gitBien(principal, ['remote', 'add', 'origin', origen]);
  gitBien(principal, ['push', '--quiet', 'origin', 'main']);
  return principal;
}

function clonDelOrigen(checkout: string): string {
  const origen = gitBien(checkout, ['remote', 'get-url', 'origin']).trim();
  const clon = path.join(directorioTemporal(), 'github');
  gitBien(checkout, ['clone', '--quiet', origen, clon]);
  return clon;
}

/** GitHub fusiona en `base` (main o una rama de lote) el PR de otro carril: `checkout` no se entera hasta que traiga origin. */
export function otroPrFusionado(checkout: string, base = 'main'): void {
  const github = clonDelOrigen(checkout);
  gitBien(github, ['switch', '--quiet', base]);
  // En un lote lleva otro mensaje: con el mismo, y en el mismo segundo, sería el mismo commit que el de main.
  const mensaje = base === 'main' ? 'otro PR' : `otro PR de ${base}`;
  gitBien(github, ['commit', '--quiet', '--allow-empty', '-m', mensaje]);
  gitBien(github, ['push', '--quiet', 'origin', base]);
}

/**
 * GitHub fusiona con rebase en `base` (main o una rama de lote) el PR de `rama`, que se sube desde
 * `checkout`, después del de otro carril: la base recibe una copia de cada commit de la rama, con otro SHA.
 */
export function fusionarComoGitHub(checkout: string, rama: string, base = 'main'): void {
  otroPrFusionado(checkout, base);
  gitBien(checkout, ['push', '--quiet', 'origin', rama]);
  copiarEnLaBase(checkout, rama, base);
}

/** GitHub fusiona con rebase en main el PR de la rama de lote `lote`, que ya está en origin, después del de otro carril. */
export function fusionarLoteComoGitHub(checkout: string, lote: string): void {
  otroPrFusionado(checkout);
  copiarEnLaBase(checkout, lote, 'main');
}

function copiarEnLaBase(checkout: string, rama: string, base: string): void {
  const github = clonDelOrigen(checkout);
  gitBien(github, ['switch', '--quiet', base]);
  // --allow-empty: un lote lleva los commits vacíos de otroPrFusionado.
  gitBien(github, ['cherry-pick', '--allow-empty', `origin/${base}..origin/${rama}`]);
  gitBien(github, ['push', '--quiet', 'origin', base]);
}

/**
 * La noche fusiona en `lote` (que origin ya tiene) un PR con `ficheros`: crea `rama` desde el lote en
 * `checkout`, que queda en ella, le apunta su lote, commitea, GitHub la fusiona y `checkout` trae origin.
 */
export function prFusionadoEnLote(
  checkout: string,
  { rama, lote, ficheros }: { rama: string; lote: string; ficheros: Readonly<Record<string, string>> },
): void {
  gitBien(checkout, ['switch', '--quiet', '--no-track', '-c', rama, `origin/${lote}`]);
  fijarLoteDeLaRama(checkout, rama, lote);
  commit(checkout, `trabajo de ${rama}`, ficheros);
  fusionarComoGitHub(checkout, rama, lote);
  gitBien(checkout, ['fetch', '--quiet', 'origin']);
}

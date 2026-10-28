// Repositorios de prueba para los carriles: la carpeta principal y un origin bare que hace de GitHub,
// con las fusiones de PR que hace GitHub (rebase: commits nuevos en main, con otro SHA).
import { realpathSync } from 'node:fs';
import path from 'node:path';
import { git } from '../../scripts/arnes/comun/git.ts';
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

/** GitHub fusiona en main el PR de otro carril: `checkout` no se entera hasta que traiga origin. */
export function otroPrFusionado(checkout: string): void {
  const github = clonDelOrigen(checkout);
  gitBien(github, ['commit', '--quiet', '--allow-empty', '-m', 'otro PR']);
  gitBien(github, ['push', '--quiet', 'origin', 'main']);
}

/**
 * GitHub fusiona con rebase el PR de `rama`, que se sube desde `checkout`, después del de otro carril:
 * main recibe una copia de cada commit de la rama, con otro SHA.
 */
export function fusionarComoGitHub(checkout: string, rama: string): void {
  otroPrFusionado(checkout);
  gitBien(checkout, ['push', '--quiet', 'origin', rama]);
  const github = clonDelOrigen(checkout);
  gitBien(github, ['cherry-pick', `origin/main..origin/${rama}`]);
  gitBien(github, ['push', '--quiet', 'origin', 'main']);
}

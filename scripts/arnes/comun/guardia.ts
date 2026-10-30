// Lógica del hook PreToolUse proteger-rutas.ts: decide si una edición o un comando Bash toca algo que
// la conversación no puede tocar. Separada del hook para probarla con tests.
//
// Cada conversación trabaja en su checkout (checkout.ts), la carpeta principal o un carril, y puede
// tocar el suyo y la carpeta principal, que no se frena aquí porque main la protege GitHub. Los demás
// carriles son de otras conversaciones. Además se niegan el .git/ de cada checkout, ~/.claude/ y
// unos pocos comandos que se salen del arnés.
import { lstatSync, readlinkSync, realpathSync } from 'node:fs';
import path from 'node:path';
import type { CheckoutsDelRepositorio } from './checkout.ts';
import { MARCA_DECISION_PENDIENTE } from './freno-stop.ts';

export interface ContextoGuardia extends CheckoutsDelRepositorio {
  /** El checkout de la conversación: la carpeta principal o uno de los carriles. */
  readonly checkout: string;
  readonly home: string;
}

const MAXIMO_SALTOS_DE_ENLACE = 40;

const MOTIVO_GIT = 'No se puede tocar .git/: ahí viven los hooks de git y la configuración del repositorio.';

const MOTIVO_HOME_CLAUDE =
  'No se puede tocar ~/.claude/: ahí vive la configuración de Claude Code del usuario. ' +
  'Solo quedan abiertos los planes (~/.claude/plans/), la memoria del proyecto ' +
  '(~/.claude/projects/<proyecto>/memory/) y, para leer desde Bash, el resto de ~/.claude/projects/.';

function motivoOtroCarril(carril: string): string {
  return (
    `No se puede tocar ${carril}: es otro carril, el de otra conversación. Cada conversación toca solo ` +
    `su carril y la carpeta principal. Si te hace falta algo de allí, dilo en tu mensaje y para con ` +
    `${MARCA_DECISION_PENDIENTE}.`
  );
}

/** Comandos prohibidos sea cual sea la ruta. No es una lista exhaustiva: un comando ofuscado puede escaparse. */
const PATRONES_PROHIBIDOS: readonly { readonly patron: RegExp; readonly motivo: string }[] = [
  {
    patron: /\bCLAUDECODE\b|\benv\b[^\n;&|]*\s(-[a-zA-Z]*[iu]|--ignore-environment|--unset)\b/,
    motivo: 'No se puede alterar el entorno (CLAUDECODE, env -i, env -u): los scripts del dueño dependen de él.',
  },
  { patron: /disableAllHooks/, motivo: 'No se pueden desactivar los hooks de Claude Code.' },
  {
    patron: /\b(npm|pnpm|yarn)\s+(install|i|add|uninstall|un|remove|rm|update|up|upgrade|link)\b/,
    motivo:
      'Las dependencias las cambia el dueño: los carriles comparten el node_modules de la carpeta principal. ' +
      'Propón la dependencia (tamaño, licencia y beneficio) y espera su aprobación.',
  },
];

// ---------------------------------------------------------------------------
// Edit / Write / MultiEdit / NotebookEdit
// ---------------------------------------------------------------------------

export function motivoBloqueoFichero(rutaAbsoluta: string, contexto: ContextoGuardia): string | undefined {
  const real = resolverReal(rutaAbsoluta);
  // El más profundo primero: un carril puede estar dentro de la carpeta principal, en .claude/worktrees/.
  const checkouts = [contexto.principal, ...contexto.carriles].map((checkout) => resolverReal(checkout));
  for (const checkout of checkouts.sort((a, b) => b.length - a.length)) {
    const relativa = relativaSiDentro(real, checkout);
    if (relativa === undefined) continue;
    if (relativa === '.git' || relativa.startsWith('.git/')) return MOTIVO_GIT;
    return carrilesAjenos(contexto).includes(checkout) ? motivoOtroCarril(checkout) : undefined;
  }
  return motivoFueraDelRepositorio(real, contexto.home);
}

/** Los carriles que no son de la conversación: desde la carpeta principal, todos. */
function carrilesAjenos(contexto: ContextoGuardia): string[] {
  const propio = resolverReal(contexto.checkout);
  return contexto.carriles.map((carril) => resolverReal(carril)).filter((carril) => carril !== propio);
}

/**
 * Ruta real, siguiendo enlaces simbólicos aunque el fichero final aún no exista.
 * Así un enlace en src/ que apunte a otro carril no sirve para escribir en él.
 */
function resolverReal(ruta: string, saltos = 0): string {
  if (saltos > MAXIMO_SALTOS_DE_ENLACE) throw new Error(`Demasiados enlaces simbólicos en ${ruta}`);
  const info = lstatSync(ruta, { throwIfNoEntry: false });
  if (info === undefined) {
    const padre = path.dirname(ruta);
    if (padre === ruta) return ruta;
    return path.join(resolverReal(padre, saltos), path.basename(ruta));
  }
  if (info.isSymbolicLink()) {
    return resolverReal(path.resolve(path.dirname(ruta), readlinkSync(ruta)), saltos + 1);
  }
  return realpathSync(ruta);
}

/** La ruta relativa a `directorio`, con «/», si está dentro; path.relative, porque con startsWith «/a» contendría a «/a-b». */
function relativaSiDentro(ruta: string, directorio: string): string | undefined {
  const relativa = path.relative(directorio, ruta);
  if (relativa === '') return '.';
  if (relativa.startsWith('..') || path.isAbsolute(relativa)) return undefined;
  return relativa.split(path.sep).join('/');
}

function motivoFueraDelRepositorio(rutaReal: string, home: string): string | undefined {
  const relativaAHomeClaude = relativaSiDentro(rutaReal, resolverReal(path.join(home, '.claude')));
  if (relativaAHomeClaude === undefined) return undefined;
  // El modo plan de Claude Code escribe el plan en ~/.claude/plans/.
  const estaAbierta = /^(projects\/[^/]+\/memory|plans)(\/|$)/.test(relativaAHomeClaude);
  return estaAbierta ? undefined : MOTIVO_HOME_CLAUDE;
}

// ---------------------------------------------------------------------------
// Bash
// ---------------------------------------------------------------------------

/**
 * Un comando se mira por lo que nombra: los patrones prohibidos, ~/.claude/ y los otros carriles.
 * Una ruta que el comando construya (con variables, por ejemplo) se escapa.
 */
export function motivoBloqueoBash(comando: string, contexto: ContextoGuardia): string | undefined {
  const prohibido = PATRONES_PROHIBIDOS.find(({ patron }) => patron.test(comando));
  if (prohibido !== undefined) return prohibido.motivo;
  if (mencionaHomeClaude(comando, contexto.home)) return MOTIVO_HOME_CLAUDE;
  const nombrado = carrilesAjenos(contexto).find((carril) =>
    formasDeNombrar(carril, contexto).some((forma) => mencionaRuta(comando, forma)),
  );
  return nombrado === undefined ? undefined : motivoOtroCarril(nombrado);
}

/**
 * Cómo puede nombrar un comando el carril: por su ruta absoluta, por su ruta desde el padre de la
 * carpeta principal (aprendizaje-experto-pasos, que mencionaRuta encuentra también dentro de
 * ../aprendizaje-experto-pasos y de ~/aprendizaje-experto-pasos) y por su ruta desde el checkout de la
 * conversación (.claude/worktrees/x, para uno dentro de la carpeta principal).
 */
function formasDeNombrar(carril: string, contexto: ContextoGuardia): string[] {
  const padre = path.dirname(resolverReal(contexto.principal));
  return [carril, path.relative(padre, carril), path.relative(resolverReal(contexto.checkout), carril)];
}

/**
 * ¿Nombra el comando ~/.claude/ (como ~, $HOME, ${HOME} o la ruta absoluta del home) fuera de
 * projects/ y plans/? No ve un «cd ~» seguido de una ruta relativa: para eso está además el
 * hook ConfigChange, que bloquea los cambios en los ajustes durante la conversación.
 */
function mencionaHomeClaude(comando: string, home: string): boolean {
  const formasDelHome = ['~', '$HOME', '${HOME}', home].map(escaparRegex).join('|');
  const patron = new RegExp(String.raw`(?:${formasDelHome})/\.claude(?![\w.-])([^\s'"\x60;&|()<>]*)`, 'g');
  return [...comando.matchAll(patron)].some(([, resto = '']) => {
    // normalize resuelve los «..»: ~/.claude/projects/../settings.json es ~/.claude/settings.json.
    const dentroDeClaude = path.posix.normalize(resto === '' ? '/' : resto);
    return !/^\/(projects|plans)(\/|$)/.test(dentroDeClaude);
  });
}

function mencionaRuta(comando: string, ruta: string): boolean {
  const antes = String.raw`(?:^|[\s'"=(<>;&|:,\x60/])`;
  const despues = String.raw`(?=$|[\s'"/)<>;&|,\x60*?[])`;
  return new RegExp(antes + escaparRegex(ruta) + despues).test(comando);
}

function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

// Lógica del hook PreToolUse: decide si una edición o un comando Bash toca algo protegido.
// Separada del hook para poder probarla con tests unitarios.
import { lstatSync, readlinkSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { entradaQueBloquea, RUTA_PROTEGIDAS } from './protegidas.ts';
import type { EntradaProtegida, Fase } from './protegidas.ts';

export interface ContextoGuardia {
  readonly raiz: string;
  readonly home: string;
  readonly entradas: readonly EntradaProtegida[];
  readonly fase: Fase;
}

const MAXIMO_SALTOS_DE_ENLACE = 40;

const MOTIVO_GIT = 'No se puede tocar .git/: ahí viven los hooks de git y la configuración del repositorio.';

const MOTIVO_HOME_CLAUDE =
  'No se puede tocar ~/.claude/: ahí vive la configuración de Claude Code del usuario. ' +
  'Solo se permite escribir en la memoria del proyecto (~/.claude/projects/<proyecto>/memory/).';

/**
 * Comandos prohibidos sea cual sea la ruta. Cierran las salidas más obvias del arnés.
 * No es una lista exhaustiva: un comando ofuscado puede escaparse, y por eso existen
 * también la comprobación de integridad y el hook pre-commit.
 */
const PATRONES_PROHIBIDOS: readonly { readonly patron: RegExp; readonly motivo: string }[] = [
  {
    patron: /--no-verify\b|\bgit\b[^\n;&|]*\bcommit\b[^\n;&|]*\s-[a-zA-Z]*n[a-zA-Z]*\b/,
    motivo: 'No se puede saltar el hook pre-commit (--no-verify / -n).',
  },
  { patron: /hooksPath/i, motivo: 'No se puede cambiar core.hooksPath: desactivaría el hook pre-commit.' },
  {
    patron: /\bCLAUDECODE\b|\benv\b[^\n;&|]*\s(-[a-zA-Z]*[iu]|--ignore-environment|--unset)\b/,
    motivo: 'No se puede alterar el entorno (CLAUDECODE, env -i, env -u): los scripts del dueño dependen de él.',
  },
  {
    patron: /\bARNES_FASE\b/,
    motivo: 'La fase (ARNES_FASE) la fija el dueño al lanzar la sesión; no se cambia desde un comando.',
  },
  { patron: /disableAllHooks/, motivo: 'No se pueden desactivar los hooks de Claude Code.' },
  {
    patron: /\b(npm|pnpm|yarn)\s+(install|i|add|uninstall|un|remove|rm|update|up|upgrade|link)\b/,
    motivo:
      'Las dependencias las cambia el dueño: package.json está protegido. Propón la dependencia ' +
      '(tamaño, licencia y beneficio) y espera su aprobación.',
  },
];

// ---------------------------------------------------------------------------
// Edit / Write / MultiEdit / NotebookEdit
// ---------------------------------------------------------------------------

export function motivoBloqueoFichero(rutaAbsoluta: string, contexto: ContextoGuardia): string | undefined {
  const real = resolverReal(rutaAbsoluta);
  const relativa = relativaSiDentro(real, resolverReal(contexto.raiz));
  if (relativa === undefined) return motivoFueraDelRepositorio(real, contexto.home);
  if (relativa === '.git' || relativa.startsWith('.git/')) return MOTIVO_GIT;
  const entrada = entradaQueBloquea(relativa, contexto.entradas, contexto.fase);
  return entrada === undefined ? undefined : mensajeRutaProtegida(relativa, entrada);
}

/**
 * Ruta real, siguiendo enlaces simbólicos aunque el fichero final aún no exista.
 * Así un enlace en src/ que apunte a docs/investigacion.md no sirve para escribir en él.
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

function relativaSiDentro(ruta: string, directorio: string): string | undefined {
  const relativa = path.relative(directorio, ruta);
  if (relativa === '') return '.';
  if (relativa.startsWith('..') || path.isAbsolute(relativa)) return undefined;
  return relativa.split(path.sep).join('/');
}

function motivoFueraDelRepositorio(rutaReal: string, home: string): string | undefined {
  const relativaAHomeClaude = relativaSiDentro(rutaReal, resolverReal(path.join(home, '.claude')));
  if (relativaAHomeClaude === undefined) return undefined;
  const esMemoriaDeProyecto = /^projects\/[^/]+\/memory(\/|$)/.test(relativaAHomeClaude);
  return esMemoriaDeProyecto ? undefined : MOTIVO_HOME_CLAUDE;
}

function mensajeRutaProtegida(relativa: string, entrada: EntradaProtegida): string {
  const desbloqueo =
    entrada.desbloqueadaEn === undefined
      ? ''
      : ` Solo se edita en una sesión lanzada con ARNES_FASE=${entrada.desbloqueadaEn}.`;
  return (
    `«${relativa}» está protegida (regla «${entrada.ruta}» de ${RUTA_PROTEGIDAS}).${desbloqueo} ` +
    'La cambia el dueño, a mano. Si crees que hay que cambiarla, para y propónselo.'
  );
}

// ---------------------------------------------------------------------------
// Bash
// ---------------------------------------------------------------------------

export function motivoBloqueoBash(comando: string, contexto: ContextoGuardia): string | undefined {
  const prohibido = PATRONES_PROHIBIDOS.find(({ patron }) => patron.test(comando));
  if (prohibido !== undefined) return prohibido.motivo;
  if (mencionaRuta(comando, '.git')) return MOTIVO_GIT;
  const entrada = contexto.entradas.find(
    (candidata) => candidata.desbloqueadaEn !== contexto.fase && mencionaEntrada(comando, candidata),
  );
  if (entrada === undefined) return undefined;
  return (
    `El comando menciona la ruta protegida «${entrada.ruta}» (${RUTA_PROTEGIDAS}). ` +
    'En Bash no se puede nombrar una ruta protegida, ni siquiera para leerla: usa las herramientas ' +
    'Read, Grep o Glob para leer, y los objetivos de make (make check, make specs…) para verificar.'
  );
}

function mencionaEntrada(comando: string, entrada: EntradaProtegida): boolean {
  const ruta = entrada.ruta.replace(/\/$/, '');
  if (mencionaRuta(comando, ruta)) return true;
  // En los ficheros se busca también el nombre suelto, para pillar rutas relativas
  // desde otro directorio o a través de un enlace simbólico.
  const nombre = path.posix.basename(ruta);
  return !entrada.ruta.endsWith('/') && nombre !== ruta && mencionaRuta(comando, nombre);
}

function mencionaRuta(comando: string, ruta: string): boolean {
  const antes = String.raw`(?:^|[\s'"=(<>;&|:,\x60/])`;
  const despues = String.raw`(?=$|[\s'"/)<>;&|,\x60*?[])`;
  return new RegExp(antes + escaparRegex(ruta) + despues).test(comando);
}

function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

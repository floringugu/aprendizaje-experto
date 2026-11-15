// Las ramas de lote (docs/plan.md §6, «Noche desatendida»): «lote/1», «lote/2»… en origin. Un lote
// nace de main y acumula lo que la noche fusiona de aceptación e impl: el Despachador saca de él los
// carriles de esas fases, y sus PR van a él, donde entran con la CI en verde y sin visto bueno. Por la
// mañana el dueño revisa el PR «lote/N → main» y lo fusiona. Las specs no pasan por el lote.
//
// Nada de esto se guarda: el estado de un lote sale de comparar origin/lote/N con origin/main, con
// lo último que trajo traerOrigen (ramas.ts). Solo hay un lote en uso a la vez, el de número más alto.
import { spawnSync } from 'node:child_process';
import { git } from './git.ts';
import { estaFusionadaEn, loteDeLaRama, numeroDeLote, RAMA_DE_ORIGEN, traerOrigen } from './ramas.ts';
import { ticketsDe } from './tickets.ts';

/**
 *   nuevo: está en el mismo commit que origin/main; aún no ha recibido nada;
 *   vivo: tiene commits que main no tiene, ni con otro SHA: espera a que el dueño lo fusione;
 *   fusionado: main ya tiene todo lo suyo (o el lote se quedó atrás sin recibir nada): no se usa más.
 */
export type EstadoDelLote = 'nuevo' | 'vivo' | 'fusionado';

/** Las ramas de lote de origin («lote/N»), de menor a mayor número. */
export function lotesDeOrigen(raiz: string): string[] {
  const { salida } = git(raiz, ['for-each-ref', '--format=%(refname:lstrip=3)', 'refs/remotes/origin/lote/']);
  return salida
    .split('\n')
    .filter((nombre) => numeroDeLote(nombre) !== undefined)
    .toSorted((a, b) => (numeroDeLote(a) ?? 0) - (numeroDeLote(b) ?? 0));
}

/** Cómo está el lote `lote` («lote/N», que origin tiene) frente a origin/main. */
export function estadoDelLote(raiz: string, lote: string): EstadoDelLote {
  const ref = `origin/${lote}`;
  const commit = (nombre: string): string => git(raiz, ['rev-parse', '--verify', '--quiet', nombre]).salida.trim();
  if (commit(ref) === commit(RAMA_DE_ORIGEN)) return 'nuevo';
  return estaFusionadaEn(raiz, ref, RAMA_DE_ORIGEN) ? 'fusionado' : 'vivo';
}

/** Los lotes de origin con algo que main no tiene, de menor a mayor número. */
export function lotesVivos(raiz: string): string[] {
  return lotesDeOrigen(raiz).filter((lote) => estadoDelLote(raiz, lote) === 'vivo');
}

export interface LoteDeLaNoche {
  /** «lote/N». */
  readonly rama: string;
  /** Si origin ya la tiene. Si no, hay que crearla (crearLote) antes de sacar de ella un carril. */
  readonly existe: boolean;
}

/**
 * El lote que usa el Despachador para aceptación e impl: el de número más alto de origin, mientras no
 * esté fusionado; si lo está, o no hay ninguno, el siguiente número, que aún no existe.
 */
export function loteDeLaNoche(raiz: string): LoteDeLaNoche {
  const ultimo = lotesDeOrigen(raiz).at(-1);
  if (ultimo === undefined) return { rama: 'lote/1', existe: false };
  if (estadoDelLote(raiz, ultimo) !== 'fusionado') return { rama: ultimo, existe: true };
  return { rama: `lote/${String((numeroDeLote(ultimo) ?? 0) + 1)}`, existe: false };
}

/** Crea en origin la rama `lote`, en el commit de origin/main, y la trae. Devuelve el motivo si falla. */
export function crearLote(raiz: string, lote: string): string | undefined {
  const subir = git(raiz, ['push', '--quiet', 'origin', `refs/remotes/${RAMA_DE_ORIGEN}:refs/heads/${lote}`]);
  if (subir.codigo !== 0) return `no se ha podido crear ${lote} en origin: ${subir.errores.trim()}`;
  return traerOrigen(raiz);
}

// ---------------------------------------------------------------------------
// El PR del lote hacia main
// ---------------------------------------------------------------------------

/** Los argumentos de «gh» que abren el PR del lote hacia main. */
function argumentosDelPrDelLote(lote: string): string[] {
  const titulo = `Lote ${String(numeroDeLote(lote) ?? '')}: lo que la noche fusionó en ${lote}`;
  const cuerpo =
    `Aceptación e impl que el Despachador fusionó en \`${lote}\` con la CI en verde y sin visto bueno. ` +
    'El visto bueno se da aquí, sobre el diff entero. `make manana` lista sus tickets y sus ficheros.';
  return ['pr', 'create', '--base', 'main', '--head', lote, '--title', titulo, '--body', cuerpo];
}

/** El número del PR abierto del lote hacia main, según gh; undefined si no lo tiene o gh falla. */
export function prDelLote(raiz: string, lote: string): number | undefined {
  const argumentos = ['pr', 'list', '--head', lote, '--base', 'main', '--state', 'open', '--json', 'number'];
  const resultado = spawnSync('gh', argumentos, { cwd: raiz, encoding: 'utf8' });
  if (resultado.status !== 0) return undefined;
  return (JSON.parse(resultado.stdout) as { number: number }[])[0]?.number;
}

/**
 * Abre el PR del lote hacia main si no tiene uno abierto. Nunca le activa la fusión automática: lo
 * fusiona el dueño. Devuelve el motivo si gh no lo abre.
 */
export function asegurarPrDelLote(raiz: string, lote: string): string | undefined {
  if (prDelLote(raiz, lote) !== undefined) return undefined;
  const resultado = spawnSync('gh', argumentosDelPrDelLote(lote), { cwd: raiz, encoding: 'utf8' });
  return resultado.status === 0
    ? undefined
    : `no se ha podido abrir el PR de ${lote} hacia main: ${resultado.stderr.trim()}`;
}

// ---------------------------------------------------------------------------
// El resumen del lote (make manana)
// ---------------------------------------------------------------------------

export interface ResumenDeLote {
  /** «lote/N». */
  readonly lote: string;
  /** Los tickets con «estado: hecho» en el lote que en origin/main aún no lo tienen. */
  readonly tickets: readonly string[];
  /** Los ficheros que el lote cambia respecto a origin/main, desde el punto en que salió de él. */
  readonly ficheros: readonly string[];
}

/** Lo que el lote `lote` lleva y main no, leído de los refs. */
export function resumenDelLote(raiz: string, lote: string): ResumenDeLote {
  const ref = `origin/${lote}`;
  const hechos = (origen: string): string[] =>
    ticketsDe(raiz, origen)
      .tickets.filter(({ estado }) => estado === 'hecho')
      .map(({ id }) => id);
  const enMain = new Set(hechos(RAMA_DE_ORIGEN));
  const { salida } = git(raiz, ['diff', '--name-only', `${RAMA_DE_ORIGEN}...${ref}`]);
  return {
    lote,
    tickets: hechos(ref).filter((id) => !enMain.has(id)),
    ficheros: salida.split('\n').filter((linea) => linea !== ''),
  };
}

/**
 * El apartado de «make manana» de un lote vivo: sus tickets, sus ficheros, su PR hacia main (`pr`,
 * undefined si no tiene) y el bloque de comandos con que el dueño lo fusiona desde `principal` y
 * actualiza la carpeta.
 */
export function textoDelLote(
  { lote, tickets, ficheros }: ResumenDeLote,
  pr: number | undefined,
  principal: string,
): string {
  const cuantos = `${String(tickets.length)} ${tickets.length === 1 ? 'ticket hecho' : 'tickets hechos'}`;
  const objetivo = pr === undefined ? lote : String(pr);
  const abrir = pr === undefined ? [`gh ${argumentosDelPrDelLote(lote).map(entreComillas).join(' ')}`] : [];
  const comandos = [
    `cd ${principal}`,
    ...abrir,
    // Una CI en rojo o sin terminar no se fusiona ni con bypass.
    `gh pr checks ${objetivo} --watch`,
    `gh pr merge ${objetivo} --rebase --admin`,
    'git pull --ff-only',
    ...(ficheros.includes('package-lock.json') ? ['npm ci'] : []),
  ];
  return [
    `Rama ${lote}, sin fusionar en main: ${cuantos}${tickets.length === 0 ? '' : ` (${tickets.join(', ')})`}.`,
    `  ${pr === undefined ? 'Sin PR abierto hacia main.' : `PR #${String(pr)} hacia main: ahí das el visto bueno al lote entero.`}`,
    `  Ficheros (${String(ficheros.length)}):`,
    ...ficheros.map((fichero) => `    ${fichero}`),
    '  Para fusionarlo:',
    ...comandos.map((comando) => `    ${comando}`),
  ].join('\n');
}

/** El argumento tal cual si es una palabra de shell; si no, entre comillas simples. */
function entreComillas(argumento: string): string {
  return /^[\w/.=:-]+$/.test(argumento) ? argumento : `'${argumento.replaceAll("'", String.raw`'\''`)}'`;
}

// ---------------------------------------------------------------------------
// El aviso a la conversación de un carril que sale de un lote
// ---------------------------------------------------------------------------

/**
 * Lo que tiene que saber la conversación del carril `checkout` si su rama sale de un lote: adónde va
 * su PR y que se fusiona solo o, si el lote ya está en main, cómo pasar la rama a main. undefined si
 * la rama sale de main. Sin fetch: con lo último que se trajo de origin.
 */
export function avisoDeLote(checkout: string): string | undefined {
  const rama = git(checkout, ['branch', '--show-current']).salida.trim();
  const lote = loteDeLaRama(checkout, rama);
  if (lote === undefined) return undefined;
  if (estadoDelLote(checkout, lote) === 'fusionado') {
    return (
      `Este carril salió de la rama de lote ${lote}, que ya está en main. Antes de seguir, pasa su rama a main: ` +
      `«git rebase --onto ${RAMA_DE_ORIGEN} origin/${lote}» y «git config --unset branch.${rama}.gh-merge-base»; ` +
      'si la rama ya tiene un PR, después «git push --force-with-lease» y «gh pr edit --base main». ' +
      'Desde entonces su PR va a main y sigue sus reglas: fusión automática solo con la lista blanca.'
    );
  }
  return (
    `Este carril sale de la rama de lote ${lote}, no de main: «gh pr create --fill» ya abre su PR hacia ${lote}. ` +
    'Ese PR no espera el visto bueno del dueño, toque lo que toque (la lista blanca solo cuenta en los PR a main): ' +
    `actívale siempre «gh pr merge --auto --rebase», y se fusiona en ${lote} con la CI en verde. ` +
    `El dueño revisa el lote entero en el PR ${lote} → main.`
  );
}

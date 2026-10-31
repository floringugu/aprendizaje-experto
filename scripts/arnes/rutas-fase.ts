// Las rutas de cada fase: lo que una conversación o un PR de una fase no puede tocar (docs/plan.md §6).
//   node scripts/arnes/rutas-fase.ts <rama> <base> <cabeza>
// es el job «rutas» de la CI (.github/workflows/puerta.yml): saca la fase del nombre de la rama y
// comprueba los ficheros que cambia el PR. El hook proteger-rutas.ts (comun/guardia.ts) usa la misma
// tabla para negar las ediciones durante la conversación.
//
// No importa nada del repositorio: la CI lo ejecuta en la versión de la base, copiado fuera del
// checkout, para que un PR no pueda relajarlo.
import { spawnSync } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';

export type Fase = 'specs' | 'aceptacion' | 'impl';

interface RutaProtegida {
  /** Fichero, o directorio con «/» al final, relativo a la raíz del repositorio. */
  readonly ruta: string;
  /** Qué hay en la ruta, para explicar el bloqueo: «es la especificación». */
  readonly que: string;
  readonly laEscribe: Fase;
  readonly prohibidaEn: readonly Fase[];
}

// config/alcance.json no está: lo escriben varias fases, y en impl se mira su contenido (problemaDeAlcance).
const RUTAS_PROTEGIDAS: readonly RutaProtegida[] = [
  { ruta: 'features/', que: 'es la especificación', laEscribe: 'specs', prohibidaEn: ['impl', 'aceptacion'] },
  {
    ruta: 'config/parametros.json',
    que: 'son los parámetros de la especificación',
    laEscribe: 'specs',
    prohibidaEn: ['impl', 'aceptacion'],
  },
  {
    ruta: 'config/peticion-ia.md',
    que: 'es la petición a la IA',
    laEscribe: 'specs',
    prohibidaEn: ['impl', 'aceptacion'],
  },
  {
    ruta: 'tests/aceptacion/',
    que: 'son los steps de aceptación',
    laEscribe: 'aceptacion',
    prohibidaEn: ['impl', 'specs'],
  },
  { ruta: 'src/', que: 'es el código', laEscribe: 'impl', prohibidaEn: ['specs'] },
  { ruta: 'tests/unidad/', que: 'son los tests unitarios', laEscribe: 'impl', prohibidaEn: ['specs'] },
];

const RUTA_ALCANCE = 'config/alcance.json';

/**
 * Por qué la fase `fase` no puede tocar `ruta` (relativa a la raíz del repositorio, con «/»), o
 * undefined si puede. No mira config/alcance.json: eso es problemaDeAlcance.
 */
export function motivoRutaDeOtraFase(fase: Fase, ruta: string): string | undefined {
  const protegida = RUTAS_PROTEGIDAS.find(
    (candidata) => candidata.prohibidaEn.includes(fase) && contiene(candidata.ruta, ruta),
  );
  if (protegida === undefined) return undefined;
  return `${protegida.ruta} ${protegida.que}, que escribe la fase ${protegida.laEscribe}`;
}

/** ¿Es `ruta` el fichero `protegida` o algo de dentro del directorio `protegida`? «features-viejas/» no está en «features/». */
function contiene(protegida: string, ruta: string): boolean {
  return protegida.endsWith('/') ? `${ruta}/`.startsWith(protegida) : ruta === protegida;
}

/**
 * Qué cambio de config/alcance.json no puede hacer la fase `fase`, o undefined si puede hacerlo.
 * `base` y `cabeza` son el texto del fichero antes y después, undefined si no existe. La fase impl
 * solo puede añadir áreas a areas_cerradas, al cerrar una, y quitar entradas de escenarios_en_rojo;
 * las demás fases, cualquier cambio. Compara el JSON, no el texto: cambiar el formato no cuenta.
 */
export function problemaDeAlcance(
  fase: Fase,
  base: string | undefined,
  cabeza: string | undefined,
): string | undefined {
  if (fase !== 'impl' || base === cabeza) return undefined;
  const detalle = detalleDeAlcanceEnImpl(base, cabeza);
  if (detalle === undefined) return undefined;
  return (
    'la fase impl solo puede añadir áreas a areas_cerradas y quitar entradas de escenarios_en_rojo, ' +
    `y este cambio ${detalle}`
  );
}

function detalleDeAlcanceEnImpl(base: string | undefined, cabeza: string | undefined): string | undefined {
  if (cabeza === undefined) return 'lo borra';
  const antes = objetoJson(base ?? '{}');
  const despues = objetoJson(cabeza);
  if (antes === undefined || despues === undefined) return 'deja un fichero que no es un objeto JSON';
  const cambiadas = [...new Set([...Object.keys(antes), ...Object.keys(despues)])].filter(
    (clave) => !CLAVES_DE_IMPL.has(clave) && !isDeepStrictEqual(antes[clave], despues[clave]),
  );
  if (cambiadas.length > 0) return `cambia ${cambiadas.join(', ')}`;
  if (!soloAnade(antes['areas_cerradas'], despues['areas_cerradas'])) return 'quita o cambia áreas de areas_cerradas';
  if (!soloQuita(antes['escenarios_en_rojo'], despues['escenarios_en_rojo'])) {
    return 'añade o cambia entradas de escenarios_en_rojo';
  }
  return undefined;
}

const CLAVES_DE_IMPL = new Set(['areas_cerradas', 'escenarios_en_rojo']);

/** ¿Sigue en la lista `despues` cada elemento de `antes`? Una lista que no existe es vacía. */
function soloAnade(antes: unknown, despues: unknown): boolean {
  const deAntes = lista(antes);
  const deDespues = lista(despues);
  if (deAntes === undefined || deDespues === undefined) return false;
  return deAntes.every((elemento) => deDespues.includes(elemento));
}

/** ¿Tiene `despues` solo áreas de `antes`, cada una con una parte de sus IDs? Un objeto que no existe es vacío. */
function soloQuita(antes: unknown, despues: unknown): boolean {
  const deAntes = objeto(antes);
  const deDespues = objeto(despues);
  if (deAntes === undefined || deDespues === undefined) return false;
  return Object.entries(deDespues).every(
    ([area, ids]) => Object.hasOwn(deAntes, area) && soloAnade(ids, deAntes[area]),
  );
}

function lista(valor: unknown): readonly unknown[] | undefined {
  if (valor === undefined) return [];
  return Array.isArray(valor) ? (valor as unknown[]) : undefined;
}

function objeto(valor: unknown): Readonly<Record<string, unknown>> | undefined {
  if (valor === undefined) return {};
  const esObjeto = typeof valor === 'object' && valor !== null && !Array.isArray(valor);
  return esObjeto ? (valor as Record<string, unknown>) : undefined;
}

function objetoJson(texto: string): Readonly<Record<string, unknown>> | undefined {
  try {
    return objeto(JSON.parse(texto));
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// El job «rutas» de la CI
// ---------------------------------------------------------------------------

/** La fase de la rama, del principio de su nombre (<fase>/<ÁREA>/<carril>, comun/ramas.ts). */
function faseDeLaRama(rama: string): Fase | undefined {
  const [, fase] = /^(impl|specs|aceptacion)\//.exec(rama) ?? [];
  return fase as Fase | undefined;
}

/** git en el directorio actual, el checkout de la CI. Lanza si falla. */
function git(argumentos: readonly string[]): string {
  const { status, stdout, stderr } = spawnSync('git', argumentos, { encoding: 'utf8' });
  if (status !== 0) throw new Error(`git ${argumentos[0] ?? ''} ha fallado:\n${stderr}`);
  return stdout;
}

/** El texto de config/alcance.json en `commit`, o undefined si no existe. */
function alcanceEn(commit: string): string | undefined {
  const { status, stdout } = spawnSync('git', ['show', `${commit}:${RUTA_ALCANCE}`], { encoding: 'utf8' });
  return status === 0 ? stdout : undefined;
}

/** Una línea por cada fichero que el PR cambia y su fase no puede tocar. */
function problemasDelPr(fase: Fase, base: string, cabeza: string): string[] {
  // Desde el punto en que la rama sale de la base: lo que main haya recibido después no es del PR.
  const origen = git(['merge-base', base, cabeza]).trim();
  // --no-renames: un renombrado es una baja y una alta, y se comprueban las dos rutas.
  const rutas = git(['diff', '--name-only', '--no-renames', '-z', origen, cabeza])
    .split('\0')
    .filter((ruta) => ruta !== '');
  const problemas = rutas.flatMap((ruta) => {
    const motivo = motivoRutaDeOtraFase(fase, ruta);
    return motivo === undefined ? [] : [`${ruta}: ${motivo}.`];
  });
  if (!rutas.includes(RUTA_ALCANCE)) return problemas;
  const alcance = problemaDeAlcance(fase, alcanceEn(origen), alcanceEn(cabeza));
  return alcance === undefined ? problemas : [...problemas, `${RUTA_ALCANCE}: ${alcance}.`];
}

function principal(): number {
  const argumentos = process.argv.slice(2);
  const [rama = '', base = '', cabeza = ''] = argumentos;
  if (argumentos.length !== 3) {
    console.error('Uso: node scripts/arnes/rutas-fase.ts <rama> <base> <cabeza>');
    return 1;
  }
  const fase = faseDeLaRama(rama);
  if (fase === undefined) {
    console.error(`La rama «${rama}» no empieza por impl/, specs/ ni aceptacion/: no se sabe su fase.`);
    return 1;
  }
  const problemas = problemasDelPr(fase, base, cabeza);
  if (problemas.length === 0) {
    console.log(`${rama}: el PR solo toca lo que puede tocar la fase ${fase}.`);
    return 0;
  }
  const lineas = problemas.map((problema) => `  - ${problema}`).join('\n');
  console.error(`${rama}: el PR toca lo que la fase ${fase} no puede tocar. Llévalo a un PR de su fase:\n${lineas}`);
  return 1;
}

// Solo al ejecutarlo: comun/guardia.ts lo importa por la tabla.
if (import.meta.main) process.exitCode = principal();

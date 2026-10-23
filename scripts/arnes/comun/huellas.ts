// Huellas de los ficheros protegidos alrededor de cada comando Bash (hook vigilar-huellas.ts).
//
// La guardia de Bash no adivina por el texto del comando qué ficheros toca: mira el efecto.
// Antes del comando se guarda la suma de cada fichero protegido y una copia de su contenido.
// Después se vuelven a calcular. Lo que el comando haya cambiado, borrado o creado vuelve a
// como estaba, y la versión que dejó el comando se aparta en reports/huellas/ para el dueño.
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { RUTA_AJUSTES_LOCALES } from './ajustes-locales.ts';
import { git } from './git.ts';
import { RUTA_SUMAS } from './protegidas.ts';
import type { EntradaProtegida, Fase } from './protegidas.ts';
import { calcularSumas, compararSumas, ficherosVigilados, parsearSumas, serializarSumas, sha256 } from './sumas.ts';
import type { Diferencia, Sumas } from './sumas.ts';

const DIRECTORIO_APARTADOS = 'reports/huellas';

const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

export interface Vigilancia {
  readonly raiz: string;
  /** Directorio con las huellas pendientes y las copias (almacenDeHuellas). */
  readonly almacen: string;
  /** tool_use_id del comando: une las huellas de antes con la comprobación de después. */
  readonly idComando: string;
}

interface Restauracion {
  readonly diferencias: readonly Diferencia[];
  /** Directorio, relativo a la raíz, con las versiones que dejó el comando. */
  readonly apartados: string;
}

/**
 * .git/arnes-huellas/. Claude no puede nombrar .git/ (guardia.ts), así que no puede tocar
 * las copias con las que se restaura; y queda fuera del árbol de trabajo.
 */
export function almacenDeHuellas(raiz: string): string {
  const { codigo, salida } = git(raiz, ['rev-parse', '--git-path', 'arnes-huellas']);
  if (codigo !== 0) throw new Error('git rev-parse ha fallado. ¿Estás dentro del repositorio?');
  return path.resolve(raiz, salida.trim());
}

/**
 * Los ficheros que vigila integridad en esta fase, más el fichero de sumas y los ajustes
 * locales: git no ve estos últimos, pero guardan la fase de la próxima conversación.
 */
export function ficherosConHuella(raiz: string, entradas: readonly EntradaProtegida[], fase: Fase): string[] {
  return [...new Set([...ficherosVigilados(raiz, entradas, fase), RUTA_SUMAS, RUTA_AJUSTES_LOCALES])].sort();
}

/** Antes del comando: guarda la suma de cada fichero y una copia de su contenido. */
export function tomarHuellas(vigilancia: Vigilancia, rutas: readonly string[], ahora: Date): void {
  borrarHuellasViejas(vigilancia.almacen, ahora);
  const sumas = new Map<string, string>();
  for (const ruta of rutas) {
    const absoluta = path.join(vigilancia.raiz, ruta);
    if (!existsSync(absoluta)) continue;
    // Se lee una sola vez, para que la copia y su suma salgan del mismo contenido.
    const contenido = readFileSync(absoluta);
    const suma = sha256(contenido);
    // Cada copia se llama como su suma: un contenido ya guardado no se vuelve a copiar.
    const copia = rutaCopia(vigilancia, suma);
    if (!existsSync(copia)) escribirEntero(copia, contenido);
    sumas.set(ruta, suma);
  }
  escribirEntero(rutaHuellas(vigilancia), serializarSumas(sumas));
}

/**
 * Después del comando: devuelve a como estaba lo que el comando haya cambiado, borrado o
 * creado. undefined si no hay huellas de antes.
 */
export function restaurarCambios(
  vigilancia: Vigilancia,
  rutas: readonly string[],
  ahora: Date,
): Restauracion | undefined {
  const huellas = rutaHuellas(vigilancia);
  if (!existsSync(huellas)) return undefined;
  const antes = parsearSumas(readFileSync(huellas, 'utf8'));
  rmSync(huellas, { force: true });
  const despues = calcularSumas(vigilancia.raiz, [...new Set([...antes.keys(), ...rutas])]);
  const diferencias = compararSumas(antes, despues).filter((diferencia) =>
    cuentaComoCambio(vigilancia, antes, diferencia),
  );
  const apartados = path.posix.join(DIRECTORIO_APARTADOS, `${marcaDeTiempo(ahora)}-${vigilancia.idComando}`);
  for (const { ruta } of diferencias) {
    apartar(vigilancia.raiz, ruta, apartados);
    restaurar(vigilancia, ruta, antes.get(ruta));
  }
  return { diferencias, apartados };
}

const QUE_SE_HA_HECHO = {
  cambiado: 'lo cambió el comando y ha vuelto a como estaba',
  falta: 'lo borró el comando y ha vuelto a su sitio',
  'sin-suma': 'lo creó el comando dentro de una ruta protegida y se ha quitado',
} as const;

export function describirRestauracion(restauracion: Restauracion): string {
  const lineas = restauracion.diferencias.map(({ ruta, tipo }) => `  - ${ruta}: ${QUE_SE_HA_HECHO[tipo]}.`);
  const dejoAlgo = restauracion.diferencias.some(({ tipo }) => tipo !== 'falta');
  const dondeEsta = dejoAlgo ? `\nLa versión que dejó el comando está en ${restauracion.apartados}/.` : '';
  return `El comando ha tocado rutas protegidas (.claude/protegidas.txt):\n${lineas.join('\n')}${dondeEsta}`;
}

/**
 * Claude Code guarda en los ajustes locales los permisos que el dueño acepta («Allow always»),
 * a veces mientras corre un comando. Ese cambio es legítimo: en ese fichero solo cuenta lo
 * que toca al arnés (la fase, en env, los hooks y disableAllHooks).
 */
function cuentaComoCambio(vigilancia: Vigilancia, antes: Sumas, diferencia: Diferencia): boolean {
  if (diferencia.ruta !== RUTA_AJUSTES_LOCALES) return true;
  const sumaAntes = antes.get(diferencia.ruta);
  const textoAntes = sumaAntes === undefined ? undefined : readFileSync(rutaCopia(vigilancia, sumaAntes), 'utf8');
  const absoluta = path.join(vigilancia.raiz, diferencia.ruta);
  const textoDespues = existsSync(absoluta) ? readFileSync(absoluta, 'utf8') : undefined;
  return loQueTocaAlArnes(textoAntes) !== loQueTocaAlArnes(textoDespues);
}

/** Las claves de los ajustes que tocan al arnés, como texto comparable. */
function loQueTocaAlArnes(textoAjustes: string | undefined): string {
  try {
    const ajustes = JSON.parse(textoAjustes ?? '{}') as Record<string, unknown>;
    return JSON.stringify([ajustes['env'], ajustes['hooks'], ajustes['disableAllHooks']]);
  } catch {
    // Si no es JSON válido, cuenta cualquier cambio del texto.
    return textoAjustes ?? '';
  }
}

/** Guarda en reports/huellas/ la versión que dejó el comando, si dejó alguna. */
function apartar(raiz: string, ruta: string, apartados: string): void {
  const absoluta = path.join(raiz, ruta);
  if (!existsSync(absoluta)) return;
  const destino = path.join(raiz, apartados, ruta);
  mkdirSync(path.dirname(destino), { recursive: true });
  copyFileSync(absoluta, destino);
}

/** Pone la copia de antes. Si el fichero no existía antes del comando, lo quita. */
function restaurar(vigilancia: Vigilancia, ruta: string, sumaAntes: string | undefined): void {
  const absoluta = path.join(vigilancia.raiz, ruta);
  // Se borra antes de copiar: si el comando dejó un enlace simbólico, copiar escribiría en su destino.
  rmSync(absoluta, { force: true });
  if (sumaAntes === undefined) return;
  mkdirSync(path.dirname(absoluta), { recursive: true });
  copyFileSync(rutaCopia(vigilancia, sumaAntes), absoluta);
}

/** Si un comando no llega a ejecutarse (lo deniega otro hook o el dueño), sus huellas se quedan. */
function borrarHuellasViejas(almacen: string, ahora: Date): void {
  const directorio = path.join(almacen, 'pendientes');
  if (!existsSync(directorio)) return;
  for (const nombre of readdirSync(directorio)) {
    const ruta = path.join(directorio, nombre);
    const info = statSync(ruta, { throwIfNoEntry: false });
    if (info !== undefined && ahora.getTime() - info.mtimeMs > MILISEGUNDOS_POR_DIA) rmSync(ruta, { force: true });
  }
}

/** Escribe en un temporal y lo renombra: si el hook se corta a medias, no queda un fichero partido. */
function escribirEntero(ruta: string, contenido: string | Buffer): void {
  mkdirSync(path.dirname(ruta), { recursive: true });
  const temporal = `${ruta}.${String(process.pid)}.tmp`;
  writeFileSync(temporal, contenido);
  renameSync(temporal, ruta);
}

function rutaHuellas(vigilancia: Vigilancia): string {
  if (!/^[\w-]+$/.test(vigilancia.idComando)) {
    throw new Error(`El tool_use_id «${vigilancia.idComando}» no sirve como nombre de fichero.`);
  }
  return path.join(vigilancia.almacen, 'pendientes', `${vigilancia.idComando}.sha256`);
}

function rutaCopia(vigilancia: Vigilancia, suma: string): string {
  return path.join(vigilancia.almacen, 'copias', suma);
}

/**
 * 2026-10-24T10:15:30.123Z → 2026-10-24T10-15-30Z: hora UTC (la «Z» lo recuerda) y sin «:»,
 * que no se admite en los nombres de fichero de algunos sistemas.
 */
function marcaDeTiempo(ahora: Date): string {
  return ahora
    .toISOString()
    .replace(/\.\d+Z$/, 'Z')
    .replaceAll(':', '-');
}

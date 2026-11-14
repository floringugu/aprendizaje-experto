// Las reglas del Despachador (docs/plan.md §6, «Noche desatendida»): qué hace cuando termina una
// sesión de «claude -p» en el carril de un ticket. Aquí solo hay funciones puras: lo que se observa
// (el stream de la sesión, el registro de paradas del carril y GitHub) lo reúne
// scripts/arnes/despachador.ts, que también ejecuta lo que estas reglas deciden.
//
// El código de salida de «claude -p» no dice nada (es 0 también cuando lo cortan), y el «subtype»
// del resultado tampoco (sigue en «success» tras un corte de red): se decide con la parada que anotó
// el hook Stop, con el PR de la rama según GitHub y con «is_error» del resultado.

export const MAXIMO_DE_RELEVOS = 4;
export const MAXIMO_DE_REANUDACIONES = 2;

/** Las paradas del hook Stop (registro-stop.ts) que tienen regla. «espera» no: el proceso no sale. */
export const PARADAS_DE_SESION = ['relevo', 'decision', 'con-cambios', 'sin-cambios'] as const;
export type ParadaDeSesion = (typeof PARADAS_DE_SESION)[number];

export interface PrDelCarril {
  readonly numero: number;
  readonly estado: 'abierto' | 'fusionado' | 'cerrado';
  /** De sus comprobaciones, ya esperadas: «pendiente» si no terminaron a tiempo. */
  readonly ci: 'verde' | 'rojo' | 'pendiente';
}

/** Lo que se sabe cuando termina una sesión. */
export interface Observacion {
  /** La última parada que anotó el hook Stop para la sesión; undefined si no anotó ninguna con regla. */
  readonly parada: ParadaDeSesion | undefined;
  /** El PR de la rama del carril, si lo tiene. */
  readonly pr: PrDelCarril | undefined;
  /** El texto del error si el resultado de la sesión trae «is_error» (corte de red, límite agotado…). */
  readonly error: string | undefined;
  /** Cuándo se reinicia el límite de uso, si la sesión terminó porque se agotó. */
  readonly reinicioDelLimite: Date | undefined;
  /** Relevos y reanudaciones que ya lleva el ticket esta noche. */
  readonly relevos: number;
  readonly reanudaciones: number;
  readonly ahora: Date;
  /** El final de la ventana: después no se lanza ni se reanuda ninguna sesión. */
  readonly fin: Date;
}

export type Accion =
  /** GitHub ha fusionado el PR: se retira el carril y se pasa al ticket siguiente. */
  | { readonly tipo: 'hecho'; readonly pr: number }
  /** Tras un relevo: otra sesión en el mismo carril, que empieza por leerlo. */
  | { readonly tipo: 'sesion-nueva' }
  /** La misma sesión, con «--resume» y «sigue». */
  | { readonly tipo: 'reanudar' }
  /** Límite agotado que se reinicia dentro de la ventana: se espera y se reanuda. */
  | { readonly tipo: 'esperar'; readonly hasta: Date }
  /** El ticket queda para el dueño, con su carril abierto, y se pasa al siguiente. */
  | { readonly tipo: 'cola'; readonly motivo: string }
  /** El ticket queda en la cola y la noche termina: el siguiente acabaría igual. */
  | { readonly tipo: 'fin'; readonly motivo: string };

/**
 * La regla que toca, por este orden: PR fusionado; límite agotado; otro error de la sesión; la parada
 * anotada (relevo, decisión, cambios sin commitear); el PR abierto o cerrado, y, sin PR ni cambios,
 * reanudar. Lo que no casa con ninguna va a la cola.
 */
export function queHacer(observacion: Observacion): Accion {
  const { pr, parada } = observacion;
  if (pr?.estado === 'fusionado') return { tipo: 'hecho', pr: pr.numero };
  const porError = accionPorError(observacion);
  if (porError !== undefined) return porError;
  if (parada === 'relevo') return trasUnRelevo(observacion);
  if (parada === 'decision') return cola('paró con una decisión pendiente');
  if (parada === 'con-cambios') return cola('paró con cambios sin commitear');
  if (pr !== undefined) return cola(motivoDelPr(pr));
  if (parada === 'sin-cambios') return sinCambiosNiPr(observacion);
  return cola('la sesión terminó sin que el hook Stop anotara su parada, y sin PR');
}

function cola(motivo: string): Accion {
  return { tipo: 'cola', motivo };
}

/** Con el límite agotado se espera si se reinicia antes del final de la ventana. Cualquier otro error termina la noche. */
function accionPorError({ error, reinicioDelLimite, fin }: Observacion): Accion | undefined {
  if (reinicioDelLimite !== undefined) {
    if (reinicioDelLimite < fin) return { tipo: 'esperar', hasta: reinicioDelLimite };
    return { tipo: 'fin', motivo: 'se agotó el límite de uso y no se reinicia dentro de la ventana' };
  }
  if (error !== undefined) return { tipo: 'fin', motivo: `la sesión terminó con un error: ${error}` };
  return undefined;
}

function trasUnRelevo({ relevos, ahora, fin }: Observacion): Accion {
  if (relevos >= MAXIMO_DE_RELEVOS)
    return cola(`pasó ${String(relevos + 1)} relevos, más de ${String(MAXIMO_DE_RELEVOS)}`);
  if (ahora >= fin) return cola('pasó un relevo con la ventana ya cerrada');
  return { tipo: 'sesion-nueva' };
}

function sinCambiosNiPr({ reanudaciones, ahora, fin }: Observacion): Accion {
  if (reanudaciones >= MAXIMO_DE_REANUDACIONES) {
    return cola(`paró sin cambios ni PR, también tras reanudarla ${String(reanudaciones)} veces`);
  }
  if (ahora >= fin) return cola('paró sin cambios ni PR con la ventana ya cerrada');
  return { tipo: 'reanudar' };
}

function motivoDelPr({ numero, estado, ci }: PrDelCarril): string {
  const pr = `el PR #${String(numero)}`;
  if (estado === 'cerrado') return `${pr} está cerrado sin fusionar`;
  if (ci === 'rojo') return `${pr} tiene la CI en rojo`;
  if (ci === 'pendiente') return `${pr} sigue con la CI sin terminar`;
  return `${pr} tiene la CI en verde y espera tu visto bueno`;
}

// ---------------------------------------------------------------------------
// La ventana
// ---------------------------------------------------------------------------

export interface Ventana {
  /** Después no se abre ningún ticket nuevo. */
  readonly ultimoTicket: Date;
  /** Después no se lanza ni se reanuda ninguna sesión. */
  readonly fin: Date;
}

/**
 * La ventana de una noche que empieza en `inicio`, con las horas «HH:MM» de su final y de su último
 * ticket: cada una es la próxima vez que el reloj la marca. Si la del último ticket cae después del
 * final es que ya pasó, y no se abre ninguno. undefined si una hora está mal escrita.
 */
export function ventanaDesde(inicio: Date, horaDelFin: string, horaDelUltimo: string): Ventana | undefined {
  const fin = proximaVez(inicio, horaDelFin);
  const ultimo = proximaVez(inicio, horaDelUltimo);
  if (fin === undefined || ultimo === undefined) return undefined;
  return { fin, ultimoTicket: ultimo > fin ? inicio : ultimo };
}

function proximaVez(desde: Date, hora: string): Date | undefined {
  const partes = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hora);
  if (partes === null) return undefined;
  const vez = new Date(desde);
  vez.setHours(Number(partes[1]), Number(partes[2]), 0, 0);
  if (vez <= desde) vez.setDate(vez.getDate() + 1);
  return vez;
}

// ---------------------------------------------------------------------------
// El stream de la sesión («claude -p --output-format stream-json --verbose»)
// ---------------------------------------------------------------------------

export interface LecturaDelStream {
  /** El session_id, para buscar su parada en el registro y para «--resume». */
  readonly sesion: string | undefined;
  /** El texto del último error, si el resultado trae «is_error». */
  readonly error: string | undefined;
  /** Cuándo se reinicia el límite, si la sesión acabó con error y con una ventana de uso rechazada. */
  readonly reinicioDelLimite: Date | undefined;
}

type Evento = Readonly<Record<string, unknown>>;

/**
 * Lee el stream guardado, una línea por evento, con o sin la hora delante. El error sale del evento
 * «result» («is_error»; su «subtype» no vale) y su texto, del «api_error» del último «assistant».
 * El límite agotado está sin medir (plan §5): se supone que el último «rate_limit_event» trae una
 * ventana con «status: rejected», y su «resetsAt» (epoch en segundos) dice cuándo se reinicia.
 */
export function leerStream(texto: string): LecturaDelStream {
  const eventos = texto.split('\n').flatMap(eventoDeLaLinea);
  const sesion = eventos.map((evento) => evento['session_id']).find((id) => typeof id === 'string');
  const resultado = eventos.findLast((evento) => evento['type'] === 'result');
  if (resultado?.['is_error'] !== true) return { sesion, error: undefined, reinicioDelLimite: undefined };
  const conError = eventos.findLast((evento) => typeof evento['api_error'] === 'string');
  const error = typeof conError?.['api_error'] === 'string' ? conError['api_error'] : 'is_error';
  const limite = eventos.findLast((evento) => evento['type'] === 'rate_limit_event');
  return { sesion, error, reinicioDelLimite: reinicioDe(limite) };
}

function eventoDeLaLinea(linea: string): Evento[] {
  const inicio = linea.indexOf('{');
  if (inicio === -1) return [];
  try {
    const valor = JSON.parse(linea.slice(inicio)) as unknown;
    return typeof valor === 'object' && valor !== null ? [valor as Evento] : [];
  } catch {
    // Una línea cortada (la sesión murió a medias) no impide leer las demás.
    return [];
  }
}

/** El reinicio más tardío de las ventanas rechazadas del evento, o undefined si no rechaza ninguna. */
function reinicioDe(evento: Evento | undefined): Date | undefined {
  const info = evento?.['rate_limit_info'] as { unifiedWindows?: Record<string, unknown> } | undefined;
  const reinicios = Object.values(info?.unifiedWindows ?? {}).flatMap((ventana) => {
    const { status, resetsAt } = ventana as { status?: unknown; resetsAt?: unknown };
    return status === 'rejected' && typeof resetsAt === 'number' ? [resetsAt] : [];
  });
  return reinicios.length === 0 ? undefined : new Date(Math.max(...reinicios) * 1000);
}

// ---------------------------------------------------------------------------
// El PR según GitHub («gh pr list --json number,state,autoMergeRequest,statusCheckRollup»)
// ---------------------------------------------------------------------------

export interface PrSegunGitHub extends PrDelCarril {
  /** Tiene activada la fusión automática: con la CI en verde, GitHub lo fusiona solo. */
  readonly fusionAutomatica: boolean;
}

const ESTADOS_DE_PR = { OPEN: 'abierto', MERGED: 'fusionado', CLOSED: 'cerrado' } as const;
const VERDES = ['SUCCESS', 'NEUTRAL', 'SKIPPED'];
const SIN_TERMINAR = ['PENDING', 'EXPECTED', 'QUEUED', 'IN_PROGRESS', 'WAITING', 'REQUESTED'];

/** El PR de una entrada de la lista de gh, o undefined si no tiene la forma esperada. */
export function leerPr(valor: unknown): PrSegunGitHub | undefined {
  if (typeof valor !== 'object' || valor === null) return undefined;
  const { number: numero, state, autoMergeRequest, statusCheckRollup } = valor as Record<string, unknown>;
  const estado = typeof state === 'string' ? ESTADOS_DE_PR[state as keyof typeof ESTADOS_DE_PR] : undefined;
  if (typeof numero !== 'number' || estado === undefined) return undefined;
  const comprobaciones = Array.isArray(statusCheckRollup) ? (statusCheckRollup as unknown[]) : [];
  const fusionAutomatica = autoMergeRequest !== null && autoMergeRequest !== undefined;
  return { numero, estado, ci: ciDe(comprobaciones), fusionAutomatica };
}

/**
 * Rojo si alguna comprobación ha terminado mal; si no, pendiente mientras falte alguna por terminar
 * o GitHub aún no haya creado ninguna; si no, verde. Una comprobación de Actions trae «status» y
 * «conclusion»; un estado de commit, solo «state».
 */
function ciDe(comprobaciones: readonly unknown[]): PrDelCarril['ci'] {
  const resultados = comprobaciones.map((comprobacion) => {
    const { status, conclusion, state } = comprobacion as Record<string, unknown>;
    if (typeof state === 'string') return state;
    return status === 'COMPLETED' && typeof conclusion === 'string' ? conclusion : 'PENDING';
  });
  if (resultados.some((resultado) => !VERDES.includes(resultado) && !SIN_TERMINAR.includes(resultado))) return 'rojo';
  if (resultados.length === 0 || resultados.some((resultado) => SIN_TERMINAR.includes(resultado))) return 'pendiente';
  return 'verde';
}

/** ¿Hay que seguir esperando a GitHub? Mientras la CI no termine, o esté en verde y el PR se vaya a fusionar solo. */
export function hayQueEsperarAlPr({ estado, ci, fusionAutomatica }: PrSegunGitHub): boolean {
  return estado === 'abierto' && (ci === 'pendiente' || (ci === 'verde' && fusionAutomatica));
}

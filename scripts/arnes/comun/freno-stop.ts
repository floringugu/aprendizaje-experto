// Mensaje del hook Stop cuando falla la comprobación de la fase (.claude/hooks/exigir-check.ts).
//
// El mensaje cambia según el fallo, para que Claude no se quede probando arreglos a ciegas:
//   - error del entorno (puerto ocupado, permisos, disco lleno, programa que no existe):
//     no es su código, así que no lo toca y para a preguntar;
//   - tercer bloqueo seguido del mismo paso: antes de seguir, escribe en una frase el
//     mecanismo del fallo, o para si la causa está en la especificación o en el entorno;
//   - cualquier otro fallo: el mensaje normal, «arregla la causa».
// También el del hook SubagentStop cuando el implementador no deja verde make check-implementador
// (.claude/hooks/exigir-check-implementador.ts).
// Separado de los hooks para poder probarlo con tests unitarios.
import { OBJETIVO_DEL_IMPLEMENTADOR } from './fases.ts';

export const MARCA_DECISION_PENDIENTE = '[DECISIÓN PENDIENTE]';

/** A partir de este bloqueo seguido del mismo paso, Claude tiene que escribir el mecanismo del fallo. */
export const BLOQUEOS_PARA_FRENAR = 3;

const LINEAS_DE_SALIDA = 150;

export interface ErrorDeEntorno {
  /** Código corto que se guarda en el registro: EADDRINUSE, EACCES, ENOSPC o COMANDO. */
  readonly codigo: string;
  readonly explicacion: string;
}

// Se reconocen por el texto de la salida. Un test que imprima uno de estos códigos a
// propósito daría un falso aviso; es raro, y el aviso solo pide parar y preguntar.
const ERRORES_DE_ENTORNO: readonly (ErrorDeEntorno & { readonly patron: RegExp })[] = [
  {
    codigo: 'EADDRINUSE',
    patron: /\bEADDRINUSE\b/,
    explicacion: 'un puerto de red ya está en uso, seguramente por otro proceso que se quedó abierto',
  },
  { codigo: 'EACCES', patron: /\bEACCES\b/, explicacion: 'falta un permiso para leer, escribir o ejecutar algo' },
  {
    codigo: 'ENOSPC',
    patron: /\bENOSPC\b/,
    explicacion: 'no queda espacio en el disco, o el sistema ha llegado a su límite de ficheros vigilados',
  },
  {
    codigo: 'COMANDO',
    // bash dice «command not found»; dash, «sh: 1: <programa>: not found».
    patron: /command not found|^sh: \d+: \S+: not found$/m,
    explicacion: 'falta un programa en el sistema',
  },
];

/** Paso de make que ha fallado, según la línea «✗ Falla el paso «…».» del Makefile. */
export function pasoQueFalla(salida: string): string {
  return /✗ Falla el paso «([^»]+)»/.exec(salida)?.[1] ?? 'desconocido';
}

export function errorDeEntorno(salida: string): ErrorDeEntorno | undefined {
  const encontrado = ERRORES_DE_ENTORNO.find(({ patron }) => patron.test(salida));
  if (encontrado === undefined) return undefined;
  return { codigo: encontrado.codigo, explicacion: encontrado.explicacion };
}

export interface Fallo {
  /** Objetivo de make que se ha ejecutado: check, check-specs o check-aceptacion. */
  readonly objetivo: string;
  readonly paso: string;
  readonly entorno: ErrorDeEntorno | undefined;
  /** Bloqueos seguidos del mismo paso en esta conversación, contando este. */
  readonly bloqueosSeguidos: number;
  /** Salida completa de make. */
  readonly salida: string;
}

export function motivoDeBloqueo(fallo: Fallo): string {
  return `${instruccion(fallo)}\n\nÚltimas líneas de make ${fallo.objetivo}:\n\n${ultimasLineas(fallo.salida)}`;
}

function ultimasLineas(salida: string): string {
  return salida.trimEnd().split('\n').slice(-LINEAS_DE_SALIDA).join('\n');
}

function instruccion(fallo: Fallo): string {
  if (fallo.entorno !== undefined) return instruccionEntorno(fallo.objetivo, fallo.entorno);
  if (fallo.bloqueosSeguidos >= BLOQUEOS_PARA_FRENAR) return instruccionFreno(fallo);
  return (
    `make ${fallo.objetivo} falla en el paso «${fallo.paso}» y no puedes terminar hasta que pase. ` +
    'Arregla la causa, no la comprobación (un cambio en el arnés espera al visto bueno del dueño). ' +
    'Si necesitas una decisión del dueño (un escenario o un parámetro que parece incorrecto, una dependencia nueva…), ' +
    `explícala y termina tu mensaje con ${MARCA_DECISION_PENDIENTE}.`
  );
}

function instruccionEntorno(objetivo: string, entorno: ErrorDeEntorno): string {
  return (
    `make ${objetivo} falla por un problema del entorno (${entorno.codigo}): ${entorno.explicacion}. ` +
    'No es tu código: no lo toques, ni los tests, para esquivarlo. Explícale al dueño qué has visto, ' +
    `dale el comando exacto que lo arreglaría si lo sabes, y para con ${MARCA_DECISION_PENDIENTE}.`
  );
}

function instruccionFreno(fallo: Fallo): string {
  return (
    `Es el bloqueo n.º ${String(fallo.bloqueosSeguidos)} seguido del paso «${fallo.paso}» en esta conversación. ` +
    'Deja de probar arreglos. Antes de cambiar nada más, escribe en una sola frase el mecanismo exacto del fallo: ' +
    'qué valor o estado llega, de dónde sale y por qué no es el que se espera. ' +
    'Si la causa está en tu código, arréglala a partir de esa frase. Si está en la especificación (un escenario, ' +
    'un step o un parámetro), en el arnés o en el entorno, no es tu código: explícaselo al dueño, dale los comandos ' +
    `que tendría que ejecutar y para con ${MARCA_DECISION_PENDIENTE}.`
  );
}

// ---------------------------------------------------------------------------
// Hook SubagentStop del implementador
// ---------------------------------------------------------------------------

export interface FalloDelImplementador {
  readonly paso: string;
  readonly entorno: ErrorDeEntorno | undefined;
  /** Salida completa de make. */
  readonly salida: string;
}

export function motivoDeBloqueoDelImplementador(fallo: FalloDelImplementador): string {
  return (
    `${instruccionAlImplementador(fallo)}\n\n` +
    `Últimas líneas de make ${OBJETIVO_DEL_IMPLEMENTADOR}:\n\n${ultimasLineas(fallo.salida)}`
  );
}

/**
 * El hook SubagentStop bloquea al implementador una sola vez: si ya está continuando por un bloqueo
 * (stop_hook_active), le deja devolver el encargo en rojo (exigir-check-implementador.ts).
 */
function instruccionAlImplementador(fallo: FalloDelImplementador): string {
  if (fallo.entorno !== undefined) {
    return (
      `make ${OBJETIVO_DEL_IMPLEMENTADOR} falla por un problema del entorno (${fallo.entorno.codigo}): ` +
      `${fallo.entorno.explicacion}. No es tu código: no lo toques. Devuelve el encargo con lo que has visto ` +
      `y termina con ${MARCA_DECISION_PENDIENTE}.`
    );
  }
  return (
    `make ${OBJETIVO_DEL_IMPLEMENTADOR} falla en el paso «${fallo.paso}» y no puedes devolver el encargo ` +
    'hasta que pase. Arregla la causa en los ficheros de tu encargo, no la comprobación. Si la causa está ' +
    'fuera de ellos, en las firmas o en la especificación, explícalo y termina con ' +
    `${MARCA_DECISION_PENDIENTE}. Es tu único intento: antes de cambiar nada, escribe en una sola frase el ` +
    'mecanismo exacto del fallo. Si aun así sigue fallando, devuelve el encargo en ROJO con esa frase.'
  );
}

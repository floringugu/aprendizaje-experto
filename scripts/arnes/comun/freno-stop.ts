// Mensaje del hook Stop cuando falla la comprobación de la fase (.claude/hooks/exigir-check.ts).
//
// El mensaje cambia según el fallo, para que Claude no se quede probando arreglos a ciegas:
//   - error del entorno (puerto ocupado, permisos, disco lleno, programa que no existe):
//     no es su código, así que no lo toca y para a preguntar;
//   - falla «integridad»: las sumas son cosa del dueño, así que para y le da los comandos;
//   - tercer bloqueo seguido del mismo paso: antes de seguir, escribe en una frase el
//     mecanismo del fallo, o para si la causa está en la especificación o en el entorno;
//   - cualquier otro fallo: el mensaje normal, «arregla la causa».
// Separado del hook para poder probarlo con tests unitarios.

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
  const ultimas = fallo.salida.trimEnd().split('\n').slice(-LINEAS_DE_SALIDA).join('\n');
  return `${instruccion(fallo)}\n\nÚltimas líneas de make ${fallo.objetivo}:\n\n${ultimas}`;
}

function instruccion(fallo: Fallo): string {
  if (fallo.entorno !== undefined) return instruccionEntorno(fallo.objetivo, fallo.entorno);
  if (fallo.paso === 'integridad') return INSTRUCCION_INTEGRIDAD;
  if (fallo.bloqueosSeguidos >= BLOQUEOS_PARA_FRENAR) return instruccionFreno(fallo);
  return (
    `make ${fallo.objetivo} falla en el paso «${fallo.paso}» y no puedes terminar hasta que pase. ` +
    'Arregla la causa, no la comprobación (los ficheros del arnés están protegidos). ' +
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

const INSTRUCCION_INTEGRIDAD =
  'Falla el paso «integridad»: un fichero protegido no coincide con sus sumas, o las sumas no coinciden ' +
  'con las del último commit. No es tu código: las sumas solo las actualiza el dueño. No toques nada para ' +
  'esquivarlo. Dale los comandos exactos que lo arreglan (la salida de abajo dice qué ha cambiado; ' +
  `normalmente «make sumas», un commit con las sumas y después «make check») y para con ${MARCA_DECISION_PENDIENTE}.`;

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

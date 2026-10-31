// Lógica de los hooks que exigen una comprobación en verde (docs/plan.md §5):
//   - exigir-check-push.ts (PreToolUse en Bash): Claude no sube trabajo a GitHub (git push, gh pr create)
//     mientras falle la comprobación de su fase (make check, make check-specs o make check-aceptacion);
//   - exigir-check-implementador.ts (SubagentStop): el implementador no devuelve su encargo mientras
//     falle make check-implementador.
// Separada de los hooks para poder probarla con tests unitarios.
import { OBJETIVO_DEL_IMPLEMENTADOR } from './fases.ts';

export const MARCA_DECISION_PENDIENTE = '[DECISIÓN PENDIENTE]';

const LINEAS_DE_SALIDA = 150;

/**
 * ¿El comando de Bash sube trabajo a GitHub? Se mira el texto: `git -C <ruta> push` se escapa, y un
 * `echo "git push"` también pasa por la comprobación.
 */
export function subeAGitHub(comando: string): boolean {
  return /\bgit\s+push\b|\bgh\s+pr\s+create\b/.test(comando);
}

/** Paso de make que ha fallado, según la línea «✗ Falla el paso «…».» del Makefile. */
export function pasoQueFalla(salida: string): string {
  return /✗ Falla el paso «([^»]+)»/.exec(salida)?.[1] ?? 'desconocido';
}

export interface Fallo {
  /** Objetivo de make que se ha ejecutado: check, check-specs o check-aceptacion. */
  readonly objetivo: string;
  readonly paso: string;
  /** Salida completa de make. */
  readonly salida: string;
}

/** Lo que ve Claude cuando el hook le niega el git push o el gh pr create. */
export function motivoDeBloqueo({ objetivo, paso, salida }: Fallo): string {
  return (
    `make ${objetivo} falla en el paso «${paso}»: no puedes hacer git push ni gh pr create hasta que pase. ` +
    'Arregla la causa, no la comprobación (un cambio en el arnés espera al visto bueno del dueño). ' +
    'Si necesitas una decisión del dueño (un escenario o un parámetro que parece incorrecto, una dependencia nueva…), ' +
    `explícala y termina tu mensaje con ${MARCA_DECISION_PENDIENTE}.\n\n` +
    `Últimas líneas de make ${objetivo}:\n\n${ultimasLineas(salida)}`
  );
}

function ultimasLineas(salida: string): string {
  return salida.trimEnd().split('\n').slice(-LINEAS_DE_SALIDA).join('\n');
}

// ---------------------------------------------------------------------------
// Hook SubagentStop del implementador
// ---------------------------------------------------------------------------

export interface FalloDelImplementador {
  readonly paso: string;
  /** Salida completa de make. */
  readonly salida: string;
}

/**
 * El hook SubagentStop bloquea al implementador una sola vez: si ya está continuando por un bloqueo
 * (stop_hook_active), le deja devolver el encargo en rojo (exigir-check-implementador.ts).
 */
export function motivoDeBloqueoDelImplementador({ paso, salida }: FalloDelImplementador): string {
  return (
    `make ${OBJETIVO_DEL_IMPLEMENTADOR} falla en el paso «${paso}» y no puedes devolver el encargo ` +
    'hasta que pase. Arregla la causa en los ficheros de tu encargo, no la comprobación. Si la causa está ' +
    'fuera de ellos, en las firmas o en la especificación, explícalo y termina con ' +
    `${MARCA_DECISION_PENDIENTE}. Es tu único intento: antes de cambiar nada, escribe en una sola frase el ` +
    'mecanismo exacto del fallo. Si aun así sigue fallando, devuelve el encargo en ROJO con esa frase.\n\n' +
    `Últimas líneas de make ${OBJETIVO_DEL_IMPLEMENTADOR}:\n\n${ultimasLineas(salida)}`
  );
}

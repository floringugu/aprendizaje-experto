// Los objetivos de make que cambian la fase o el área, o abren o retiran un carril, los ejecuta el
// dueño. make rama, no: lo ejecuta la conversación del carril.
// Claude Code lanza los comandos sin terminal interactivo y con la variable CLAUDECODE.

/** Por qué este proceso no puede ejecutar la acción, o undefined si el dueño la lanza desde su terminal. */
export function motivoSiNoEsElDueno(accion: string): string | undefined {
  if (process.env['CLAUDECODE'] === undefined && process.stdin.isTTY) return undefined;
  return `${accion} solo lo hace el dueño, desde su terminal o con una tarea de VS Code (no desde Claude Code).`;
}

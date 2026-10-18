// Utilidades de entrada y salida para los hooks de Claude Code.
// Claude Code envía un JSON por stdin; los hooks responden con JSON por stdout.
import { text } from 'node:stream/consumers';

export async function leerEntradaHook(): Promise<unknown> {
  return JSON.parse(await text(process.stdin)) as unknown;
}

export function campo(objeto: unknown, nombre: string): unknown {
  if (typeof objeto !== 'object' || objeto === null) return undefined;
  return (objeto as Record<string, unknown>)[nombre];
}

export function campoTexto(objeto: unknown, nombre: string): string | undefined {
  const valor = campo(objeto, nombre);
  return typeof valor === 'string' ? valor : undefined;
}

export function responder(respuesta: Record<string, unknown>): void {
  process.stdout.write(JSON.stringify(respuesta));
}

/**
 * Ejecuta el hook. Si algo falla, sale con código 2: para Claude Code eso bloquea
 * la acción (fallar cerrado). Cualquier otro código dejaría pasar la acción.
 */
export function ejecutarHook(nombre: string, principal: () => Promise<void>): void {
  principal().catch((error: unknown) => {
    process.stderr.write(`El hook ${nombre} ha fallado y se trata como un bloqueo: ${String(error)}\n`);
    process.exit(2);
  });
}

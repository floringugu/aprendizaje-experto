// Ejecuta un objetivo del Makefile y recoge su salida. Lo usan los hooks que exigen una
// comprobación en verde: Stop (exigir-check.ts) y SubagentStop (exigir-check-implementador.ts).
import { spawnSync } from 'node:child_process';

// La salida de make check puede ser larga (los tests de aceptación); el límite por defecto se queda corto.
const BYTES_MAXIMOS_DE_SALIDA = 64 * 1024 * 1024;

export interface ResultadoDeMake {
  readonly verde: boolean;
  /** stdout y stderr juntos, en el orden en que salieron. */
  readonly salida: string;
}

export function ejecutarObjetivo(raiz: string, objetivo: string): ResultadoDeMake {
  const make = spawnSync('sh', ['-c', `make --no-print-directory ${objetivo} 2>&1`], {
    cwd: raiz,
    encoding: 'utf8',
    maxBuffer: BYTES_MAXIMOS_DE_SALIDA,
  });
  return { verde: make.status === 0, salida: make.stdout };
}

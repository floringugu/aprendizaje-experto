// make sumas: recalcula .claude/sumas.sha256. Solo lo ejecuta el dueño, a mano, desde su terminal.
//
// Se niega a ejecutarse dentro de Claude Code (variable CLAUDECODE) o sin un terminal
// interactivo, que es como Claude Code lanza los comandos. No es infalible: por eso
// la integridad compara además las sumas con el último commit (scripts/arnes/integridad.ts).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { leerProtegidas, RUTA_SUMAS } from './comun/protegidas.ts';
import { RAIZ } from './comun/raiz.ts';
import {
  calcularSumas,
  compararSumas,
  describirDiferencia,
  ficherosVigilados,
  parsearSumas,
  serializarSumas,
} from './comun/sumas.ts';

function principal(): number {
  if (process.env['CLAUDECODE'] !== undefined || !process.stdin.isTTY) {
    console.error('Las sumas solo las actualiza el dueño, a mano, desde su propio terminal (no desde Claude Code).');
    return 1;
  }
  const rutaSumas = path.join(RAIZ, RUTA_SUMAS);
  const anteriores = parsearSumas(existsSync(rutaSumas) ? readFileSync(rutaSumas, 'utf8') : '');
  // Todas las rutas protegidas, sin desbloqueos de fase: las sumas cubren el estado completo.
  const nuevas = calcularSumas(RAIZ, ficherosVigilados(RAIZ, leerProtegidas(RAIZ), 'impl'));
  writeFileSync(rutaSumas, serializarSumas(nuevas));
  const cambios = compararSumas(anteriores, nuevas);
  console.log(`${RUTA_SUMAS}: ${String(nuevas.size)} ficheros protegidos.`);
  console.log(cambios.length === 0 ? 'Sin cambios.' : cambios.map((c) => `  - ${describirDiferencia(c)}`).join('\n'));
  console.log('Revisa el diff y commitea las sumas junto con los ficheros que han cambiado.');
  return 0;
}

process.exitCode = principal();

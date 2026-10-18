// make check, paso «integridad»: falla si un fichero protegido ha cambiado respecto a sus sumas.
//
// Dos comprobaciones:
//   1. Cada fichero protegido coincide con su suma en .claude/sumas.sha256.
//   2. El propio fichero de sumas coincide con el del último commit. Así, aunque alguien
//      cambiara un fichero protegido y recalculara las sumas, la diferencia saltaría aquí.
// En las fases specs y aceptacion no se vigilan las rutas que esa fase desbloquea.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { contenidoEnGit, hayCommits } from './comun/git.ts';
import { faseDeEntorno, leerProtegidas, RUTA_SUMAS } from './comun/protegidas.ts';
import { RAIZ } from './comun/raiz.ts';
import {
  calcularSumas,
  compararSumas,
  describirDiferencia,
  ficherosVigilados,
  parsearSumas,
  sumasVigiladas,
} from './comun/sumas.ts';

const COMO_SE_ARREGLA =
  'Si el cambio es tuyo y es intencionado, actualiza las sumas desde tu terminal con «make sumas» y ' +
  'commitéalas. Si no lo has hecho tú, deshaz el cambio (git diff / git checkout).';

function principal(): number {
  const rutaSumas = path.join(RAIZ, RUTA_SUMAS);
  if (!existsSync(rutaSumas)) {
    console.error(`No existe ${RUTA_SUMAS}. El dueño la genera desde su terminal con «make sumas».`);
    return 1;
  }
  const textoSumas = readFileSync(rutaSumas, 'utf8');
  const problemas = [...problemasDeFicheros(textoSumas), ...problemasContraHead(textoSumas)];
  if (problemas.length === 0) {
    console.log('Integridad: los ficheros protegidos coinciden con sus sumas.');
    return 0;
  }
  console.error(`Integridad rota:\n${problemas.map((problema) => `  - ${problema}`).join('\n')}\n${COMO_SE_ARREGLA}`);
  return 1;
}

function problemasDeFicheros(textoSumas: string): string[] {
  const fase = faseDeEntorno(process.env);
  const entradas = leerProtegidas(RAIZ);
  const esperadas = sumasVigiladas(parsearSumas(textoSumas), entradas, fase);
  const actuales = calcularSumas(RAIZ, ficherosVigilados(RAIZ, entradas, fase));
  return compararSumas(esperadas, actuales).map(describirDiferencia);
}

function problemasContraHead(textoSumas: string): string[] {
  if (!hayCommits(RAIZ)) {
    console.warn(`Aviso: aún no hay commits; ${RUTA_SUMAS} no se puede comparar con HEAD.`);
    return [];
  }
  const enHead = contenidoEnGit(RAIZ, `HEAD:${RUTA_SUMAS}`)?.toString('utf8');
  if (enHead === undefined) return [`${RUTA_SUMAS} no está en el último commit.`];
  return enHead === textoSumas ? [] : [`${RUTA_SUMAS} ha cambiado respecto al último commit.`];
}

process.exitCode = principal();

// make fase F=<fase> [A=<ÁREA>] [N=<carril>]: fija la fase y el área en curso de la carpeta principal
// o, con N, del carril N (cada checkout tiene las suyas). Solo lo ejecuta el dueño, desde cualquier
// checkout: desde su terminal o con la tarea de VS Code «Arnés: fase de la próxima conversación»
// (.vscode/tasks.json).
//
// El área es obligatoria en la fase aceptacion y en los carriles, y opcional en la carpeta principal:
// sin ella, la fase impl solo comprueba la regresión de las áreas cerradas. Un carril cambia de fase
// solo entre dos ramas: sin relevo pendiente, sin cambios sin commitear y con su rama ya fusionada
// (comun/worktrees.ts). Su conversación siguiente empieza con make rama, y la rama nueva lleva en
// el nombre la fase y el área nuevas.
//
// Se niega a ejecutarse dentro de Claude Code (variable CLAUDECODE) o sin un terminal interactivo,
// que es como Claude Code lanza los comandos. Los hooks del arnés leen la fase y el área del checkout
// en cada llamada (comun/checkout.ts): una conversación ya abierta en él pasa a la fase nueva. El
// modelo y el esfuerzo, no: Claude Code los lee al empezar, y el hook ConfigChange bloquea los
// cambios en caliente.
import { fijarFase, RUTA_AJUSTES_LOCALES } from './comun/ajustes-locales.ts';
import { problemaDeFaseYArea } from './comun/alcance.ts';
import { carpetaPrincipal } from './comun/checkout.ts';
import { MODELO_POR_FASE } from './comun/fases.ts';
import { esFase, FASES } from './comun/fases.ts';
import type { Fase } from './comun/fases.ts';
import { RAIZ } from './comun/raiz.ts';
import { motivoSiNoEsElDueno } from './comun/solo-dueno.ts';
import { directorioDeWorktree, problemaParaCambiarLaFase } from './comun/worktrees.ts';

interface Peticion {
  readonly fase: Fase;
  readonly area: string | undefined;
  /** El carril, o undefined para la carpeta principal. */
  readonly carril: string | undefined;
}

/** El checkout de la petición, o por qué no puede cambiar de fase. */
function checkoutDe({ fase, area, carril }: Peticion): { checkout: string } | { problema: string } {
  const principal = carpetaPrincipal(RAIZ);
  const problema =
    carril === undefined
      ? problemaDeFaseYArea(principal, fase, area)
      : problemaParaCambiarLaFase(principal, { nombre: carril, fase, area });
  if (problema !== undefined) return { problema };
  return { checkout: carril === undefined ? principal : directorioDeWorktree(principal, carril) };
}

function leerPeticion(): Peticion | undefined {
  const [fase = '', area = '', carril = ''] = process.argv.slice(2);
  if (!esFase(fase)) return undefined;
  return { fase, area: area === '' ? undefined : area, carril: carril === '' ? undefined : carril };
}

function principal(): number {
  const noEsElDueno = motivoSiNoEsElDueno('La fase');
  if (noEsElDueno !== undefined) {
    console.error(noEsElDueno);
    return 1;
  }
  const peticion = leerPeticion();
  if (peticion === undefined) {
    console.error(`Uso: make fase F=<fase> [A=<ÁREA>] [N=<carril>], con una de estas fases: ${FASES.join(', ')}.`);
    return 1;
  }
  const destino = checkoutDe(peticion);
  if ('problema' in destino) {
    console.error(destino.problema);
    return 1;
  }
  const { fase, area, carril } = peticion;
  fijarFase(destino.checkout, { fase, area });
  const { modelo, esfuerzo } = MODELO_POR_FASE[fase];
  console.log(
    `Fase de ${destino.checkout}: ${fase}, con ${modelo} y esfuerzo ${esfuerzo}, ` +
      `área en curso: ${area ?? 'ninguna'} (${RUTA_AJUSTES_LOCALES}).`,
  );
  console.log('Abre una conversación nueva de Claude Code. Al empezar, un aviso te confirmará la fase.');
  if (carril !== undefined) console.log('Empezará con make rama: la rama nueva lleva la fase y el área nuevas.');
  console.log('Una conversación ya abierta ahí pasa a esta fase; el modelo y el esfuerzo cambian en la próxima.');
  return 0;
}

process.exitCode = principal();

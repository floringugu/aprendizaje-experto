// make fase F=<fase> [A=<ÁREA>]: fija la fase y el área en curso de este checkout (cada worktree
// tiene las suyas). Solo lo ejecuta el dueño: desde su terminal o con la tarea de VS Code
// «Arnés: fase de la próxima conversación» (.vscode/tasks.json).
//
// El área es obligatoria en la fase aceptacion y opcional en las demás: sin ella, la fase impl
// solo comprueba la regresión de las áreas cerradas. Se niega a ejecutarse dentro de Claude Code
// (variable CLAUDECODE) o sin un terminal interactivo, que es como Claude Code lanza los comandos.
// Los hooks del arnés leen la fase y el área del checkout en cada llamada (comun/checkout.ts): una
// conversación ya abierta en él pasa a la fase nueva. El modelo y el esfuerzo, no: Claude Code los lee
// al empezar, y el hook ConfigChange bloquea los cambios en caliente.
import { fijarFase, RUTA_AJUSTES_LOCALES } from './comun/ajustes-locales.ts';
import { problemaDeFaseYArea } from './comun/alcance.ts';
import { MODELO_POR_FASE } from './comun/fases.ts';
import { esFase, FASES } from './comun/fases.ts';
import { RAIZ } from './comun/raiz.ts';
import { motivoSiNoEsElDueno } from './comun/solo-dueno.ts';

function principal(): number {
  const noEsElDueno = motivoSiNoEsElDueno('La fase');
  if (noEsElDueno !== undefined) {
    console.error(noEsElDueno);
    return 1;
  }
  const fase = process.argv[2] ?? '';
  const area = process.argv[3] === '' ? undefined : process.argv[3];
  if (!esFase(fase)) {
    console.error(`Uso: make fase F=<fase> [A=<ÁREA>], con una de estas fases: ${FASES.join(', ')}.`);
    return 1;
  }
  const problema = problemaDeFaseYArea(RAIZ, fase, area);
  if (problema !== undefined) {
    console.error(problema);
    return 1;
  }
  fijarFase(RAIZ, { fase, area });
  const { modelo, esfuerzo } = MODELO_POR_FASE[fase];
  console.log(
    `Fase de este checkout: ${fase}, con ${modelo} y esfuerzo ${esfuerzo}, ` +
      `área en curso: ${area ?? 'ninguna'} (${RUTA_AJUSTES_LOCALES}).`,
  );
  console.log('Abre una conversación nueva de Claude Code. Al empezar, un aviso te confirmará la fase.');
  console.log('Una conversación ya abierta aquí pasa a esta fase; el modelo y el esfuerzo cambian en la próxima.');
  return 0;
}

process.exitCode = principal();

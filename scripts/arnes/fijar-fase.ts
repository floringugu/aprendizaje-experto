// make fase F=<fase>: fija la fase de la PRÓXIMA conversación de Claude Code en este repositorio.
// Solo lo ejecuta el dueño: desde su terminal o con la tarea de VS Code «Arnés: fase de la
// próxima conversación» (.vscode/tasks.json).
//
// Se niega a ejecutarse dentro de Claude Code (variable CLAUDECODE) o sin un terminal
// interactivo, igual que «make sumas». La conversación que ya está abierta no cambia de fase:
// Claude Code lee los ajustes al empezar, y el hook ConfigChange bloquea los cambios en caliente.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ajustesConFase, RUTA_AJUSTES_LOCALES } from './comun/ajustes-locales.ts';
import { MODELO_POR_FASE } from './comun/fases.ts';
import { esFase, FASES } from './comun/protegidas.ts';
import { RAIZ } from './comun/raiz.ts';

function principal(): number {
  if (process.env['CLAUDECODE'] !== undefined || !process.stdin.isTTY) {
    console.error(
      'La fase solo la cambia el dueño, desde su terminal o con la tarea de VS Code (no desde Claude Code).',
    );
    return 1;
  }
  const fase = process.argv[2] ?? '';
  if (!esFase(fase)) {
    console.error(`Uso: make fase F=<fase>, con una de estas fases: ${FASES.join(', ')}.`);
    return 1;
  }
  const ruta = path.join(RAIZ, RUTA_AJUSTES_LOCALES);
  const anterior = existsSync(ruta) ? readFileSync(ruta, 'utf8') : undefined;
  writeFileSync(ruta, ajustesConFase(anterior, fase));
  const { modelo, esfuerzo } = MODELO_POR_FASE[fase];
  console.log(
    `Fase de la próxima conversación: ${fase}, con ${modelo} y esfuerzo ${esfuerzo} (${RUTA_AJUSTES_LOCALES}).`,
  );
  console.log('Abre una conversación nueva de Claude Code. Al empezar, un aviso te confirmará la fase.');
  console.log('Las conversaciones que ya están abiertas siguen en su fase.');
  return 0;
}

process.exitCode = principal();

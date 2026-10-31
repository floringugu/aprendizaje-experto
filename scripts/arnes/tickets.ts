// make tickets | make tablero | npm run tickets (docs/plan.md §6, «Tickets»):
//   comprobar: los tickets del árbol de trabajo están bien escritos (comun/tickets.ts). Es un paso de
//     ESTATICOS en el Makefile: un ticket mal escrito no llega a main, en ninguna fase;
//   listar (make tickets): trae origin y escribe el tablero en texto (comun/tablero.ts);
//   tablero (make tablero): trae origin, escribe reports/tablero.html y, si lo lanza el dueño, lo abre.
// Si git fetch falla (sin red), listar y tablero siguen con lo último que se trajo, y lo dicen.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { leerAlcance } from './comun/alcance.ts';
import { prsAbiertos, situacionDelRepositorio } from './comun/estado-tickets.ts';
import type { Situacion } from './comun/estado-tickets.ts';
import { traerOrigen } from './comun/ramas.ts';
import { RAIZ } from './comun/raiz.ts';
import { motivoSiNoEsElDueno } from './comun/solo-dueno.ts';
import { tableroEnHtml, tableroEnTexto } from './comun/tablero.ts';
import { CARPETA_DE_TICKETS, problemasDeLosTickets, ticketsDe } from './comun/tickets.ts';

const RUTA_DEL_TABLERO = path.join(RAIZ, 'reports', 'tablero.html');

function comprobar(): number {
  const lectura = ticketsDe(RAIZ);
  const problemas = problemasDeLosTickets(RAIZ, lectura, leerAlcance(RAIZ).cerradas);
  for (const problema of problemas) console.error(problema);
  if (problemas.length > 0) return 1;
  console.log(`Tickets bien escritos en ${CARPETA_DE_TICKETS}/: ${String(lectura.tickets.length)}.`);
  return 0;
}

/** Trae origin y lee la situación. Sin red, avisa y sigue con lo que hay. */
function situacionAlDia(): Situacion {
  const problema = traerOrigen(RAIZ);
  if (problema !== undefined) console.error(`Sigo con lo último que se trajo de origin. ${problema}`);
  return situacionDelRepositorio(RAIZ, prsAbiertos(RAIZ));
}

function listar(): number {
  const texto = tableroEnTexto(situacionAlDia());
  console.log(texto === '' ? `No hay tickets en ${CARPETA_DE_TICKETS}/ de origin/main.` : texto);
  return 0;
}

function tablero(): number {
  mkdirSync(path.dirname(RUTA_DEL_TABLERO), { recursive: true });
  writeFileSync(RUTA_DEL_TABLERO, tableroEnHtml(situacionAlDia(), new Date().toLocaleString('es-ES')));
  console.log(`Tablero en ${RUTA_DEL_TABLERO}`);
  if (motivoSiNoEsElDueno('Abrir el tablero') === undefined) {
    spawn('xdg-open', [RUTA_DEL_TABLERO], { detached: true, stdio: 'ignore' }).unref();
  }
  return 0;
}

const ORDENES: Readonly<Record<string, () => number>> = { comprobar, listar, tablero };

function principal(): number {
  const orden = ORDENES[process.argv[2] ?? ''];
  if (orden !== undefined) return orden();
  console.error(`Uso: node scripts/arnes/tickets.ts ${Object.keys(ORDENES).join(' | ')}`);
  return 1;
}

process.exitCode = principal();

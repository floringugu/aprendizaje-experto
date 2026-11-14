// La lista de tickets aprobados para la noche (docs/plan.md §6, «Noche desatendida»): un id por
// línea, en el orden en que el dueño los aprobó, que es el orden en que el Despachador los toma.
// Vive fuera del repositorio para que ningún PR pueda aprobar un ticket: solo la escribe el dueño,
// con «make aprobar». El Despachador solo la lee.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

/** La ruta de la lista: la de ARNES_APROBADOS si está, o «~/.config/aprendizaje-experto/aprobados». */
export function rutaDeAprobados(): string {
  return process.env['ARNES_APROBADOS'] ?? path.join(homedir(), '.config', 'aprendizaje-experto', 'aprobados');
}

/** Los tickets aprobados, en su orden. Ninguno si la lista no existe. */
export function leerAprobados(ruta: string): string[] {
  if (!existsSync(ruta)) return [];
  const lineas = readFileSync(ruta, 'utf8').split('\n');
  return lineas.map((linea) => linea.trim()).filter((linea) => linea !== '');
}

/** Añade el ticket al final de la lista, si no estaba. Devuelve la lista que queda. */
export function aprobar(ruta: string, ticket: string): string[] {
  const aprobados = leerAprobados(ruta);
  return aprobados.includes(ticket) ? aprobados : escribir(ruta, [...aprobados, ticket]);
}

/** Quita el ticket de la lista, si estaba. Devuelve la lista que queda. */
export function quitarAprobado(ruta: string, ticket: string): string[] {
  const aprobados = leerAprobados(ruta);
  return aprobados.includes(ticket)
    ? escribir(
        ruta,
        aprobados.filter((id) => id !== ticket),
      )
    : aprobados;
}

function escribir(ruta: string, aprobados: string[]): string[] {
  mkdirSync(path.dirname(ruta), { recursive: true });
  writeFileSync(ruta, aprobados.map((id) => `${id}\n`).join(''));
  return aprobados;
}

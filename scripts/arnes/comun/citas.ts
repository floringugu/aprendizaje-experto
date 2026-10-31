// Busca las citas de IDs de escenario (@MAST-1.2) en el código y en los tests.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { listarFicheros } from './ficheros.ts';

export interface Cita {
  readonly id: string;
  readonly fichero: string;
  readonly linea: number;
}

const CARPETAS = ['src', 'tests/unidad', 'tests/aceptacion'];

/** Una cita lleva siempre número (@MAST-1 o @MAST-1.2); el prefijo suelo no cuenta como cita. */
const PATRON_CITA = /@([A-Z]{2,6}-\d+(?:\.\d+)?)\b/g;

export function citasEnTexto(texto: string, fichero: string): Cita[] {
  return texto.split('\n').flatMap((contenido, indice) =>
    [...contenido.matchAll(PATRON_CITA)].map((coincidencia) => ({
      id: coincidencia[1] ?? '',
      fichero,
      linea: indice + 1,
    })),
  );
}

export function buscarCitas(raiz: string): Cita[] {
  return CARPETAS.flatMap((carpeta) =>
    listarFicheros(raiz, carpeta, '.ts').flatMap((fichero) =>
      citasEnTexto(readFileSync(path.join(raiz, fichero), 'utf8'), fichero),
    ),
  );
}

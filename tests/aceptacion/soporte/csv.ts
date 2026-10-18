import { aceptado } from './mundo.ts';
import type { Mundo } from './mundo.ts';

export type FilaCsv = Readonly<Record<string, string>>;

export interface CsvLeido {
  readonly cabecera: readonly string[];
  readonly filas: readonly FilaCsv[];
}

/** Lee un CSV de la exportación: coma como separador, una fila de cabecera y nada más (INST). */
export function leerCsv(texto: string): CsvLeido {
  const lineas = texto.split('\n').filter((linea) => linea !== '');
  const cabecera = (lineas[0] ?? '').split(',');
  const filas = lineas.slice(1).map((linea) => {
    const valores = linea.split(',');
    return Object.fromEntries(cabecera.map((columna, posicion) => [columna, valores[posicion] ?? '']));
  });
  return { cabecera, filas };
}

/** Exporta el CSV como lo haría la persona y devuelve su texto tal cual. */
export function exportarTexto(mundo: Mundo, fichero: string): string {
  mundo.csv = aceptado(mundo.listo().exportarCsv({ fichero }));
  return mundo.csv;
}

export function exportar(mundo: Mundo, fichero: string): CsvLeido {
  return leerCsv(exportarTexto(mundo, fichero));
}

/** Filas del CSV que son del dominio del escenario, en el orden de exportación. */
export function filasDelDominio(mundo: Mundo, fichero: string): readonly FilaCsv[] {
  return exportar(mundo, fichero).filas.filter((fila) => fila['dominio'] === mundo.dominio);
}

/** Última fila del CSV para el dominio del escenario; falla el paso si no hay ninguna. */
export function ultimaFila(mundo: Mundo, fichero: string): FilaCsv {
  const fila = filasDelDominio(mundo, fichero).at(-1);
  if (fila === undefined) {
    throw new Error(`${fichero} no tiene ninguna fila del dominio ${mundo.dominio}`);
  }
  return fila;
}

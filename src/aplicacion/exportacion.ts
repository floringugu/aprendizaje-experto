import type { Resultado } from './resultado.ts';

export interface CasosDeExportacion {
  /** Texto del CSV con todos los dominios y las filas en orden cronológico (INST-2.2). */
  exportarCsv(peticion: { readonly fichero: string }): Resultado<string>;
  /** Nombres de los ficheros que se pueden descargar (INST-2.3). */
  listarExportaciones(): Resultado<readonly string[]>;
}

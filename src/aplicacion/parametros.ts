import type { ParametrosJson } from './puertos.ts';

/** Valor numérico de un parámetro de `config/parametros.json`; falla si falta o no es un número. */
export function parametroNumerico(parametros: ParametrosJson, nombre: string): number {
  const valor = parametros[nombre]?.valor;
  if (typeof valor !== 'number') {
    throw new Error(`El parámetro «${nombre}» de config/parametros.json falta o no es un número`);
  }
  return valor;
}

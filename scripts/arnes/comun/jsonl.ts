// Registros locales en formato JSON Lines: una línea JSON por evento, y solo se añaden líneas.
// Los usan el hook Stop (registro-stop.ts) y el enrutador de modelos (registro-enrutador.ts).
import { appendFileSync, existsSync, readFileSync } from 'node:fs';

export function anotarLinea(ruta: string, valor: unknown): void {
  appendFileSync(ruta, `${JSON.stringify(valor)}\n`);
}

/** Las líneas del fichero que pasan la guarda. Si el fichero no existe, no hay ninguna. */
export function leerLineas<T>(ruta: string, esValida: (valor: unknown) => valor is T): T[] {
  return existsSync(ruta) ? parsearLineas(readFileSync(ruta, 'utf8'), esValida) : [];
}

export function parsearLineas<T>(texto: string, esValida: (valor: unknown) => valor is T): T[] {
  return texto.split('\n').flatMap((linea) => {
    const valor = leerLinea(linea);
    return esValida(valor) ? [valor] : [];
  });
}

function leerLinea(linea: string): unknown {
  if (linea.trim() === '') return undefined;
  try {
    return JSON.parse(linea) as unknown;
  } catch {
    // Una línea cortada (por ejemplo, si se llenó el disco) no debe impedir leer las demás.
    return undefined;
  }
}

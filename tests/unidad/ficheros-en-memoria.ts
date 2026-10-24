// Los ficheros de la aplicación, en memoria, para los tests del material. No es un fichero de tests: vitest
// solo recoge los *.test.ts, así que aquí no se ejecuta nada.
import type { Ficheros } from '../../src/aplicacion/puertos.ts';

/** Los ficheros de la aplicación, en memoria. Sin ficheros en el mapa, nadie ha escrito nada. */
export function ficherosEnMemoria() {
  const contenidos = new Map<string, Uint8Array>();
  const ficheros: Ficheros = {
    leer: (ruta) => contenidos.get(ruta),
    escribir: (ruta, bytes) => {
      contenidos.set(ruta, bytes);
    },
  };
  return { ficheros, contenidos };
}

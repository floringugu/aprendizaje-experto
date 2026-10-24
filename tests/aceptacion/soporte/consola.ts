import { After, Before } from '@cucumber/cucumber';
import type { Mundo } from './mundo.ts';

// Captura lo que el servidor escribe en la consola durante los escenarios que miran que un código o un
// token no aparezca en ella (MATE-8.6, MATE-8.7). Lo capturado sigue saliendo por la consola.

const ESCENARIOS_CON_CONSOLA = '@MATE-8.6 or @MATE-8.7';
const FLUJOS = [process.stdout, process.stderr];

function comoTexto(trozo: unknown): string {
  return trozo instanceof Uint8Array ? Buffer.from(trozo).toString() : String(trozo);
}

Before({ tags: ESCENARIOS_CON_CONSOLA }, function (this: Mundo) {
  const { consola } = this.material;
  FLUJOS.forEach((flujo) => {
    const escribir = flujo.write.bind(flujo);
    // `write` es un método del prototipo: asignarlo crea una propiedad propia, que el After borra.
    flujo.write = (trozo: unknown, ...resto: unknown[]) => {
      consola.push(comoTexto(trozo));
      return (escribir as (...argumentos: unknown[]) => boolean)(trozo, ...resto);
    };
  });
});

After({ tags: ESCENARIOS_CON_CONSOLA }, () => {
  FLUJOS.forEach((flujo) => {
    Reflect.deleteProperty(flujo, 'write');
  });
});

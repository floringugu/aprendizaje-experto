// Cucumber: features en español, steps en TypeScript (Node los carga sin compilar).
// Solo se ejecutan los escenarios en alcance (scripts/arnes/comun/alcance.ts), seleccionados por etiqueta:
//   perfil por defecto: los de las áreas cerradas, que deben seguir en verde (regresión), sin sus pendientes;
//   perfil «area» (--profile area): además, los del área en curso del checkout, con sus pendientes.
// strict: un paso pendiente o sin definir hace fallar la ejecución.
import { expresionEtiquetasCucumber, leerAlcance, seleccionEnAlcance } from './scripts/arnes/comun/alcance.ts';

const alcance = leerAlcance(import.meta.dirname);

const comun = {
  paths: ['features/**/*.feature'],
  import: ['tests/aceptacion/**/*.ts'],
  language: 'es',
  strict: true,
  format: ['progress', 'message:reports/cucumber.ndjson'],
};

export default { ...comun, tags: expresionEtiquetasCucumber(seleccionEnAlcance(alcance, false)) };

export const area = { ...comun, tags: expresionEtiquetasCucumber(seleccionEnAlcance(alcance, true)) };

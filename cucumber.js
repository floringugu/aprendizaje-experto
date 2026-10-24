// Cucumber: features en español, steps en TypeScript (Node los carga sin compilar).
// Solo se ejecutan las áreas en alcance (scripts/arnes/comun/alcance.ts), seleccionadas por etiqueta:
//   perfil por defecto: las áreas cerradas, que deben seguir en verde (regresión);
//   perfil «area» (--profile area): las cerradas y el área en curso (ARNES_AREA).
// strict: un paso pendiente o sin definir hace fallar la ejecución.
import { areasEnAlcance, expresionEtiquetasCucumber, leerAlcance } from './scripts/arnes/comun/alcance.ts';

const alcance = leerAlcance(import.meta.dirname, process.env);

const comun = {
  paths: ['features/**/*.feature'],
  import: ['tests/aceptacion/**/*.ts'],
  language: 'es',
  strict: true,
  format: ['progress', 'message:reports/cucumber.ndjson'],
};

export default { ...comun, tags: expresionEtiquetasCucumber(areasEnAlcance(alcance, false)) };

export const area = { ...comun, tags: expresionEtiquetasCucumber(areasEnAlcance(alcance, true)) };

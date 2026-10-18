// Cucumber: features en español, steps en TypeScript (Node los carga sin compilar).
// Las áreas de config/alcance.json aún no se implementan y se excluyen por etiqueta.
// strict: un paso pendiente o sin definir hace fallar la ejecución.
import { expresionEtiquetasCucumber, leerAreasFueraDeAlcance } from './scripts/arnes/comun/alcance.ts';

export default {
  paths: ['features/**/*.feature'],
  import: ['tests/aceptacion/**/*.ts'],
  language: 'es',
  strict: true,
  format: ['progress', 'message:reports/cucumber.ndjson'],
  tags: expresionEtiquetasCucumber(leerAreasFueraDeAlcance(import.meta.dirname)),
};

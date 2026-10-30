// La regla de mezcla (comun/commits.ts): ningún commit lleva a la vez especificación (features/,
// tests/aceptacion/, config/) y código (src/, tests/unidad/).
//   node scripts/arnes/regla-commits.ts                 lo preparado, antes de commitear
//   node scripts/arnes/regla-commits.ts --rango a..b    cada commit del rango: el job «mezcla» de la CI
//                                                       (.github/workflows/puerta.yml), con la base y la cabeza del PR
import { problemasDeLoPreparado, problemasDelRango } from './comun/commits.ts';
import { RAIZ } from './comun/raiz.ts';

function principal(): number {
  const argumentos = process.argv.slice(2);
  const [opcion, rango] = argumentos;
  if (argumentos.length !== 0 && (opcion !== '--rango' || rango === undefined || argumentos.length !== 2)) {
    console.error('Uso: node scripts/arnes/regla-commits.ts [--rango <base>..<cabeza>]');
    return 1;
  }
  const problemas = rango === undefined ? problemasDeLoPreparado(RAIZ) : problemasDelRango(RAIZ, rango);
  if (problemas.length === 0) {
    console.log('Regla de mezcla: ningún commit mezcla especificación y código.');
    return 0;
  }
  console.error(`Regla de mezcla rota:\n${problemas.map((problema) => `  - ${problema}`).join('\n')}`);
  return 1;
}

process.exitCode = principal();

// make check, paso «lint»: ESLint con una pista de cómo arreglar cada problema.
// Uso: node scripts/arnes/lint.ts [ficheros o directorios…]
import { lintear, OBJETIVOS_POR_DEFECTO } from './comun/lint.ts';
import { RAIZ } from './comun/raiz.ts';

const argumentos = process.argv.slice(2);
const resultado = await lintear(RAIZ, argumentos.length > 0 ? argumentos : OBJETIVOS_POR_DEFECTO);

if (resultado.hayProblemas) {
  console.error(resultado.texto);
  process.exitCode = 1;
} else {
  console.log('ESLint: sin problemas.');
}

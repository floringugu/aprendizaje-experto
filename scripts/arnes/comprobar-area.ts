// make cerrar-area A=<ÁREA>, antes de sus pasos: A tiene que ser el área en curso del checkout, la
// que comprueban la aceptación y la cobertura del área (comun/alcance.ts).
import { problemaDelAreaACerrar } from './comun/alcance.ts';
import { RAIZ } from './comun/raiz.ts';

function principal(): number {
  const problema = problemaDelAreaACerrar(RAIZ, process.argv[2] ?? '');
  if (problema === undefined) return 0;
  console.error(problema);
  return 1;
}

process.exitCode = principal();

// make bloqueos A=<ÁREA>: cuántas veces bloqueó el hook Stop mientras se implementaba el área.
// Lee .claude/registro-stop.jsonl. El resultado va al archivo del área (docs/areas/<ÁREA>.md).
import { esArea } from './comun/checkout.ts';
import { RAIZ } from './comun/raiz.ts';
import { formatearResumen, leerRegistro, resumirArea } from './comun/registro-stop.ts';

function principal(): number {
  const area = process.argv[2] ?? '';
  if (!esArea(area)) {
    console.error('Uso: make bloqueos A=<ÁREA>, con el prefijo del área en mayúsculas (por ejemplo, A=RECU).');
    return 1;
  }
  console.log(formatearResumen(resumirArea(leerRegistro(RAIZ), area)));
  return 0;
}

process.exitCode = principal();

// make check, paso «integridad»: falla si un fichero protegido difiere del último commit.
//
// Cuenta lo cambiado, lo borrado y lo nuevo (también sin seguimiento) en las rutas de
// .claude/protegidas.txt. Esas rutas las cambia el dueño con un commit, así que lo que no está
// en HEAD no vale, lo haya escrito quien lo haya escrito.
// En las fases specs y aceptacion no se vigilan las rutas que esa fase desbloquea.
import { faseYAreaDelCheckout } from './comun/checkout.ts';
import { hayCommits } from './comun/git.ts';
import { problemasDeIntegridad } from './comun/integridad.ts';
import { leerProtegidas } from './comun/protegidas.ts';
import { RAIZ } from './comun/raiz.ts';

const COMO_SE_ARREGLA =
  'Si el cambio es tuyo y es intencionado, commitéalo desde tu terminal (git add y git commit). ' +
  'Si no lo has hecho tú, deshaz el cambio (git diff / git restore).';

function principal(): number {
  if (!hayCommits(RAIZ)) {
    console.warn('Aviso: aún no hay commits; los ficheros protegidos no se pueden comparar con HEAD.');
    return 0;
  }
  const problemas = problemasDeIntegridad(RAIZ, leerProtegidas(RAIZ), faseYAreaDelCheckout(RAIZ).fase);
  if (problemas.length === 0) {
    console.log('Integridad: los ficheros protegidos coinciden con el último commit.');
    return 0;
  }
  console.error(`Integridad rota:\n${problemas.map((problema) => `  - ${problema}`).join('\n')}\n${COMO_SE_ARREGLA}`);
  return 1;
}

process.exitCode = principal();

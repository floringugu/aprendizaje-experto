// make manana (docs/plan.md §6, «Noche desatendida»): qué hizo el Despachador en su última noche.
// Lee su diario (comun/diario-noche.ts) y pregunta a GitHub cómo está ahora el PR de cada ticket de
// la cola. No guarda nada.
import { spawnSync } from 'node:child_process';
import { carpetaPrincipal } from './comun/checkout.ts';
import { leerDiario, textoDeLaManana, ultimaNoche } from './comun/diario-noche.ts';
import { RAIZ } from './comun/raiz.ts';
import { ramasDelCarril } from './comun/ramas.ts';

const PRINCIPAL = carpetaPrincipal(RAIZ);

const ESTADOS: Readonly<Record<string, string>> = {
  OPEN: 'abierto',
  MERGED: 'fusionado',
  CLOSED: 'cerrado sin fusionar',
};

/** «PR #n abierto», del PR más reciente de las ramas del carril del ticket; '' si no tiene o gh falla. */
function estadoDelPr(ticket: string): string {
  for (const rama of ramasDelCarril(PRINCIPAL, ticket).toReversed()) {
    const argumentos = ['pr', 'list', '--head', rama, '--state', 'all', '--limit', '1', '--json', 'number,state'];
    const resultado = spawnSync('gh', argumentos, { cwd: PRINCIPAL, encoding: 'utf8' });
    if (resultado.status !== 0) return '';
    const [pr] = JSON.parse(resultado.stdout) as { number: number; state: string }[];
    if (pr !== undefined) return `PR #${String(pr.number)} ${ESTADOS[pr.state] ?? pr.state}`;
  }
  return '';
}

function principal(): number {
  const noche = ultimaNoche(leerDiario(PRINCIPAL));
  console.log(
    noche === undefined ? 'El Despachador no ha anotado ninguna noche.' : textoDeLaManana(noche, estadoDelPr),
  );
  return 0;
}

process.exitCode = principal();

// make manana (docs/plan.md §6, «Noche desatendida»): qué hizo el Despachador en su última noche y
// qué lotes esperan al dueño. Lee su diario (comun/diario-noche.ts) y pregunta a GitHub cómo está
// ahora el PR de cada ticket de la cola. De cada lote que main aún no tiene (comun/lote.ts), tras
// traer origin, dice sus tickets, sus ficheros, su PR hacia main y los comandos para fusionarlo. No
// guarda nada.
import { spawnSync } from 'node:child_process';
import { carpetaPrincipal } from './comun/checkout.ts';
import { leerDiario, textoDeLaManana, ultimaNoche } from './comun/diario-noche.ts';
import { lotesVivos, prDelLote, resumenDelLote, textoDelLote } from './comun/lote.ts';
import { RAIZ } from './comun/raiz.ts';
import { ramasDelCarril, traerOrigen } from './comun/ramas.ts';

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
  const problema = traerOrigen(PRINCIPAL);
  if (problema !== undefined) console.error(`Sigo con lo último que se trajo de origin. ${problema}`);
  for (const lote of lotesVivos(PRINCIPAL)) {
    console.log(`\n${textoDelLote(resumenDelLote(PRINCIPAL, lote), prDelLote(PRINCIPAL, lote), PRINCIPAL)}`);
  }
  return 0;
}

process.exitCode = principal();

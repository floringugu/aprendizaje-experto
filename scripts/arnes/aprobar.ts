// make aprobar [N=<ticket>] [QUITAR=1] (docs/plan.md §6, «Noche desatendida»): la lista de tickets
// que el Despachador puede ejecutar de noche (comun/aprobados.ts). Sin N, la enseña. Solo la escribe
// el dueño: aprobar un ticket es dar permiso para ejecutarlo sin nadie delante.
import { aprobar, leerAprobados, quitarAprobado, rutaDeAprobados } from './comun/aprobados.ts';
import { RAMA_DE_ORIGEN, traerOrigen } from './comun/ramas.ts';
import { RAIZ } from './comun/raiz.ts';
import { motivoSiNoEsElDueno } from './comun/solo-dueno.ts';
import { ticketsDe } from './comun/tickets.ts';

/** Por qué no se puede aprobar el ticket: no está en origin/main, o ya está hecho o descartado. */
function problemaDelTicket(id: string): string | undefined {
  const problema = traerOrigen(RAIZ);
  if (problema !== undefined) console.error(`Sigo con lo último que se trajo de origin. ${problema}`);
  const ticket = ticketsDe(RAIZ, RAMA_DE_ORIGEN).tickets.find((candidato) => candidato.id === id);
  if (ticket === undefined) return `No hay ningún ticket «${id}» en ${RAMA_DE_ORIGEN}.`;
  return ticket.estado === 'abierto' ? undefined : `El ticket «${id}» está ${ticket.estado}.`;
}

function principal(): number {
  const [id = '', quitar = ''] = process.argv.slice(2);
  const ruta = rutaDeAprobados();
  if (id !== '') {
    const problema = motivoSiNoEsElDueno('make aprobar') ?? (quitar === '1' ? undefined : problemaDelTicket(id));
    if (problema !== undefined) {
      console.error(problema);
      return 1;
    }
    if (quitar === '1') quitarAprobado(ruta, id);
    else aprobar(ruta, id);
  }
  const aprobados = leerAprobados(ruta);
  console.log(`Aprobados para la noche (${ruta}): ${aprobados.length === 0 ? 'ninguno' : aprobados.join(', ')}.`);
  return 0;
}

process.exitCode = principal();

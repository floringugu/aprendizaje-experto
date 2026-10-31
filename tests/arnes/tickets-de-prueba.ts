// Tickets, carriles y situaciones de prueba para los tests de estado-tickets.ts, tickets.ts y tablero.ts.
import type { CarrilAbierto, Situacion } from '../../scripts/arnes/comun/estado-tickets.ts';
import { leerTicket } from '../../scripts/arnes/comun/tickets.ts';
import type { Ticket } from '../../scripts/arnes/comun/tickets.ts';

export interface Frontmatter {
  fase?: string;
  area?: string;
  depende?: string;
  toca?: string;
  estado?: string;
}

/** El texto de un ticket, con un frontmatter válido salvo lo que cambie `campos`. */
export function texto(
  campos: Frontmatter = {},
  cuerpo = '# Título\n\n**Hecho cuando:** make check\nen verde.\n',
): string {
  const { fase = 'impl', area = 'MATE', depende = '[]', toca = '[]', estado = 'abierto' } = campos;
  return `---\nfase: ${fase}\narea: ${area}\ndepende: ${depende}\ntoca: ${toca}\nestado: ${estado}\n---\n${cuerpo}`;
}

export function ticket(id: string, campos: Frontmatter = {}): Ticket {
  const leido = leerTicket(id, texto(campos));
  if ('problema' in leido) throw new Error(leido.problema);
  return leido;
}

export function carril(nombre: string, campos: Partial<CarrilAbierto> = {}): CarrilAbierto {
  return { nombre, rama: `impl/MATE/${nombre}`, commiteados: [], pr: undefined, ...campos };
}

export function situacion(campos: Partial<Situacion>): Situacion {
  return {
    tickets: [],
    problemas: [],
    cerradas: [],
    carriles: [],
    ficheros: ['src/a.ts', 'config/alcance.json'],
    ...campos,
  };
}

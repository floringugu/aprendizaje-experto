// El tablero de los tickets (estado-tickets.ts): en texto para «make tickets» y los avisos, y en un
// HTML autónomo para «make tablero», con una columna por estado y el grafo de dependencias en Mermaid.
// Mermaid se carga de jsdelivr con la versión fijada: sin red se ven las columnas, pero no el grafo.
import { esArea } from './checkout.ts';
import { detalle, estadoDeLosTickets } from './estado-tickets.ts';
import type { Estado, Situacion } from './estado-tickets.ts';
import type { Ticket } from './tickets.ts';

const MERMAID = 'https://cdn.jsdelivr.net/npm/mermaid@12.2.0/dist/mermaid.esm.min.mjs';

type Tipo = Estado['tipo'];

/** Las columnas del tablero, en orden, con su título. Los descartados no tienen columna. */
const COLUMNAS: readonly (readonly [Exclude<Tipo, 'descartado'>, string])[] = [
  ['listo', 'Listo'],
  ['bloqueado', 'Bloqueado'],
  ['curso', 'En curso'],
  ['revision', 'En revisión'],
  ['hecho', 'Hecho'],
];

interface Fila {
  readonly ticket: Ticket;
  readonly estado: Estado;
}

function filasDe(filas: readonly Fila[], tipo: Tipo): Fila[] {
  return filas.filter(({ estado }) => estado.tipo === tipo);
}

/** Lo que el dueño tiene que saber además de las columnas: lo que no se ha leído y los carriles que sobran o no cuentan. */
function avisosDelTablero(situacion: Situacion, filas: readonly Fila[]): string[] {
  const conTicket = new Set(situacion.tickets.map(({ id }) => id));
  const sinTicket = situacion.carriles
    .filter(({ nombre }) => !conTicket.has(nombre))
    .map(({ nombre }) => `El carril ${nombre} no tiene ticket: para los solapes solo cuenta lo que ha commiteado.`);
  const paraRetirar = filas
    .filter(({ estado }) => 'carrilSinRetirar' in estado && estado.carrilSinRetirar)
    .map(
      ({ ticket, estado }) =>
        `${ticket.id} está ${estado.tipo} y su carril sigue abierto: make retirar N=${ticket.id}.`,
    );
  return [...situacion.problemas, ...sinTicket, ...paraRetirar];
}

/** El tablero en texto: una sección por columna, con «make abrir» en los listos, y los avisos. */
export function tableroEnTexto(situacion: Situacion): string {
  const filas = estadoDeLosTickets(situacion);
  const secciones = COLUMNAS.flatMap(([tipo, titulo]) => {
    const deLaColumna = filasDe(filas, tipo);
    if (deLaColumna.length === 0) return [];
    const lineas = deLaColumna.map(({ ticket, estado }) => {
      const final = tipo === 'listo' ? `make abrir N=${ticket.id}` : detalle(estado);
      return `  ${ticket.id} (${ticket.fase}/${ticket.area}): ${ticket.titulo}${final === '' ? '' : `\n      ${final}`}`;
    });
    return [`${titulo} (${String(deLaColumna.length)}):`, ...lineas];
  });
  const avisos = avisosDelTablero(situacion, filas).map((aviso) => `  ${aviso}`);
  return [...secciones, ...(avisos.length > 0 ? ['Avisos:', ...avisos] : [])].join('\n');
}

/** La línea del aviso de inicio con los tickets listos para abrir; undefined si no hay ninguno. */
export function avisoDeListos(situacion: Situacion): string | undefined {
  const listos = filasDe(estadoDeLosTickets(situacion), 'listo').map(({ ticket }) => ticket.id);
  return listos.length === 0 ? undefined : `Tickets listos: ${listos.join(', ')} (make tablero)`;
}

function escapar(texto: string): string {
  return texto.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function lista(titulo: string, elementos: readonly string[]): string {
  if (elementos.length === 0) return '';
  return `<dt>${titulo}</dt><dd>${elementos.map((e) => `<code>${escapar(e)}</code>`).join(' ')}</dd>`;
}

function tarjeta({ ticket, estado }: Fila, filas: readonly Fila[]): string {
  const bloqueaA = filas.filter((otra) => otra.ticket.depende.includes(ticket.id)).map((otra) => otra.ticket.id);
  const abrir = estado.tipo === 'listo' ? `<pre>make abrir N=${ticket.id}</pre>` : '';
  const nota = detalle(estado);
  return [
    `<article class="${estado.tipo}"><h3>${escapar(ticket.id)}</h3>`,
    `<p class="fase">${ticket.fase}/${ticket.area}</p><p>${escapar(ticket.titulo)}</p>`,
    nota === '' ? '' : `<p class="nota">${escapar(nota)}</p>`,
    `<dl>${lista('depende de', ticket.depende)}${lista('bloquea a', bloqueaA)}${lista('toca', ticket.toca)}</dl>`,
    `${abrir}</article>`,
  ].join('');
}

/** El nodo de un ticket o de un área en Mermaid, con un prefijo para no chocar con sus palabras reservadas (end…). */
function nodo(nombre: string): string {
  return esArea(nombre) ? `area_${nombre}` : `ticket_${nombre.replaceAll('-', '_')}`;
}

/** El grafo en Mermaid: una flecha de cada dependencia a su ticket, coloreado por estado. Sin los descartados. */
function grafo(filas: readonly Fila[], cerradas: readonly string[]): string {
  const vivas = filas.filter(({ estado }) => estado.tipo !== 'descartado');
  const areas = [...new Set(vivas.flatMap(({ ticket }) => ticket.depende.filter(esArea)))];
  const nodos = [
    ...vivas.map(
      ({ ticket, estado }) => `  ${nodo(ticket.id)}["${ticket.id}<br/>${ticket.fase}/${ticket.area}"]:::${estado.tipo}`,
    ),
    ...areas.map((area) => `  ${nodo(area)}(["área ${area}"]):::${cerradas.includes(area) ? 'hecho' : 'area'}`),
  ];
  const flechas = vivas.flatMap(({ ticket }) =>
    ticket.depende.map((dependencia) => `  ${nodo(dependencia)} --> ${nodo(ticket.id)}`),
  );
  const clases = [
    '  classDef listo fill:#d8f5d0,stroke:#2e7d32',
    '  classDef bloqueado fill:#fde2e1,stroke:#c62828',
    '  classDef curso fill:#fff3c4,stroke:#b28704',
    '  classDef revision fill:#e3e8ff,stroke:#3949ab',
    '  classDef hecho fill:#eeeeee,stroke:#9e9e9e,color:#757575',
    '  classDef area fill:#ffffff,stroke:#616161,stroke-dasharray:4 3',
  ];
  return ['flowchart LR', ...nodos, ...flechas, ...clases].join('\n');
}

const ESTILO = `
body { font-family: system-ui, sans-serif; margin: 1.5rem; background: #fafafa; color: #212121; }
.columnas { display: grid; grid-template-columns: repeat(5, minmax(12rem, 1fr)); gap: 1rem; align-items: start; }
section { background: #f0f0f0; border-radius: 6px; padding: .5rem; }
article { background: #fff; border-left: 4px solid #9e9e9e; border-radius: 4px; padding: .5rem; margin: .5rem 0; font-size: .9rem; }
article.listo { border-color: #2e7d32; } article.bloqueado { border-color: #c62828; }
article.curso { border-color: #b28704; } article.revision { border-color: #3949ab; }
h3 { margin: 0; font-size: 1rem; } .fase { color: #616161; margin: 0; } .nota { color: #c62828; }
dt { font-weight: 600; } dd { margin: 0 0 .25rem 0; } code { font-size: .8rem; }
pre { background: #263238; color: #eceff1; padding: .25rem .5rem; border-radius: 4px; }`;

/** El tablero en una página HTML autónoma. `generado` dice cuándo se generó. */
export function tableroEnHtml(situacion: Situacion, generado: string): string {
  const filas = estadoDeLosTickets(situacion);
  const columnas = COLUMNAS.map(([tipo, titulo]) => {
    const tarjetas = filasDe(filas, tipo).map((fila) => tarjeta(fila, filas));
    return `<section><h2>${titulo} (${String(tarjetas.length)})</h2>${tarjetas.join('')}</section>`;
  });
  const avisos = avisosDelTablero(situacion, filas).map((aviso) => `<li>${escapar(aviso)}</li>`);
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Tablero de tickets</title><style>${ESTILO}</style></head>
<body>
<h1>Tablero de tickets</h1>
<p>Generado el ${escapar(generado)} a partir de origin/main y de los carriles abiertos.</p>
${avisos.length > 0 ? `<ul>${avisos.join('')}</ul>` : ''}
<div class="columnas">${columnas.join('')}</div>
<h2>Dependencias</h2>
<pre class="mermaid">${escapar(grafo(filas, situacion.cerradas))}</pre>
<script type="module">import mermaid from '${MERMAID}'; mermaid.initialize({ startOnLoad: true });</script>
</body></html>
`;
}

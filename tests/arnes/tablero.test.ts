import { describe, expect, it } from 'vitest';
import { tableroEnHtml, tableroEnTexto } from '../../scripts/arnes/comun/tablero.ts';
import { carril, situacion, ticket } from './tickets-de-prueba.ts';

/** Un ticket por estado: listo, bloqueado (por dependencia y por solape), en curso, en revisión, hecho con el carril abierto y descartado. */
const DE_CADA_ESTADO = situacion({
  tickets: [
    ticket('listo', { toca: '[src/b.ts]' }),
    ticket('espera', { area: 'MAST', depende: '[listo, PLAN]', toca: '[src/a.ts]' }),
    ticket('curso', { toca: '[src/a.ts]' }),
    ticket('revision'),
    ticket('hecho', { estado: 'hecho' }),
    ticket('tirado', { estado: 'descartado' }),
  ],
  carriles: [carril('curso'), carril('revision', { pr: 9 }), carril('hecho'), carril('suelto')],
  problemas: ['docs/tickets/roto.md: le falta el título.'],
});

describe('tableroEnTexto', () => {
  it('una sección por estado, con «make abrir» en los listos y por qué esperan los bloqueados', () => {
    const texto = tableroEnTexto(DE_CADA_ESTADO);
    expect(texto).toContain('Listo (1):\n  listo (impl/MATE): Título\n      make abrir N=listo');
    expect(texto).toContain('espera (impl/MAST): Título\n      falta listo, PLAN; se solapa con curso (src/a.ts)');
    expect(texto).toContain('En revisión (1):\n  revision (impl/MATE): Título\n      PR #9');
    expect(texto).toContain('En curso (1):');
    expect(texto).not.toContain('tirado');
  });

  it('avisa de lo que no se ha leído, de los carriles sin ticket y de los hechos sin retirar', () => {
    const texto = tableroEnTexto(DE_CADA_ESTADO);
    expect(texto).toContain('Avisos:\n  docs/tickets/roto.md: le falta el título.');
    expect(texto).toContain('El carril suelto no tiene ticket');
    expect(texto).toContain('hecho está hecho y su carril sigue abierto: make retirar N=hecho.');
  });

  it('sin tickets ni avisos, queda vacío', () => {
    expect(tableroEnTexto(situacion({}))).toBe('');
  });
});

describe('tableroEnHtml', () => {
  const html = tableroEnHtml(DE_CADA_ESTADO, '31-10-2026 12:00');

  it('las cinco columnas, con sus tarjetas, «bloquea a» y «make abrir» en los listos', () => {
    for (const titulo of ['Listo (1)', 'Bloqueado (1)', 'En curso (1)', 'En revisión (1)', 'Hecho (1)']) {
      expect(html).toContain(`<h2>${titulo}</h2>`);
    }
    expect(html).toContain('<dt>bloquea a</dt><dd><code>espera</code></dd>');
    expect(html).toContain('<pre>make abrir N=listo</pre>');
    expect(html).toContain('Generado el 31-10-2026 12:00');
  });

  it('el grafo en Mermaid, escapado, con las áreas y sin los descartados', () => {
    expect(html).toContain('ticket_listo --&gt; ticket_espera');
    expect(html).toContain('area_PLAN([&quot;área PLAN&quot;]):::area');
    expect(html).toContain('ticket_espera[&quot;espera&lt;br/&gt;impl/MAST&quot;]:::bloqueado');
    expect(html).not.toContain('ticket_tirado');
  });
});

import { describe, expect, it } from 'vitest';
import {
  estadoDeLosTickets,
  seSolapan,
  situacionDelRepositorio,
  solapesDelCarril,
} from '../../scripts/arnes/comun/estado-tickets.ts';
import type { Situacion } from '../../scripts/arnes/comun/estado-tickets.ts';
import { apartado, leerTicket, problemasDeLosTickets, ticketsDe } from '../../scripts/arnes/comun/tickets.ts';
import { commit, gitBien, principalConOrigen } from './origen.ts';
import { escribirFicheros, repositorioConCommit } from './temporal.ts';
import { carril, situacion, texto, ticket } from './tickets-de-prueba.ts';

function problemaAlLeer(contenido: string): string {
  const leido = leerTicket('uno', contenido);
  return 'problema' in leido ? leido.problema : '';
}

describe('leerTicket', () => {
  it('lee el frontmatter, las listas y el título', () => {
    const leido = ticket('uno', { depende: '[otro, MAST]', toca: '[src/a.ts, tests/unidad/]' });
    expect(leido).toMatchObject({
      id: 'uno',
      titulo: 'Título',
      fase: 'impl',
      area: 'MATE',
      depende: ['otro', 'MAST'],
      toca: ['src/a.ts', 'tests/unidad/'],
      estado: 'abierto',
    });
  });

  it('se niega sin frontmatter, sin título, con claves desconocidas o con valores que no valen', () => {
    expect(problemaAlLeer('# Título\n')).toMatch(/docs\/tickets\/uno\.md: .*frontmatter/);
    expect(problemaAlLeer(texto({}, 'Sin título\n'))).toMatch(/falta el título/);
    expect(problemaAlLeer(texto().replace('estado:', 'otra: x\nestado:'))).toMatch(/claves desconocidas.*otra/);
    expect(problemaAlLeer(texto().replace('estado:', 'sin dos puntos\nestado:'))).toMatch(/no es «clave: valor»/);
    expect(problemaAlLeer(texto({ fase: 'pruebas' }))).toMatch(/«fase»/);
    expect(problemaAlLeer(texto({ area: 'mate' }))).toMatch(/«area»/);
    expect(problemaAlLeer(texto({ estado: 'listo' }))).toMatch(/«estado»/);
    expect(problemaAlLeer(texto({ toca: 'src/a.ts' }))).toMatch(/tienen que ser listas/);
  });
});

describe('apartado', () => {
  it('da el párrafo del apartado hasta la línea en blanco, o undefined si no está', () => {
    expect(apartado(ticket('uno'), 'Hecho cuando')).toBe('make check en verde.');
    expect(apartado(ticket('uno'), 'Leer primero')).toBeUndefined();
  });
});

/** Repositorio con las áreas MATE y MAST en features/ y los tickets `ficheros` (id → texto). */
function repositorioConTickets(ficheros: Readonly<Record<string, string>>): string {
  const feature = (area: string): string =>
    `# language: es\n@${area}\nCaracterística: ${area}\n\n  @${area}-1.1\n  Escenario: E\n    Dado algo\n`;
  const tickets = Object.fromEntries(Object.entries(ficheros).map(([id, t]) => [`docs/tickets/${id}.md`, t]));
  return repositorioConCommit({
    'features/MATE.feature': feature('MATE'),
    'features/MAST.feature': feature('MAST'),
    'src/carpeta/a.ts': '',
    'docs/tickets/_plantilla.md': 'no es un ticket',
    ...tickets,
  });
}

function problemasDe(ficheros: Readonly<Record<string, string>>, cerradas: readonly string[] = []): string[] {
  const raiz = repositorioConTickets(ficheros);
  return problemasDeLosTickets(raiz, ticketsDe(raiz), cerradas);
}

describe('problemasDeLosTickets', () => {
  it('unos tickets bien escritos no tienen problemas, y la plantilla no cuenta', () => {
    expect(problemasDe({ uno: texto(), dos: texto({ depende: '[uno, MAST]', toca: '[src/carpeta/]' }) })).toEqual([]);
  });

  it('señala el fichero mal escrito, el nombre de carril, el área y las dependencias que no existen', () => {
    const problemas = problemasDe({
      roto: '# sin frontmatter\n',
      Mal_Nombre: texto(),
      tres: texto({ area: 'PANT', depende: '[nadie, CALI]' }),
    }).join('\n');
    expect(problemas).toMatch(/roto\.md: .*frontmatter/);
    expect(problemas).toMatch(/Mal_Nombre\.md: el nombre del fichero no vale/);
    expect(problemas).toMatch(/tres\.md: El área PANT no existe/);
    expect(problemas).toMatch(/tres\.md: depende de «nadie», que no es un ticket/);
    expect(problemas).toMatch(/tres\.md: El área CALI no existe/);
  });

  it('señala la dependencia de un ticket descartado y la carpeta de «toca» sin «/»', () => {
    const problemas = problemasDe({
      uno: texto({ estado: 'descartado' }),
      dos: texto({ depende: '[uno]', toca: '[src/carpeta]' }),
    });
    expect(problemas.join('\n')).toMatch(/dos\.md: depende de uno, que está descartado/);
    expect(problemas.join('\n')).toMatch(/«src\/carpeta» en «toca» es una carpeta/);
  });

  it('señala un ciclo entre tickets, también a través de un área sin cerrar', () => {
    expect(problemasDe({ uno: texto({ depende: '[dos]' }), dos: texto({ depende: '[uno]' }) })).toEqual([
      'Ciclo de dependencias sin cumplir: dos → uno → dos.',
    ]);
    const porArea = { uno: texto({ area: 'MAST', depende: '[dos]' }), dos: texto({ depende: '[MAST]' }) };
    expect(problemasDe(porArea)).toEqual(['Ciclo de dependencias sin cumplir: dos → uno → dos.']);
  });

  it('no hay ciclo si la dependencia ya está cumplida: un ticket hecho o un área cerrada', () => {
    expect(
      problemasDe({ uno: texto({ depende: '[dos]', estado: 'hecho' }), dos: texto({ depende: '[uno]' }) }),
    ).toEqual([]);
    const porArea = { uno: texto({ area: 'MAST', depende: '[dos]' }), dos: texto({ depende: '[MAST]' }) };
    expect(problemasDe(porArea, ['MAST'])).toEqual([]);
  });
});

describe('seSolapan', () => {
  const ficheros = ['src/a.ts', 'src/b/c.ts', 'tests/unidad/d.test.ts'];

  it('por fichero, por carpeta y por patrón', () => {
    expect(seSolapan(['src/a.ts'], ['src/a.ts', 'src/z.ts'], ficheros)).toEqual(['src/a.ts']);
    expect(seSolapan(['src/b/'], ['src/b/c.ts'], ficheros)).toEqual(['src/b/c.ts']);
    expect(seSolapan(['src/*.ts'], ['src/'], ficheros)).toEqual(['src/a.ts']);
    expect(seSolapan(['tests/**/*.test.ts'], ['tests/unidad/'], ficheros)).toEqual(['tests/unidad/d.test.ts']);
  });

  it('un fichero nuevo, que aún no está en el árbol, y nada si no comparten ninguno', () => {
    expect(seSolapan(['src/nuevo/'], ['src/nuevo/x.ts'], ficheros)).toEqual(['src/nuevo/x.ts']);
    expect(seSolapan(['src/b/'], ['src/a.ts', 'tests/'], ficheros)).toEqual([]);
  });

  it('sin config/alcance.json ni docs/deuda-diseno.md, que escriben casi todos los carriles', () => {
    const conCompartidos = [...ficheros, 'config/alcance.json', 'config/parametros.json', 'docs/deuda-diseno.md'];
    expect(seSolapan(['config/alcance.json', 'docs/deuda-diseno.md'], ['config/', 'docs/'], conCompartidos)).toEqual(
      [],
    );
    expect(seSolapan(['config/'], ['config/alcance.json', 'config/parametros.json'], conCompartidos)).toEqual([
      'config/parametros.json',
    ]);
  });
});

function estados(datos: Situacion): Record<string, unknown> {
  return Object.fromEntries(estadoDeLosTickets(datos).map(({ ticket: { id }, estado }) => [id, estado]));
}

describe('estadoDeLosTickets', () => {
  it('listo con las dependencias cumplidas; bloqueado con las que faltan', () => {
    const tickets = [
      ticket('hecho', { estado: 'hecho' }),
      ticket('listo', { depende: '[hecho, MAST]' }),
      ticket('espera', { depende: '[listo, MAST, PANT]' }),
    ];
    expect(estados(situacion({ tickets, cerradas: ['MAST'] }))).toEqual({
      hecho: { tipo: 'hecho', carrilSinRetirar: false },
      listo: { tipo: 'listo' },
      espera: { tipo: 'bloqueado', faltan: ['listo', 'PANT'], solapes: [] },
    });
  });

  it('bloqueado por solape con el «toca» del ticket de un carril abierto o con lo que commiteó un carril sin ticket', () => {
    const tickets = [
      ticket('uno', { toca: '[config/parametros.json]' }),
      ticket('dos', { toca: '[config/]' }),
      ticket('tres', { toca: '[src/]' }),
    ];
    const carriles = [carril('uno'), carril('sin-ticket', { commiteados: ['src/nuevo.ts'] })];
    expect(estados(situacion({ tickets, carriles }))).toMatchObject({
      dos: { tipo: 'bloqueado', faltan: [], solapes: [{ carril: 'uno', ficheros: ['config/parametros.json'] }] },
      tres: { tipo: 'bloqueado', solapes: [{ carril: 'sin-ticket', ficheros: ['src/nuevo.ts'] }] },
    });
  });

  it('listo aunque comparta config/alcance.json y docs/deuda-diseno.md con un carril abierto', () => {
    const tickets = [
      ticket('uno', { toca: '[src/a.ts, config/alcance.json, docs/deuda-diseno.md]' }),
      ticket('dos', { toca: '[src/b.ts, config/alcance.json, docs/deuda-diseno.md]' }),
    ];
    const carriles = [carril('uno', { commiteados: ['config/alcance.json'] })];
    expect(estados(situacion({ tickets, carriles }))).toMatchObject({ dos: { tipo: 'listo' } });
  });

  it('en curso con su carril abierto, en revisión con un PR, y hecho con el carril sin retirar', () => {
    const tickets = [ticket('uno'), ticket('dos'), ticket('tres', { estado: 'hecho' })];
    const carriles = [carril('uno'), carril('dos', { pr: 12 }), carril('tres')];
    expect(estados(situacion({ tickets, carriles }))).toEqual({
      uno: { tipo: 'curso' },
      dos: { tipo: 'revision', pr: 12 },
      tres: { tipo: 'hecho', carrilSinRetirar: true },
    });
  });
});

describe('solapesDelCarril', () => {
  it('compara la huella del carril con los demás carriles abiertos; nada si el carril no está abierto', () => {
    const datos = situacion({
      tickets: [ticket('uno', { toca: '[src/a.ts]' })],
      carriles: [
        carril('uno', { commiteados: ['config/parametros.json'] }),
        carril('otro', { commiteados: ['config/parametros.json'] }),
      ],
    });
    expect(solapesDelCarril('uno', datos)).toEqual([{ carril: 'otro', ficheros: ['config/parametros.json'] }]);
    expect(solapesDelCarril('cerrado', datos)).toEqual([]);
  });
});

describe('situacionDelRepositorio', () => {
  it('lee los tickets y las áreas cerradas de origin/main, y lo commiteado sin fusionar de cada carril', () => {
    const raiz = principalConOrigen({
      'config/alcance.json': JSON.stringify({ areas_cerradas: ['DIAG'] }),
      'docs/tickets/uno.md': texto(),
    });
    escribirFicheros(raiz, { 'docs/tickets/sin-subir.md': texto() });
    gitBien(raiz, ['fetch', '--quiet', 'origin']);
    gitBien(raiz, ['worktree', 'add', '--quiet', '-b', 'impl/MATE/uno', `${raiz}-uno`, 'origin/main']);
    commit(`${raiz}-uno`, 'trabajo', { 'src/b.ts': '' });
    const datos = situacionDelRepositorio(raiz, new Map([['impl/MATE/uno', 7]]));
    expect(datos.tickets.map(({ id }) => id)).toEqual(['uno']);
    expect(datos.cerradas).toEqual(['DIAG']);
    expect(datos.carriles).toEqual([{ nombre: 'uno', rama: 'impl/MATE/uno', commiteados: ['src/b.ts'], pr: 7 }]);
    expect(datos.ficheros).toContain('docs/tickets/uno.md');
  });
});

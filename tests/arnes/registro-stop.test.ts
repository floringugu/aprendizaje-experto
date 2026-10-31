import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  anotarParada,
  datosDeLaEntrada,
  formatearResumen,
  leerRegistro,
  parsearRegistro,
  relevoPasado,
  resumirArea,
} from '../../scripts/arnes/comun/registro-stop.ts';
import type { ParadaStop } from '../../scripts/arnes/comun/registro-stop.ts';
import { directorioTemporal, escribirFicheros, repositorioConWorktree } from './temporal.ts';

/** Parada de la fase impl con DIAG en curso y RECU todavía fuera de alcance, salvo que se diga otra cosa. */
function parada(cambios: Partial<ParadaStop> = {}): ParadaStop {
  return {
    fecha: '2026-10-23T10:00:00.000Z',
    sesion: 'a',
    fase: 'impl',
    resultado: 'verde',
    areasFueraDeAlcance: ['RECU'],
    ...cambios,
  };
}

function bloqueo(paso: string, cambios: Partial<ParadaStop> = {}): ParadaStop {
  return parada({ resultado: 'bloqueo', paso, ...cambios });
}

/** Anotación con el área en curso de su checkout: MATE, salvo que se diga otra cosa. */
function nueva(cambios: Partial<ParadaStop> = {}): ParadaStop {
  const { fecha, sesion, fase } = parada();
  return { fecha, sesion, fase, resultado: 'con-cambios', areasCerradas: ['DIAG'], areaEnCurso: 'MATE', ...cambios };
}

const SIN_ANOTACIONES = {
  decision: 0,
  relevo: 0,
  espera: 0,
  'sin-cambios': 0,
  'con-cambios': 0,
  'push-verde': 0,
  'push-bloqueo': 0,
  'implementador-bloqueo': 0,
  verde: 0,
  bloqueo: 0,
};

describe('parsearRegistro', () => {
  it('lee una anotación por línea y se salta las vacías, las cortadas y las que no son anotaciones', () => {
    const texto = [
      JSON.stringify(parada()),
      '',
      '{"sesion":"a","resultado":"bloq',
      JSON.stringify({ sesion: 'a', resultado: 'otro', areasFueraDeAlcance: [] }),
      JSON.stringify({ sesion: 'a', resultado: 'verde' }),
      JSON.stringify({ sesion: 'a', resultado: 'verde', areasCerradas: ['MAST'], areaEnCurso: 'MATE' }),
      'null',
      JSON.stringify(bloqueo('unidad')),
      JSON.stringify(nueva({ resultado: 'push-bloqueo', paso: 'lint', milisegundos: 1200 })),
      JSON.stringify(nueva({ resultado: 'sin-cambios', tokens: 50_000 })),
    ].join('\n');
    expect(parsearRegistro(texto).map(({ resultado }) => resultado)).toEqual([
      'verde',
      'verde',
      'bloqueo',
      'push-bloqueo',
      'sin-cambios',
    ]);
  });
});

describe('anotarParada y leerRegistro', () => {
  it('devuelve un registro vacío si el fichero aún no existe', () => {
    expect(leerRegistro(directorioTemporal())).toEqual([]);
  });

  it('añade cada anotación al final y la lee igual que se escribió', () => {
    const raiz = directorioTemporal();
    escribirFicheros(raiz, { '.claude/.vacio': '' });
    const anotaciones = [
      nueva({ resultado: 'espera', tokens: 80_000 }),
      nueva({ resultado: 'push-bloqueo', paso: 'lint', milisegundos: 61_000, carril: 'mate-pasos' }),
    ];
    for (const anotacion of anotaciones) anotarParada(raiz, anotacion);
    expect(leerRegistro(raiz)).toEqual(anotaciones);
  });
});

describe('datosDeLaEntrada', () => {
  it('lleva la conversación, la fase, las áreas y el carril del checkout', () => {
    const { worktree } = repositorioConWorktree((principal) => `${path.basename(principal)}-mate-pasos`);
    escribirFicheros(worktree, {
      '.claude/settings.local.json': JSON.stringify({ env: { ARNES_FASE: 'aceptacion', ARNES_AREA: 'MATE' } }),
      'config/alcance.json': JSON.stringify({ areas_cerradas: ['RECU', 'DIAG'] }),
    });
    const { fecha, ...datos } = datosDeLaEntrada({ session_id: 's1' }, worktree);
    expect(Date.parse(fecha)).not.toBeNaN();
    expect(datos).toEqual({
      sesion: 's1',
      fase: 'aceptacion',
      areasCerradas: ['RECU', 'DIAG'],
      areaEnCurso: 'MATE',
      carril: 'mate-pasos',
    });
  });

  it('en la carpeta principal sin área en curso no lleva ni carril ni área; sin session_id, la conversación es desconocida', () => {
    const { principal } = repositorioConWorktree(() => 'otro');
    const datos = datosDeLaEntrada({}, principal);
    expect(datos).toEqual({ fecha: datos.fecha, sesion: 'desconocida', fase: 'impl', areasCerradas: [] });
  });
});

describe('relevoPasado', () => {
  it('es cierto si la conversación ya ha parado con [RELEVO] aceptado', () => {
    expect(relevoPasado([parada(), parada({ resultado: 'relevo' }), bloqueo('unidad')], 'a')).toBe(true);
  });

  it('no cuenta el relevo de otra conversación, y es falso sin paradas', () => {
    expect(relevoPasado([parada({ sesion: 'b', resultado: 'relevo' })], 'a')).toBe(false);
    expect(relevoPasado([], 'a')).toBe(false);
  });

  it('un bloqueo, una decisión o una espera no son un relevo', () => {
    expect(
      relevoPasado([bloqueo('unidad'), parada({ resultado: 'decision' }), nueva({ resultado: 'espera' })], 'a'),
    ).toBe(false);
  });
});

describe('resumirArea', () => {
  const registro: ParadaStop[] = [
    // Antes de DIAG: DIAG aún fuera de alcance.
    bloqueo('unidad', { areasFueraDeAlcance: ['DIAG', 'RECU'] }),
    // DIAG en curso.
    bloqueo('unidad', { fecha: '2026-10-20T09:00:00.000Z' }),
    bloqueo('unidad'),
    bloqueo('unidad'),
    parada({ resultado: 'decision' }),
    parada({ resultado: 'relevo' }),
    bloqueo('lint', { sesion: 'b' }),
    // La fase specs trata todas las áreas a la vez: no cuenta.
    bloqueo('specs', { sesion: 'c', fase: 'specs' }),
    parada({ sesion: 'b' }),
    // RECU entra en alcance: empieza la siguiente área.
    bloqueo('unidad', { sesion: 'd', areasFueraDeAlcance: [] }),
  ];

  it('cuenta solo las anotaciones de la fase impl mientras el área estaba en curso', () => {
    expect(resumirArea(registro, 'DIAG')).toEqual({
      area: 'DIAG',
      desde: '2026-10-20T09:00:00.000Z',
      sesiones: 2,
      carriles: ['principal'],
      anotaciones: 7,
      porResultado: { ...SIN_ANOTACIONES, decision: 1, relevo: 1, verde: 1, bloqueo: 4 },
      pasos: {
        'push-bloqueo': [],
        'implementador-bloqueo': [],
        bloqueo: [
          ['unidad', 3],
          ['lint', 1],
        ],
      },
      medianaDelPush: undefined,
    });
  });

  it('el área siguiente empieza donde termina la anterior', () => {
    expect(resumirArea(registro, 'RECU').anotaciones).toBe(1);
  });

  it('un área que nunca estuvo en curso no tiene anotaciones', () => {
    expect(resumirArea([parada({ areasFueraDeAlcance: ['PLAN'] })], 'PLAN').anotaciones).toBe(0);
  });
});

describe('resumirArea con el área en curso de cada anotación', () => {
  it('cuenta las anotaciones de la fase impl que dicen ese área, de todas las conversaciones', () => {
    const registro = [
      nueva({ resultado: 'push-bloqueo', paso: 'lint', sesion: 'a' }),
      nueva({ resultado: 'decision', sesion: 'b' }),
      nueva({ areaEnCurso: 'MAST', sesion: 'c' }),
      // Sin área en curso: regresión pura, no es de ningún área.
      {
        fecha: '2026-10-25T10:00:00.000Z',
        sesion: 'd',
        fase: 'impl',
        resultado: 'verde',
        areasCerradas: ['DIAG'],
      } satisfies ParadaStop,
      nueva({ fase: 'aceptacion', sesion: 'e' }),
    ];
    const resumen = resumirArea(registro, 'MATE');
    expect(resumen).toMatchObject({ anotaciones: 2, sesiones: 2, porResultado: { decision: 1, 'push-bloqueo': 1 } });
    expect(resumen.pasos['push-bloqueo']).toEqual([['lint', 1]]);
    expect(resumirArea(registro, 'MAST').anotaciones).toBe(1);
  });

  it('separa los bloqueos del push, del implementador y del antiguo Stop, y da la mediana del push', () => {
    const resumen = resumirArea(
      [
        nueva({ resultado: 'push-verde', milisegundos: 90_000 }),
        nueva({ resultado: 'push-bloqueo', paso: 'lint', milisegundos: 30_000 }),
        nueva({ resultado: 'push-bloqueo', paso: 'unidad', milisegundos: 120_000 }),
        nueva({ resultado: 'push-bloqueo', paso: 'lint', milisegundos: 100_000 }),
        nueva({ resultado: 'implementador-bloqueo', paso: 'tipos' }),
        nueva({ resultado: 'bloqueo', paso: 'aceptacion' }),
        nueva({ resultado: 'espera' }),
        nueva({ resultado: 'sin-cambios' }),
      ],
      'MATE',
    );
    expect(resumen.porResultado).toEqual({
      ...SIN_ANOTACIONES,
      'push-verde': 1,
      'push-bloqueo': 3,
      'implementador-bloqueo': 1,
      bloqueo: 1,
      espera: 1,
      'sin-cambios': 1,
    });
    expect(resumen.pasos).toEqual({
      'push-bloqueo': [
        ['lint', 2],
        ['unidad', 1],
      ],
      'implementador-bloqueo': [['tipos', 1]],
      bloqueo: [['aceptacion', 1]],
    });
    // Con un número par de comprobaciones, la media de las dos centrales: 90 s y 100 s.
    expect(resumen.medianaDelPush).toBe(95_000);
  });

  it('suma las paradas antiguas, que solo copiaban las áreas fuera de alcance, a las nuevas', () => {
    const registro = [
      bloqueo('unidad', { fecha: '2026-10-22T10:00:00.000Z', areasFueraDeAlcance: ['MATE'] }),
      bloqueo('unidad', { fecha: '2026-10-23T10:00:00.000Z', areasFueraDeAlcance: [] }),
      nueva({ fecha: '2026-10-25T10:00:00.000Z' }),
    ];
    expect(resumirArea(registro, 'MATE')).toMatchObject({ anotaciones: 2, desde: '2026-10-23T10:00:00.000Z' });
  });

  it('lista los carriles de las anotaciones, sin repetir; el directorio principal es «principal»', () => {
    const registro = [
      nueva({ carril: 'mate-pasos' }),
      nueva({ carril: 'mate-limpieza' }),
      nueva(),
      nueva({ carril: 'mate-pasos' }),
      nueva({ carril: 'pant', areaEnCurso: 'PANT' }),
    ];
    expect(resumirArea(registro, 'MATE').carriles).toEqual(['mate-limpieza', 'mate-pasos', 'principal']);
  });
});

describe('formatearResumen', () => {
  it('resume el área en unas líneas para copiarlas al archivo del área', () => {
    const texto = formatearResumen(
      resumirArea(
        [
          nueva({ resultado: 'push-verde', milisegundos: 80_000 }),
          nueva({ resultado: 'push-bloqueo', paso: 'lint', milisegundos: 95_400, carril: 'mate-pasos' }),
          nueva({ resultado: 'push-verde', milisegundos: 120_000 }),
          nueva({ resultado: 'implementador-bloqueo', paso: 'unidad' }),
          nueva({ resultado: 'decision' }),
          nueva({ resultado: 'relevo' }),
          nueva({ resultado: 'espera' }),
          nueva({ resultado: 'sin-cambios' }),
          nueva({ resultado: 'con-cambios' }),
          nueva({ resultado: 'con-cambios' }),
        ],
        'MATE',
      ),
    );
    expect(texto).toBe(
      [
        'MATE: 10 anotaciones en 1 conversaciones, desde 2026-10-23T10:00:00.000Z.',
        '  - Carriles: mate-pasos, principal.',
        '  - Push: 2 en verde y 1 bloqueos (lint 1); la comprobación tarda 95 s de mediana.',
        '  - Implementador: 1 bloqueos (unidad 1).',
        '  - Paradas del hook Stop: 1 con [DECISIÓN PENDIENTE], 1 con [RELEVO], 1 esperando a subagentes, ' +
          '1 sin cambios y 2 con cambios sin commitear.',
      ].join('\n'),
    );
  });

  it('añade la comprobación del antiguo Stop solo si el área tiene alguna', () => {
    const texto = formatearResumen(resumirArea([bloqueo('aceptacion'), parada()], 'DIAG'));
    expect(texto).toBe(
      [
        'DIAG: 2 anotaciones en 1 conversaciones, desde 2026-10-23T10:00:00.000Z.',
        '  - Carriles: principal.',
        '  - Push: 0 en verde y 0 bloqueos.',
        '  - Implementador: 0 bloqueos.',
        '  - Paradas del hook Stop: 0 con [DECISIÓN PENDIENTE], 0 con [RELEVO], 0 esperando a subagentes, ' +
          '0 sin cambios y 0 con cambios sin commitear.',
        '  - Comprobación en el Stop, ya retirada: 1 en verde y 1 bloqueos (aceptacion 1).',
      ].join('\n'),
    );
  });

  it('avisa si el registro no tiene anotaciones del área', () => {
    expect(formatearResumen(resumirArea([], 'MATE'))).toMatch(/^MATE: el registro no tiene anotaciones/);
  });
});

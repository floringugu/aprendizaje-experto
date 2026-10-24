import { describe, expect, it } from 'vitest';
import {
  anotarParada,
  bloqueosSeguidos,
  formatearResumen,
  leerRegistro,
  parsearRegistro,
  resumirArea,
} from '../../scripts/arnes/comun/registro-stop.ts';
import type { ParadaStop } from '../../scripts/arnes/comun/registro-stop.ts';
import { directorioTemporal, escribirFicheros } from './temporal.ts';

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

describe('parsearRegistro', () => {
  it('lee una parada por línea y se salta las vacías, las cortadas y las que no son paradas', () => {
    const texto = [
      JSON.stringify(parada()),
      '',
      '{"sesion":"a","resultado":"bloq',
      JSON.stringify({ sesion: 'a', resultado: 'otro', areasFueraDeAlcance: [] }),
      JSON.stringify({ sesion: 'a', resultado: 'verde' }),
      JSON.stringify({ sesion: 'a', resultado: 'verde', areasCerradas: ['MAST'], areaEnCurso: 'MATE' }),
      'null',
      JSON.stringify(bloqueo('unidad')),
    ].join('\n');
    expect(parsearRegistro(texto).map(({ resultado }) => resultado)).toEqual(['verde', 'verde', 'bloqueo']);
  });
});

describe('anotarParada y leerRegistro', () => {
  it('devuelve un registro vacío si el fichero aún no existe', () => {
    expect(leerRegistro(directorioTemporal())).toEqual([]);
  });

  it('añade cada parada al final y la lee igual que se escribió', () => {
    const raiz = directorioTemporal();
    escribirFicheros(raiz, { '.claude/.vacio': '' });
    anotarParada(raiz, parada());
    anotarParada(raiz, bloqueo('lint', { seguidos: 1, entorno: 'EACCES' }));
    expect(leerRegistro(raiz)).toEqual([parada(), bloqueo('lint', { seguidos: 1, entorno: 'EACCES' })]);
  });
});

describe('bloqueosSeguidos', () => {
  it('cuenta los bloqueos del mismo paso al final de la conversación', () => {
    const registro = [bloqueo('unidad'), bloqueo('unidad'), bloqueo('unidad')];
    expect(bloqueosSeguidos(registro, 'a', 'unidad')).toBe(3);
  });

  it('empieza de cero tras una parada en verde o un bloqueo de otro paso', () => {
    expect(bloqueosSeguidos([bloqueo('unidad'), parada(), bloqueo('unidad')], 'a', 'unidad')).toBe(1);
    expect(bloqueosSeguidos([bloqueo('unidad'), bloqueo('lint')], 'a', 'unidad')).toBe(0);
    expect(bloqueosSeguidos([bloqueo('unidad'), bloqueo('lint')], 'a', 'lint')).toBe(1);
  });

  it('no mezcla conversaciones: otra conversación ni suma ni corta la racha', () => {
    const registro = [
      bloqueo('unidad'),
      bloqueo('unidad', { sesion: 'b' }),
      parada({ sesion: 'b' }),
      bloqueo('unidad'),
    ];
    expect(bloqueosSeguidos(registro, 'a', 'unidad')).toBe(2);
    expect(bloqueosSeguidos(registro, 'b', 'unidad')).toBe(0);
    expect(bloqueosSeguidos(registro, 'c', 'unidad')).toBe(0);
  });
});

describe('resumirArea', () => {
  const registro: ParadaStop[] = [
    // Antes de DIAG: DIAG aún fuera de alcance.
    bloqueo('unidad', { areasFueraDeAlcance: ['DIAG', 'RECU'] }),
    // DIAG en curso.
    bloqueo('unidad', { fecha: '2026-10-20T09:00:00.000Z', seguidos: 1 }),
    bloqueo('unidad', { seguidos: 2 }),
    bloqueo('unidad', { seguidos: 3, entorno: 'ENOSPC' }),
    parada({ resultado: 'decision' }),
    parada({ resultado: 'relevo' }),
    bloqueo('lint', { sesion: 'b', seguidos: 1 }),
    // La fase specs trata todas las áreas a la vez: no cuenta.
    bloqueo('specs', { sesion: 'c', fase: 'specs' }),
    parada({ sesion: 'b' }),
    // RECU entra en alcance: empieza la siguiente área.
    bloqueo('unidad', { sesion: 'd', areasFueraDeAlcance: [] }),
  ];

  it('cuenta solo las paradas de la fase impl mientras el área estaba en curso', () => {
    expect(resumirArea(registro, 'DIAG')).toEqual({
      area: 'DIAG',
      desde: '2026-10-20T09:00:00.000Z',
      sesiones: 2,
      paradas: 7,
      bloqueosPorPaso: [
        ['unidad', 3],
        ['lint', 1],
      ],
      erroresDeEntorno: ['ENOSPC'],
      frenos: 1,
      decisiones: 1,
      relevos: 1,
    });
  });

  it('el área siguiente empieza donde termina la anterior', () => {
    expect(resumirArea(registro, 'RECU').paradas).toBe(1);
  });

  it('un área que nunca estuvo en curso no tiene paradas', () => {
    expect(resumirArea([parada({ areasFueraDeAlcance: ['PLAN'] })], 'PLAN').paradas).toBe(0);
  });
});

describe('resumirArea con el área en curso de cada parada', () => {
  const nueva = (cambios: Partial<ParadaStop> = {}): ParadaStop => {
    const { resultado, fecha, sesion, fase } = parada();
    return { resultado, fecha, sesion, fase, areasCerradas: ['DIAG'], areaEnCurso: 'MATE', ...cambios };
  };

  it('cuenta las paradas de la fase impl que dicen ese área, de todas las conversaciones', () => {
    const registro = [
      nueva({ resultado: 'bloqueo', paso: 'lint', sesion: 'a' }),
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
    expect(resumen).toMatchObject({ paradas: 2, sesiones: 2, decisiones: 1, bloqueosPorPaso: [['lint', 1]] });
    expect(resumirArea(registro, 'MAST').paradas).toBe(1);
  });

  it('suma las paradas antiguas, que solo copiaban las áreas fuera de alcance, a las nuevas', () => {
    const registro = [
      bloqueo('unidad', { fecha: '2026-10-22T10:00:00.000Z', areasFueraDeAlcance: ['MATE'] }),
      bloqueo('unidad', { fecha: '2026-10-23T10:00:00.000Z', areasFueraDeAlcance: [] }),
      nueva({ fecha: '2026-10-25T10:00:00.000Z' }),
    ];
    expect(resumirArea(registro, 'MATE')).toMatchObject({ paradas: 2, desde: '2026-10-23T10:00:00.000Z' });
  });
});

describe('formatearResumen', () => {
  it('resume el área en unas líneas para copiarlas al archivo del área', () => {
    const texto = formatearResumen(
      resumirArea(
        [
          bloqueo('unidad', { seguidos: 3, entorno: 'EACCES' }),
          parada({ resultado: 'decision' }),
          parada({ resultado: 'relevo' }),
        ],
        'DIAG',
      ),
    );
    expect(texto).toBe(
      [
        'DIAG: 3 paradas del hook Stop en 1 conversaciones, desde 2026-10-23T10:00:00.000Z.',
        '  - Bloqueos: 1 (unidad 1).',
        '  - Por el entorno: 1 (EACCES).',
        '  - Con el freno (3.º bloqueo seguido o más): 1.',
        '  - Paradas con [DECISIÓN PENDIENTE]: 1.',
        '  - Paradas con [RELEVO]: 1.',
      ].join('\n'),
    );
  });

  it('avisa si el registro no tiene paradas del área', () => {
    expect(formatearResumen(resumirArea([], 'MATE'))).toMatch(/^MATE: el registro no tiene paradas/);
  });
});

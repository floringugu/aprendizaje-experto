import { describe, expect, it } from 'vitest';
import {
  hayQueEsperarAlPr,
  leerPr,
  leerStream,
  MAXIMO_DE_REANUDACIONES,
  MAXIMO_DE_RELEVOS,
  queHacer,
  ventanaDesde,
} from '../../scripts/arnes/comun/despachador.ts';
import type { Observacion, PrDelCarril } from '../../scripts/arnes/comun/despachador.ts';
import { anotarEnElDiario, leerDiario, textoDeLaManana, ultimaNoche } from '../../scripts/arnes/comun/diario-noche.ts';
import type { Anotacion } from '../../scripts/arnes/comun/diario-noche.ts';
import { directorioTemporal, escribirFicheros } from './temporal.ts';

const AHORA = new Date('2026-11-15T02:00:00');
const FIN = new Date('2026-11-15T07:00:00');

/** Una sesión que termina sin nada que contar, salvo lo que diga `cambios`. */
function observacion(cambios: Partial<Observacion>): Observacion {
  return {
    parada: undefined,
    pr: undefined,
    error: undefined,
    reinicioDelLimite: undefined,
    relevos: 0,
    reanudaciones: 0,
    ahora: AHORA,
    fin: FIN,
    ...cambios,
  };
}

function pr(cambios: Partial<PrDelCarril>): PrDelCarril {
  return { numero: 42, estado: 'abierto', ci: 'verde', ...cambios };
}

describe('queHacer: una fila de la tabla de reglas de parada, un test', () => {
  it('tras un relevo lanza una sesión nueva, hasta 4 por ticket; después, cola', () => {
    expect(queHacer(observacion({ parada: 'relevo' }))).toEqual({ tipo: 'sesion-nueva' });
    expect(queHacer(observacion({ parada: 'relevo', relevos: MAXIMO_DE_RELEVOS - 1 }))).toEqual({
      tipo: 'sesion-nueva',
    });
    expect(queHacer(observacion({ parada: 'relevo', relevos: MAXIMO_DE_RELEVOS }))).toMatchObject({ tipo: 'cola' });
  });

  it('una decisión pendiente va a la cola, también si ya hay PR', () => {
    const motivo = 'paró con una decisión pendiente';
    expect(queHacer(observacion({ parada: 'decision' }))).toEqual({ tipo: 'cola', motivo });
    expect(queHacer(observacion({ parada: 'decision', pr: pr({}) }))).toEqual({ tipo: 'cola', motivo });
  });

  it('los cambios sin commitear van a la cola', () => {
    const accion = queHacer(observacion({ parada: 'con-cambios' }));
    expect(accion).toEqual({ tipo: 'cola', motivo: 'paró con cambios sin commitear' });
  });

  it('sin cambios ni PR reanuda la sesión, hasta 2 veces; después, cola', () => {
    expect(queHacer(observacion({ parada: 'sin-cambios' }))).toEqual({ tipo: 'reanudar' });
    const penultima = observacion({ parada: 'sin-cambios', reanudaciones: MAXIMO_DE_REANUDACIONES - 1 });
    expect(queHacer(penultima)).toEqual({ tipo: 'reanudar' });
    const agotadas = observacion({ parada: 'sin-cambios', reanudaciones: MAXIMO_DE_REANUDACIONES });
    expect(queHacer(agotadas)).toMatchObject({ tipo: 'cola' });
  });

  it('un PR con la CI en rojo va a la cola', () => {
    const accion = queHacer(observacion({ parada: 'sin-cambios', pr: pr({ ci: 'rojo' }) }));
    expect(accion).toEqual({ tipo: 'cola', motivo: 'el PR #42 tiene la CI en rojo' });
  });

  it('un PR abierto con la CI en verde espera el visto bueno: cola', () => {
    const accion = queHacer(observacion({ parada: 'sin-cambios', pr: pr({}) }));
    expect(accion).toEqual({ tipo: 'cola', motivo: 'el PR #42 tiene la CI en verde y espera tu visto bueno' });
  });

  it('un PR fusionado es «hecho», diga lo que diga la parada', () => {
    const fusionado = pr({ estado: 'fusionado' });
    expect(queHacer(observacion({ parada: 'sin-cambios', pr: fusionado }))).toEqual({ tipo: 'hecho', pr: 42 });
    expect(queHacer(observacion({ parada: 'decision', pr: fusionado }))).toEqual({ tipo: 'hecho', pr: 42 });
    expect(queHacer(observacion({ error: 'connection_failed', pr: fusionado }))).toEqual({ tipo: 'hecho', pr: 42 });
  });

  it('con el límite agotado espera al reinicio si cae dentro de la ventana; si no, termina la noche', () => {
    const dentro = new Date('2026-11-15T04:00:00');
    const agotado = { parada: 'sin-cambios', error: 'rate_limit' } as const;
    expect(queHacer(observacion({ ...agotado, reinicioDelLimite: dentro }))).toEqual({
      tipo: 'esperar',
      hasta: dentro,
    });
    expect(queHacer(observacion({ ...agotado, reinicioDelLimite: FIN }))).toMatchObject({ tipo: 'fin' });
  });
});

describe('queHacer: lo que la tabla no nombra', () => {
  it('otro error de la sesión (un corte de red) termina la noche: el ticket siguiente acabaría igual', () => {
    const accion = queHacer(observacion({ parada: 'sin-cambios', error: 'connection_failed' }));
    expect(accion).toEqual({ tipo: 'fin', motivo: 'la sesión terminó con un error: connection_failed' });
  });

  it('con la ventana cerrada no lanza ni reanuda ninguna sesión', () => {
    expect(queHacer(observacion({ parada: 'relevo', ahora: FIN }))).toMatchObject({ tipo: 'cola' });
    expect(queHacer(observacion({ parada: 'sin-cambios', ahora: FIN }))).toMatchObject({ tipo: 'cola' });
  });

  it('un relevo con PR abierto sigue siendo un relevo: el trabajo no ha terminado', () => {
    expect(queHacer(observacion({ parada: 'relevo', pr: pr({}) }))).toEqual({ tipo: 'sesion-nueva' });
  });

  it('un PR cerrado sin fusionar, o con la CI sin terminar a tiempo, va a la cola con su motivo', () => {
    const cerrado = queHacer(observacion({ pr: pr({ estado: 'cerrado' }) }));
    expect(cerrado).toEqual({ tipo: 'cola', motivo: 'el PR #42 está cerrado sin fusionar' });
    const pendiente = queHacer(observacion({ pr: pr({ ci: 'pendiente' }) }));
    expect(pendiente).toEqual({ tipo: 'cola', motivo: 'el PR #42 sigue con la CI sin terminar' });
  });

  it('una sesión sin parada anotada y sin PR va a la cola', () => {
    expect(queHacer(observacion({}))).toMatchObject({ tipo: 'cola' });
  });
});

describe('ventanaDesde', () => {
  it('cada hora es la próxima vez que el reloj la marca', () => {
    const ventana = ventanaDesde(new Date('2026-11-15T00:30:00'), '07:00', '06:00');
    expect(ventana).toEqual({ fin: new Date('2026-11-15T07:00:00'), ultimoTicket: new Date('2026-11-15T06:00:00') });
    const deDia = ventanaDesde(new Date('2026-11-14T16:00:00'), '07:00', '06:00');
    expect(deDia?.fin).toEqual(new Date('2026-11-15T07:00:00'));
  });

  it('si la hora del último ticket ya pasó, no se abre ninguno', () => {
    const inicio = new Date('2026-11-15T06:30:00');
    expect(ventanaDesde(inicio, '07:00', '06:00')).toEqual({
      fin: new Date('2026-11-15T07:00:00'),
      ultimoTicket: inicio,
    });
  });

  it('undefined si una hora está mal escrita', () => {
    expect(ventanaDesde(AHORA, '7', '06:00')).toBeUndefined();
    expect(ventanaDesde(AHORA, '07:00', '24:00')).toBeUndefined();
  });
});

/** Una línea del stream guardado: la hora, un tabulador y el evento. */
function linea(evento: Record<string, unknown>): string {
  return `2026-11-15T02:00:00.000Z\t${JSON.stringify({ session_id: 'sesion-1', ...evento })}`;
}

function limite(estadoDeCincoHoras: string): string {
  const unifiedWindows = {
    five_hour: { utilization: 1, resetsAt: 1794700800, status: estadoDeCincoHoras },
    seven_day: { utilization: 0.3, resetsAt: 1795064400, status: 'allowed' },
  };
  return linea({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows } });
}

describe('leerStream', () => {
  const inicio = linea({ type: 'system', subtype: 'init' });

  it('una sesión que termina bien: su id, sin error', () => {
    const texto = [inicio, limite('allowed'), linea({ type: 'result', subtype: 'success', is_error: false })].join(
      '\n',
    );
    expect(leerStream(texto)).toEqual({ sesion: 'sesion-1', error: undefined, reinicioDelLimite: undefined });
  });

  it('tras un corte de red: «is_error» con el «subtype» en success, y el texto del «api_error»', () => {
    const caida = linea({ type: 'assistant', error: 'server_error', api_error: 'connection_failed' });
    const resultado = linea({ type: 'result', subtype: 'success', is_error: true });
    const texto = [inicio, limite('allowed_warning'), caida, resultado, 'línea cortada {"type":'].join('\n');
    expect(leerStream(texto)).toEqual({ sesion: 'sesion-1', error: 'connection_failed', reinicioDelLimite: undefined });
  });

  it('con una ventana de uso rechazada y error, dice cuándo se reinicia', () => {
    const texto = [inicio, limite('rejected'), linea({ type: 'result', is_error: true })].join('\n');
    expect(leerStream(texto).reinicioDelLimite).toEqual(new Date(1794700800 * 1000));
  });

  it('un stream vacío no tiene sesión ni error', () => {
    expect(leerStream('')).toEqual({ sesion: undefined, error: undefined, reinicioDelLimite: undefined });
  });
});

describe('leerPr y hayQueEsperarAlPr', () => {
  const bien = { status: 'COMPLETED', conclusion: 'SUCCESS' };

  function deGitHub(statusCheckRollup: unknown[], autoMergeRequest: unknown = null): unknown {
    return { number: 7, state: 'OPEN', autoMergeRequest, statusCheckRollup };
  }

  it('la CI: rojo si algo ha fallado, pendiente si falta algo o no hay nada, verde si todo ha pasado', () => {
    expect(leerPr(deGitHub([bien, { status: 'COMPLETED', conclusion: 'SKIPPED' }]))?.ci).toBe('verde');
    expect(leerPr(deGitHub([bien, { status: 'IN_PROGRESS', conclusion: '' }]))?.ci).toBe('pendiente');
    expect(leerPr(deGitHub([]))?.ci).toBe('pendiente');
    const fallo = { status: 'COMPLETED', conclusion: 'FAILURE' };
    expect(leerPr(deGitHub([fallo, { status: 'QUEUED', conclusion: '' }]))?.ci).toBe('rojo');
    expect(leerPr(deGitHub([{ state: 'ERROR' }]))?.ci).toBe('rojo');
  });

  it('el estado y la fusión automática', () => {
    expect(leerPr(deGitHub([bien]))).toEqual({ numero: 7, estado: 'abierto', ci: 'verde', fusionAutomatica: false });
    expect(leerPr(deGitHub([bien], { enabledAt: '2026-11-15' }))?.fusionAutomatica).toBe(true);
    expect(leerPr({ number: 7, state: 'MERGED', statusCheckRollup: [bien] })?.estado).toBe('fusionado');
    expect(leerPr(undefined)).toBeUndefined();
    expect(leerPr({ number: 7, state: 'RARO' })).toBeUndefined();
  });

  it('se espera mientras la CI no termina, o está en verde y el PR se fusiona solo', () => {
    const abierto = { numero: 7, estado: 'abierto', ci: 'verde', fusionAutomatica: false } as const;
    expect(hayQueEsperarAlPr(abierto)).toBe(false);
    expect(hayQueEsperarAlPr({ ...abierto, fusionAutomatica: true })).toBe(true);
    expect(hayQueEsperarAlPr({ ...abierto, ci: 'pendiente' })).toBe(true);
    expect(hayQueEsperarAlPr({ ...abierto, ci: 'rojo', fusionAutomatica: true })).toBe(false);
    expect(hayQueEsperarAlPr({ ...abierto, estado: 'fusionado', fusionAutomatica: true })).toBe(false);
  });
});

describe('el diario y el resumen de la mañana', () => {
  const noche: Anotacion[] = [
    { fecha: '2026-11-14T01:00:00', tipo: 'inicio', fin: '', ultimoTicket: '' },
    { fecha: '2026-11-14T01:01:00', tipo: 'decision', ticket: 'viejo', accion: { tipo: 'hecho', pr: 1 } },
    { fecha: '2026-11-15T00:30:00', tipo: 'inicio', fin: '', ultimoTicket: '' },
    { fecha: '2026-11-15T00:31:00', tipo: 'sesion', ticket: 'uno', stream: 'uno.tsv', reanudada: false },
    { fecha: '2026-11-15T00:50:00', tipo: 'decision', ticket: 'uno', accion: { tipo: 'sesion-nueva' } },
    { fecha: '2026-11-15T00:51:00', tipo: 'sesion', ticket: 'uno', stream: 'uno-2.tsv', reanudada: false },
    { fecha: '2026-11-15T01:10:00', tipo: 'decision', ticket: 'uno', accion: { tipo: 'hecho', pr: 50 } },
    { fecha: '2026-11-15T01:11:00', tipo: 'sesion', ticket: 'dos', stream: 'dos.tsv', reanudada: false },
    {
      fecha: '2026-11-15T01:30:00',
      tipo: 'decision',
      ticket: 'dos',
      accion: { tipo: 'cola', motivo: 'paró con una decisión pendiente' },
    },
    { fecha: '2026-11-15T01:31:00', tipo: 'sesion', ticket: 'tres', stream: 'tres.tsv', reanudada: false },
  ];

  it('ultimaNoche: los tickets desde el último inicio, con sus sesiones y su última decisión', () => {
    expect(ultimaNoche([])).toBeUndefined();
    expect(ultimaNoche(noche)).toEqual({
      inicio: '2026-11-15T00:30:00',
      fin: undefined,
      tickets: [
        { ticket: 'uno', sesiones: 2, accion: { tipo: 'hecho', pr: 50 }, avisos: [] },
        { ticket: 'dos', sesiones: 1, accion: { tipo: 'cola', motivo: 'paró con una decisión pendiente' }, avisos: [] },
        { ticket: 'tres', sesiones: 1, accion: undefined, avisos: [] },
      ],
    });
  });

  it('textoDeLaManana: lo fusionado y la cola, con el motivo y el estado de ahora del PR', () => {
    const fin: Anotacion = {
      fecha: '2026-11-15T01:40:00',
      tipo: 'fin',
      motivo: 'no quedan tickets listos y aprobados',
    };
    const aviso: Anotacion = {
      fecha: '2026-11-15T01:10:30',
      tipo: 'aviso',
      ticket: 'uno',
      texto: 'El carril no se ha retirado.',
    };
    const resumen = ultimaNoche([...noche.slice(0, 7), aviso, ...noche.slice(7), fin]);
    if (resumen === undefined) throw new Error('falta la noche');
    const texto = textoDeLaManana(resumen, (ticket) => (ticket === 'dos' ? 'PR #51 abierto' : ''));
    expect(texto).toContain('terminó a las 01:40: no quedan tickets listos y aprobados.');
    expect(texto).toContain('Fusionado (1):\n  uno: PR #50 fusionado (2 sesiones). El carril no se ha retirado.');
    expect(texto).toContain(
      'Cola de la mañana (2):\n  dos: paró con una decisión pendiente (1 sesión). Ahora: PR #51 abierto.',
    );
    expect(texto).toContain('  tres: la noche se cortó con su sesión a medias (1 sesión).');
  });

  it('anotarEnElDiario y leerDiario: una línea por suceso, con su fecha; las líneas que no son anotaciones se saltan', () => {
    const principal = directorioTemporal();
    escribirFicheros(principal, { 'reports/noche/diario.jsonl': 'basura\n{"otra":"cosa"}\n' });
    anotarEnElDiario(principal, { tipo: 'fin', motivo: 'prueba' });
    const [anotacion, ...resto] = leerDiario(principal);
    expect(resto).toEqual([]);
    expect(anotacion).toMatchObject({ tipo: 'fin', motivo: 'prueba' });
    expect(Number.isNaN(Date.parse(anotacion?.fecha ?? ''))).toBe(false);
  });
});

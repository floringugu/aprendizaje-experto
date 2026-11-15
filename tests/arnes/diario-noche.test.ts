import { describe, expect, it } from 'vitest';
import { anotarEnElDiario, leerDiario, textoDeLaManana, ultimaNoche } from '../../scripts/arnes/comun/diario-noche.ts';
import type { Anotacion } from '../../scripts/arnes/comun/diario-noche.ts';
import { directorioTemporal, escribirFicheros } from './temporal.ts';

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

  it('textoDeLaManana: lo fusionado en un lote dice en cuál', () => {
    const resumen = ultimaNoche([
      { fecha: '2026-11-15T00:30:00', tipo: 'inicio', fin: '', ultimoTicket: '' },
      { fecha: '2026-11-15T00:31:00', tipo: 'sesion', ticket: 'uno', stream: 'uno.tsv', reanudada: false },
      {
        fecha: '2026-11-15T01:10:00',
        tipo: 'decision',
        ticket: 'uno',
        accion: { tipo: 'hecho', pr: 50, base: 'lote/1' },
      },
      { fecha: '2026-11-15T01:11:00', tipo: 'sesion', ticket: 'dos', stream: 'dos.tsv', reanudada: false },
      {
        fecha: '2026-11-15T01:30:00',
        tipo: 'decision',
        ticket: 'dos',
        accion: { tipo: 'hecho', pr: 51, base: 'main' },
      },
    ]);
    if (resumen === undefined) throw new Error('falta la noche');
    const texto = textoDeLaManana(resumen, () => '');
    expect(texto).toContain('  uno: PR #50 fusionado en lote/1 (1 sesión).');
    expect(texto).toContain('  dos: PR #51 fusionado (1 sesión).');
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

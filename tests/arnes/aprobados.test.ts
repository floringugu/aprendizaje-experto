import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { aprobar, leerAprobados, quitarAprobado } from '../../scripts/arnes/comun/aprobados.ts';
import { directorioTemporal } from './temporal.ts';

describe('la lista de aprobados', () => {
  it('no hay ninguno si la lista no existe', () => {
    expect(leerAprobados(path.join(directorioTemporal(), 'aprobados'))).toEqual([]);
  });

  it('aprobar crea la lista con su carpeta y guarda los tickets en el orden en que se aprueban, sin repetir', () => {
    const ruta = path.join(directorioTemporal(), 'carpeta', 'aprobados');
    expect(aprobar(ruta, 'dos')).toEqual(['dos']);
    expect(aprobar(ruta, 'uno')).toEqual(['dos', 'uno']);
    expect(aprobar(ruta, 'dos')).toEqual(['dos', 'uno']);
    expect(readFileSync(ruta, 'utf8')).toBe('dos\nuno\n');
    expect(leerAprobados(ruta)).toEqual(['dos', 'uno']);
  });

  it('quitarAprobado quita solo ese ticket; si no estaba, la lista queda igual', () => {
    const ruta = path.join(directorioTemporal(), 'aprobados');
    aprobar(ruta, 'uno');
    aprobar(ruta, 'dos');
    expect(quitarAprobado(ruta, 'tres')).toEqual(['uno', 'dos']);
    expect(quitarAprobado(ruta, 'uno')).toEqual(['dos']);
    expect(leerAprobados(ruta)).toEqual(['dos']);
  });
});

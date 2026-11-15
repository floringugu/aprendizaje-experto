import type { Dependencias } from '../../src/aplicacion/dependencias.ts';
import type { Ficheros, ParametrosJson } from '../../src/aplicacion/puertos.ts';

/** El momento que da el reloj de `dependenciasDePrueba`. */
export const AHORA = new Date('2026-01-01T00:00:00Z');

const sinUso = (): never => {
  throw new Error('Este test no usa este puerto');
};

/**
 * Las dependencias de un test de las sesiones: solo hacen algo los ficheros, el reloj (siempre `AHORA`)
 * y los parámetros, que se leen con `leer` en cada llamada. El resto es relleno, y usarlo es un error.
 */
export function dependenciasDePrueba(ficheros: Ficheros, leer: () => ParametrosJson): Dependencias {
  return {
    ficheros,
    reloj: { ahora: () => AHORA },
    leerParametros: leer,
    direccion: 'http://192.168.1.20:3000',
    planificadorFsrs: { programar: sinUso, recalcular: sinUso },
    leerIa: () => undefined,
    libreOffice: { instalado: () => Promise.resolve(false), convertirAPdf: sinUso },
    web: { descargar: () => Promise.resolve(undefined) },
    claudeCode: { iniciarSesion: sinUso, estado: () => Promise.resolve({ iniciada: false }) },
    temporizador: { programar: () => () => undefined },
  };
}

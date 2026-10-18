import type { CasosDeBucle } from './bucle.ts';
import type { Dependencias } from './dependencias.ts';
import type { CasosDeDominio } from './dominio.ts';
import type { CasosDeExportacion } from './exportacion.ts';
import type { CasosDeHoras } from './horas.ts';
import { sinImplementar } from './sin-implementar.ts';
import type { CasosDeSesiones } from './sesiones.ts';
import type { CasosDeTareas } from './tareas.ts';

/**
 * Todos los casos de uso de una persona. Cada llamada a `crearAplicacion` es una persona distinta,
 * con su propio progreso (los escenarios de calibración comparan a dos personas).
 */
export type Aplicacion = CasosDeDominio &
  CasosDeSesiones &
  CasosDeBucle &
  CasosDeHoras &
  CasosDeTareas &
  CasosDeExportacion;

/**
 * Etapa 3: los casos de uso están vacíos y lanzan «Sin implementar», para que los escenarios de
 * aceptación fallen de verdad. La etapa 4 los implementa área por área.
 */
export const crearAplicacion: (dependencias: Dependencias) => Aplicacion = () => ({
  abrirDominio: sinImplementar,
  terminarDiagnostico: sinImplementar,
  consultarProgreso: sinImplementar,
  consultarObjetivo: sinImplementar,
  evaluarObjetivo: sinImplementar,
  evaluarFase: sinImplementar,
  iniciarSesion: sinImplementar,
  presentarItem: sinImplementar,
  estudiarEjemplo: sinImplementar,
  responderItem: sinImplementar,
  declararConfianza: sinImplementar,
  consultarRepasos: sinImplementar,
  consultarHorizontes: sinImplementar,
  elegirHorizonte: sinImplementar,
  abrirSesion: sinImplementar,
  ejecutarBucle: sinImplementar,
  terminarBucle: sinImplementar,
  registrarHoras: sinImplementar,
  consultarHoras: sinImplementar,
  pedirTarea: sinImplementar,
  consultarTareas: sinImplementar,
  registrarEvaluacionExterna: sinImplementar,
  consultarEvaluacionTarea: sinImplementar,
  evaluarNivelExperto: sinImplementar,
  exportarCsv: sinImplementar,
  listarExportaciones: sinImplementar,
});

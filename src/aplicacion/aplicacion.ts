import type { CasosDeBucle } from './bucle.ts';
import type { CasosDeClaudeCode } from './claude-code.ts';
import { consultarObjetivo, evaluarFase, evaluarObjetivo } from './criterio-dominio.ts';
import { exportarCsv } from './csv.ts';
import type { Dependencias } from './dependencias.ts';
import { abrirDominio, terminarDiagnostico } from './diagnostico.ts';
import type { CasosDeDominio } from './dominio.ts';
import type { Entorno } from './estado.ts';
import { EstadoPersona } from './estado.ts';
import type { CasosDeExportacion } from './exportacion.ts';
import type { CasosDeHoras } from './horas.ts';
import { crearInicioSesion } from './inicio-sesion.ts';
import { anadirMaterial, listarMaterial, type CasosDeMaterial } from './material.ts';
import { evaluarNivelExperto } from './nivel-experto.ts';
import { iniciarSesion } from './practica.ts';
import { consultarProgreso } from './progreso.ts';
import { consultarRepasos } from './repasos.ts';
import { crearRevisionDelMaterial, type CasosDeRevision } from './revision-del-material.ts';
import { declararConfianza, presentarItem, responderItem } from './respuestas.ts';
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
  CasosDeExportacion &
  CasosDeMaterial &
  CasosDeClaudeCode;

/** Lo que falta del material propio (MATE). */
const CASOS_DE_MATERIAL: Omit<CasosDeMaterial, 'anadirMaterial' | 'listarMaterial' | keyof CasosDeRevision> = {
  redactarBorrador: sinImplementar,
  verFuente: sinImplementar,
};

/**
 * La etapa 4 implementa los casos de uso área por área. Los de las áreas que faltan lanzan «Sin
 * implementar», para que sus escenarios de aceptación fallen de verdad.
 */
export const crearAplicacion: (dependencias: Dependencias) => Aplicacion = (dependencias) => {
  const entorno: Entorno = { dependencias, persona: new EstadoPersona() };
  return {
    abrirDominio: (peticion) => abrirDominio(entorno, peticion),
    terminarDiagnostico: (peticion) => terminarDiagnostico(entorno, peticion),
    consultarProgreso: (peticion) => consultarProgreso(entorno, peticion),
    consultarObjetivo: (peticion) => consultarObjetivo(entorno, peticion),
    evaluarObjetivo: (peticion) => evaluarObjetivo(entorno, peticion),
    evaluarFase: (peticion) => evaluarFase(entorno, peticion),
    iniciarSesion: (peticion) => iniciarSesion(entorno, peticion),
    presentarItem: (peticion) => presentarItem(entorno, peticion),
    estudiarEjemplo: sinImplementar,
    responderItem: (peticion) => responderItem(entorno, peticion),
    declararConfianza: (peticion) => declararConfianza(entorno, peticion),
    consultarRepasos: (peticion) => consultarRepasos(entorno, peticion),
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
    evaluarNivelExperto: (peticion) => evaluarNivelExperto(entorno, peticion),
    exportarCsv: (peticion) => exportarCsv(entorno, peticion),
    listarExportaciones: sinImplementar,
    anadirMaterial: (peticion) => anadirMaterial(dependencias, peticion),
    listarMaterial: (peticion) => listarMaterial(dependencias.ficheros, peticion),
    ...CASOS_DE_MATERIAL,
    ...crearRevisionDelMaterial(dependencias.ficheros),
    ...crearInicioSesion(dependencias.claudeCode, dependencias.temporizador),
  };
};

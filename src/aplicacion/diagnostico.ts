import type { EntradaDiagnostico } from '../dominio/diagnostico.ts';
import { evaluarDiagnostico, pasosRetiradosIniciales, problemasIntercalables } from '../dominio/diagnostico.ts';
import { intercalarPorTurnos } from '../dominio/turnos.ts';
import type { ContenidoDominio, ItemContenido } from './contenido.ts';
import { itemsDelObjetivo } from './contenido.ts';
import type { AperturaDominio, ResultadoDiagnostico } from './dominio.ts';
import type { Entorno, Situacion } from './estado.ts';
import { diagnosticoPendiente, enDominio, MOTIVO_DIAGNOSTICO_TERMINADO } from './estado.ts';
import { parametroNumerico } from './parametros.ts';
import type { PeticionDominio } from './peticiones.ts';
import { presentar } from './presentacion.ts';
import type { ParametrosJson } from './puertos.ts';
import type { Resultado } from './resultado.ts';
import { aceptar, rechazar } from './resultado.ts';
import type { Sesion } from './sesiones.ts';

/** Solo los ítems que el autor marcó para el diagnóstico, en el orden del contenido. */
function itemsDeDiagnostico(contenido: ContenidoDominio): readonly ItemContenido[] {
  return contenido.items.filter((item) => item.diagnostico);
}

/**
 * Solo ítems, sin ejemplos resueltos ni preguntas sobre lo que la persona cree saber (@DIAG-1.2), y
 * mezclados por turnos entre objetivos para que el orden no delate el tipo de problema (@DIAG-1.3).
 */
function sesionDeDiagnostico(contenido: ContenidoDominio): Sesion {
  const items = itemsDeDiagnostico(contenido);
  const porObjetivo = contenido.objetivos.map((objetivo) => itemsDelObjetivo(items, objetivo.id));
  return {
    tipo: 'diagnostico',
    intercalada: false,
    elementos: intercalarPorTurnos(porObjetivo).map((item) => ({ tipo: 'item', item: presentar(item) })),
  };
}

/** Al abrir un dominio nuevo, lo primero es el diagnóstico (@DIAG-1.1). */
export function abrirDominio(entorno: Entorno, peticion: PeticionDominio): Resultado<AperturaDominio> {
  return enDominio<AperturaDominio>(entorno, peticion.dominio, ({ contenido, estado }) => {
    if (!diagnosticoPendiente(estado)) {
      return aceptar({ diagnosticoPendiente: false });
    }
    return aceptar({ diagnosticoPendiente: true, diagnostico: sesionDeDiagnostico(contenido) });
  });
}

function entradaDelDiagnostico(situacion: Situacion, parametros: ParametrosJson): EntradaDiagnostico {
  const { contenido, estado } = situacion;
  const items = itemsDeDiagnostico(contenido);
  return {
    objetivos: contenido.objetivos.map((objetivo) => ({
      id: objetivo.id,
      items: itemsDelObjetivo(items, objetivo.id).map((item) => item.id),
    })),
    problemasIntercalables: problemasIntercalables(items, contenido.categorias),
    respuestas: estado.ultimoIntentoDeCadaItem('diagnostico'),
    umbralDominio: parametroNumerico(parametros, 'umbral_dominio'),
    umbralPasoAAvanzado: parametroNumerico(parametros, 'umbral_paso_a_avanzado'),
  };
}

/** Los pasos que el diagnóstico retira de los ejemplos resueltos de cada objetivo (@DIAG-2.5). */
function pasosRetiradosTrasDiagnostico(
  contenido: ContenidoDominio,
  resultado: ResultadoDiagnostico,
): ReadonlyMap<string, number> {
  return new Map(
    contenido.objetivos.map((objetivo) => {
      const dominado = resultado.objetivosDominados.includes(objetivo.id);
      const pasosDeCadaEjemplo = objetivo.ejemplos_resueltos.map((ejemplo) => ejemplo.pasos.length);
      return [objetivo.id, pasosRetiradosIniciales(dominado, pasosDeCadaEjemplo)];
    }),
  );
}

/**
 * Corrige el diagnóstico con el último intento de cada ítem y deja a la persona en su fase y su ruta.
 * Si la persona deja algún ítem de un objetivo sin responder, ese objetivo no tiene acierto medido y
 * no queda dominado.
 */
export function terminarDiagnostico(entorno: Entorno, peticion: PeticionDominio): Resultado<ResultadoDiagnostico> {
  return enDominio(entorno, peticion.dominio, (situacion) => {
    if (!diagnosticoPendiente(situacion.estado)) {
      return rechazar(MOTIVO_DIAGNOSTICO_TERMINADO);
    }
    const resultado = evaluarDiagnostico(entradaDelDiagnostico(situacion, entorno.dependencias.leerParametros()));
    situacion.estado.cerrarDiagnostico({
      fase: resultado.fase,
      dominados: resultado.objetivosDominados,
      pasosRetirados: pasosRetiradosTrasDiagnostico(situacion.contenido, resultado),
    });
    return aceptar(resultado);
  });
}

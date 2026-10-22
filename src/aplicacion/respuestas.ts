import { esCorrecta, respuestaMostrada } from '../dominio/correccion.ts';
import type { ItemContenido } from './contenido.ts';
import type { Entorno, Situacion } from './estado.ts';
import {
  diagnosticoPendiente,
  enDominio,
  MOTIVO_DIAGNOSTICO_PENDIENTE,
  MOTIVO_DIAGNOSTICO_TERMINADO,
} from './estado.ts';
import { presentar } from './presentacion.ts';
import type { Resultado } from './resultado.ts';
import { aceptar, rechazar } from './resultado.ts';
import type { CasosDeSesiones, ContextoRespuesta, Feedback, ItemPresentado } from './sesiones.ts';

// Las peticiones de cada caso de uso, sacadas de su firma en `CasosDeSesiones`.
type PeticionItem = Parameters<CasosDeSesiones['presentarItem']>[0];
type PeticionRespuesta = Parameters<CasosDeSesiones['responderItem']>[0];
type PeticionConfianza = Parameters<CasosDeSesiones['declararConfianza']>[0];

function buscarItem(situacion: Situacion, id: string): ItemContenido | undefined {
  return situacion.contenido.items.find((item) => item.id === id);
}

/**
 * Mientras el diagnóstico está pendiente solo se responden sus ítems; después ya no se responde
 * ninguno como parte del diagnóstico (@DIAG-1.1).
 */
function motivoParaNoResponder(
  situacion: Situacion,
  item: ItemContenido,
  contexto: ContextoRespuesta,
): string | undefined {
  const enDiagnostico = diagnosticoPendiente(situacion.estado);
  if (enDiagnostico && contexto !== 'diagnostico') {
    return MOTIVO_DIAGNOSTICO_PENDIENTE;
  }
  if (!enDiagnostico && contexto === 'diagnostico') {
    return MOTIVO_DIAGNOSTICO_TERMINADO;
  }
  if (contexto === 'diagnostico' && !item.diagnostico) {
    return `El ítem ${item.id} no forma parte del diagnóstico.`;
  }
  return undefined;
}

function itemQueSePuedeResponder(situacion: Situacion, peticion: PeticionItem): Resultado<ItemContenido> {
  const item = buscarItem(situacion, peticion.item);
  if (item === undefined) {
    return rechazar(`No existe el ítem ${peticion.item}.`);
  }
  const motivo = motivoParaNoResponder(situacion, item, peticion.contexto);
  return motivo === undefined ? aceptar(item) : rechazar(motivo);
}

export function presentarItem(entorno: Entorno, peticion: PeticionItem): Resultado<ItemPresentado> {
  return enDominio(entorno, peticion.dominio, (situacion) => {
    const item = itemQueSePuedeResponder(situacion, peticion);
    return item.ok ? aceptar(presentar(item.valor)) : item;
  });
}

/** Guarda la respuesta sin corregirla: la corrección llega después de declarar la confianza. */
export function responderItem(
  entorno: Entorno,
  peticion: PeticionRespuesta,
): Resultado<{ readonly esperandoConfianza: true }> {
  return enDominio(entorno, peticion.dominio, (situacion) => {
    const item = itemQueSePuedeResponder(situacion, peticion);
    if (!item.ok) {
      return item;
    }
    situacion.estado.pendientes.set(item.valor.id, { contexto: peticion.contexto, respuesta: peticion.respuesta });
    return aceptar({ esperandoConfianza: true });
  });
}

/**
 * Corrige la respuesta comparándola con el contenido y registra el intento. La confianza que declare
 * la persona no cambia la corrección (@DIAG-1.2).
 */
export function declararConfianza(entorno: Entorno, peticion: PeticionConfianza): Resultado<Feedback> {
  return enDominio(entorno, peticion.dominio, (situacion) => {
    const pendiente = situacion.estado.pendientes.get(peticion.item);
    const item = buscarItem(situacion, peticion.item);
    if (pendiente === undefined || item === undefined) {
      return rechazar(`Primero hay que responder el ítem ${peticion.item}.`);
    }
    const correcta = esCorrecta(pendiente.respuesta, item.respuesta);
    situacion.estado.pendientes.delete(item.id);
    situacion.estado.intentos.push({ item: item.id, contexto: pendiente.contexto, correcta });
    return aceptar({ correcta, respuestaCorrecta: respuestaMostrada(item.respuesta), explicacion: item.feedback });
  });
}

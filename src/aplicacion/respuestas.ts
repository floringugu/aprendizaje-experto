import { esCorrecta, respuestaMostrada } from '../dominio/correccion.ts';
import type { ItemContenido, ItemValidado } from './contenido.ts';
import { registrarIntentoYReevaluar } from './criterio-dominio.ts';
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

function buscarItem(situacion: Situacion, id: string): ItemValidado | undefined {
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

/**
 * El contexto decide si el ítem se puede responder, pero no cómo se ve: se presenta igual en la
 * práctica, en los repasos y en las pruebas de retención (@RECU-4.1). El ítem que se presenta queda
 * marcado como presentado (`marcarPresentado`): hasta su feedback no se abre su fuente (@MATE-7.1).
 */
export function presentarItem(entorno: Entorno, peticion: PeticionItem): Resultado<ItemPresentado> {
  return enDominio(entorno, peticion.dominio, (situacion) => {
    const item = itemQueSePuedeResponder(situacion, peticion);
    if (!item.ok) {
      return item;
    }
    // Solo si se acepta: un rechazo no presenta nada, así que tampoco deja nada en curso.
    situacion.estado.marcarPresentado(item.valor.id);
    return aceptar(presentar(item.valor));
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
    situacion.estado.guardarRespuesta(item.valor.id, {
      fecha: entorno.dependencias.reloj.ahora(),
      contexto: peticion.contexto,
      respuesta: peticion.respuesta,
    });
    return aceptar({ esperandoConfianza: true });
  });
}

/**
 * Corrige la respuesta comparándola con el contenido y registra el intento. La confianza que declare
 * la persona no cambia la corrección (@DIAG-1.2) ni cuenta para el dominio: solo se guarda
 * (@MAST-3.1). El feedback sale siempre, acierte o falle (@RECU-2.1), y su explicación es el
 * `feedback` del autor tal cual (@RECU-2.2).
 */
export function declararConfianza(entorno: Entorno, peticion: PeticionConfianza): Resultado<Feedback> {
  return enDominio(entorno, peticion.dominio, (situacion) => {
    const pendiente = situacion.estado.respuestaPendiente(peticion.item);
    const item = buscarItem(situacion, peticion.item);
    if (pendiente === undefined || item === undefined) {
      return rechazar(`Primero hay que responder el ítem ${peticion.item}.`);
    }
    const correcta = esCorrecta(pendiente.respuesta, item.respuesta);
    const respuestaCorrecta = respuestaMostrada(item.respuesta);
    registrarIntentoYReevaluar(entorno, situacion, {
      fecha: pendiente.fecha,
      contexto: pendiente.contexto,
      item: item.id,
      objetivo: item.objetivo,
      correcta,
      confianza: peticion.confianza,
    });
    return aceptar({ correcta, respuestaCorrecta, explicacion: item.feedback });
  });
}

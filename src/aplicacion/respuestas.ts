import { esCorrecta, respuestaMostrada } from '../dominio/correccion.ts';
import { esReservado } from '../dominio/transferencia.ts';
import type { ItemContenido, ItemValidado } from './contenido.ts';
import { registrarIntentoYReevaluar } from './criterio-dominio.ts';
import type { Entorno, IntentoNuevo, RespuestaPendiente, Situacion } from './estado.ts';
import {
  diagnosticoPendiente,
  enDominio,
  MOTIVO_DIAGNOSTICO_PENDIENTE,
  MOTIVO_DIAGNOSTICO_TERMINADO,
} from './estado.ts';
import { presentar } from './presentacion.ts';
import type { Resultado } from './resultado.ts';
import { aceptar, rechazar } from './resultado.ts';
import { sesionTrasElIntento } from './sesion-en-curso.ts';
import type { CasosDeSesiones, ContextoRespuesta, Feedback, ItemPresentado, RespuestaRecogida } from './sesiones.ts';

// Las peticiones de cada caso de uso, sacadas de su firma en `CasosDeSesiones`.
type PeticionItem = Parameters<CasosDeSesiones['presentarItem']>[0];
type PeticionRespuesta = Parameters<CasosDeSesiones['responderItem']>[0];
type PeticionConfianza = Parameters<CasosDeSesiones['declararConfianza']>[0];

function buscarItem(situacion: Situacion, id: string): ItemValidado | undefined {
  return situacion.contenido.items.find((item) => item.id === id);
}

/**
 * Mientras el diagnóstico está pendiente solo se responden sus ítems; después ya no se responde
 * ninguno como parte del diagnóstico (@DIAG-1.1). Un reservado no es del diagnóstico aunque esté
 * marcado para él (@MAST-8.1), y se responde una sola vez (@MAST-8.5).
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
  if (contexto === 'diagnostico' && (!item.diagnostico || esReservado(item))) {
    return `El ítem ${item.id} no forma parte del diagnóstico.`;
  }
  if (esReservado(item) && situacion.estado.ultimoIntentoDeCadaItem().has(item.id)) {
    return `El ítem ${item.id} ya se ha presentado: es un caso nuevo y se presenta una sola vez.`;
  }
  return undefined;
}

function itemQueSePuedeResponder(situacion: Situacion, peticion: PeticionItem): Resultado<ItemValidado> {
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
 * en curso (`marcarEnCurso`): hasta su feedback no se abre su fuente (@MATE-7.1).
 */
export function presentarItem(entorno: Entorno, peticion: PeticionItem): Resultado<ItemPresentado> {
  return enDominio(entorno, peticion.dominio, (situacion) => {
    const item = itemQueSePuedeResponder(situacion, peticion);
    if (!item.ok) {
      return item;
    }
    // Solo si se acepta: un rechazo no presenta nada, así que tampoco deja nada en curso.
    situacion.estado.marcarEnCurso(item.valor.id);
    return aceptar(presentar(item.valor));
  });
}

/**
 * Guarda la respuesta sin corregirla: la corrección llega después de declarar la confianza. Un reintento
 * no la pide: se corrige y se registra ya, sin confianza, y el feedback sale con la respuesta (@RECU-6.3).
 */
export function responderItem(entorno: Entorno, peticion: PeticionRespuesta): Resultado<RespuestaRecogida> {
  return enDominio<RespuestaRecogida>(entorno, peticion.dominio, (situacion) => {
    const item = itemQueSePuedeResponder(situacion, peticion);
    if (!item.ok) {
      return item;
    }
    const fecha = entorno.dependencias.reloj.ahora();
    if (peticion.contexto === 'reintento') {
      const respuesta = { item: item.valor, fecha, contexto: peticion.contexto, respuesta: peticion.respuesta };
      return aceptar({ esperandoConfianza: false, feedback: corregirYRegistrar(entorno, situacion, respuesta) });
    }
    situacion.estado.guardarRespuesta(item.valor.id, {
      fecha,
      contexto: peticion.contexto,
      respuesta: peticion.respuesta,
    });
    return aceptar({ esperandoConfianza: true });
  });
}

/** Una respuesta lista para corregir, con la fecha y el contexto en que se respondió. */
interface RespuestaACorregir extends RespuestaPendiente {
  readonly item: ItemValidado;
  /** Solo si se pidió: un reintento no la pide (@RECU-6.3). */
  readonly confianza?: number;
}

/**
 * Corrige la respuesta comparándola con el contenido, registra el intento, lo cuenta en la sesión en
 * curso (RECU-6) y devuelve el feedback. El feedback sale siempre, acierte o falle (@RECU-2.1), y su
 * explicación es el `feedback` del autor tal cual (@RECU-2.2); en un reintento es el mismo (@RECU-6.3).
 * El intento de un reservado se registra como `transferencia`, sea cual sea el contexto en que se
 * respondió (@MAST-8.4, @INTE-5.4). La sesión que queda se calcula antes de tocar el estado, para que
 * un parámetro que falte no deje el intento registrado y la sesión sin cambiar.
 */
function corregirYRegistrar(entorno: Entorno, situacion: Situacion, respuesta: RespuestaACorregir): Feedback {
  const { item } = respuesta;
  const correcta = esCorrecta(respuesta.respuesta, item.respuesta);
  const intento: IntentoNuevo = {
    fecha: respuesta.fecha,
    contexto: esReservado(item) ? 'transferencia' : respuesta.contexto,
    item: item.id,
    objetivo: item.objetivo,
    correcta,
    ...(respuesta.confianza === undefined ? {} : { confianza: respuesta.confianza }),
  };
  const sesion = sesionTrasElIntento(entorno, situacion.estado.sesionEnCurso, intento);
  registrarIntentoYReevaluar(entorno, situacion, intento);
  situacion.estado.cambiarSesion(sesion);
  return { correcta, respuestaCorrecta: respuestaMostrada(item.respuesta), explicacion: item.feedback };
}

/**
 * Corrige la respuesta pendiente y registra el intento con la confianza declarada. La confianza no
 * cambia la corrección (@DIAG-1.2) ni cuenta para el dominio: solo se guarda (@MAST-3.1). Un reservado
 * se gasta al declarar la confianza, no al presentarlo (@MAST-8.6).
 */
export function declararConfianza(entorno: Entorno, peticion: PeticionConfianza): Resultado<Feedback> {
  return enDominio(entorno, peticion.dominio, (situacion) => {
    const pendiente = situacion.estado.respuestaPendiente(peticion.item);
    const item = buscarItem(situacion, peticion.item);
    if (pendiente === undefined || item === undefined) {
      return rechazar(`Primero hay que responder el ítem ${peticion.item}.`);
    }
    return aceptar(corregirYRegistrar(entorno, situacion, { ...pendiente, item, confianza: peticion.confianza }));
  });
}

// La sesión en curso de cada dominio y lo que queda por presentar de ella, con los ítems que vuelven
// (RECU-6). Se guarda al iniciarla, cambia con cada intento registrado y se olvida al terminarla o al
// iniciar otra: lo que queda por volver no pasa a la siguiente (@RECU-6.7).
//
// El reintento no se comprueba contra la sesión: un ítem se puede responder como `reintento` aunque no
// le toque volver, y entonces se registra sin cambiar la sesión. Lo hacen así los escenarios de otras
// áreas que solo necesitan un intento con ese contexto (MAST-1.8, PLAN-1.5).
import type { ClaseDeRespuesta } from '../dominio/reintentos.ts';
import { colaInicial, colaTrasResponder } from '../dominio/reintentos.ts';
import { loQueQuedaDelDiagnostico } from './diagnostico.ts';
import type { Entorno, IntentoNuevo, SesionEnCurso } from './estado.ts';
import { diagnosticoPendiente, enDominio, MOTIVO_DIAGNOSTICO_PENDIENTE } from './estado.ts';
import { parametroNumerico } from './parametros.ts';
import type { PeticionDominio } from './peticiones.ts';
import type { Resultado } from './resultado.ts';
import { aceptar, rechazar } from './resultado.ts';
import type { ContextoRespuesta, ElementoSesion, ItemPresentado, Sesion } from './sesiones.ts';

const SIN_SESION = 'No hay ninguna sesión en curso.';

/**
 * Cómo cuenta para la sesión en curso un intento, según el contexto con que se registra; el de un
 * reservado es siempre `transferencia`, y no vuelve (@RECU-6.8). Lo que se responde antes de la
 * instrucción o en un experimento no cuenta (`undefined`): el ítem sigue pendiente de su primer intento.
 */
const CLASE_POR_CONTEXTO: Readonly<Record<ContextoRespuesta, ClaseDeRespuesta | undefined>> = {
  reintento: 'reintento',
  practica: 'ensena',
  repaso: 'ensena',
  intercalado: 'ensena',
  diagnostico: 'mide',
  retencion: 'mide',
  transferencia: 'mide',
  exploracion: undefined,
  prepregunta: undefined,
  experimento_estudio: undefined,
  experimento_prueba: undefined,
};

/** La sesión recién iniciada, con todos sus ítems por presentar y ninguno que vuelva todavía. */
export function sesionEnCursoDe(sesion: Sesion): SesionEnCurso {
  const items = sesion.elementos.flatMap((elemento) => (elemento.tipo === 'item' ? [elemento.item.id] : []));
  return { sesion, cola: colaInicial(items) };
}

/**
 * Los elementos que quedan por presentar: los ejemplos de la sesión guardada, tal cual, y detrás los
 * ítems que quedan en la cola, cada uno tal como se presentó al iniciar la sesión.
 */
function elementosPorPresentar({ sesion, cola }: SesionEnCurso): readonly ElementoSesion[] {
  const presentados = new Map<string, ItemPresentado>();
  sesion.elementos.forEach((elemento) => {
    if (elemento.tipo === 'item') {
      presentados.set(elemento.item.id, elemento.item);
    }
  });
  const ejemplos = sesion.elementos.filter((elemento) => elemento.tipo === 'ejemplo');
  const items = cola.pendientes.flatMap(({ item, reintento }): ElementoSesion[] => {
    const presentado = presentados.get(item);
    if (presentado === undefined) {
      return [];
    }
    // `reintento: undefined` no vale con `exactOptionalPropertyTypes`: la propiedad solo está si vuelve.
    return [reintento ? { tipo: 'item', item: presentado, reintento: true } : { tipo: 'item', item: presentado }];
  });
  return [...ejemplos, ...items];
}

/**
 * Mientras el diagnóstico está pendiente, la sesión en curso es él: sus ítems sin responder, y ninguno
 * vuelve (@RECU-6.8). Después, la última sesión iniciada: primero sus ejemplos resueltos, que siguen ahí
 * hasta que la persona los estudie (`estudiarEjemplo`, AYUD), y luego sus ítems por presentar, con los
 * que vuelven marcados con `reintento` (@RECU-6.1). Sin ninguna sesión en curso, rechaza.
 */
export function consultarSesion(entorno: Entorno, peticion: PeticionDominio): Resultado<Sesion> {
  return enDominio(entorno, peticion.dominio, (situacion) => {
    if (diagnosticoPendiente(situacion.estado)) {
      return aceptar(loQueQuedaDelDiagnostico(situacion));
    }
    const sesionActual = situacion.estado.sesionEnCurso;
    if (sesionActual === undefined) {
      return rechazar(SIN_SESION);
    }
    const { tipo, intercalada } = sesionActual.sesion;
    return aceptar({ tipo, intercalada, elementos: elementosPorPresentar(sesionActual) });
  });
}

/**
 * La persona deja la sesión en curso, aunque queden ítems por volver (@RECU-6.7). Rechaza mientras el
 * diagnóstico está pendiente, que no se deja así, y si no hay ninguna sesión en curso.
 */
export function terminarSesion(entorno: Entorno, peticion: PeticionDominio): Resultado<null> {
  return enDominio(entorno, peticion.dominio, ({ estado }) => {
    if (diagnosticoPendiente(estado)) {
      return rechazar(MOTIVO_DIAGNOSTICO_PENDIENTE);
    }
    if (estado.sesionEnCurso === undefined) {
      return rechazar(SIN_SESION);
    }
    estado.cambiarSesion(undefined);
    return aceptar(null);
  });
}

/**
 * La sesión en curso tal como queda tras el intento, sin guardarla: quien registra el intento la guarda
 * después, y así lo que puede fallar (leer la configuración) va antes de tocar el estado. Lee
 * `items_entre_intento_y_reintento` y `aciertos_para_cerrar_item_en_sesion` en cada intento que cuenta,
 * para que un cambio en la configuración cuente enseguida (@RECU-6.9), y solo entonces: sin sesión en
 * curso, o con un intento que no cuenta, no los lee ni cambia nada.
 */
export function sesionTrasElIntento(
  entorno: Entorno,
  sesionActual: SesionEnCurso | undefined,
  intento: Pick<IntentoNuevo, 'item' | 'contexto' | 'correcta'>,
): SesionEnCurso | undefined {
  const clase = CLASE_POR_CONTEXTO[intento.contexto];
  if (sesionActual === undefined || clase === undefined) {
    return sesionActual;
  }
  const parametros = entorno.dependencias.leerParametros();
  const reglas = {
    separacion: parametroNumerico(parametros, 'items_entre_intento_y_reintento'),
    aciertosParaCerrar: parametroNumerico(parametros, 'aciertos_para_cerrar_item_en_sesion'),
  };
  const respuesta = { item: intento.item, correcta: intento.correcta, clase };
  return { sesion: sesionActual.sesion, cola: colaTrasResponder(sesionActual.cola, respuesta, reglas) };
}

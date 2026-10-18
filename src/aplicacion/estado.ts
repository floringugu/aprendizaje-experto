import type { ContenidoDominio } from './contenido.ts';
import type { Dependencias } from './dependencias.ts';
import type { Fase } from './dominio.ts';
import type { Resultado } from './resultado.ts';
import { rechazar } from './resultado.ts';
import type { ContextoRespuesta } from './sesiones.ts';

/** Un intento ya corregido: se guarda al declarar la confianza. */
interface Intento {
  readonly item: string;
  readonly contexto: ContextoRespuesta;
  readonly correcta: boolean;
}

/** Respuesta recogida que espera la confianza para corregirse. */
interface RespuestaPendiente {
  readonly contexto: ContextoRespuesta;
  readonly respuesta: string;
}

/** Lo que la aplicación sabe de una persona en un dominio. */
export interface EstadoDominio {
  /** Empieza en «diagnostico»: hasta terminarlo no se practica nada. */
  fase: Fase;
  /** En el orden en que se hicieron. */
  readonly intentos: Intento[];
  readonly pendientes: Map<string, RespuestaPendiente>;
  readonly dominados: Set<string>;
  /** Pasos retirados de los ejemplos resueltos de cada objetivo. */
  readonly pasosRetirados: Map<string, number>;
}

/** Progreso de una persona en todos sus dominios. Por ahora vive en memoria. */
export class EstadoPersona {
  private readonly dominios = new Map<string, EstadoDominio>();

  estadoDe(dominio: string): EstadoDominio {
    const existente = this.dominios.get(dominio);
    if (existente !== undefined) {
      return existente;
    }
    const nuevo: EstadoDominio = {
      fase: 'diagnostico',
      intentos: [],
      pendientes: new Map(),
      dominados: new Set(),
      pasosRetirados: new Map(),
    };
    this.dominios.set(dominio, nuevo);
    return nuevo;
  }
}

/** Lo que comparten todos los casos de uso de una persona: sus dependencias y su estado. */
export interface Entorno {
  readonly dependencias: Dependencias;
  readonly persona: EstadoPersona;
}

/** El contenido de un dominio y el estado de la persona en él. */
export interface Situacion {
  readonly contenido: ContenidoDominio;
  readonly estado: EstadoDominio;
}

/** Ejecuta el caso de uso con el dominio pedido; si el dominio no existe, rechaza la petición. */
export function enDominio<T>(
  entorno: Entorno,
  dominio: string,
  caso: (situacion: Situacion) => Resultado<T>,
): Resultado<T> {
  const contenido = entorno.dependencias.leerContenido(dominio);
  if (contenido === undefined) {
    return rechazar(`No existe el dominio «${dominio}».`);
  }
  return caso({ contenido, estado: entorno.persona.estadoDe(dominio) });
}

/** Hasta que la persona termina el diagnóstico de un dominio, no hace nada más en él (@DIAG-1.1). */
export function diagnosticoPendiente(estado: EstadoDominio): boolean {
  return estado.fase === 'diagnostico';
}

export const MOTIVO_DIAGNOSTICO_PENDIENTE = 'Primero hay que terminar el diagnóstico.';
export const MOTIVO_DIAGNOSTICO_TERMINADO = 'El diagnóstico de este dominio ya está terminado.';

import { ultimoIntentoPorItem } from '../dominio/acierto.ts';
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

/** Lo que deja el diagnóstico al cerrarse. */
interface CierreDiagnostico {
  readonly fase: Fase;
  readonly dominados: readonly string[];
  /** Pasos retirados de los ejemplos resueltos de cada objetivo. */
  readonly pasosRetirados: ReadonlyMap<string, number>;
}

/**
 * Lo que la aplicación sabe de una persona en un dominio. Los casos de uso lo leen y lo cambian solo
 * con estos métodos, así que la forma en que se guarda no sale de este módulo.
 */
export class EstadoDominio {
  /** Empieza en «diagnostico»: hasta terminarlo no se practica nada. */
  private faseActual: Fase = 'diagnostico';
  /** En el orden en que se hicieron. */
  private readonly intentos: Intento[] = [];
  private readonly pendientes = new Map<string, RespuestaPendiente>();
  private readonly objetivosDominados = new Set<string>();
  private readonly pasosRetirados = new Map<string, number>();

  get fase(): Fase {
    return this.faseActual;
  }

  get dominados(): ReadonlySet<string> {
    return this.objetivosDominados;
  }

  /** Mientras dura el diagnóstico no se ha retirado ningún paso. */
  pasosRetiradosDe(objetivo: string): number {
    return this.pasosRetirados.get(objetivo) ?? 0;
  }

  /** Último intento de cada ítem (`true` si lo acertó); con `contexto`, solo entre los de ese contexto. */
  ultimoIntentoDeCadaItem(contexto?: ContextoRespuesta): Map<string, boolean> {
    const contados =
      contexto === undefined ? this.intentos : this.intentos.filter((intento) => intento.contexto === contexto);
    return ultimoIntentoPorItem(contados);
  }

  respuestaPendiente(item: string): RespuestaPendiente | undefined {
    return this.pendientes.get(item);
  }

  /** Guarda la respuesta hasta que la persona declare su confianza; otra respuesta al mismo ítem la sustituye. */
  guardarRespuesta(item: string, respuesta: RespuestaPendiente): void {
    this.pendientes.set(item, respuesta);
  }

  /** Registra el intento ya corregido: su respuesta deja de estar pendiente. */
  registrarIntento(intento: Intento): void {
    this.pendientes.delete(intento.item);
    this.intentos.push(intento);
  }

  /**
   * Deja la fase, los objetivos dominados y los pasos retirados que dio el diagnóstico. Una respuesta
   * del diagnóstico sin confianza declarada ya no cuenta: el diagnóstico está cerrado.
   */
  cerrarDiagnostico(cierre: CierreDiagnostico): void {
    this.faseActual = cierre.fase;
    this.pendientes.clear();
    cierre.dominados.forEach((objetivo) => this.objetivosDominados.add(objetivo));
    cierre.pasosRetirados.forEach((pasos, objetivo) => this.pasosRetirados.set(objetivo, pasos));
  }
}

/** Progreso de una persona en todos sus dominios. Por ahora vive en memoria. */
export class EstadoPersona {
  private readonly dominios = new Map<string, EstadoDominio>();

  estadoDe(dominio: string): EstadoDominio {
    const existente = this.dominios.get(dominio);
    if (existente !== undefined) {
      return existente;
    }
    const nuevo = new EstadoDominio();
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

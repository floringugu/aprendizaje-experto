import { ultimoIntentoPorItem } from '../dominio/acierto.ts';
import type { Fase } from '../dominio/fases.ts';
import type { RecorridoDeRuta } from '../dominio/ruta.ts';
import { recorrerRuta } from '../dominio/ruta.ts';
import type { ContenidoValidado } from './contenido.ts';
import type { Dependencias } from './dependencias.ts';
import { lugarDelFallo, validarContenido } from './formato-contenido.ts';
import type { Resultado } from './resultado.ts';
import { aceptar, rechazar } from './resultado.ts';
import type { ContextoRespuesta } from './sesiones.ts';

/** Respuesta recogida que espera la confianza para corregirse. */
interface RespuestaPendiente {
  /** Cuando respondió la persona, que es la fecha del intento. */
  readonly fecha: Date;
  readonly contexto: ContextoRespuesta;
  readonly respuesta: string;
}

/** Un intento recién corregido, con la fecha y el contexto de la respuesta pendiente de la que sale. */
export interface IntentoNuevo {
  readonly fecha: Date;
  readonly contexto: ContextoRespuesta;
  readonly item: string;
  readonly objetivo: string;
  readonly correcta: boolean;
  readonly confianza: number;
}

/** Un intento ya registrado: se guarda al declarar la confianza. */
interface Intento extends IntentoNuevo {
  /** Pasos retirados de los ejemplos resueltos del objetivo cuando respondió. */
  readonly pasosRetirados: number;
}

/** Un objetivo que pasa a estar dominado o deja de estarlo, con el acierto que lo decide. */
interface CambioDominado {
  readonly fecha: Date;
  readonly objetivo: string;
  readonly dominado: boolean;
  readonly acierto: number;
}

interface CambioFase {
  readonly fecha: Date;
  readonly anterior: Fase;
  readonly nueva: Fase;
}

/** Todo lo que ha pasado en un dominio, en el orden en que pasó: es lo que se exporta (INST). */
export interface RegistroDominio {
  readonly intentos: readonly Intento[];
  readonly cambiosDominado: readonly CambioDominado[];
  readonly cambiosFase: readonly CambioFase[];
}

/** Lo que deja el diagnóstico al cerrarse. */
interface CierreDiagnostico {
  readonly fecha: Date;
  readonly fase: Fase;
  /** Cada objetivo dominado, con el acierto con el que lo domina. */
  readonly dominados: ReadonlyMap<string, number>;
  /** Pasos retirados de los ejemplos resueltos de cada objetivo. */
  readonly pasosRetirados: ReadonlyMap<string, number>;
}

/**
 * Lo que la aplicación sabe de una persona en un dominio. Los casos de uso lo leen y lo cambian solo
 * con estos métodos, así que la forma en que se guarda no sale de este módulo.
 *
 * La fase y los objetivos dominados no se guardan aparte: salen de los cambios registrados, que son
 * también lo que se exporta. Así lo que ve la persona y lo que se exporta no pueden contradecirse.
 */
export class EstadoDominio {
  private readonly intentos: Intento[] = [];
  private readonly pendientes = new Map<string, RespuestaPendiente>();
  /** Los ítems en curso: presentados y sin intento registrado todavía. */
  private readonly itemsEnCurso = new Set<string>();
  private readonly cambiosDominado: CambioDominado[] = [];
  private readonly cambiosFase: CambioFase[] = [];
  private readonly pasosRetirados = new Map<string, number>();

  /** Empieza en «diagnostico»: hasta terminarlo no se practica nada. */
  get fase(): Fase {
    return this.cambiosFase.at(-1)?.nueva ?? 'diagnostico';
  }

  get dominados(): ReadonlySet<string> {
    const ultimos = [...this.ultimoCambioDeCadaObjetivo().values()];
    return new Set(ultimos.filter((cambio) => cambio.dominado).map((cambio) => cambio.objetivo));
  }

  /** Desde cuándo está dominado el objetivo; `undefined` si ahora no lo está. */
  dominadoDesde(objetivo: string): Date | undefined {
    const ultimo = this.ultimoCambioDeCadaObjetivo().get(objetivo);
    return ultimo?.dominado === true ? ultimo.fecha : undefined;
  }

  /** Estado de cada objetivo en la ruta y cuál es el actual. Durante el diagnóstico, todos están cerrados. */
  recorrerRuta(objetivos: readonly string[]): RecorridoDeRuta {
    if (this.fase === 'diagnostico') {
      return { estados: new Map(objetivos.map((objetivo) => [objetivo, 'cerrado'])) };
    }
    const dominadosAlgunaVez = this.cambiosDominado
      .filter((cambio) => cambio.dominado)
      .map((cambio) => cambio.objetivo);
    return recorrerRuta(objetivos, { dominados: this.dominados, dominadosAlgunaVez: new Set(dominadosAlgunaVez) });
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

  get registro(): RegistroDominio {
    return { intentos: this.intentos, cambiosDominado: this.cambiosDominado, cambiosFase: this.cambiosFase };
  }

  respuestaPendiente(item: string): RespuestaPendiente | undefined {
    return this.pendientes.get(item);
  }

  /** Guarda la respuesta hasta que la persona declare su confianza; otra respuesta al mismo ítem la sustituye. */
  guardarRespuesta(item: string, respuesta: RespuestaPendiente): void {
    this.pendientes.set(item, respuesta);
  }

  /** La persona tiene el ítem delante: queda en curso hasta que se registre su intento. */
  marcarEnCurso(item: string): void {
    this.itemsEnCurso.add(item);
  }

  /**
   * Si el ítem está en curso: presentado y todavía sin feedback, también después de responder y antes de
   * declarar la confianza. Mientras lo está, no se abre su fuente (@MATE-7.1).
   */
  enCurso(item: string): boolean {
    return this.itemsEnCurso.has(item);
  }

  /**
   * Registra el intento con los pasos retirados de ahora; su respuesta deja de estar pendiente, y el
   * ítem, en curso.
   */
  registrarIntento(intento: IntentoNuevo): void {
    this.pendientes.delete(intento.item);
    this.itemsEnCurso.delete(intento.item);
    this.intentos.push({ ...intento, pasosRetirados: this.pasosRetiradosDe(intento.objetivo) });
  }

  /** Registra el cambio solo si el objetivo pasa de verdad a estar dominado o deja de estarlo. */
  cambiarDominado(cambio: CambioDominado): void {
    if (this.dominados.has(cambio.objetivo) !== cambio.dominado) {
      this.cambiosDominado.push(cambio);
    }
  }

  /** Registra el cambio solo si la fase es otra. */
  cambiarFase(fecha: Date, nueva: Fase): void {
    const anterior = this.fase;
    if (nueva !== anterior) {
      this.cambiosFase.push({ fecha, anterior, nueva });
    }
  }

  /**
   * Deja la fase, los objetivos dominados y los pasos retirados que dio el diagnóstico, registrados
   * como cualquier otro cambio. Una respuesta del diagnóstico sin confianza declarada ya no cuenta: el
   * diagnóstico está cerrado. Por lo mismo, ningún ítem sigue en curso: si no, uno que el diagnóstico
   * presentó y la persona no respondió tendría la fuente cerrada para siempre.
   */
  cerrarDiagnostico(cierre: CierreDiagnostico): void {
    this.pendientes.clear();
    this.itemsEnCurso.clear();
    this.cambiarFase(cierre.fecha, cierre.fase);
    cierre.dominados.forEach((acierto, objetivo) => {
      this.cambiarDominado({ fecha: cierre.fecha, objetivo, dominado: true, acierto });
    });
    cierre.pasosRetirados.forEach((pasos, objetivo) => this.pasosRetirados.set(objetivo, pasos));
  }

  private ultimoCambioDeCadaObjetivo(): Map<string, CambioDominado> {
    return new Map(this.cambiosDominado.map((cambio) => [cambio.objetivo, cambio]));
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

  /** El estado de cada dominio que la persona ha abierto, en el orden en que los abrió. */
  get todosLosDominios(): ReadonlyMap<string, EstadoDominio> {
    return this.dominios;
  }
}

/** Lo que comparten todos los casos de uso de una persona: sus dependencias y su estado. */
export interface Entorno {
  readonly dependencias: Dependencias;
  readonly persona: EstadoPersona;
}

/** El contenido de un dominio y el estado de la persona en él. */
export interface Situacion {
  readonly contenido: ContenidoValidado;
  readonly estado: EstadoDominio;
}

/** El estado de cada objetivo del dominio en la ruta de la persona, y cuál es el actual. */
export function recorridoDeRuta(situacion: Situacion): RecorridoDeRuta {
  return situacion.estado.recorrerRuta(situacion.contenido.objetivos.map((objetivo) => objetivo.id));
}

/**
 * Ejecuta el caso de uso con el dominio pedido. Si el dominio no existe, o su contenido no cumple el
 * formato (D16), rechaza la petición en vez de lanzar un error (ver `contenidoValidado`).
 */
export function enDominio<T>(
  entorno: Entorno,
  dominio: string,
  caso: (situacion: Situacion) => Resultado<T>,
): Resultado<T> {
  const contenido = contenidoValidado(dominio, entorno.dependencias.leerContenido(dominio));
  return contenido.ok ? caso({ contenido: contenido.valor, estado: entorno.persona.estadoDe(dominio) }) : contenido;
}

/**
 * El contenido aprobado del dominio, tal como se leyó (`undefined` si no existe), ya validado. Si no
 * existe, o no cumple el formato (D16), rechaza: un contenido mal escrito no tumba el servidor, y el
 * rechazo dice qué pieza hay que arreglar. Lo usan `enDominio` y la revisión del material, que lee
 * `contenido/<dominio>.json` con el puerto `Ficheros` porque también lo escribe.
 */
export function contenidoValidado(dominio: string, leido: unknown): Resultado<ContenidoValidado> {
  if (leido === undefined) {
    return rechazar(`No existe el dominio «${dominio}».`);
  }
  const contenido = validarContenido(leido);
  if (!contenido.ok) {
    return rechazar(`El contenido de «${dominio}» no cumple el formato: revisa ${lugarDelFallo(contenido.fallo)}.`);
  }
  return aceptar(contenido.valor);
}

/** Hasta que la persona termina el diagnóstico de un dominio, no hace nada más en él (@DIAG-1.1). */
export function diagnosticoPendiente(estado: EstadoDominio): boolean {
  return estado.fase === 'diagnostico';
}

export const MOTIVO_DIAGNOSTICO_PENDIENTE = 'Primero hay que terminar el diagnóstico.';
export const MOTIVO_DIAGNOSTICO_TERMINADO = 'El diagnóstico de este dominio ya está terminado.';

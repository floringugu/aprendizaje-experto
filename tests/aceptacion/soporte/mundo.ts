import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Before, BeforeStep, setWorldConstructor } from '@cucumber/cucumber';
import { crearAplicacion } from '../../../src/aplicacion/aplicacion.ts';
import type { Aplicacion } from '../../../src/aplicacion/aplicacion.ts';
import type { AperturaSesion, IntencionDelPlan, ResultadoBucle } from '../../../src/aplicacion/bucle.ts';
import type { ContenidoDominio } from '../../../src/aplicacion/contenido.ts';
import type {
  AperturaDominio,
  EvaluacionFase,
  EvaluacionObjetivo,
  ObjetivoConsultado,
  ResultadoDiagnostico,
} from '../../../src/aplicacion/dominio.ts';
import type { ConsultaHoras, RegistroHoras } from '../../../src/aplicacion/horas.ts';
import type { ParametrosJson } from '../../../src/aplicacion/puertos.ts';
import type { Resultado } from '../../../src/aplicacion/resultado.ts';
import type { EjemploPresentado, Feedback, ItemPresentado, Sesion } from '../../../src/aplicacion/sesiones.ts';
import type {
  EvaluacionTarea,
  NivelExperto,
  PeticionEvaluacionExterna,
  TareaPresentada,
} from '../../../src/aplicacion/tareas.ts';
import { BorradorContenido } from './contenido.ts';
import { PlanificadorFsrsDePrueba } from './planificador.ts';
import { RelojDePrueba, instanteUtc } from './reloj.ts';

const DOMINIO_POR_DEFECTO = 'ficticio';
const INICIO_POR_DEFECTO = instanteUtc('2026-01-01', '09:00:00');
const CONFIANZA_POR_DEFECTO = 50;

/** Lee `config/parametros.json` tal como está en el repositorio (los pasos lo cambian en memoria). */
function leerParametrosDelRepositorio(): ParametrosJson {
  const ruta = join(process.cwd(), 'config', 'parametros.json');
  return JSON.parse(readFileSync(ruta, 'utf8')) as ParametrosJson;
}

/** Devuelve el valor de un resultado aceptado; si la aplicación lo rechazó, falla el paso. */
export function aceptado<T>(resultado: Resultado<T>): T {
  if (!resultado.ok) {
    throw new Error(`La aplicación rechazó la petición: ${resultado.motivo}`);
  }
  return resultado.valor;
}

/**
 * Estado de un escenario. Los pasos «Dado» no llaman a la aplicación al momento, sino que dejan la
 * preparación en cola (`preparar`): así el contenido y la configuración están completos antes de
 * que la persona haga nada, igual que en un dominio real. Los pasos «Cuando» y «Entonces» piden la
 * aplicación con `listo()`, que ejecuta antes la preparación pendiente.
 */
export class Mundo {
  readonly reloj = new RelojDePrueba(INICIO_POR_DEFECTO);
  readonly planificador = new PlanificadorFsrsDePrueba();
  readonly contenidos = new Map<string, BorradorContenido>();
  dominio = DOMINIO_POR_DEFECTO;
  parametros: ParametrosJson = leerParametrosDelRepositorio();
  /** Confianza que declaran los pasos cuando el escenario no dice otra cosa. */
  confianza = CONFIANZA_POR_DEFECTO;
  /** Último intento de cada ítem en este escenario: `true` si lo acertó. */
  readonly intentos = new Map<string, boolean>();
  /** Objetivo del que habla el paso anterior, para los pasos que dicen «de ellos» u «otra para». */
  objetivoEnCurso = 'O1';
  /** Categoría que la persona está practicando, en los escenarios que practican una sola (INTE-2.2). */
  categoriaEnCurso: string | undefined;
  /** Tipo del paso que se está ejecutando: «Context» (Dado), «Action» (Cuando) u «Outcome» (Entonces). */
  tipoPasoActual = 'Unknown';
  consultado: ObjetivoConsultado | undefined;
  nivel: NivelExperto | undefined;
  /** Última tarea que la aplicación presentó a la persona (TARE-1). */
  tareaPresentada: TareaPresentada | undefined;
  /** Lo que ve la persona al consultar la evaluación de una tarea (TARE-1.3). */
  evaluacionTarea: EvaluacionTarea | undefined;
  /** Última evaluación externa que se intentó registrar, aceptada o rechazada (TARE-2). */
  evaluacionRegistrada: PeticionEvaluacionExterna | undefined;
  /** Propiedad que el escenario estropeó a propósito al registrar una evaluación (TARE-2.2). */
  problemaRegistrado: string | undefined;
  /** Lo que devolvió la última petición rechazable, para los pasos «Entonces» de rechazo. */
  ultimoResultado: Resultado<unknown> | undefined;
  /**
   * Casi todos los escenarios parten de una persona que ya hizo el diagnóstico (sin marcar ningún
   * ítem, así que empieza como novato). Los escenarios del diagnóstico lo ponen a `false`.
   */
  diagnosticoPrevio = true;
  // Lo último que vio la persona, cada cosa en su campo para que los pasos «Entonces» la comprueben.
  sesion: Sesion | undefined;
  feedback: Feedback | undefined;
  apertura: AperturaDominio | undefined;
  diagnostico: ResultadoDiagnostico | undefined;
  evaluacionObjetivo: EvaluacionObjetivo | undefined;
  evaluacionFase: EvaluacionFase | undefined;
  bucle: ResultadoBucle | undefined;
  /** Lo que vio la persona al abrir la última sesión (BUCL-1). */
  aperturaSesion: AperturaSesion | undefined;
  /** Intención de implementación que la persona escribe en el paso 5 del bucle (BUCL-3.4). */
  intencion: IntencionDelPlan | undefined;
  /** Texto de la intención que dejó escrita la semana anterior (BUCL-3.2). */
  intencionAnterior: string | undefined;
  /** Lo que debe seguir igual tras una acción: el progreso antes de ella (BUCL-3.4, HORA-3.1). */
  fotoDelProgreso: string | undefined;
  /** Último registro de horas que se intentó guardar, aceptado o rechazado (HORA-1). */
  registroDeHoras: Resultado<RegistroHoras> | undefined;
  /** Lo que ve la persona en su registro de horas (HORA-1.3, HORA-2.1). */
  consultaHoras: ConsultaHoras | undefined;
  csv: string | undefined;
  /** Los ficheros que la persona puede descargar en la pantalla de exportación (INST-2.3). */
  exportaciones: readonly string[] | undefined;
  /** Último ítem que se le presentó a la persona habitual, con lo que podía hacer con él. */
  presentado: ItemPresentado | undefined;
  /** Las veces que se le presentó un mismo ítem en distintos contextos (RECU-4). */
  readonly presentaciones: ItemPresentado[] = [];
  /** Último ejemplo resuelto que estudió la persona (AYUD-3). */
  ejemplo: EjemploPresentado | undefined;
  /** Opciones que la aplicación ofreció en la última consulta (por ejemplo, los horizontes). */
  opciones: readonly string[] | undefined;
  /** Lo que acierta cada ítem en el diagnóstico; los que no aparecen se fallan. Vacío: se alterna. */
  readonly respuestasDiagnostico = new Map<string, boolean>();
  /** Cada respuesta del diagnóstico: lo que debía corregirse y lo que corrigió la aplicación. */
  readonly correcciones: { readonly esperada: boolean; readonly recibida: boolean }[] = [];
  private readonly diagnosticosHechos = new Set<string>();
  private readonly aplicaciones: Aplicacion[] = [];
  private pendientes: (() => void)[] = [];
  private preparando = false;

  constructor() {
    this.contenidos.set(DOMINIO_POR_DEFECTO, new BorradorContenido(DOMINIO_POR_DEFECTO));
  }

  /** Contenido del dominio actual (o del indicado); se crea con los objetivos por defecto. */
  contenido(dominio = this.dominio): BorradorContenido {
    const existente = this.contenidos.get(dominio);
    if (existente !== undefined) {
      return existente;
    }
    const nuevo = new BorradorContenido(dominio);
    this.contenidos.set(dominio, nuevo);
    return nuevo;
  }

  establecerParametro(nombre: string, valor: unknown): void {
    this.parametros = { ...this.parametros, [nombre]: { ...this.parametros[nombre], valor } };
  }

  /** Aplicación de una persona (la 0 es la habitual; los escenarios de calibración usan dos). */
  aplicacion(persona = 0): Aplicacion {
    const existente = this.aplicaciones[persona];
    if (existente !== undefined) {
      return existente;
    }
    const nueva = crearAplicacion({
      reloj: this.reloj,
      leerParametros: () => this.parametros,
      leerContenido: (dominio): ContenidoDominio | undefined => this.contenidos.get(dominio)?.toContenido(),
      planificadorFsrs: this.planificador,
    });
    this.aplicaciones[persona] = nueva;
    return nueva;
  }

  preparar(accion: () => void): void {
    this.pendientes.push(accion);
  }

  /**
   * Como `preparar`, pero pone la acción al principio de la cola. Es para un «Dado» que cuenta algo que
   * pasó antes que lo de los «Dado» anteriores: así el reloj de prueba solo avanza y nunca retrocede.
   */
  prepararAntes(accion: () => void): void {
    this.pendientes.unshift(accion);
  }

  /** La persona abre el dominio y termina el diagnóstico sin marcar ningún ítem (una sola vez). */
  terminarDiagnosticoSinItems(persona = 0, dominio = this.dominio): void {
    const clave = `${String(persona)}:${dominio}`;
    if (this.diagnosticosHechos.has(clave)) {
      return;
    }
    this.diagnosticosHechos.add(clave);
    const app = this.aplicacion(persona);
    aceptado(app.abrirDominio({ dominio }));
    this.diagnostico = aceptado(app.terminarDiagnostico({ dominio }));
  }

  /** Ejecuta la preparación pendiente, en orden, y devuelve la aplicación de la persona habitual. */
  listo(): Aplicacion {
    if (!this.preparando) {
      this.preparando = true;
      if (this.diagnosticoPrevio) {
        this.terminarDiagnosticoSinItems();
      }
      const cola = this.pendientes;
      this.pendientes = [];
      try {
        cola.forEach((accion) => {
          accion();
        });
      } finally {
        this.preparando = false;
      }
    }
    return this.aplicacion();
  }
}

setWorldConstructor(Mundo);

// Los pasos son funciones flecha (sin `this`, porque el lint limita los parámetros y `this` cuenta
// como uno): el mundo del escenario en curso se obtiene con `mundo()`.
let mundoEnCurso: Mundo | undefined;

function recordarMundo(nuevo: Mundo): void {
  mundoEnCurso = nuevo;
}

Before(function (this: Mundo) {
  recordarMundo(this);
});

// Cucumber no distingue «Cuando» de «Entonces» al buscar la definición de un paso. Los pocos pasos
// que se escriben igual como acción y como comprobación miran este tipo para saber cuál toca.
BeforeStep(function (this: Mundo, { pickleStep }) {
  this.tipoPasoActual = pickleStep.type ?? 'Unknown';
});

export function mundo(): Mundo {
  if (mundoEnCurso === undefined) {
    throw new Error('No hay ningún escenario en ejecución');
  }
  return mundoEnCurso;
}

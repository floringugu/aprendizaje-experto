// El criterio de dominio aplicado a la persona (MAST): si cada objetivo está dominado, en qué fase
// está y qué puede hacer con cada objetivo. Las reglas son del dominio; este módulo las aplica a su
// estado y registra cada cambio con la fecha en que ocurre.
//
// Quien registra un intento llama a `registrarIntentoYReevaluar`, y el objetivo del intento se
// reevalúa en ese momento, sin esperar a que nadie lo pida: así un repaso fallado quita el dominio
// aunque nadie llame a `evaluarObjetivo` (@MAST-4.1).
import { aciertoSinAyuda } from '../dominio/acierto.ts';
import type { EvaluacionDominio } from '../dominio/criterio-dominio.ts';
import { evaluarDominio } from '../dominio/criterio-dominio.ts';
import { problemasIntercalables } from '../dominio/diagnostico.ts';
import { faseTrasDominio, faseTrasProblemas } from '../dominio/fases.ts';
import { objetivosPendientes } from '../dominio/ruta.ts';
import { itemsDelObjetivo } from './contenido.ts';
import type { CasosDeDominio, EvaluacionFase, EvaluacionObjetivo, ObjetivoConsultado } from './dominio.ts';
import type { Entorno, IntentoNuevo, Situacion } from './estado.ts';
import { diagnosticoPendiente, enDominio, MOTIVO_DIAGNOSTICO_PENDIENTE, recorridoDeRuta } from './estado.ts';
import { parametroNumerico } from './parametros.ts';
import type { PeticionDominio } from './peticiones.ts';
import type { Resultado } from './resultado.ts';
import { aceptar, rechazar } from './resultado.ts';

// La petición, sacada de la firma del caso de uso.
type PeticionObjetivo = Parameters<CasosDeDominio['evaluarObjetivo']>[0];

/** Lo que hace falta para decidir ahora si un objetivo está dominado y fechar el cambio. */
interface UmbralYMomento {
  readonly umbral: number;
  readonly ahora: Date;
}

/** El umbral se lee en cada evaluación, para que un cambio en la configuración cuente enseguida (@MAST-5.1). */
function leerUmbralYMomento(entorno: Entorno): UmbralYMomento {
  const umbral = parametroNumerico(entorno.dependencias.leerParametros(), 'umbral_dominio');
  return { umbral, ahora: entorno.dependencias.reloj.ahora() };
}

/**
 * Decide si el objetivo está dominado con el último intento de cada uno de sus ítems, sea cual sea
 * el contexto (@MAST-7.2). Registra el cambio, si lo hay, y con él la fase: dominar el último
 * objetivo pasa de novato a intermedio (@MAST-6.1), y perder uno no devuelve a ninguna fase anterior
 * (@MAST-6.3).
 */
function reevaluarObjetivo(situacion: Situacion, objetivo: string, momento: UmbralYMomento): EvaluacionDominio {
  const { contenido, estado } = situacion;
  const evaluacion = evaluarDominio({
    items: itemsDelObjetivo(contenido.items, objetivo).map((item) => item.id),
    ultimoIntento: estado.ultimoIntentoDeCadaItem(),
    umbral: momento.umbral,
    dominadoAntes: estado.dominados.has(objetivo),
  });
  // Sin acierto medido el objetivo sigue como estaba: no hay ningún cambio que registrar.
  if (evaluacion.aciertoSinAyuda !== undefined) {
    estado.cambiarDominado({
      fecha: momento.ahora,
      objetivo,
      dominado: evaluacion.dominado,
      acierto: evaluacion.aciertoSinAyuda,
    });
  }
  const ids = contenido.objetivos.map((candidato) => candidato.id);
  const todosDominados = objetivosPendientes(ids, estado.dominados).length === 0;
  estado.cambiarFase(momento.ahora, faseTrasDominio(estado.fase, todosDominados));
  return evaluacion;
}

/**
 * Registra el intento y reevalúa su objetivo. Lo que puede fallar (leer la configuración) va antes
 * de tocar el estado, para no dejar un intento registrado sin evaluar. Durante el diagnóstico no se
 * reevalúa nada: el diagnóstico lo decide todo al terminar.
 */
export function registrarIntentoYReevaluar(entorno: Entorno, situacion: Situacion, intento: IntentoNuevo): void {
  const momento = leerUmbralYMomento(entorno);
  situacion.estado.registrarIntento(intento);
  if (!diagnosticoPendiente(situacion.estado)) {
    reevaluarObjetivo(situacion, intento.objetivo, momento);
  }
}

/** Recalcula si el objetivo está dominado y dice cuántos ítems le faltan por responder (@MAST-1.3). */
export function evaluarObjetivo(entorno: Entorno, peticion: PeticionObjetivo): Resultado<EvaluacionObjetivo> {
  return enDominio(entorno, peticion.dominio, (situacion) => {
    if (diagnosticoPendiente(situacion.estado)) {
      return rechazar(MOTIVO_DIAGNOSTICO_PENDIENTE);
    }
    if (!situacion.contenido.objetivos.some((candidato) => candidato.id === peticion.objetivo)) {
      return rechazar(`No existe el objetivo ${peticion.objetivo}.`);
    }
    return aceptar(reevaluarObjetivo(situacion, peticion.objetivo, leerUmbralYMomento(entorno)));
  });
}

/**
 * De intermedio se pasa a avanzado/experto solo aquí, con el último intento intercalado de cada
 * problema intercalable (@MAST-6.2, @MAST-6.4). Responder problemas no cambia la fase hasta evaluarla.
 */
export function evaluarFase(entorno: Entorno, peticion: PeticionDominio): Resultado<EvaluacionFase> {
  return enDominio(entorno, peticion.dominio, ({ contenido, estado }) => {
    if (diagnosticoPendiente(estado)) {
      return rechazar(MOTIVO_DIAGNOSTICO_PENDIENTE);
    }
    const umbral = parametroNumerico(entorno.dependencias.leerParametros(), 'umbral_paso_a_avanzado');
    const problemas = problemasIntercalables(contenido.items, contenido.categorias);
    const acierto = aciertoSinAyuda(problemas, estado.ultimoIntentoDeCadaItem('intercalado'));
    estado.cambiarFase(entorno.dependencias.reloj.ahora(), faseTrasProblemas(estado.fase, acierto, umbral));
    return aceptar(
      acierto === undefined ? { fase: estado.fase } : { fase: estado.fase, aciertoProblemasSinPista: acierto },
    );
  });
}

/**
 * Lo único que se puede hacer con un objetivo es practicarlo, y solo cuando está abierto o dominado:
 * no hay forma de darlo por dominado, saltarlo ni declarar que ya se sabe (@MAST-3.2).
 */
export function consultarObjetivo(entorno: Entorno, peticion: PeticionObjetivo): Resultado<ObjetivoConsultado> {
  return enDominio(entorno, peticion.dominio, (situacion) => {
    const objetivo = situacion.contenido.objetivos.find((candidato) => candidato.id === peticion.objetivo);
    if (objetivo === undefined) {
      return rechazar(`No existe el objetivo ${peticion.objetivo}.`);
    }
    const cerrado = recorridoDeRuta(situacion).estados.get(objetivo.id) === 'cerrado';
    return aceptar({
      objetivo: objetivo.id,
      instruccion: objetivo.instruccion,
      acciones: cerrado ? [] : ['practicar'],
    });
  });
}

import { fechasDeRetencion, pruebaDeRetencionEnCurso } from '../dominio/criterio-dominio.ts';
import { problemasIntercalables } from '../dominio/diagnostico.ts';
import { esReservado, reservadosDeRetencion, sinReservados } from '../dominio/transferencia.ts';
import type { ContenidoDominio, ItemContenido, ObjetivoContenido } from './contenido.ts';
import { itemsDelObjetivo } from './contenido.ts';
import type { Entorno, Situacion } from './estado.ts';
import { diagnosticoPendiente, enDominio, MOTIVO_DIAGNOSTICO_PENDIENTE, recorridoDeRuta } from './estado.ts';
import { parametroListaNumerica } from './parametros.ts';
import { presentar } from './presentacion.ts';
import type { Resultado } from './resultado.ts';
import { aceptar, rechazar } from './resultado.ts';
import type { CasosDeSesiones, EjemploPresentado, Sesion } from './sesiones.ts';
import { sinImplementar } from './sin-implementar.ts';

// La petición, sacada de la firma del caso de uso, y un elemento cualquiera de una sesión.
type PeticionSesion = Parameters<CasosDeSesiones['iniciarSesion']>[0];
type ElementoSesion = Sesion['elementos'][number];

/**
 * El primer ejemplo resuelto del objetivo, si le queda algún paso a la vista. Un objetivo dominado en
 * el diagnóstico tiene todos los pasos retirados y no muestra ejemplos; uno sin dominar, el ejemplo
 * completo (@DIAG-2.5).
 */
function ejemploVisible(objetivo: ObjetivoContenido, pasosRetirados: number): EjemploPresentado | undefined {
  const ejemplo = objetivo.ejemplos_resueltos[0];
  if (ejemplo === undefined || pasosRetirados >= ejemplo.pasos.length) {
    return undefined;
  }
  const pasos = ejemplo.pasos.slice(0, ejemplo.pasos.length - pasosRetirados);
  return { id: ejemplo.id, objetivo: objetivo.id, pasos, instruccionesAutoexplicacion: [] };
}

function comoElementos(items: readonly ItemContenido[]): ElementoSesion[] {
  return items.map((item) => ({ tipo: 'item', item: presentar(item) }));
}

/** Los ítems del objetivo, sin los reservados (@MAST-8.1), detrás del ejemplo resuelto si lo hay. */
function elementosDePractica(
  contenido: ContenidoDominio,
  objetivo: ObjetivoContenido,
  pasosRetirados: number,
): readonly ElementoSesion[] {
  const items = comoElementos(itemsDelObjetivo(sinReservados(contenido.items), objetivo.id));
  const ejemplo = ejemploVisible(objetivo, pasosRetirados);
  return ejemplo === undefined ? items : [{ tipo: 'ejemplo', ejemplo }, ...items];
}

/** Un objetivo se practica solo cuando está abierto o dominado: uno cerrado se abre al dominar el anterior (@MAST-2.2). */
function sesionDePractica(situacion: Situacion, idObjetivo: string | undefined): Resultado<Sesion> {
  const { contenido, estado } = situacion;
  const objetivo = contenido.objetivos.find((candidato) => candidato.id === idObjetivo);
  if (objetivo === undefined) {
    return rechazar('Hay que elegir un objetivo del dominio para practicarlo.');
  }
  if (recorridoDeRuta(situacion).estados.get(objetivo.id) === 'cerrado') {
    return rechazar('Este objetivo se abre al dominar el anterior.');
  }
  const pasosRetirados = estado.pasosRetiradosDe(objetivo.id);
  return aceptar({
    tipo: 'practica',
    intercalada: false,
    elementos: elementosDePractica(contenido, objetivo, pasosRetirados),
  });
}

/** Un reservado se presenta una sola vez: después de su intento ya no es un caso nuevo (@MAST-8.5). */
function sinGastar(situacion: Situacion, items: readonly ItemContenido[]): readonly ItemContenido[] {
  const respondidos = situacion.estado.ultimoIntentoDeCadaItem();
  return items.filter((item) => !esReservado(item) || !respondidos.has(item.id));
}

/**
 * Los problemas de las categorías del grupo de parecidas, en el orden del contenido, con los
 * problemas reservados que aún no se han respondido: van a la mezcla (@MAST-8.3, INTE-5). Es lo
 * mínimo para MAST: el orden por turnos, la fase de intercalado y cuándo entra un reservado (INTE-5.1)
 * son del área INTE.
 */
function sesionIntercalada(situacion: Situacion, grupo: string): Resultado<Sesion> {
  const { contenido } = situacion;
  const delGrupo = contenido.categorias.filter((categoria) => categoria.grupo_parecidas === grupo);
  const problemas = new Set(problemasIntercalables(contenido.items, delGrupo));
  const items = sinGastar(
    situacion,
    contenido.items.filter((item) => problemas.has(item.id)),
  );
  if (items.length === 0) {
    return rechazar(`El grupo ${grupo} no tiene problemas que intercalar.`);
  }
  return aceptar({ tipo: 'practica', intercalada: true, elementos: comoElementos(items) });
}

/**
 * Los ítems no reservados que la persona ya ha respondido, del objetivo si se pide uno (@MAST-8.1).
 * Es lo mínimo para MAST: qué ítems tocan cada día lo decide el planificador (PLAN).
 */
function sesionDeRepaso(situacion: Situacion, objetivo: string | undefined): Resultado<Sesion> {
  const { contenido, estado } = situacion;
  const respondidos = estado.ultimoIntentoDeCadaItem();
  const candidatos = sinReservados(contenido.items).filter(
    (item) => objetivo === undefined || item.objetivo === objetivo,
  );
  const items = candidatos.filter((item) => respondidos.has(item.id));
  if (items.length === 0) {
    return rechazar('No hay nada que repasar todavía.');
  }
  return aceptar({ tipo: 'repaso', intercalada: false, elementos: comoElementos(items) });
}

/**
 * La prueba de retención que toca ahora de un objetivo dominado (@MAST-7.1): sus ítems no reservados
 * y los reservados que el reparto da a esa prueba y aún no se han respondido (@MAST-8.3, @MAST-8.5),
 * en el orden del contenido. Lee solo el contenido aprobado: nada del borrador (@MAST-7.4).
 */
function pruebaDeRetencion(entorno: Entorno, situacion: Situacion, idObjetivo: string | undefined): Resultado<Sesion> {
  const { contenido, estado } = situacion;
  const objetivo = contenido.objetivos.find((candidato) => candidato.id === idObjetivo);
  if (objetivo === undefined) {
    return rechazar('Hay que elegir un objetivo del dominio para su prueba de retención.');
  }
  const dominadoEl = estado.dominadoDesde(objetivo.id);
  if (dominadoEl === undefined) {
    return rechazar('Solo se mide la retención de un objetivo dominado.');
  }
  const semanas = parametroListaNumerica(entorno.dependencias.leerParametros(), 'retencion_diferida_semanas');
  const fechas = fechasDeRetencion(dominadoEl, semanas);
  const prueba = pruebaDeRetencionEnCurso(fechas, entorno.dependencias.reloj.ahora());
  if (prueba === undefined) {
    return rechazar(`Todavía no toca ninguna prueba de retención de ${objetivo.id}.`);
  }
  const delObjetivo = itemsDelObjetivo(contenido.items, objetivo.id);
  const deEstaPrueba = new Set(reservadosDeRetencion(delObjetivo, contenido.categorias, fechas.length)[prueba]);
  const items = sinGastar(
    situacion,
    delObjetivo.filter((item) => !esReservado(item) || deEstaPrueba.has(item.id)),
  );
  return aceptar({ tipo: 'retencion', intercalada: false, elementos: comoElementos(items) });
}

/**
 * Hasta terminar el diagnóstico no se empieza ninguna sesión (@DIAG-1.1). Un reservado solo se
 * presenta donde se mide la transferencia: en la mezcla y en las pruebas de retención (@MAST-8.1).
 */
export function iniciarSesion(entorno: Entorno, peticion: PeticionSesion): Resultado<Sesion> {
  const { tipo } = peticion;
  if (tipo === 'diagnostico') {
    return sinImplementar();
  }
  return enDominio(entorno, peticion.dominio, (situacion) => {
    if (diagnosticoPendiente(situacion.estado)) {
      return rechazar(MOTIVO_DIAGNOSTICO_PENDIENTE);
    }
    switch (tipo) {
      case 'practica':
        return peticion.grupo === undefined
          ? sesionDePractica(situacion, peticion.objetivo)
          : sesionIntercalada(situacion, peticion.grupo);
      case 'repaso':
        return sesionDeRepaso(situacion, peticion.objetivo);
      case 'retencion':
        return pruebaDeRetencion(entorno, situacion, peticion.objetivo);
    }
  });
}

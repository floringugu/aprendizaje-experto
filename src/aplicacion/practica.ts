import type { ContenidoDominio, ObjetivoContenido } from './contenido.ts';
import { itemsDelObjetivo } from './contenido.ts';
import type { Entorno } from './estado.ts';
import { diagnosticoPendiente, enDominio, MOTIVO_DIAGNOSTICO_PENDIENTE } from './estado.ts';
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

function elementosDePractica(
  contenido: ContenidoDominio,
  objetivo: ObjetivoContenido,
  pasosRetirados: number,
): readonly ElementoSesion[] {
  const items: ElementoSesion[] = itemsDelObjetivo(contenido.items, objetivo.id).map((item) => ({
    tipo: 'item',
    item: presentar(item),
  }));
  const ejemplo = ejemploVisible(objetivo, pasosRetirados);
  return ejemplo === undefined ? items : [{ tipo: 'ejemplo', ejemplo }, ...items];
}

/** Hasta terminar el diagnóstico no se practica ningún objetivo (@DIAG-1.1). */
export function iniciarSesion(entorno: Entorno, peticion: PeticionSesion): Resultado<Sesion> {
  if (peticion.tipo !== 'practica') {
    return sinImplementar();
  }
  return enDominio(entorno, peticion.dominio, ({ contenido, estado }) => {
    if (diagnosticoPendiente(estado)) {
      return rechazar(MOTIVO_DIAGNOSTICO_PENDIENTE);
    }
    const objetivo = contenido.objetivos.find((candidato) => candidato.id === peticion.objetivo);
    if (objetivo === undefined) {
      return rechazar('Hay que elegir un objetivo del dominio para practicarlo.');
    }
    const pasosRetirados = estado.pasosRetiradosDe(objetivo.id);
    return aceptar({
      tipo: 'practica',
      intercalada: false,
      elementos: elementosDePractica(contenido, objetivo, pasosRetirados),
    });
  });
}

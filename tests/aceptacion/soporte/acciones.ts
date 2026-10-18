import type { ItemContenido } from '../../../src/aplicacion/contenido.ts';
import type { Fase, Progreso, ProgresoObjetivo } from '../../../src/aplicacion/dominio.ts';
import type { ContextoRespuesta, Feedback } from '../../../src/aplicacion/sesiones.ts';
import { presente } from './comprobar.ts';
import { respuestaPara } from './contenido.ts';
import { aceptado } from './mundo.ts';
import type { Mundo } from './mundo.ts';

const DIAS_HASTA_EL_REPASO = 8;
/** Para que 0,85 × 20 no se quede en 17,0000000000000004 y pida un acierto de más. */
const TOLERANCIA_DEL_UMBRAL = 1e-9;
const PROBLEMAS_POR_SEMANA = 20;
const UMBRAL_DE_RETIRADA = 0.85;
/** Algo más que la periodicidad del bucle, para que cada semana empiece con la ventana vacía. */
const DIAS_ENTRE_BUCLES = 8;
const INTENCION_DE_PRUEBA = 'si son las 9:00 y estoy en la mesa, hago 20 problemas';

interface PeticionBase {
  readonly item: string;
  readonly contexto?: ContextoRespuesta | undefined;
  readonly confianza?: number | undefined;
  readonly persona?: number | undefined;
  readonly dominio?: string | undefined;
}

interface PeticionRespuesta extends PeticionBase {
  readonly correcta: boolean;
}

interface PeticionTexto extends PeticionBase {
  /** Lo que escribe o elige la persona, tal cual. */
  readonly respuesta: string;
}

/**
 * La persona ve un ítem, escribe o elige `respuesta` y declara su confianza: el recorrido completo
 * de un intento. Devuelve el feedback que ve al final.
 */
export function responderTexto(mundo: Mundo, peticion: PeticionTexto): Feedback {
  const dominio = peticion.dominio ?? mundo.dominio;
  if (mundo.diagnosticoPrevio) {
    mundo.terminarDiagnosticoSinItems(peticion.persona, dominio);
  }
  const app = mundo.aplicacion(peticion.persona);
  const contexto = peticion.contexto ?? 'practica';
  mundo.presentado = aceptado(app.presentarItem({ dominio, item: peticion.item, contexto }));
  aceptado(app.responderItem({ dominio, item: peticion.item, contexto, respuesta: peticion.respuesta }));
  const feedback = aceptado(
    app.declararConfianza({ dominio, item: peticion.item, confianza: peticion.confianza ?? mundo.confianza }),
  );
  mundo.feedback = feedback;
  return feedback;
}

/** Como `responderTexto`, pero con una respuesta que el contenido corrige como acertada o fallada. */
export function responder(mundo: Mundo, peticion: PeticionRespuesta): Feedback {
  const item = mundo.contenido(peticion.dominio ?? mundo.dominio).item(peticion.item);
  const feedback = responderTexto(mundo, { ...peticion, respuesta: respuestaPara(item, peticion.correcta) });
  mundo.intentos.set(item.id, peticion.correcta);
  return feedback;
}

/** Fecha del siguiente repaso del ítem para la persona indicada; falla el paso si no hay ninguno. */
export function siguienteRepaso(mundo: Mundo, item: string, persona = 0): Date {
  const repasos = aceptado(mundo.aplicacion(persona).consultarRepasos({ dominio: mundo.dominio }));
  return presente(
    repasos.find((candidato) => candidato.item === item),
    `ningún repaso programado para ${item}`,
  ).fecha;
}

interface PeticionRespuestas {
  readonly items: readonly ItemContenido[];
  /** Cuántos de los ítems, empezando por el primero, se aciertan; el resto se falla. */
  readonly aciertos: number;
  readonly contexto?: ContextoRespuesta;
  readonly persona?: number;
}

/** Responde los ítems en orden: acierta los `aciertos` primeros y falla el resto (último intento). */
export function responderItems(mundo: Mundo, peticion: PeticionRespuestas): void {
  peticion.items.forEach((item, posicion) => {
    responder(mundo, {
      item: item.id,
      correcta: posicion < peticion.aciertos,
      contexto: peticion.contexto,
      persona: peticion.persona,
    });
  });
}

/** Responde todos los ítems del objetivo, acertando los `aciertos` primeros. */
export function responderObjetivo(mundo: Mundo, objetivo: string, aciertos: number): void {
  responderItems(mundo, { items: mundo.contenido().itemsDe(objetivo), aciertos });
}

/** Acierta todos los ítems del objetivo y pide a la aplicación que lo evalúe. */
export function dominarObjetivo(mundo: Mundo, objetivo: string): void {
  const items = mundo.contenido().itemsDe(objetivo);
  responderItems(mundo, { items, aciertos: items.length });
  aceptado(mundo.aplicacion().evaluarObjetivo({ dominio: mundo.dominio, objetivo }));
}

/** Responde los ítems del objetivo acertando la fracción pedida y pide que se evalúe. */
export function llevarAcierto(mundo: Mundo, objetivo: string, fraccion: number): void {
  const items = mundo.contenido().itemsDe(objetivo);
  responderItems(mundo, { items, aciertos: Math.round(fraccion * items.length) });
  aceptado(mundo.aplicacion().evaluarObjetivo({ dominio: mundo.dominio, objetivo }));
}

/** Ítems del objetivo cuyo último intento fue correcto. */
function itemsAcertados(mundo: Mundo, objetivo: string): readonly ItemContenido[] {
  return mundo
    .contenido()
    .itemsDe(objetivo)
    .filter((item) => mundo.intentos.get(item.id) === true);
}

/** Pasa el tiempo que hace falta para que toque repasar y la persona falla `cantidad` ítems que sabía. */
export function fallarRepaso(
  mundo: Mundo,
  peticion: { objetivo: string; contexto: ContextoRespuesta; cantidad: number },
): void {
  mundo.reloj.avanzarDias(DIAS_HASTA_EL_REPASO);
  itemsAcertados(mundo, peticion.objetivo)
    .slice(0, peticion.cantidad)
    .forEach((item) => {
      responder(mundo, { item: item.id, correcta: false, contexto: peticion.contexto });
    });
}

/** Cuántos ítems hay que fallar para que el acierto de `total` ítems baje del umbral. */
export function fallosParaPerderElDominio(total: number, umbral: number): number {
  const aciertosQueLlegan = Math.ceil(umbral * total - TOLERANCIA_DEL_UMBRAL);
  return total - aciertosQueLlegan + 1;
}

/** Problemas de categorías intercalables, que son los que decide el paso a la fase avanzada. */
export function problemasIntercalables(mundo: Mundo): readonly ItemContenido[] {
  const contenido = mundo.contenido();
  return contenido.items.filter((item) => item.tipo === 'problema' && contenido.esIntercalable(item));
}

/** Acierta en sesiones intercaladas todos los problemas intercalables y evalúa la fase. */
export function superarProblemasIntercalados(mundo: Mundo): void {
  const problemas = problemasIntercalables(mundo);
  responderItems(mundo, { items: problemas, aciertos: problemas.length, contexto: 'intercalado' });
  aceptado(mundo.aplicacion().evaluarFase({ dominio: mundo.dominio }));
}

/**
 * Lleva a la persona a la fase indicada por el camino de verdad: diagnóstico, dominar todos los
 * objetivos y acertar los problemas intercalados. El contenido tiene que estar ya completo.
 */
export function llegarAFase(mundo: Mundo, fase: Fase): void {
  mundo.terminarDiagnosticoSinItems();
  if (fase === 'novato') {
    return;
  }
  const contenido = mundo.contenido();
  contenido.asegurarItemsPorObjetivo(1);
  if (fase === 'avanzado_experto') {
    contenido.hacerIntercalables(1);
  }
  contenido.objetivos.forEach((objetivo) => {
    dominarObjetivo(mundo, objetivo.id);
  });
  if (fase === 'avanzado_experto') {
    superarProblemasIntercalados(mundo);
  }
}

const FASES: readonly Fase[] = ['diagnostico', 'novato', 'intermedio', 'avanzado_experto'];

/** «novato» → 'novato'; falla el paso si el escenario nombra una fase que no existe. */
export function aFase(texto: string): Fase {
  const fase = FASES.find((candidata) => candidata === texto);
  if (fase === undefined) {
    throw new Error(`«${texto}» no es una fase`);
  }
  return fase;
}

export function progresoCompleto(mundo: Mundo): Progreso {
  return aceptado(mundo.listo().consultarProgreso({ dominio: mundo.dominio }));
}

export function progresoDe(mundo: Mundo, objetivo: string): ProgresoObjetivo {
  const encontrado = progresoCompleto(mundo).objetivos.find((candidato) => candidato.objetivo === objetivo);
  if (encontrado === undefined) {
    throw new Error(`La aplicación no informa del objetivo ${objetivo}`);
  }
  return encontrado;
}

export function ejecutarBucleSemanal(mundo: Mundo): void {
  mundo.bucle = aceptado(mundo.aplicacion().ejecutarBucle({ dominio: mundo.dominio }));
}

/**
 * Ejecuta el bucle semanal y lo termina dejando escrita una intención de implementación, que es lo
 * que hace falta para terminarlo (BUCL-3.1). Sin terminarlo, el siguiente bucle podría no empezar.
 */
export function cerrarBucleSemanal(mundo: Mundo, intencion: string): void {
  ejecutarBucleSemanal(mundo);
  aceptado(
    mundo.aplicacion().terminarBucle({ dominio: mundo.dominio, intencion: { accion: 'nueva', texto: intencion } }),
  );
}

/** Los `total` problemas del objetivo que se responden en una semana (se crean si faltan). */
function problemasDeLaSemana(mundo: Mundo, objetivo: string, total: number): readonly ItemContenido[] {
  mundo.contenido().asegurarProblemas(objetivo, total);
  return mundo
    .contenido()
    .itemsDe(objetivo)
    .filter((item) => item.tipo === 'problema')
    .slice(0, total);
}

/** La persona responde en la semana `total` problemas del objetivo y acierta `aciertos` de ellos. */
export function responderProblemasDeLaSemana(mundo: Mundo, objetivo: string, aciertos: number): void {
  responderItems(mundo, { items: problemasDeLaSemana(mundo, objetivo, PROBLEMAS_POR_SEMANA), aciertos });
}

/**
 * Deja al objetivo con `pasos` pasos retirados por el camino de verdad: bucles semanales con todos los
 * problemas acertados. Usa el umbral y el ajuste de la tabla del SRS, no los que el escenario cambie.
 * El reloj avanza `pasos × DIAS_ENTRE_BUCLES` días.
 */
export function retirarPasos(mundo: Mundo, objetivo: string, pasos: number): void {
  const configuracion = mundo.parametros;
  mundo.establecerParametro('umbral_retirada_ayuda', UMBRAL_DE_RETIRADA);
  mundo.establecerParametro('pasos_retirados_por_ajuste', 1);
  for (let semana = 0; semana < pasos; semana += 1) {
    responderProblemasDeLaSemana(mundo, objetivo, PROBLEMAS_POR_SEMANA);
    cerrarBucleSemanal(mundo, INTENCION_DE_PRUEBA);
    mundo.reloj.avanzarDias(DIAS_ENTRE_BUCLES);
  }
  mundo.parametros = configuracion;
}

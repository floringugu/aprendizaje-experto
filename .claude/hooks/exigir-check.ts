// Hook Stop: Claude no puede terminar el turno mientras falle la comprobación de su fase
// (make check, make check-specs o make check-aceptacion).
//
// Excepción: si Claude necesita una decisión del dueño, termina su mensaje con la marca
// [DECISIÓN PENDIENTE]. Entonces puede parar, y el dueño ve un aviso de que la
// comprobación no se ha hecho.
//
// Freno: si el fallo es del entorno, de las sumas, o es el tercer bloqueo seguido del mismo
// paso, el mensaje cambia (scripts/arnes/comun/freno-stop.ts). Cada parada se anota en
// .claude/registro-stop.jsonl (scripts/arnes/comun/registro-stop.ts).
//
// Espera: si quedan subagentes trabajando en segundo plano (el implementador), no comprueba
// nada, porque vería sus ficheros a medio escribir. Claude Code despierta a Claude cuando
// terminan, y el hook vuelve a ejecutarse al parar de nuevo.
import { leerAreasFueraDeAlcance } from '../../scripts/arnes/comun/alcance.ts';
import { subagentesEnCurso } from '../../scripts/arnes/comun/enrutador.ts';
import { campo, campoTexto, ejecutarHook, leerEntradaHook, responder } from '../../scripts/arnes/comun/entrada-hook.ts';
import { OBJETIVO_POR_FASE } from '../../scripts/arnes/comun/fases.ts';
import {
  errorDeEntorno,
  MARCA_DECISION_PENDIENTE,
  motivoDeBloqueo,
  pasoQueFalla,
} from '../../scripts/arnes/comun/freno-stop.ts';
import { ejecutarObjetivo } from '../../scripts/arnes/comun/make.ts';
import { faseDeEntorno } from '../../scripts/arnes/comun/protegidas.ts';
import { RAIZ } from '../../scripts/arnes/comun/raiz.ts';
import { anotarParada, bloqueosSeguidos, leerRegistro } from '../../scripts/arnes/comun/registro-stop.ts';
import type { ParadaStop } from '../../scripts/arnes/comun/registro-stop.ts';

/** Lo que se anota en todas las paradas, pase o no la comprobación. */
type DatosDeParada = Pick<ParadaStop, 'fecha' | 'sesion' | 'fase' | 'areasFueraDeAlcance'>;

ejecutarHook('exigir-check', async () => {
  const entrada = await leerEntradaHook();
  const datos: DatosDeParada = {
    fecha: new Date().toISOString(),
    sesion: campoTexto(entrada, 'session_id') ?? 'desconocida',
    fase: faseDeEntorno(process.env),
    areasFueraDeAlcance: leerAreasFueraDeAlcance(RAIZ),
  };
  if ((campoTexto(entrada, 'last_assistant_message') ?? '').includes(MARCA_DECISION_PENDIENTE)) {
    anotarParada(RAIZ, { ...datos, resultado: 'decision' });
    responder({
      systemMessage: `Claude ha parado con ${MARCA_DECISION_PENDIENTE}: espera tu decisión. La comprobación no se ha ejecutado.`,
    });
    return;
  }
  const subagentes = subagentesEnCurso(campo(entrada, 'background_tasks'));
  if (subagentes > 0) {
    responder({
      systemMessage: `Claude espera a ${String(subagentes)} subagente(s) en segundo plano; la comprobación se hará cuando terminen.`,
    });
    return;
  }
  const objetivo = OBJETIVO_POR_FASE[datos.fase];
  const make = ejecutarObjetivo(RAIZ, objetivo);
  if (make.verde) {
    anotarParada(RAIZ, { ...datos, resultado: 'verde' });
    return;
  }
  bloquear(datos, objetivo, make.salida);
});

function bloquear(datos: DatosDeParada, objetivo: string, salida: string): void {
  const paso = pasoQueFalla(salida);
  const entorno = errorDeEntorno(salida);
  // La racha incluye este bloqueo: se lee el registro antes de anotarlo.
  const seguidos = bloqueosSeguidos(leerRegistro(RAIZ), datos.sesion, paso) + 1;
  anotarParada(RAIZ, {
    ...datos,
    resultado: 'bloqueo',
    paso,
    seguidos,
    ...(entorno === undefined ? {} : { entorno: entorno.codigo }),
  });
  responder({
    decision: 'block',
    reason: motivoDeBloqueo({ objetivo, paso, entorno, bloqueosSeguidos: seguidos, salida }),
  });
}

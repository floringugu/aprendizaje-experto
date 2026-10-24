// Hook Stop: Claude no puede terminar el turno mientras falle la comprobación de su fase
// (make check, make check-specs o make check-aceptacion).
//
// Excepción: si Claude necesita una decisión del dueño, termina su mensaje con la marca
// [DECISIÓN PENDIENTE]. Entonces puede parar, y el dueño ve un aviso de que la
// comprobación no se ha hecho.
//
// Freno: si el fallo es del entorno, de la integridad, o es el tercer bloqueo seguido del mismo
// paso, el mensaje cambia (scripts/arnes/comun/freno-stop.ts). Cada parada se anota en
// .claude/registro-stop.jsonl (scripts/arnes/comun/registro-stop.ts).
//
// Relevo: si el contexto ha pasado del umbral (scripts/arnes/comun/relevo.ts), Claude acaba el paso
// en curso, apunta el relevo y termina con [RELEVO]. Entonces puede parar sin la comprobación: el
// dueño sigue en una conversación nueva. Por debajo del umbral, la marca no cuenta.
//
// Espera: si quedan subagentes trabajando en segundo plano (el implementador), no comprueba
// nada, porque vería sus ficheros a medio escribir. Claude Code despierta a Claude cuando
// terminan, y el hook vuelve a ejecutarse al parar de nuevo.
//
// Sin cambios: si el árbol de trabajo no difiere del último commit, no hay trabajo que comprobar
// (la conversación ha sido una consulta, o el dueño ya ha commiteado lo que había), y Claude
// para sin ejecutar make. Exigirle la comprobación lo empujaría a trabajar en una etapa que
// nadie le ha pedido. Ni las esperas ni estas paradas se anotan en el registro.
import { leerAlcance } from '../../scripts/arnes/comun/alcance.ts';
import { subagentesEnCurso } from '../../scripts/arnes/comun/enrutador.ts';
import { campo, campoTexto, ejecutarHook, leerEntradaHook, responder } from '../../scripts/arnes/comun/entrada-hook.ts';
import { OBJETIVO_POR_FASE } from '../../scripts/arnes/comun/fases.ts';
import {
  errorDeEntorno,
  MARCA_DECISION_PENDIENTE,
  motivoDeBloqueo,
  pasoQueFalla,
} from '../../scripts/arnes/comun/freno-stop.ts';
import { hayCambiosSinCommitear } from '../../scripts/arnes/comun/git.ts';
import { ejecutarObjetivo } from '../../scripts/arnes/comun/make.ts';
import { faseDeEntorno } from '../../scripts/arnes/comun/protegidas.ts';
import { RAIZ } from '../../scripts/arnes/comun/raiz.ts';
import { anotarParada, bloqueosSeguidos, leerRegistro } from '../../scripts/arnes/comun/registro-stop.ts';
import type { ParadaStop } from '../../scripts/arnes/comun/registro-stop.ts';
import {
  avisoDeRelevoPasado,
  MARCA_RELEVO,
  NOTA_DE_RELEVO_ANTES_DE_TIEMPO,
  puedePasarElRelevo,
  tokensDelTranscript,
} from '../../scripts/arnes/comun/relevo.ts';

/** Lo que se anota en todas las paradas, pase o no la comprobación. */
type DatosDeParada = Pick<ParadaStop, 'fecha' | 'sesion' | 'fase' | 'areasCerradas' | 'areaEnCurso'>;

ejecutarHook('exigir-check', async () => {
  const entrada = await leerEntradaHook();
  const datos = datosDeParada(entrada);
  const ultimoMensaje = campoTexto(entrada, 'last_assistant_message') ?? '';
  if (ultimoMensaje.includes(MARCA_DECISION_PENDIENTE)) {
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
  // Se mira después de la espera: con un subagente aún escribiendo, el relevo saldría a medias.
  const conRelevo = ultimoMensaje.includes(MARCA_RELEVO);
  if (conRelevo && pasarRelevo(entrada, datos)) return;
  const objetivo = OBJETIVO_POR_FASE[datos.fase];
  if (!hayCambiosSinCommitear(RAIZ)) {
    responder({ systemMessage: `Sin cambios respecto al último commit: Claude para sin ejecutar make ${objetivo}.` });
    return;
  }
  const make = ejecutarObjetivo(RAIZ, objetivo);
  if (make.verde) {
    anotarParada(RAIZ, { ...datos, resultado: 'verde' });
    return;
  }
  const motivo = anotarBloqueo(datos, objetivo, make.salida);
  // Si Claude ha intentado pasar el relevo antes de tiempo, se le explica por qué no ha podido parar.
  responder({ decision: 'block', reason: conRelevo ? `${NOTA_DE_RELEVO_ANTES_DE_TIEMPO}\n\n${motivo}` : motivo });
});

function datosDeParada(entrada: unknown): DatosDeParada {
  const { cerradas, enCurso } = leerAlcance(RAIZ, process.env);
  return {
    fecha: new Date().toISOString(),
    sesion: campoTexto(entrada, 'session_id') ?? 'desconocida',
    fase: faseDeEntorno(process.env),
    areasCerradas: cerradas,
    ...(enCurso === undefined ? {} : { areaEnCurso: enCurso }),
  };
}

/** Si el contexto pasa del umbral, deja parar a Claude con [RELEVO] y devuelve true. */
function pasarRelevo(entrada: unknown, datos: DatosDeParada): boolean {
  const tokens = tokensDelTranscript(campoTexto(entrada, 'transcript_path'));
  if (tokens === undefined || !puedePasarElRelevo(tokens)) return false;
  anotarParada(RAIZ, { ...datos, resultado: 'relevo' });
  responder({ systemMessage: avisoDeRelevoPasado(tokens) });
  return true;
}

/** Anota el bloqueo en el registro y devuelve el motivo que verá Claude. */
function anotarBloqueo(datos: DatosDeParada, objetivo: string, salida: string): string {
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
  return motivoDeBloqueo({ objetivo, paso, entorno, bloqueosSeguidos: seguidos, salida });
}

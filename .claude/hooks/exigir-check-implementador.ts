// Hook SubagentStop (implementador): el subagente no puede devolver su encargo mientras falle
// make check-implementador (tipos, lint, duplicación, capas y tests unitarios).
//
// Excepciones:
//   - si termina su mensaje con [DECISIÓN PENDIENTE], devuelve el encargo sin comprobar y
//     decide la conversación principal;
//   - después de BLOQUEOS_DEL_IMPLEMENTADOR bloqueos lo devuelve en rojo, para que la
//     conversación principal lo reencargue con un modelo más capaz (enrutador.ts).
// Cada bloqueo se anota en .claude/registro-enrutador.jsonl. El mensaje está en freno-stop.ts.
import { campoTexto, ejecutarHook, leerEntradaHook, responder } from '../../scripts/arnes/comun/entrada-hook.ts';
import { OBJETIVO_DEL_IMPLEMENTADOR } from '../../scripts/arnes/comun/fases.ts';
import {
  BLOQUEOS_DEL_IMPLEMENTADOR,
  errorDeEntorno,
  MARCA_DECISION_PENDIENTE,
  motivoDeBloqueoDelImplementador,
  pasoQueFalla,
} from '../../scripts/arnes/comun/freno-stop.ts';
import { ejecutarObjetivo } from '../../scripts/arnes/comun/make.ts';
import { RAIZ } from '../../scripts/arnes/comun/raiz.ts';
import {
  anotarEvento,
  bloqueosDelAgente,
  leerRegistroEnrutador,
} from '../../scripts/arnes/comun/registro-enrutador.ts';

ejecutarHook('exigir-check-implementador', async () => {
  const entrada = await leerEntradaHook();
  if ((campoTexto(entrada, 'last_assistant_message') ?? '').includes(MARCA_DECISION_PENDIENTE)) return;
  const make = ejecutarObjetivo(RAIZ, OBJETIVO_DEL_IMPLEMENTADOR);
  if (make.verde) return;
  const agente = campoTexto(entrada, 'agent_id') ?? 'desconocido';
  // El número de este bloqueo: se lee el registro antes de anotarlo.
  const bloqueo = bloqueosDelAgente(leerRegistroEnrutador(RAIZ), agente) + 1;
  if (bloqueo > BLOQUEOS_DEL_IMPLEMENTADOR) {
    responder({
      systemMessage: `El implementador devuelve su encargo con make ${OBJETIVO_DEL_IMPLEMENTADOR} en rojo.`,
    });
    return;
  }
  const paso = pasoQueFalla(make.salida);
  anotarEvento(RAIZ, {
    tipo: 'bloqueo',
    fecha: new Date().toISOString(),
    sesion: campoTexto(entrada, 'session_id') ?? 'desconocida',
    agente,
    paso,
  });
  responder({
    decision: 'block',
    reason: motivoDeBloqueoDelImplementador({
      paso,
      entorno: errorDeEntorno(make.salida),
      bloqueo,
      salida: make.salida,
    }),
  });
});

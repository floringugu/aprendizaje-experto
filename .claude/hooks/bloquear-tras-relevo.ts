// Hook PreToolUse (Edit, Write, MultiEdit, NotebookEdit): una conversación que ya ha parado con
// [RELEVO] no edita más ficheros. El relevo es obligatorio: el dueño sigue en una conversación nueva,
// y lo que esta cambiara ahora no estaría en el relevo. La regla está en scripts/arnes/comun/relevo.ts.
//
// Que la conversación ya pasó el relevo se lee de .claude/registro-stop.jsonl, donde el hook Stop
// (anotar-parada.ts) anota cada parada con [RELEVO] aceptado. Los subagentes comparten el session_id
// de la conversación que los lanza, así que tampoco editan.
import { campoTexto, ejecutarHook, leerEntradaHook, responder } from '../../scripts/arnes/comun/entrada-hook.ts';
import { RAIZ } from '../../scripts/arnes/comun/raiz.ts';
import { leerRegistro, relevoPasado } from '../../scripts/arnes/comun/registro-stop.ts';
import { MOTIVO_EDICION_TRAS_RELEVO } from '../../scripts/arnes/comun/relevo.ts';

ejecutarHook('bloquear-tras-relevo', async () => {
  const entrada = await leerEntradaHook();
  const sesion = campoTexto(entrada, 'session_id');
  if (sesion === undefined || !relevoPasado(leerRegistro(RAIZ), sesion)) return;
  responder({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: MOTIVO_EDICION_TRAS_RELEVO,
    },
  });
});

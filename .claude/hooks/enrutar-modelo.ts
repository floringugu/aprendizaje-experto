// Hook PreToolUse (Agent): el modelo de los subagentes lo elige una regla fija, no Claude.
// El implementador y los revisores usan el modelo de su cabecera (.claude/agents/), el implementador
// solo en la fase impl, y a los demás subagentes que no lleven modelo los manda a Haiku o Sonnet.
// La regla está en scripts/arnes/comun/enrutador.ts.
import { campo, ejecutarHook, leerEntradaHook, responder } from '../../scripts/arnes/comun/entrada-hook.ts';
import { enrutar } from '../../scripts/arnes/comun/enrutador.ts';
import { faseDeEntorno } from '../../scripts/arnes/comun/protegidas.ts';

ejecutarHook('enrutar-modelo', async () => {
  const entrada = await leerEntradaHook();
  const enrutado = enrutar(campo(entrada, 'tool_input'), { fase: faseDeEntorno(process.env) });
  if (enrutado.tipo === 'sin-cambios') return;
  if (enrutado.tipo === 'bloquear') {
    responder({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: enrutado.motivo,
      },
    });
    return;
  }
  // updatedInput sustituye la entrada entera de Agent, y Claude Code solo lo aplica junto a «allow».
  responder({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow',
      permissionDecisionReason: enrutado.aviso,
      updatedInput: enrutado.entrada,
      additionalContext: enrutado.aviso,
    },
  });
});

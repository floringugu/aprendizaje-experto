// Hook PreToolUse (Agent): el modelo de los subagentes lo elige una regla fija, no Claude.
// Encarga al implementador con Haiku o Sonnet según los ficheros y los reencargos, deja a los
// revisores con el modelo de su cabecera y manda a Haiku o Sonnet a los demás subagentes que no
// lleven modelo. La regla está en scripts/arnes/comun/enrutador.ts.
// Cada encargo al implementador se anota en .claude/registro-enrutador.jsonl, para la escalera.
import { campo, campoTexto, ejecutarHook, leerEntradaHook, responder } from '../../scripts/arnes/comun/entrada-hook.ts';
import { enrutar } from '../../scripts/arnes/comun/enrutador.ts';
import { faseDeEntorno } from '../../scripts/arnes/comun/protegidas.ts';
import { RAIZ } from '../../scripts/arnes/comun/raiz.ts';
import { anotarEvento, leerRegistroEnrutador } from '../../scripts/arnes/comun/registro-enrutador.ts';

ejecutarHook('enrutar-modelo', async () => {
  const entrada = await leerEntradaHook();
  const sesion = campoTexto(entrada, 'session_id') ?? 'desconocida';
  const enrutado = enrutar(campo(entrada, 'tool_input'), {
    fase: faseDeEntorno(process.env),
    sesion,
    registro: leerRegistroEnrutador(RAIZ),
  });
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
  if (enrutado.encargo !== undefined) {
    anotarEvento(RAIZ, { tipo: 'encargo', fecha: new Date().toISOString(), sesion, ...enrutado.encargo });
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

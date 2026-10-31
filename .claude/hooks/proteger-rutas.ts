// Hook PreToolUse (Edit, Write, MultiEdit, NotebookEdit y Bash): bloquea lo que la conversación no
// puede tocar: los carriles de otras conversaciones, las rutas de otras fases, el .git/ de cada
// checkout, ~/.claude/ y unos pocos comandos que se salen del arnés. La carpeta principal no se frena
// salvo por la fase: main la protege GitHub. La lógica está en scripts/arnes/comun/guardia.ts.
import os from 'node:os';
import {
  checkoutDeLaEntrada,
  checkoutsDelRepositorio,
  faseYAreaDelCheckout,
} from '../../scripts/arnes/comun/checkout.ts';
import { ejecutarHook, leerEntradaHook, responder } from '../../scripts/arnes/comun/entrada-hook.ts';
import { motivoBloqueoDeLaEntrada } from '../../scripts/arnes/comun/guardia.ts';
import { RAIZ } from '../../scripts/arnes/comun/raiz.ts';

ejecutarHook('proteger-rutas', async () => {
  const entrada = await leerEntradaHook();
  const checkout = checkoutDeLaEntrada(RAIZ, entrada);
  const motivo = motivoBloqueoDeLaEntrada(entrada, {
    ...checkoutsDelRepositorio(RAIZ),
    checkout,
    fase: faseYAreaDelCheckout(checkout).fase,
    home: os.homedir(),
  });
  if (motivo === undefined) return;
  responder({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: motivo },
  });
});

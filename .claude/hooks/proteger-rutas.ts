// Hook PreToolUse (Edit, Write, MultiEdit, NotebookEdit y Bash): bloquea lo que la conversación no
// puede tocar: los carriles de otras conversaciones, el .git/ de cada checkout, ~/.claude/ y unos
// pocos comandos que se salen del arnés. La carpeta principal no se frena: main la protege GitHub.
// La lógica está en scripts/arnes/comun/guardia.ts.
import os from 'node:os';
import path from 'node:path';
import { checkoutDeLaEntrada, checkoutsDelRepositorio } from '../../scripts/arnes/comun/checkout.ts';
import { campo, campoTexto, ejecutarHook, leerEntradaHook, responder } from '../../scripts/arnes/comun/entrada-hook.ts';
import { motivoBloqueoBash, motivoBloqueoFichero } from '../../scripts/arnes/comun/guardia.ts';
import type { ContextoGuardia } from '../../scripts/arnes/comun/guardia.ts';
import { RAIZ } from '../../scripts/arnes/comun/raiz.ts';

function motivoBloqueo(
  herramienta: string,
  entradaHerramienta: unknown,
  contexto: ContextoGuardia,
): string | undefined {
  if (herramienta === 'Bash') return motivoBloqueoBash(campoTexto(entradaHerramienta, 'command') ?? '', contexto);
  const ruta = campoTexto(entradaHerramienta, 'file_path') ?? campoTexto(entradaHerramienta, 'notebook_path');
  // Sin ruta no se sabe qué se va a tocar: se bloquea por seguridad.
  if (ruta === undefined) return `No se puede saber qué fichero toca ${herramienta}; se bloquea por seguridad.`;
  // Una ruta relativa lo es al checkout de la conversación.
  return motivoBloqueoFichero(path.resolve(contexto.checkout, ruta), contexto);
}

ejecutarHook('proteger-rutas', async () => {
  const entrada = await leerEntradaHook();
  const contexto: ContextoGuardia = {
    ...checkoutsDelRepositorio(RAIZ),
    checkout: checkoutDeLaEntrada(RAIZ, entrada),
    home: os.homedir(),
  };
  const motivo = motivoBloqueo(campoTexto(entrada, 'tool_name') ?? '', campo(entrada, 'tool_input'), contexto);
  if (motivo === undefined) return;
  responder({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: motivo },
  });
});

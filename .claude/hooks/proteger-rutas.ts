// Hook PreToolUse (Edit, Write, MultiEdit, NotebookEdit y Bash): bloquea las ediciones en las
// rutas de .claude/protegidas.txt y los comandos Bash que intentan una salida del arnés. Lo que
// un comando Bash cambie en las rutas protegidas lo deshace vigilar-huellas.ts.
// La lógica está en scripts/arnes/comun/guardia.ts.
import os from 'node:os';
import path from 'node:path';
import { campo, campoTexto, ejecutarHook, leerEntradaHook, responder } from '../../scripts/arnes/comun/entrada-hook.ts';
import { motivoBloqueoBash, motivoBloqueoFichero } from '../../scripts/arnes/comun/guardia.ts';
import type { ContextoGuardia } from '../../scripts/arnes/comun/guardia.ts';
import { faseDeEntorno, leerProtegidas } from '../../scripts/arnes/comun/protegidas.ts';
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
  return motivoBloqueoFichero(path.resolve(RAIZ, ruta), contexto);
}

ejecutarHook('proteger-rutas', async () => {
  const entrada = await leerEntradaHook();
  const contexto: ContextoGuardia = {
    raiz: RAIZ,
    home: os.homedir(),
    entradas: leerProtegidas(RAIZ),
    fase: faseDeEntorno(process.env),
  };
  const motivo = motivoBloqueo(campoTexto(entrada, 'tool_name') ?? '', campo(entrada, 'tool_input'), contexto);
  if (motivo === undefined) return;
  responder({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: motivo },
  });
});

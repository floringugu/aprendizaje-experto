// Hook ConfigChange (user_settings, project_settings y local_settings): impide que un cambio de configuración
// durante la sesión desactive o cambie los hooks del arnés. El dueño edita la configuración
// fuera de Claude Code y abre una sesión nueva.
import { campoTexto, ejecutarHook, leerEntradaHook, responder } from '../../scripts/arnes/comun/entrada-hook.ts';

ejecutarHook('bloquear-config', async () => {
  const entrada = await leerEntradaHook();
  const origen = campoTexto(entrada, 'source') ?? 'desconocido';
  responder({
    decision: 'block',
    reason:
      `Cambio de configuración (${origen}) bloqueado durante la sesión: los hooks del arnés no se cambian en caliente. ` +
      'Edita la configuración fuera de Claude Code y abre una sesión nueva.',
  });
});

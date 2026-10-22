// Hook ConfigChange (user_settings, project_settings y local_settings): impide que un cambio de configuración
// durante la conversación desactive o cambie los hooks del arnés. El dueño edita la configuración
// fuera de Claude Code y abre una conversación nueva. «make fase» también cambia local_settings:
// por eso la fase nueva no llega a las conversaciones abiertas.
import { campoTexto, ejecutarHook, leerEntradaHook, responder } from '../../scripts/arnes/comun/entrada-hook.ts';

ejecutarHook('bloquear-config', async () => {
  const entrada = await leerEntradaHook();
  const origen = campoTexto(entrada, 'source') ?? 'desconocido';
  responder({
    decision: 'block',
    reason:
      `Cambio de configuración (${origen}) bloqueado durante la conversación: los hooks del arnés no se cambian ` +
      'en caliente. Se aplica en la próxima conversación; si es la fase («make fase»), esta sigue en la suya.',
  });
});

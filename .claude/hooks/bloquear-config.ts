// Hook ConfigChange (user_settings, project_settings y local_settings): impide que un cambio de configuración
// durante la conversación desactive o cambie los hooks del arnés. El dueño edita la configuración
// fuera de Claude Code y abre una conversación nueva. «make fase» también cambia local_settings: los
// hooks leen la fase y el área del fichero en cada llamada, pero el modelo y el esfuerzo nuevos no
// llegan a las conversaciones abiertas.
import { campoTexto, ejecutarHook, leerEntradaHook, responder } from '../../scripts/arnes/comun/entrada-hook.ts';

ejecutarHook('bloquear-config', async () => {
  const entrada = await leerEntradaHook();
  const origen = campoTexto(entrada, 'source') ?? 'desconocido';
  responder({
    decision: 'block',
    reason:
      `Cambio de configuración (${origen}) bloqueado durante la conversación: los hooks del arnés no se cambian ` +
      'en caliente. Se aplica en la próxima conversación. Si es la fase («make fase»), los hooks ya la leen ' +
      'del checkout; el modelo y el esfuerzo cambian en la próxima.',
  });
});

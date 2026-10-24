import { describe, expect, it } from 'vitest';
import { crearInicioSesion } from '../../src/aplicacion/inicio-sesion.ts';
import type {
  ClaudeCode,
  EventoInicioSesion,
  ProcesoInicioSesion,
  Temporizador,
} from '../../src/aplicacion/puertos.ts';
import { MS_PARA_INICIAR_SESION } from '../../src/dominio/unidades.ts';

/** Un proceso de inicio de sesión de mentira: anota lo que recibe y deja emitir eventos. */
interface ProcesoFalso extends ProcesoInicioSesion {
  readonly codigos: string[];
  cortes: number;
  emitir(evento: EventoInicioSesion): void;
}

/** Claude Code de mentira: guarda cada proceso lanzado, el último es el actual. */
class ClaudeCodeFalso implements ClaudeCode {
  readonly procesos: ProcesoFalso[] = [];
  eventosDentroDeIniciar: EventoInicioSesion[] = [];
  sesion: { readonly iniciada: boolean; readonly cuenta?: string } = { iniciada: false };

  iniciarSesion(alRecibir: (evento: EventoInicioSesion) => void): ProcesoInicioSesion {
    const proceso: ProcesoFalso = {
      codigos: [],
      cortes: 0,
      enviar: (codigo) => {
        proceso.codigos.push(codigo);
      },
      cortar: () => {
        proceso.cortes += 1;
      },
      emitir: alRecibir,
    };
    this.procesos.push(proceso);
    this.eventosDentroDeIniciar.forEach(alRecibir);
    return proceso;
  }

  estado(): Promise<{ readonly iniciada: boolean; readonly cuenta?: string }> {
    return Promise.resolve(this.sesion);
  }

  get ultimo(): ProcesoFalso {
    const proceso = this.procesos.at(-1);
    if (proceso === undefined) {
      throw new Error('No se ha lanzado ningún inicio de sesión');
    }
    return proceso;
  }
}

/** Temporizador que solo avanza cuando el test lo dice. */
class TemporizadorFalso implements Temporizador {
  readonly plazos: number[] = [];
  cancelados = 0;
  private ahora = 0;
  private pendientes: { vence: number; accion: () => void; cancelada: boolean }[] = [];

  programar(milisegundos: number, accion: () => void): () => void {
    this.plazos.push(milisegundos);
    const tarea = { vence: this.ahora + milisegundos, accion, cancelada: false };
    this.pendientes.push(tarea);
    return () => {
      tarea.cancelada = true;
      this.cancelados += 1;
    };
  }

  avanzar(milisegundos: number): void {
    this.ahora += milisegundos;
    const vencidas = this.pendientes.filter((tarea) => !tarea.cancelada && tarea.vence <= this.ahora);
    this.pendientes = this.pendientes.filter((tarea) => !vencidas.includes(tarea));
    vencidas.forEach((tarea) => {
      tarea.accion();
    });
  }
}

function montar() {
  const claudeCode = new ClaudeCodeFalso();
  const temporizador = new TemporizadorFalso();
  // Repartidos con `...`, como en `crearAplicacion`.
  return { claudeCode, temporizador, casos: { ...crearInicioSesion(claudeCode, temporizador) } };
}

function salida(texto: string): EventoInicioSesion {
  return { tipo: 'salida', texto };
}

async function enlaceTras(texto: string): Promise<string | undefined> {
  const { claudeCode, casos } = montar();
  await casos.iniciarSesionClaudeCode();
  claudeCode.ultimo.emitir(salida(texto));
  const vista = await casos.consultarInicioSesion();
  return vista.ok ? vista.valor.enlace : undefined;
}

describe('iniciarSesionClaudeCode', () => {
  it('@MATE-8.3 lanza el proceso, programa el corte a los 5 minutos y acepta', async () => {
    const { claudeCode, temporizador, casos } = montar();
    expect(await casos.iniciarSesionClaudeCode()).toEqual({ ok: true, valor: null });
    expect(claudeCode.procesos).toHaveLength(1);
    expect(temporizador.plazos).toEqual([MS_PARA_INICIAR_SESION]);
  });

  it('@MATE-8.3 corta el proceso a los 5 minutos exactos y no un milisegundo antes', async () => {
    const { claudeCode, temporizador, casos } = montar();
    await casos.iniciarSesionClaudeCode();
    temporizador.avanzar(MS_PARA_INICIAR_SESION - 1);
    expect(claudeCode.ultimo.cortes).toBe(0);
    expect(await casos.consultarInicioSesion()).toMatchObject({ valor: { enMarcha: true } });
    temporizador.avanzar(1);
    expect(claudeCode.ultimo.cortes).toBe(1);
    expect(await casos.consultarInicioSesion()).toEqual({
      ok: true,
      valor: { enMarcha: false, pideCodigo: false },
    });
  });

  it('@MATE-8.3 relanzar corta el proceso anterior, cancela su corte y programa uno nuevo', async () => {
    const { claudeCode, temporizador, casos } = montar();
    await casos.iniciarSesionClaudeCode();
    await casos.iniciarSesionClaudeCode();
    const [primero, segundo] = claudeCode.procesos;
    expect(primero?.cortes).toBe(1);
    expect(segundo?.cortes).toBe(0);
    expect(temporizador.cancelados).toBe(1);
    expect(temporizador.plazos).toHaveLength(2);
    temporizador.avanzar(MS_PARA_INICIAR_SESION);
    expect(primero?.cortes).toBe(1);
    expect(segundo?.cortes).toBe(1);
  });

  it('@MATE-8.3 los eventos de un proceso que ya no es el actual se ignoran', async () => {
    const { claudeCode, casos } = montar();
    await casos.iniciarSesionClaudeCode();
    const viejo = claudeCode.ultimo;
    await casos.iniciarSesionClaudeCode();
    viejo.emitir(salida('Abre https://viejo.org/acceso ya.'));
    viejo.emitir({ tipo: 'pide_codigo' });
    viejo.emitir({ tipo: 'terminado', exito: true });
    expect(await casos.consultarInicioSesion()).toEqual({
      ok: true,
      valor: { enMarcha: true, pideCodigo: false },
    });
    claudeCode.ultimo.emitir(salida('https://nuevo.org/acceso'));
    expect(await casos.consultarInicioSesion()).toMatchObject({ valor: { enlace: 'https://nuevo.org/acceso' } });
  });

  it('@MATE-8.1 un evento síncrono dentro de iniciarSesion no rompe nada', async () => {
    const { claudeCode, temporizador, casos } = montar();
    claudeCode.eventosDentroDeIniciar = [salida('https://ahora.org/acceso'), { tipo: 'pide_codigo' }];
    await casos.iniciarSesionClaudeCode();
    expect(await casos.consultarInicioSesion()).toEqual({
      ok: true,
      valor: { enMarcha: true, enlace: 'https://ahora.org/acceso', pideCodigo: true },
    });
    temporizador.avanzar(MS_PARA_INICIAR_SESION);
    expect(claudeCode.ultimo.cortes).toBe(1);
  });

  it('@MATE-8.3 si el proceso termina dentro de iniciarSesion, no programa ningún corte', async () => {
    const { claudeCode, temporizador, casos } = montar();
    claudeCode.eventosDentroDeIniciar = [{ tipo: 'terminado', exito: true }];
    await casos.iniciarSesionClaudeCode();
    expect(temporizador.plazos).toEqual([]);
    expect(await casos.consultarInicioSesion()).toMatchObject({ valor: { enMarcha: false } });
  });
});

describe('eventos del proceso', () => {
  it('@MATE-8.1 la salida con un enlace lo muestra y pide_codigo enseña la casilla', async () => {
    const { claudeCode, casos } = montar();
    await casos.iniciarSesionClaudeCode();
    expect(await casos.consultarInicioSesion()).toEqual({
      ok: true,
      valor: { enMarcha: true, pideCodigo: false },
    });
    claudeCode.ultimo.emitir(salida('Abre https://ejemplo.org/acceso en el navegador.'));
    claudeCode.ultimo.emitir({ tipo: 'pide_codigo' });
    expect(await casos.consultarInicioSesion()).toEqual({
      ok: true,
      valor: { enMarcha: true, enlace: 'https://ejemplo.org/acceso', pideCodigo: true },
    });
  });

  it.each(['.', ',', ';', ':', ')', '»'])('@MATE-8.7 quita la puntuación «%s» que cierra el enlace', async (cierre) => {
    expect(await enlaceTras(`Abre (https://ejemplo.org/a?x=1${cierre} luego`)).toBe('https://ejemplo.org/a?x=1');
    expect(await enlaceTras(`Abre https://ejemplo.org/a?x=1${cierre}`)).toBe('https://ejemplo.org/a?x=1');
  });

  it('@MATE-8.7 el enlace es el de la primera salida que trae uno', async () => {
    const { claudeCode, casos } = montar();
    await casos.iniciarSesionClaudeCode();
    claudeCode.ultimo.emitir(salida('Cargando...'));
    claudeCode.ultimo.emitir(salida('Abre https://primero.org/a'));
    claudeCode.ultimo.emitir(salida('O también https://segundo.org/b'));
    expect(await casos.consultarInicioSesion()).toMatchObject({ valor: { enlace: 'https://primero.org/a' } });
  });

  it('@MATE-8.7 una salida sin enlace no deja ni rastro de su texto', async () => {
    const { claudeCode, casos } = montar();
    await casos.iniciarSesionClaudeCode();
    claudeCode.ultimo.emitir(salida('Token: sk-secreto-123'));
    const vista = await casos.consultarInicioSesion();
    expect(vista).toEqual({ ok: true, valor: { enMarcha: true, pideCodigo: false } });
    expect(JSON.stringify(vista)).not.toContain('secreto');
  });

  it('@MATE-8.7 solo se queda con el enlace aunque la salida lleve un token después', async () => {
    expect(await enlaceTras('https://ejemplo.org/a Token: sk-secreto-123')).toBe('https://ejemplo.org/a');
  });

  it('@MATE-8.3 terminado, con o sin éxito, deja el inicio parado y cancela el corte', async () => {
    for (const exito of [true, false]) {
      const { claudeCode, temporizador, casos } = montar();
      await casos.iniciarSesionClaudeCode();
      claudeCode.ultimo.emitir(salida('https://ejemplo.org/a'));
      claudeCode.ultimo.emitir({ tipo: 'terminado', exito });
      expect(temporizador.cancelados).toBe(1);
      expect(await casos.consultarInicioSesion()).toEqual({
        ok: true,
        valor: { enMarcha: false, pideCodigo: false },
      });
      temporizador.avanzar(MS_PARA_INICIAR_SESION);
      expect(claudeCode.ultimo.cortes).toBe(0);
    }
  });
});

describe('consultarInicioSesion', () => {
  it('@MATE-8.1 sin un inicio en marcha dice que no y no trae la clave enlace', async () => {
    const { casos } = montar();
    const vista = await casos.consultarInicioSesion();
    expect(vista).toEqual({ ok: true, valor: { enMarcha: false, pideCodigo: false } });
    expect(vista.ok && 'enlace' in vista.valor).toBe(false);
  });
});

describe('enviarCodigo', () => {
  it('@MATE-8.2 pasa el código tal cual al proceso', async () => {
    const { claudeCode, casos } = montar();
    await casos.iniciarSesionClaudeCode();
    expect(await casos.enviarCodigo({ codigo: ' abc-123 ' })).toEqual({ ok: true, valor: null });
    expect(claudeCode.ultimo.codigos).toEqual([' abc-123 ']);
  });

  it('@MATE-8.2 sin un inicio en marcha rechaza y no envía nada', async () => {
    const { claudeCode, casos } = montar();
    const resultado = await casos.enviarCodigo({ codigo: 'abc' });
    expect(resultado.ok).toBe(false);
    expect(claudeCode.procesos).toEqual([]);
  });

  it.each(['', '   ', '\t\n'])(
    '@MATE-8.2 un código vacío o de espacios (%j) rechaza con campo codigo',
    async (codigo) => {
      const { claudeCode, casos } = montar();
      await casos.iniciarSesionClaudeCode();
      const resultado = await casos.enviarCodigo({ codigo });
      expect(resultado).toMatchObject({ ok: false, campo: 'codigo' });
      expect(claudeCode.ultimo.codigos).toEqual([]);
    },
  );

  it('@MATE-8.6 el código no queda en lo que ve el móvil', async () => {
    const { casos } = montar();
    await casos.iniciarSesionClaudeCode();
    await casos.enviarCodigo({ codigo: 'codigo-secreto' });
    expect(JSON.stringify(await casos.consultarInicioSesion())).not.toContain('codigo-secreto');
  });
});

describe('cancelarInicioSesion', () => {
  it('@MATE-8.4 corta el proceso, cancela el corte programado y deja el inicio parado', async () => {
    const { claudeCode, temporizador, casos } = montar();
    await casos.iniciarSesionClaudeCode();
    expect(await casos.cancelarInicioSesion()).toEqual({ ok: true, valor: null });
    expect(claudeCode.ultimo.cortes).toBe(1);
    expect(temporizador.cancelados).toBe(1);
    temporizador.avanzar(MS_PARA_INICIAR_SESION);
    expect(claudeCode.ultimo.cortes).toBe(1);
    expect(await casos.consultarInicioSesion()).toMatchObject({ valor: { enMarcha: false } });
  });

  it('@MATE-8.4 sin un inicio en marcha no hace nada y acepta', async () => {
    const { claudeCode, temporizador, casos } = montar();
    expect(await casos.cancelarInicioSesion()).toEqual({ ok: true, valor: null });
    expect(claudeCode.procesos).toEqual([]);
    expect(temporizador.cancelados).toBe(0);
  });
});

describe('consultarAjustes', () => {
  it.each([true, false])('@MATE-8.5 devuelve solo sesionClaudeCode (%s), sin la cuenta', async (iniciada) => {
    const { claudeCode, casos } = montar();
    claudeCode.sesion = { iniciada, cuenta: 'persona@ejemplo.org' };
    const ajustes = await casos.consultarAjustes();
    expect(ajustes).toEqual({ ok: true, valor: { sesionClaudeCode: iniciada } });
    expect(ajustes.ok && Object.keys(ajustes.valor)).toEqual(['sesionClaudeCode']);
  });
});

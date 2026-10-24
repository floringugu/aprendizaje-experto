// La exportación en CSV (INST): un fichero por cada clase de registro, con las filas de todos los
// dominios de la persona en orden cronológico (INST-2.2). Por ahora solo los ficheros que llena el
// criterio de dominio (MAST): respuestas.csv, objetivos_dominados.csv y cambios_fase.csv.
//
// Cada fichero se describe con sus columnas propias y cómo sacar sus filas del registro de un
// dominio. Lo que comparten todos (las columnas fecha y dominio, el formato y el orden) va en
// `exportarCsv`, una sola vez.
import type { Entorno, RegistroDominio } from './estado.ts';
import type { CasosDeExportacion } from './exportacion.ts';
import type { Resultado } from './resultado.ts';
import { aceptar } from './resultado.ts';
import { sinImplementar } from './sin-implementar.ts';

type PeticionCsv = Parameters<CasosDeExportacion['exportarCsv']>[0];

interface FilaCsv {
  readonly fecha: Date;
  /** Los valores de las columnas propias del fichero, en el orden de su cabecera. */
  readonly valores: readonly string[];
}

interface FicheroCsv {
  /** Las columnas que van detrás de fecha y dominio. */
  readonly columnas: readonly string[];
  readonly filas: (registro: RegistroDominio) => readonly FilaCsv[];
}

const FICHEROS = new Map<string, FicheroCsv>([
  [
    'respuestas.csv',
    {
      columnas: [
        'contexto',
        'item',
        'objetivo',
        'correcta',
        'latencia_ms',
        'tras_ejemplo',
        'pasos_retirados',
        'confianza',
      ],
      // La latencia y si responde tras un ejemplo quedan vacías: la aplicación aún no las mide.
      filas: (registro) =>
        registro.intentos.map((intento) => ({
          fecha: intento.fecha,
          valores: [
            intento.contexto,
            intento.item,
            intento.objetivo,
            String(intento.correcta),
            '',
            '',
            String(intento.pasosRetirados),
            String(intento.confianza),
          ],
        })),
    },
  ],
  [
    'objetivos_dominados.csv',
    {
      columnas: ['objetivo', 'dominado', 'acierto'],
      filas: (registro) =>
        registro.cambiosDominado.map((cambio) => ({
          fecha: cambio.fecha,
          valores: [cambio.objetivo, String(cambio.dominado), String(cambio.acierto)],
        })),
    },
  ],
  [
    'cambios_fase.csv',
    {
      columnas: ['fase_anterior', 'fase_nueva'],
      filas: (registro) =>
        registro.cambiosFase.map((cambio) => ({ fecha: cambio.fecha, valores: [cambio.anterior, cambio.nueva] })),
    },
  ],
]);

/** Fecha ISO en UTC sin la «Z» final, como 2026-03-02T10:00:04.200 (INST). */
function fechaCsv(fecha: Date): string {
  return fecha.toISOString().replace('Z', '');
}

/**
 * El texto del fichero: coma como separador, una línea de cabecera y punto decimal (INST). Las filas
 * de la misma fecha conservan el orden en que se registraron. Los ficheros que todavía no se llenan
 * siguen sin implementar.
 *
 * Los valores no se entrecomillan: son fechas, números, booleanos, contextos, fases e ids del
 * contenido, que no llevan comas ni comillas. Un fichero con texto libre tendrá que entrecomillarlos.
 */
export function exportarCsv(entorno: Entorno, peticion: PeticionCsv): Resultado<string> {
  const fichero = FICHEROS.get(peticion.fichero);
  if (fichero === undefined) {
    return sinImplementar();
  }
  const filas = Array.from(entorno.persona.todosLosDominios).flatMap(([dominio, estado]) =>
    fichero.filas(estado.registro).map((fila) => ({ fecha: fila.fecha, valores: [dominio, ...fila.valores] })),
  );
  const ordenadas = filas.toSorted((primera, segunda) => primera.fecha.getTime() - segunda.fecha.getTime());
  const lineas = [
    ['fecha', 'dominio', ...fichero.columnas],
    ...ordenadas.map((fila) => [fechaCsv(fila.fecha), ...fila.valores]),
  ];
  return aceptar(lineas.map((linea) => `${linea.join(',')}\n`).join(''));
}

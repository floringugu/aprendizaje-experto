import { Given } from '@cucumber/cucumber';
import { mundo } from '../soporte/mundo.ts';

// Pasos «que X configurado es …»: cambian en memoria el valor de un parámetro de
// config/parametros.json. La aplicación lo lee en cada uso, sin guardarlo.

/** Expresión del paso y parámetro que cambia; el valor es lo que lleva el paso. */
const PARAMETROS_DE_UN_VALOR: readonly (readonly [string, string])[] = [
  ['que el umbral de dominio configurado es del {fraccion}', 'umbral_dominio'],
  ['que el umbral de paso a la fase avanzada configurado es del {fraccion}', 'umbral_paso_a_avanzado'],
  ['que el umbral de retirada de ayuda configurado es del {fraccion}', 'umbral_retirada_ayuda'],
  ['que la retención objetivo de FSRS configurada es del {fraccion}', 'retencion_objetivo_fsrs'],
  ['que cada ajuste configurado retira o devuelve {int} paso(s)', 'pasos_retirados_por_ajuste'],
  ['que la periodicidad del bucle configurada es de {int} días', 'periodicidad_bucle_dias'],
  ['que el percentil mínimo configurado es {int}', 'percentil_experto'],
  ['que el número de evaluaciones requeridas configurado es {int}', 'evaluaciones_experto_requeridas'],
  [
    'que la separación mínima configurada entre evaluaciones es de {int} meses',
    'separacion_minima_evaluaciones_experto_meses',
  ],
  ['que las semanas de retención diferida configuradas son {numeros}', 'retencion_diferida_semanas'],
  ['que la fase de intercalado configurada es {texto}', 'fase_intercalado'],
];

for (const [expresion, parametro] of PARAMETROS_DE_UN_VALOR) {
  Given(expresion, (valor: unknown) => {
    mundo().establecerParametro(parametro, valor);
  });
}

interface Cambio {
  readonly nombre: string;
  readonly valor: unknown;
}

Given('que se cambia en config\\/parametros.json {cambio}', (cambio: Cambio) => {
  mundo().establecerParametro(cambio.nombre, cambio.valor);
});

Given('que se cambia en config\\/parametros.json {cambio} y {cambio}', (primero: Cambio, segundo: Cambio) => {
  mundo().establecerParametro(primero.nombre, primero.valor);
  mundo().establecerParametro(segundo.nombre, segundo.valor);
});

Given('que el algoritmo de repetición espaciada configurado es {algoritmo}', (algoritmo: string) => {
  const alternativa = algoritmo === 'fsrs' ? 'sm2' : 'fsrs';
  mundo().establecerParametro('planificador_algoritmo', { principal: algoritmo, alternativa });
});

Given('que la escala de confianza configurada va del {int} al {int} %', (minimo: number, maximo: number) => {
  mundo().establecerParametro('escala_confianza', { minimo, maximo, unidad: '%' });
});

Given('que la combinación de ejemplos resueltos y autoexplicación configurada está desactivada', () => {
  mundo().establecerParametro('combinar_ejemplos_resueltos_y_autoexplicacion', false);
});

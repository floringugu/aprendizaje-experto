import { describe, expect, it } from 'vitest';
import { dominioValido } from '../../src/aplicacion/dominio-valido.ts';

const MOTIVO =
  'El nombre del dominio solo puede llevar letras minúsculas sin tilde, números, «_» y «-», y empezar por una letra o un número.';

// Los límites de la regla: 64 caracteres entran, 65 no. Se construyen aquí porque el literal sería ilegible.
const DE_64 = 'a'.repeat(64);
const DE_65 = 'a'.repeat(65);

describe('dominioValido', () => {
  it.each(['ficticio', 'ficticio_b', 'otro', 'mate', 'a', '0', 'mate-2', DE_64])(
    'admite «%s» y lo devuelve tal cual',
    (dominio) => {
      expect(dominioValido(dominio)).toStrictEqual({ ok: true, valor: dominio });
    },
  );

  it.each([
    ['vacío', ''],
    ['con «../»', '../x'],
    ['con barra', 'a/b'],
    ['con barra invertida', 'a\\b'],
    ['un punto', '.'],
    ['dos puntos', '..'],
    ['con un punto dentro', 'a.b'],
    ['con mayúscula', 'Mate'],
    ['con tilde', 'química'],
    ['con un espacio delante', ' mate'],
    ['con un espacio detrás', 'mate '],
    ['con un salto de línea detrás', 'mate\n'],
    ['que empieza por «-»', '-mate'],
    ['que empieza por «_»', '_mate'],
    ['de 65 caracteres', DE_65],
  ])('rechaza un dominio %s con campo dominio', (_descripcion, dominio) => {
    expect(dominioValido(dominio)).toStrictEqual({ ok: false, campo: 'dominio', motivo: MOTIVO });
  });
});

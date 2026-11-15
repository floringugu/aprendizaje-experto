import { describe, expect, it } from 'vitest';
import { escribirNumero, FORMATO_DE_UN_NUMERO, leerNumero } from '../../src/dominio/numero-escrito.ts';

describe('leerNumero: el signo y el separador decimal', () => {
  it.each([
    ['12', 12],
    ['+12', 12],
    ['-12', -12],
    ['−12', -12],
    ['-9,81', -9.81],
    ['+9,81', 9.81],
    ['−9.81', -9.81],
  ])('@RECU-5.4 «%s» se lee como %d', (texto, valor) => {
    expect(leerNumero(texto)).toStrictEqual({ valor, resto: '' });
  });

  it.each([
    ['9,81', 9.81],
    ['9.81', 9.81],
    ['9,810', 9.81],
    ['12,0', 12],
    ['0,5', 0.5],
    ['10', 10],
    ['1.000', 1],
  ])('@RECU-5.4 «%s» se lee con el separador decimal como %d', (texto, valor) => {
    expect(leerNumero(texto)?.valor).toBe(valor);
  });

  it('@RECU-5.6 los espacios de los extremos no cuentan', () => {
    expect(leerNumero('  9,81  ')).toStrictEqual({ valor: 9.81, resto: '' });
  });
});

describe('leerNumero: la notación científica con «e»', () => {
  it.each([
    ['6,674e-11', 6.674e-11],
    ['6,67E-11', 6.67e-11],
    ['1e+21', 1e21],
    ['1e5', 1e5],
    ['1E5', 1e5],
    ['1e−5', 1e-5],
    ['-2,5e3', -2500],
  ])('@RECU-5.5 «%s» se lee como %d', (texto, valor) => {
    expect(leerNumero(texto)).toStrictEqual({ valor, resto: '' });
  });
});

describe('leerNumero: la notación científica con una potencia de diez', () => {
  const SIGNOS_DE_MULTIPLICAR = ['·', '×', 'x', '*'];

  it.each(SIGNOS_DE_MULTIPLICAR)('@RECU-5.5 el signo «%s» multiplica por 10^', (signo) => {
    expect(leerNumero(`6,674${signo}10^-11`)).toStrictEqual({ valor: 6.674e-11, resto: '' });
  });

  it.each(SIGNOS_DE_MULTIPLICAR)('@RECU-5.5 el signo «%s» multiplica por 10 con superíndices', (signo) => {
    expect(leerNumero(`6,674${signo}10⁻¹¹`)).toStrictEqual({ valor: 6.674e-11, resto: '' });
  });

  it.each([
    ['6,674x10^11', 6.674e11],
    ['6,674 x10^11', 6.674e11],
    ['6,674x 10^11', 6.674e11],
    ['6,674 x 10^11', 6.674e11],
    ['6,674  x  10^11', 6.674e11],
    ['6,674×10¹¹', 6.674e11],
    ['6,674 ×10¹¹', 6.674e11],
    ['6,674× 10¹¹', 6.674e11],
    ['6,674 × 10¹¹', 6.674e11],
  ])('@RECU-5.5 los espacios a los lados del signo de multiplicar son opcionales: «%s»', (texto, valor) => {
    expect(leerNumero(texto)).toStrictEqual({ valor, resto: '' });
  });

  it.each([
    ['1·10^3', 1e3],
    ['1·10^+3', 1e3],
    ['1·10^-3', 1e-3],
    ['1·10^−3', 1e-3],
    ['1·10^23', 1e23],
    ['1·10³', 1e3],
    ['1·10⁺³', 1e3],
    ['1·10⁻³', 1e-3],
    ['1·10²³', 1e23],
  ])('@RECU-5.5 el signo del exponente puede ser +, - o −, o faltar: «%s»', (texto, valor) => {
    expect(leerNumero(texto)).toStrictEqual({ valor, resto: '' });
  });

  it.each([
    ['⁰', 0],
    ['¹', 1],
    ['²', 2],
    ['³', 3],
    ['⁴', 4],
    ['⁵', 5],
    ['⁶', 6],
    ['⁷', 7],
    ['⁸', 8],
    ['⁹', 9],
  ])('@RECU-5.5 el superíndice «%s» vale %d', (superindice, digito) => {
    expect(leerNumero(`1×10${superindice}`)).toStrictEqual({ valor: 10 ** digito, resto: '' });
  });

  it('@RECU-5.5 el menos tipográfico vale también en el exponente de una potencia de diez', () => {
    expect(leerNumero('−6,674×10^−11')).toStrictEqual({ valor: -6.674e-11, resto: '' });
  });

  it('@RECU-5.5 el número es el mismo se escriba como se escriba', () => {
    const formas = ['0,00000000006674', '6,674e-11', '6,674·10^-11', '6,674×10⁻¹¹', '6.674E-11', '6,674 x 10^-11'];
    for (const forma of formas) {
      expect(leerNumero(forma)?.valor).toBe(6.674e-11);
    }
  });
});

describe('leerNumero: el resto', () => {
  it.each([
    ['9,81 m/s²', 'm/s²'],
    ['9,81m/s²', 'm/s²'],
    ['9,81 m / s²', 'm/s²'],
    ['9,81   m  /  s²  ', 'm/s²'],
    ['9,81 N·m²/kg²', 'N·m²/kg²'],
    ['9,81 N m2/kg2', 'Nm2/kg2'],
    ['9,81', ''],
    ['9,81   ', ''],
  ])('@RECU-5.6 el resto de «%s» es «%s», sin espacios', (texto, resto) => {
    expect(leerNumero(texto)?.resto).toBe(resto);
  });

  it.each([
    ['6,674e-11 N·m²/kg²', 6.674e-11, 'N·m²/kg²'],
    ['6,674·10^-11 N·m²/kg²', 6.674e-11, 'N·m²/kg²'],
    ['6,674×10⁻¹¹ N·m²/kg²', 6.674e-11, 'N·m²/kg²'],
    ['0,00000000006674 N·m²/kg²', 6.674e-11, 'N·m²/kg²'],
  ])('@RECU-5.5 tras el exponente de «%s» sigue el resto', (texto, valor, resto) => {
    expect(leerNumero(texto)).toStrictEqual({ valor, resto });
  });

  it('@RECU-5.6 «5 eV» es 5 con el resto «eV»: una «e» sin exponente es parte del resto', () => {
    expect(leerNumero('5 eV')).toStrictEqual({ valor: 5, resto: 'eV' });
  });

  it.each([
    ['5e', 'e'],
    ['5 e', 'e'],
    ['5 e3', 'e3'],
    ['5 E', 'E'],
    ['5 m e3', 'me3'],
    ['5 x', 'x'],
    ['5 x 10 m', 'x10m'],
    ['5×10^', '×10^'],
    ['5×10⁻', '×10⁻'],
    ['5 x 100', 'x100'],
    ['5·', '·'],
    ['5²', '²'],
  ])('@RECU-5.6 en «%s» no hay exponente y todo lo que sigue al 5 es el resto «%s»', (texto, resto) => {
    expect(leerNumero(texto)).toStrictEqual({ valor: 5, resto });
  });
});

describe('leerNumero: lo que no se lee', () => {
  it.each(['muy rápido', 'm/s²', 'muy 5 m', 'x5', 'e5', '·5', '.5', ',5', '-', '+', '−', '', '   '])(
    '@RECU-5.10 «%s» no empieza por un número',
    (texto) => {
      expect(leerNumero(texto)).toBeUndefined();
    },
  );

  it.each([
    '1.000,5 m/s²',
    '9,8,1 m/s²',
    '1 000',
    '1 000 m',
    '9,8.1',
    '9.8.1',
    '9.81.',
    '5,',
    '5.',
    '5,m/s',
    '5 ,5',
    '5 .5',
    '5 3',
    '1e5,5',
    '1e5 7',
    '6,674·10^-11 3',
    '6,674×10⁻¹¹.5',
  ])('@RECU-5.10 «%s» hace dudar de cuál es el número', (texto) => {
    expect(leerNumero(texto)).toBeUndefined();
  });

  it.each(['1e999', '-1e999', '1·10^999', '1×10⁹⁹⁹', '9'.repeat(400)])(
    '@RECU-5.10 «%s» no cabe en un número y no se lee',
    (texto) => {
      expect(leerNumero(texto)).toBeUndefined();
    },
  );

  it('@RECU-5.10 un número muy grande pero que cabe sí se lee', () => {
    expect(leerNumero('1e308')).toStrictEqual({ valor: 1e308, resto: '' });
  });
});

describe('FORMATO_DE_UN_NUMERO', () => {
  it.each(['dígitos', 'coma', 'punto', 'miles', '«1000,5»', 'notación científica', '«6,674e-11»', '«6,674·10^-11»'])(
    '@RECU-5.10 dice cómo escribir un número y menciona «%s»',
    (fragmento) => {
      expect(FORMATO_DE_UN_NUMERO).toContain(fragmento);
    },
  );
});

describe('escribirNumero', () => {
  it.each([
    [9.81, '9,81'],
    [12, '12'],
    [6.674e-11, '6,674e-11'],
    [-5, '-5'],
    [0.5, '0,5'],
    [1e21, '1e+21'],
  ])('@RECU-5.11 %d se escribe «%s», con coma decimal', (valor, texto) => {
    expect(escribirNumero(valor)).toBe(texto);
  });

  it.each([9.81, 12, 6.674e-11, -5, 0, 0.1 + 0.2, 1 / 3, 1e21, 1.5e300, -2.5e-7])(
    '@RECU-5.11 lo que escribe para %d se vuelve a leer con el mismo valor',
    (valor) => {
      expect(leerNumero(escribirNumero(valor))).toStrictEqual({ valor, resto: '' });
    },
  );
});

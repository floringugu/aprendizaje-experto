// ESLint del proyecto. Los límites de tamaño y complejidad son una propuesta (docs/plan.md).
// El mensaje de «cómo arreglarlo» lo añade scripts/arnes/lint.ts (pistas en scripts/arnes/comun/pistas-lint.ts).
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

// Comentarios que apagan una herramienta del arnés. Se arregla la causa, no se silencia.
const COMENTARIOS_QUE_APAGAN_HERRAMIENTAS = [
  'jscpd:ignore',
  'stryker disable',
  'istanbul ignore',
  'c8 ignore',
  'v8 ignore',
  '@public',
  '@internal',
  '@beta',
  '@alpha',
];

const SALTARSE_TESTS = {
  selector: 'MemberExpression[property.name=/^(skip|only|todo|fails|skipIf|runIf)$/]',
  message: 'Prohibido saltarse o aislar tests (.skip, .only, .todo, .fails, .skipIf, .runIf).',
};

export default defineConfig(
  { ignores: ['node_modules/', 'reports/', '.stryker-tmp/'] },
  {
    files: ['**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    // Nada de // eslint-disable: las reglas se cumplen o se cambian aquí, con aprobación.
    linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: 'error' },
    rules: {
      complexity: ['error', 10],
      'max-lines-per-function': ['error', { max: 40, skipBlankLines: true, skipComments: true }],
      'max-params': ['error', 3],
      'max-depth': ['error', 3],
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-nested-callbacks': ['error', 3],
      'no-warning-comments': ['error', { terms: COMENTARIOS_QUE_APAGAN_HERRAMIENTAS, location: 'anywhere' }],
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-expect-error': true, 'ts-ignore': true, 'ts-nocheck': true, 'ts-check': false },
      ],
    },
  },
  {
    // Código de la aplicación: sin números sueltos. Los umbrales pedagógicos se leen de
    // config/parametros.json; las constantes técnicas (unidades) viven en src/dominio/unidades.ts.
    files: ['src/**/*.ts'],
    ignores: ['src/dominio/unidades.ts'],
    rules: {
      'no-console': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[raw=/^[0-9.]/]:not([raw=/^[01]$/])',
          message:
            'Número suelto en src/. Un umbral o intervalo pedagógico va en config/parametros.json con su ' +
            'sección del informe; una constante técnica (ms por día…) va en src/dominio/unidades.ts.',
        },
      ],
    },
  },
  {
    files: ['src/dominio/unidades.ts'],
    rules: { 'no-console': 'error' },
  },
  {
    files: ['tests/unidad/**/*.ts', 'tests/arnes/**/*.ts'],
    rules: {
      // Los describe agrupan muchos casos: su longitud no indica complejidad.
      'max-lines-per-function': 'off',
      'no-restricted-syntax': ['error', SALTARSE_TESTS],
    },
  },
  {
    files: ['tests/aceptacion/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        SALTARSE_TESTS,
        {
          selector: 'ReturnStatement > Literal[value=/^(pending|skipped)$/]',
          message: 'Un step no devuelve "pending" ni "skipped": si falta la aplicación, debe fallar.',
        },
        {
          selector: 'ArrowFunctionExpression > Literal.body[value=/^(pending|skipped)$/]',
          message: 'Un step no devuelve "pending" ni "skipped": si falta la aplicación, debe fallar.',
        },
      ],
    },
  },
);

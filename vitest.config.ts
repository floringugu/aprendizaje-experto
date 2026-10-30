import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // tests/unidad: dominio de la aplicación (citan el @ID del escenario que cubren).
    // tests/arnes: los scripts y hooks del arnés.
    include: ['tests/unidad/**/*.test.ts', 'tests/arnes/**/*.test.ts'],
    // Solo con «vitest run --coverage» (npm run unidad). Cada fichero de src/dominio/ cubierto entero;
    // el resto de src/ se mide sin umbral.
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      reportsDirectory: 'reports/cobertura',
      reporter: ['text-summary'],
      thresholds: { perFile: true, 'src/dominio/**': { 100: true } },
    },
  },
});

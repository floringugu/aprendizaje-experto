import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // tests/unidad: dominio de la aplicación (citan el @ID del escenario que cubren).
    // tests/arnes: los scripts y hooks del arnés.
    include: ['tests/unidad/**/*.test.ts', 'tests/arnes/**/*.test.ts'],
  },
});

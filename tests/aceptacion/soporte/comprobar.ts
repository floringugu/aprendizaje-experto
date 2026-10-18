import assert from 'node:assert/strict';

const TOLERANCIA = 1e-9;

/** Compara dos números decimales (fracciones, puntos) sin que los redondeos de coma flotante estorben. */
export function esperarCasiIgual(real: number | undefined, esperado: number, queSeMide: string): void {
  assert.ok(
    real !== undefined && Math.abs(real - esperado) < TOLERANCIA,
    `${queSeMide}: se esperaba ${String(esperado)} y la aplicación da ${String(real)}`,
  );
}

/** Falla el paso si el valor no existe y, si existe, lo devuelve ya sin `undefined`. */
export function presente<T>(valor: T | undefined, queFalta: string): T {
  assert.ok(valor !== undefined, `La aplicación no ha dado ${queFalta}`);
  return valor;
}

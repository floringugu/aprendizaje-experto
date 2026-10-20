# Deuda de diseño

Problemas de diseño del código que siguen sin arreglar. Los anota `revisor-codigo` al cerrar cada área de la etapa 4, en la sección «Deuda de diseño» de su informe, y el dueño pega aquí las filas. Por qué se trabaja así está en el §6 de `docs/arnes.md`.

**Cómo se paga** (`docs/plan.md`, etapa 4):

- Al abrir cada área, el dueño elige qué partidas se pagan con ella: al menos una o, si no, una línea que diga por qué ninguna. Como referencia del esfuerzo, Ousterhout propone dedicar a mejorar el diseño en torno al 10-20 % del tiempo.
- Se pagan antes que el área, en un cambio que solo refactoriza, para no mezclar el diseño con el comportamiento nuevo.
- Una partida pagada sale de la tabla; el historial queda en git. Los ids (D1, D2…) no se reutilizan.

**Tamaño:** pequeña (uno o dos ficheros) o grande (varios módulos, o una interfaz que usan otras capas).

## Pendientes

| Id | Anotada en | Señal de alarma | Dónde (fichero:línea) | Problema | Propuesta | Tamaño |
|---|---|---|---|---|---|---|

## Por área

Una línea por área: qué partidas paga o por qué no paga ninguna.

- DIAG: ninguna; la lista empezó después de cerrarla.

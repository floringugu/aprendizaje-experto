# RECU: Práctica de recuperación con feedback correctivo

## Mecanismo

Dominio puro: sin paso de mecanismo. RECU no añade ninguna pantalla, porque `src/interfaz` aún no existe (§17.8, punto 2, sin decidir).

## Interfaces descartadas y por qué

`respuestaMostrada` (D6) no es un fichero nuevo, pero se comparó con otra forma:

- **Elegida:** `respuestaMostrada(esperada): string` en `src/dominio/correccion.ts`, junto a `esCorrecta`. La aplicación compone el feedback con las dos y con el `feedback` del ítem.
- **Descartada:** `corregir(respuesta, esperada): { correcta, respuestaCorrecta }`, una sola llamada que corrige y dice qué se enseña. Motivo: junta la corrección (DIAG-1.2, RECU-3) con lo que ve la persona (RECU-2.1), y un cambio en cómo se elige la respuesta que se enseña tocaría la función que corrige el diagnóstico.
- **Descartada:** el tipo de lista no vacía para `aceptadas` que proponía D6. Motivo: el tipo del contenido llega hasta el soporte de aceptación (`tests/aceptacion/`, protegido), que construye `aceptadas` como `string[]`. En su lugar, un ítem sin respuestas aceptadas da un error claro, como `parametroNumerico` con un parámetro que falta. `declararConfianza` lo calcula antes de tocar el estado, para que el error no deje un intento registrado a medias.

## Deuda pagada

- D6 (643ec19): `respuestaMostrada` en el dominio y fuera el `?? ''` de `respuestas.ts`.

## Mutación

- **Puntuación:** 97,48 % (116 mutantes eliminados, 3 supervivientes). Antes del cierre era 96,64 %: el test «@RECU-3.1 reduce los espacios a uno, pero no los quita» mató el mutante que cambiaba `replace(/\s+/g, ' ')` por `replace(/\s+/g, '')`.
- **Supervivientes aceptados**, los tres equivalentes:
  - `correccion.ts:32`, `toLowerCase()` por `toUpperCase()`: los dos lados de la comparación se normalizan igual, así que corrige lo mismo. Solo cambiaría con letras como «ß», cuya mayúscula es «SS», que el contenido no usa.
  - `acierto.ts:34`, `acierto !== undefined && …` por `true && …`: `undefined >= umbral` ya es `false`. La comprobación está para TypeScript. Es de DIAG.
  - `diagnostico.ts:75`, `item.categoria !== undefined && …` por `true && …`: `intercalables.has(undefined)` ya es `false`. También está para TypeScript y es de DIAG.

## Bloqueos del hook Stop

```text
RECU: 5 paradas del hook Stop en 2 conversaciones, desde 2026-10-22T23:07:13.581Z.
  - Bloqueos: 1 (cobertura-ids 1).
  - Por el entorno: 0.
  - Con el freno (3.º bloqueo seguido o más): 0.
  - Paradas con [DECISIÓN PENDIENTE]: 4.
```

El único bloqueo fue de `cobertura-ids`: los cinco escenarios ya pasaban con el código de DIAG, pero nadie citaba sus IDs.

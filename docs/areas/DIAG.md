# DIAG: diagnóstico inicial

Archivo del área: qué se decidió al implementarla y cómo fue. Se crea en la primera conversación del área copiando esta plantilla a `docs/areas/<ÁREA>.md`, y se completa al cerrarla (docs/plan.md §16, etapa 4).

DIAG se cerró la primera vez antes de que existiera esta plantilla. Este archivo recoge la reapertura del 25-10-2026 (0439009), que cambia DIAG-2.3 y DIAG-2.4: el diagnóstico nunca sitúa en «avanzado_experto» (plan §0, fila «Diagnóstico»).

Si una conversación del área llega al umbral de contexto (docs/plan.md §5, «Relevo»), añade al final de este fichero una sección «## Relevo» con lo que está hecho, lo que falta, el paso siguiente y los ficheros que hay que leer primero. La conversación siguiente la lee y la borra.

## Mecanismo

Dominio puro: sin paso de mecanismo.

## Interfaces descartadas y por qué

- **Elegida:** `evaluarDiagnostico` decide la fase solo con el dominio de los objetivos, `faseTrasDominio('novato', todosDominados)`, y `EntradaDiagnostico` pierde `umbralPasoAAvanzado`. El acierto en problemas intercalables se sigue midiendo y se devuelve en `aciertoProblemasSinPista` (DIAG-2.4 lo muestra), pero no entra en la fase. Desaparece `faseTrasDiagnostico`, que pasaba a ser un envoltorio de una línea.
- **Descartada:** mantener `faseTrasDiagnostico` y `umbralPasoAAvanzado`, y limitar su resultado a «intermedio» como máximo. Motivo: la entrada seguiría pidiendo un umbral que no decide nada, y quien leyera la firma creería que el diagnóstico aún puede llevar a la fase avanzada.

## Deuda pagada

Ninguna. El cambio es de comportamiento y de pocas líneas. D19 y D20, las partidas que tocan `src/dominio/diagnostico.ts`, siguen pendientes; solo se han corregido sus números de línea. D20 pesa ahora más: `problemasIntercalables` ya solo decide fase en la práctica (`evaluarFase`), aunque siga en el módulo del diagnóstico.

## Mutación

- **Puntuación:** 97,73 % en `src/dominio/diagnostico.ts` (43 mutantes muertos, 1 superviviente); 97,19 % en todo `src/dominio/`.
- **Supervivientes aceptados:** `diagnostico.ts:60`, `item.categoria !== undefined` → `true`. Es equivalente: `intercalables.has(undefined)` ya da `false`. La guarda está por los tipos, no por el comportamiento.

## Bloqueos del hook Stop

Salida de `make bloqueos A=DIAG` durante la reapertura, antes del cierre:

```text
DIAG: 9 paradas del hook Stop en 3 conversaciones, desde 2026-10-22T23:07:13.581Z.
  - Bloqueos: 1 (cobertura-ids 1).
  - Por el entorno: 0.
  - Con el freno (3.º bloqueo seguido o más): 0.
  - Paradas con [DECISIÓN PENDIENTE]: 7.
  - Paradas con [RELEVO]: 0.
```

En la reapertura, `cobertura-ids` y `cobertura-ids-area` estaban en rojo desde antes (c542a89) por @MATE-5.1, @MATE-5.2 y @MATE-5.4. e20d15e los quitó de `features/material.feature`, pero `src/aplicacion/revision.ts` y sus tests aún los citan. Se arreglan en la fase impl de MATE (ver su relevo), no en DIAG.

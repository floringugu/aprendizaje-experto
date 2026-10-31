# <ÁREA>: <nombre del área>

Archivo del área: qué se decidió al implementarla y cómo fue. Se crea en la primera conversación del área copiando esta plantilla a `docs/areas/<ÁREA>.md`, y se completa al cerrarla (docs/plan.md §16, etapa 4).

El relevo de una conversación del área no va en este fichero: va en `reports/relevo.md` de su checkout, fuera de git (docs/plan.md §5, «Relevo»).

## Mecanismo

Solo en las áreas con arquitectura: MATE, PLAN (ts-fsrs) y las que añaden pantallas nuevas. En las demás, escribe «Dominio puro: sin paso de mecanismo».

Cómo funciona por dentro, en prosa: qué datos entran, qué módulo hace qué, qué queda guardado y dónde. Es el texto que el dueño aprobó antes de escribir `src/`.

## Interfaces descartadas y por qué

Las dos interfaces que se compararon («diseñarlo dos veces»): cuál se eligió, cuál se descartó y la razón.

- **Elegida:** …
- **Descartada:** … Motivo: …

## Deuda pagada

Partidas de `docs/deuda-diseno.md` que se pagaron en esta área, con el commit que las cierra. Si no se pagó ninguna, «Ninguna».

## Mutación

Puntuación de `make mutacion` al cerrar el área, y los mutantes supervivientes que se aceptaron con su motivo.

- **Puntuación:** … %
- **Supervivientes aceptados:** …

## Bloqueos de los hooks

Salida de `make bloqueos A=<ÁREA>` al cerrar el área, y una frase sobre el bloqueo que más costó, si lo hubo.

```text
…
```

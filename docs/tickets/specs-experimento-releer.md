---
fase: specs
area: CALI
depende: [specs-calibracion-visual]
toca: [features/calibracion.feature, features/recuperacion.feature, features/instrumentacion.feature, config/parametros.json]
estado: abierto
---
# La persona puede hacer un miniexperimento: releer frente a recuperar, con sus propios ítems

**Qué:** la app no puede enseñar «releer frente a recuperar», porque todo se estudia con recuperación y no hay grupo de control. Especificar un experimento opcional: dos mitades equivalentes de ítems, una estudiada releyendo (pregunta con la respuesta visible) y otra recuperando (lo normal), y una prueba de las dos a la semana. El resultado se enseña como dos pilas de aciertos («4 de 10 releídas, 8 de 10 recuperadas»), junto a la confianza que declaró la persona en cada mitad.

**Hecho cuando:** los escenarios fijan cómo se eligen y reparten los ítems, cómo se estudia cada mitad, cuándo y cómo es la prueba, qué se enseña y qué se registra, que el modo releer solo existe dentro del experimento y que los intentos del experimento no cuentan para el dominio; y `make check-specs` está en verde.

**Leer primero:** features/recuperacion.feature (regla «Se recuerda antes de ver la respuesta»; «No se puede dar un ítem por sabido sin responderlo»); features/calibracion.feature; features/instrumentacion.feature (los CSV).

## Evidencia

Yan, Bjork y Bjork (2016, J Exp Psychol: General): el 72 % juzgó mejor estudiar por bloques aunque el intercalado les dio mejores resultados. Explicar la teoría llevó como mucho al 52 %. Solo separar las fases, explicar la teoría y vivir primero el intercalado llevó al 75–93 %, y aun así cerca de una cuarta parte siguió prefiriendo los bloques o no vio diferencia. Vivir el contraste con los propios datos es lo que más mueve el juicio. Límite: sesiones únicas de laboratorio que miden juicios, no conducta sostenida. Kirk-Johnson, Galla y Fraundorf (2019): el esfuerzo se lee como «no estoy aprendiendo», y quienes eligieron recuperar recordaban más a los dos días (7,95 frente a 6,40 de 15).

## Condiciones para que la comparación sea justa

1. **Reparto al azar** de los ítems entre las dos mitades: si elige la persona, pone los fáciles en un lado.
2. **Mismo tiempo de estudio** en las dos mitades.
3. **Sin repasos entre medias** de esos ítems hasta la prueba.
4. **Ítems de un objetivo aún no dominado**, para que haya algo que aprender.

## Choque con la spec

La regla de RECU impide ver la respuesta sin responder. El experimento necesita una excepción limitada a la mitad «releída». Fuera del experimento, la regla no cambia.

## Por decidir

- Tamaño de cada mitad (el boceto usa 10) y plazo de la prueba (el boceto usa una semana), en `config/parametros.json` como extrapolación del autor.
- Si el resultado se enseña aunque contradiga lo esperado: sí (regla «los datos mandan» de specs-calibracion-visual).
- Qué pasa después con los ítems del experimento: vuelven a la práctica normal.
- Si la app propone el experimento o solo lo ofrece en Ajustes.

---
fase: specs
area: CALI
depende: [specs-calibracion-visual]
toca: [features/calibracion.feature, features/recuperacion.feature, features/instrumentacion.feature, config/parametros.json, docs/tickets/specs-registro-calibracion.md]
estado: hecho
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

## Decidido

- **Tamaño y plazo:** 10 ítems por mitad, 2 pasadas de estudio y prueba a los 7 días, en `config/parametros.json` como extrapolación del autor (`experimento_items_por_mitad`, `experimento_pasadas_de_estudio`, `experimento_plazo_prueba_dias`).
- **Quién lo propone:** nadie. El experimento solo se ofrece en «Ajustes» y la app nunca lo propone (CALI-7).
- **Resultado que contradice lo esperado:** se enseña igual (CALI-11).
- **Después del experimento:** los ítems vuelven a la práctica normal sin ningún intento, al terminar o al cancelar (CALI-12).
- **Coste:** los 20 ítems salen de la práctica hasta la prueba, así que el objetivo elegido no se puede dar por dominado durante al menos una semana (CALI-9.7).
- **Registro:** CSV nuevo `experimentos.csv`; la mitad releída no genera filas en `respuestas.csv`, porque no es un intento (INST-1.7 a INST-1.9).
- **Fuentes:** Yan, Bjork y Bjork (2016) y Kirk-Johnson et al. (2019) no están en `docs/investigacion.md`, así que ninguna feature ni parámetro las cita. Solo se citan las secciones 2.2 y 2.5.
- **Pendiente:** la tabla de cobertura y el plan no mencionan la excepción a RECU-1: ticket `specs-cobertura-experimento`.

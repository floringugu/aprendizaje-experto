# language: es
@CALI @evidencia-2.5 @evidencia-4
Característica: Calibración de la confianza
  Los juicios de aprendizaje están sesgados por la fluidez: releer da sensación de dominio sin
  dominio (sección 2.5). Por eso la persona declara su confianza de 0 a 100 % en cada ítem (sección 4,
  instrumentos) y el bucle semanal la compara con su acierto (paso 2). La confianza solo sirve para
  calibrar: nunca mide el progreso (sección 2.5; mito 10 de la sección 5).

  Antecedentes:
    Dado el dominio de prueba «ficticio» con los objetivos O1, O2 y O3, en ese orden
    Y que la escala de confianza configurada va del 0 al 100 %

  @CALI-1 @evidencia-4 @extrapolacion
  Regla: La confianza se declara en cada ítem, antes del feedback

    @CALI-1.1 @evidencia-4 @extrapolacion
    Escenario: Sin declarar la confianza no hay feedback
      Dado que la persona ha respondido el ítem I1
      Cuando aún no ha declarado su confianza
      Entonces no ve si ha acertado ni el feedback de I1

    @CALI-1.2 @evidencia-4 @extrapolacion
    Esquema del escenario: La confianza debe estar dentro de la escala
      Cuando la persona declara una confianza del <confianza> % en I1
      Entonces la confianza <resultado>

      Ejemplos:
        | confianza | resultado  |
        | 0         | se acepta  |
        | 100       | se acepta  |
        | -1        | se rechaza |
        | 101       | se rechaza |

    @CALI-1.3 @evidencia-4
    Escenario: La confianza se registra junto a la respuesta
      Cuando la persona responde I1 y declara una confianza del 70 %
      Entonces respuestas.csv registra ese intento con la confianza 70

  @CALI-2 @evidencia-4 @evidencia-2.5 @extrapolacion
  Regla: El bucle semanal compara la confianza con el acierto

    @CALI-2.1 @evidencia-4 @extrapolacion
    Escenario: La calibración es la diferencia media entre confianza y acierto
      Dado que en la última semana la persona respondió estos ítems:
        | ítem | confianza | correcta |
        | I1   | 90        | sí       |
        | I2   | 80        | no       |
        | I3   | 70        | sí       |
        | I4   | 60        | no       |
      Cuando se ejecuta el bucle semanal
      Entonces el paso de calibración muestra una confianza media del 75 %
      Y un acierto del 50 %
      Y una diferencia de +25 puntos entre confianza y acierto

    @CALI-2.2 @evidencia-4 @extrapolacion
    Escenario: Sin respuestas en la semana no hay calibración
      Dado que en la última semana la persona no respondió ningún ítem
      Cuando se ejecuta el bucle semanal
      Entonces el paso de calibración indica que no hay respuestas para calibrar

    @CALI-2.3 @evidencia-4 @extrapolacion
    Escenario: El intento de exploración no entra en la calibración
      Dado que en la última semana la persona respondió estos ítems:
        | ítem | contexto    | confianza | correcta |
        | I1   | practica    | 80        | sí       |
        | I2   | practica    | 60        | no       |
        | I3   | exploracion | 90        | no       |
      Cuando se ejecuta el bucle semanal
      Entonces el paso de calibración muestra una confianza media del 70 %
      Y un acierto del 50 %

  @CALI-3 @evidencia-2.5 @evidencia-5
  Regla: La confianza nunca afecta al progreso

    @CALI-3.1 @evidencia-2.5 @evidencia-5
    Escenario: La misma historia de aciertos da el mismo progreso con cualquier confianza
      Dado dos personas con los mismos intentos y aciertos en el dominio «ficticio»
      Pero una declaró siempre una confianza del 100 % y la otra del 0 %
      Cuando la aplicación evalúa a las dos
      Entonces las dos tienen los mismos objetivos dominados y la misma fase
      Y los mismos pasos retirados en cada objetivo
      Y las mismas fechas de repaso

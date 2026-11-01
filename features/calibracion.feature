# language: es
@CALI @evidencia-2.5 @evidencia-4
Característica: Calibración de la confianza
  Los juicios de aprendizaje están sesgados por la fluidez: releer da sensación de dominio sin
  dominio (sección 2.5). Por eso la persona declara su confianza de 0 a 100 % en cada ítem (sección 4,
  instrumentos) y el bucle semanal la compara con su acierto (paso 2). La confianza solo sirve para
  calibrar: nunca mide el progreso (sección 2.5; mito 10 de la sección 5).

  Las pantallas de calibración (CALI-4 a CALI-6) enseñan esa comparación con los ítems de la persona,
  por objetivo y con el paso del tiempo, y no solo con tres números. Son extrapolación del autor:
  ningún estudio prueba estas pantallas. Salen solo en el paso 2 del bucle semanal, una por bucle,
  y enseñan lo que digan los datos, sin textos escritos de antemano a favor de ningún método.

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

    @CALI-2.4 @evidencia-4 @evidencia-2.5 @extrapolacion
    Escenario: Los reservados sí entran en la calibración
      Dado que en la última semana la persona respondió estos ítems:
        | ítem | contexto      | confianza | correcta |
        | I1   | practica      | 80        | sí       |
        | I2   | practica      | 60        | sí       |
        | I3   | transferencia | 90        | no       |
        | I4   | transferencia | 70        | no       |
      Cuando se ejecuta el bucle semanal
      Entonces el paso de calibración muestra una confianza media del 75 %
      Y un acierto del 50 %
      Y una diferencia de +25 puntos entre confianza y acierto

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

    @CALI-3.2 @evidencia-2.5 @extrapolacion
    Escenario: Ver las pantallas de calibración y abrir sus tarjetas no cambia el progreso
      Dado dos personas con los mismos intentos y aciertos en el dominio «ficticio»
      Pero una abrió todas las tarjetas de las pantallas de calibración y la otra no las vio
      Cuando la aplicación evalúa a las dos
      Entonces las dos tienen los mismos objetivos dominados y la misma fase
      Y los mismos pasos retirados en cada objetivo
      Y las mismas fechas de repaso
      Y respuestas.csv de las dos tiene las mismas filas

  @CALI-4 @evidencia-2.5 @extrapolacion
  Regla: La silueta de cada objetivo compara la confianza con el acierto sin ayuda
    Pantalla 1 de las pantallas de calibración. Cada objetivo tiene una silueta: el contorno
    discontinuo es la confianza media y el relleno, el acierto sin ayuda. Los dos se calculan sobre
    el último intento de cada ítem, como el acierto sin ayuda de MAST, y no sobre la última semana
    como CALI-2.1: con pocas respuestas por semana no se llegaría al mínimo. El intento de
    exploración no entra (CALI-2.3). «Sin ayuda» es la definición de MAST, y la confianza de cada
    ítem es la de ese último intento. Los ítems practicados (no reservados) y los reservados
    (MAST-8) tienen cada uno su silueta: la lectura de lo que significa un hueco en los reservados
    es de la persona, no de la pantalla. Los porcentajes se muestran enteros y la diferencia se
    calcula con los enteros mostrados. El relleno va con su frecuencia («6 de 10»). Un grupo de un
    objetivo sin ningún ítem respondido no sale. Que haya un mínimo de ítems, y cuántos, es decisión
    del autor.

    La diferencia es un dato descriptivo, no prueba un sesgo: la sección 2.5 avisa de que parte del
    patrón de desajuste puede ser regresión a la media y efectos de suelo y techo, y con pocos
    ítems un acierto más mueve mucho el relleno.

    Antecedentes:
      Dado que el mínimo de ítems de las pantallas de calibración configurado es 5

    @CALI-4.1 @evidencia-2.5 @extrapolacion
    Escenario: Cada objetivo con ítems respondidos tiene su silueta
      Dado que en O1 la persona respondió 10 ítems no reservados, con una confianza media del 80 % en su último intento, y acertó 6
      Y que en O2 respondió 8 ítems no reservados, con una confianza media del 60 %, y acertó 6
      Y que no ha respondido ningún ítem de O3
      Cuando se ejecuta el bucle semanal
      Entonces el paso de calibración muestra la silueta de los ítems practicados de O1 con el contorno al 80 % y el relleno al 60 %, «6 de 10»
      Y la silueta de los ítems practicados de O2 con el contorno al 60 % y el relleno al 75 %, «6 de 8»
      Y ninguna silueta de O3

    @CALI-4.2 @evidencia-2.5 @extrapolacion
    Esquema del escenario: La silueta enseña una confianza mayor, igual o menor que el acierto
      Dado que en O1 la persona respondió 10 ítems no reservados, con una confianza media del <confianza> % en su último intento, y acertó <aciertos>
      Cuando se ejecuta el bucle semanal
      Entonces la silueta de los ítems practicados de O1 tiene el contorno al <confianza> % y el relleno al <relleno> %
      Y <forma>
      Y su frase es «<frase>»

      Ejemplos:
        | confianza | aciertos | relleno | forma                                              | frase                                         |
        | 80        | 5        | 50      | el hueco entre el relleno y el contorno está vacío | La confianza supera al acierto en 30 puntos   |
        | 60        | 6        | 60      | el relleno llega justo al contorno                 | Confianza y acierto coinciden                 |
        | 40        | 7        | 70      | el relleno sobresale del contorno                  | El acierto supera a la confianza en 30 puntos |

    @CALI-4.3 @extrapolacion
    Escenario: Los porcentajes salen enteros y la diferencia se calcula con ellos
      Dado que en O1 la persona respondió 7 ítems no reservados, con una confianza media del 80 % en su último intento, y acertó 4
      Cuando se ejecuta el bucle semanal
      Entonces la silueta de los ítems practicados de O1 tiene el contorno al 80 % y el relleno al 57 %, «4 de 7»
      Y su frase es «La confianza supera al acierto en 23 puntos»

    @CALI-4.4 @evidencia-2.5 @extrapolacion
    Escenario: Los reservados tienen su propia silueta y no se mezclan con los practicados
      Dado que en O1 la persona respondió 10 ítems no reservados, con una confianza media del 80 % en su último intento, y acertó 9
      Y que respondió 6 ítems reservados de O1, con una confianza media del 80 %, y acertó 3
      Cuando se ejecuta el bucle semanal
      Entonces la silueta de los ítems practicados de O1 tiene el contorno al 80 % y el relleno al 90 %
      Y la silueta de los casos nuevos de O1 tiene el contorno al 80 % y el relleno al 50 %, «3 de 6»
      Y ninguna silueta de O1 junta ítems practicados y reservados

    @CALI-4.5 @extrapolacion
    Esquema del escenario: Con menos ítems que el mínimo no hay silueta
      Dado que en O1 la persona respondió <ítems> ítems no reservados, con una confianza media del 80 % en su último intento, y acertó 2
      Cuando se ejecuta el bucle semanal
      Entonces el paso de calibración muestra para los ítems practicados de O1 <resultado>

      Ejemplos:
        | ítems | resultado                                                              |
        | 4     | solo el texto «Aún no hay datos suficientes: 4 de 5 ítems», sin silueta |
        | 5     | la silueta con el contorno al 80 % y el relleno al 40 %, «2 de 5»       |

    @CALI-4.6 @extrapolacion
    Escenario: El mínimo se aplica por objetivo y por grupo de ítems
      Dado que en O1 la persona respondió 6 ítems no reservados, con una confianza media del 70 % en su último intento, y acertó 3
      Y que respondió 4 ítems reservados de O1, con una confianza media del 70 %, y acertó 1
      Y que en O2 respondió 2 ítems no reservados, con una confianza media del 70 %, y acertó 1
      Cuando se ejecuta el bucle semanal
      Entonces el paso de calibración muestra la silueta de los ítems practicados de O1
      Y para los casos nuevos de O1 solo el texto «Aún no hay datos suficientes: 4 de 5 ítems»
      Y para los ítems practicados de O2 solo el texto «Aún no hay datos suficientes: 2 de 5 ítems»

    @CALI-4.7 @extrapolacion
    Escenario: El intento de exploración no entra en la silueta
      Dado que el mínimo de ítems de las pantallas de calibración configurado es 2
      Y que en O1 la persona respondió estos ítems:
        | ítem | contexto    | confianza | correcta |
        | I1   | practica    | 80        | sí       |
        | I2   | practica    | 60        | no       |
        | I3   | exploracion | 90        | no       |
      Cuando se ejecuta el bucle semanal
      Entonces la silueta de los ítems practicados de O1 tiene el contorno al 70 % y el relleno al 50 %, «1 de 2»

    @CALI-4.8 @extrapolacion
    Escenario: El mínimo de ítems se lee de la configuración
      Dado que se cambia en config/parametros.json «minimo_items_calibracion_visual» a 3
      Y que en O1 la persona respondió 3 ítems no reservados, con una confianza media del 80 % en su último intento, y acertó 2
      Cuando se ejecuta el bucle semanal
      Entonces el paso de calibración muestra la silueta de los ítems practicados de O1 con el contorno al 80 % y el relleno al 67 %, «2 de 3»

  @CALI-5 @evidencia-2.5 @extrapolacion
  Regla: Las tarjetas de la prueba de retención enseñan cuáles de los ítems dados por seguros se aciertan
    Pantalla 2 de las pantallas de calibración. Tras la prueba de retención de la última de las
    semanas configuradas (MAST-7), el siguiente bucle enseña las tarjetas de ese objetivo: una por
    cada ítem no reservado que la persona dio por seguro y que esa prueba incluye. «Seguro» es una
    confianza igual o mayor que la confianza alta configurada, en su último intento antes de la
    prueba (sin contar la exploración). Una tarjeta «sigue en pie» si el ítem se acertó en la
    prueba y «fallada en la prueba» si no: los ítems se eligen por su confianza, no porque antes se
    acertaran, así que la etiqueta no dice que se haya perdido nada. El recuento es descriptivo y,
    como en CALI-4, parte de la diferencia puede ser regresión a la media (sección 2.5). Los
    reservados no tienen tarjeta: se presentan una sola vez (MAST-8.5). La tarjeta se puede abrir
    para ver el ítem, y abrirla no es un intento. Que sean las semanas configuradas, el 80 % de
    confianza alta y el mínimo de ítems es decisión del autor.

    Antecedentes:
      Dado que el mínimo de ítems de las pantallas de calibración configurado es 5
      Y que las semanas de retención diferida configuradas son 1 y 4
      Y que la confianza alta configurada es del 80 %

    @CALI-5.1 @evidencia-2.5 @extrapolacion
    Escenario: Hay una tarjeta por cada ítem dado por seguro y se cuenta cuántas siguen en pie
      Dado que la persona hizo desde el último bucle la prueba de retención de O1 de la semana 4
      Y que esa prueba incluye 12 ítems con una confianza de al menos el 80 % en su último intento anterior y 8 con menos
      Y que la persona acertó 6 de los 12 y 4 de los 8
      Cuando se ejecuta el bucle semanal
      Entonces el paso de calibración muestra «Siguen en pie 6 de 12»
      Y 12 tarjetas, una por cada ítem dado por seguro: 6 «sigue en pie» y 6 «fallada en la prueba»
      Y ninguna tarjeta de los 8 ítems con menos confianza

    @CALI-5.2 @extrapolacion
    Esquema del escenario: La confianza alta empieza en el valor configurado
      Dado que el mínimo de ítems de las pantallas de calibración configurado es 1
      Y que la persona hizo desde el último bucle la prueba de retención de O1 de la semana 4
      Y que el ítem I1 tenía una confianza del <confianza> % en su último intento antes de esa prueba
      Cuando se ejecuta el bucle semanal
      Entonces I1 <resultado>

      Ejemplos:
        | confianza | resultado        |
        | 79        | no tiene tarjeta |
        | 80        | tiene tarjeta    |

    @CALI-5.3 @extrapolacion
    Escenario: La confianza alta se lee de la configuración
      Dado que se cambia en config/parametros.json «confianza_alta_minima» a 90
      Y que el mínimo de ítems de las pantallas de calibración configurado es 1
      Y que la persona hizo desde el último bucle la prueba de retención de O1 de la semana 4
      Y que I1 tenía una confianza del 85 % y I2, del 90 % en su último intento antes de esa prueba
      Cuando se ejecuta el bucle semanal
      Entonces solo I2 tiene tarjeta

    @CALI-5.4 @extrapolacion
    Escenario: Cuenta la confianza del último intento antes de la prueba
      Dado que el mínimo de ítems de las pantallas de calibración configurado es 1
      Y que la persona hizo desde el último bucle la prueba de retención de O1 de la semana 4
      Y que declaró en I1 una confianza del 90 % y después, en un repaso, del 60 %
      Y que declaró en I2 una confianza del 60 % y después, en un repaso, del 90 %
      Cuando se ejecuta el bucle semanal
      Entonces solo I2 tiene tarjeta

    @CALI-5.5 @extrapolacion
    Escenario: Ni los reservados ni la exploración dan tarjeta
      Dado que el mínimo de ítems de las pantallas de calibración configurado es 1
      Y que la persona hizo desde el último bucle la prueba de retención de O1 de la semana 4
      Y que I1 es un reservado de esa prueba respondido con una confianza del 95 %
      Y que declaró en I2 una confianza del 95 % solo en el intento de exploración
      Y que declaró en I3 una confianza del 95 % en una sesión de práctica
      Cuando se ejecuta el bucle semanal
      Entonces solo I3 tiene tarjeta

    @CALI-5.6 @evidencia-2.5 @extrapolacion
    Escenario: Abrir una tarjeta enseña el ítem sin que sea un intento
      Dado que el ítem I1 de O1 tiene una tarjeta «fallada en la prueba»
      Cuando la persona abre la tarjeta de I1
      Entonces ve el enunciado de I1, su respuesta correcta y la confianza que declaró
      Y respuestas.csv no gana ninguna fila
      Y los objetivos dominados, la fase y las fechas de repaso no cambian

    @CALI-5.7 @extrapolacion
    Escenario: Con menos tarjetas que el mínimo no se enseñan y el paso 2 enseña las siluetas
      Dado que la persona hizo desde el último bucle la prueba de retención de O1 de la semana 4
      Y que esa prueba incluye 4 ítems con una confianza de al menos el 80 % en su último intento anterior
      Y que O1 tiene datos suficientes para su silueta
      Cuando se ejecuta el bucle semanal
      Entonces el paso de calibración no muestra ninguna tarjeta
      Y muestra la silueta de los ítems practicados de O1

    @CALI-5.8 @extrapolacion
    Esquema del escenario: Solo la prueba de la última semana configurada da tarjetas
      Dado que las semanas de retención diferida configuradas son <semanas>
      Y que la persona hizo desde el último bucle la prueba de retención de O1 de la semana <hecha>
      Y que esa prueba incluye 6 ítems con una confianza de al menos el 80 % en su último intento anterior
      Cuando se ejecuta el bucle semanal
      Entonces el paso de calibración <resultado>

      Ejemplos:
        | semanas | hecha | resultado                  |
        | 1 y 4   | 1     | no muestra ninguna tarjeta |
        | 1 y 4   | 4     | muestra 6 tarjetas         |
        | 2 y 8   | 4     | no muestra ninguna tarjeta |
        | 2 y 8   | 8     | muestra 6 tarjetas         |

    @CALI-5.9 @extrapolacion
    Escenario: Las tarjetas de cada objetivo salen una sola vez y de un objetivo por bucle
      Dado que la persona hizo desde el último bucle la prueba de retención de la semana 4 de O1 y la de O2
      Y que las dos pruebas incluyen 6 ítems con una confianza de al menos el 80 % en su último intento anterior
      Cuando se ejecuta el bucle semanal
      Entonces el paso de calibración muestra las 6 tarjetas de O1
      Y en el siguiente bucle muestra las 6 tarjetas de O2
      Y en el bucle que sigue a ese no muestra ninguna tarjeta

  @CALI-6 @evidencia-2.5 @extrapolacion
  Regla: Cada bucle enseña una sola pantalla de calibración y lo que digan los datos
    Si hay tarjetas por enseñar (CALI-5) y siluetas (CALI-4), el bucle enseña las tarjetas y las
    siluetas esperan al siguiente. Los textos de las pantallas son plantillas rellenas con los datos
    de la persona. No hay ningún texto escrito de antemano que defienda un método, ni siquiera el de
    recuperar: si los datos contradicen la idea de que recuperar es mejor, la pantalla los enseña
    igual. Los textos hablan de la tarea («estos ítems», «estas tarjetas»), no de la persona.

    Antecedentes:
      Dado que el mínimo de ítems de las pantallas de calibración configurado es 5

    @CALI-6.1 @extrapolacion
    Escenario: Con tarjetas y siluetas por enseñar, el bucle enseña solo las tarjetas
      Dado que la persona hizo desde el último bucle la prueba de retención de O1 de la semana 4
      Y que esa prueba incluye 6 ítems con una confianza de al menos el 80 % en su último intento anterior
      Y que O1 tiene datos suficientes para su silueta
      Cuando se ejecuta el bucle semanal
      Entonces el paso de calibración muestra las 6 tarjetas de O1
      Y no muestra ninguna silueta
      Y el bucle siguiente muestra la silueta de los ítems practicados de O1

    @CALI-6.2 @evidencia-2.5 @extrapolacion
    Esquema del escenario: Las siluetas enseñan los datos tal como salen
      Dado que en O1 la persona respondió 10 ítems no reservados, con una confianza media del <conf_pr> % en su último intento, y acertó <ac_pr>
      Y que respondió 6 ítems reservados de O1, con una confianza media del <conf_re> %, y acertó <ac_re>
      Cuando se ejecuta el bucle semanal
      Entonces la silueta de los ítems practicados de O1 dice «<frase_pr>»
      Y la silueta de los casos nuevos de O1 dice «<frase_re>»
      Y la pantalla no muestra ningún otro texto sobre cómo estudiar

      Ejemplos:
        | conf_pr | ac_pr | conf_re | ac_re | frase_pr                                      | frase_re                                      |
        | 80      | 5     | 50      | 5     | La confianza supera al acierto en 30 puntos   | El acierto supera a la confianza en 33 puntos |
        | 60      | 9     | 90      | 3     | El acierto supera a la confianza en 30 puntos | La confianza supera al acierto en 40 puntos   |
        | 70      | 7     | 50      | 3     | Confianza y acierto coinciden                 | Confianza y acierto coinciden                 |

    @CALI-6.3 @evidencia-2.5 @extrapolacion
    Esquema del escenario: Las tarjetas enseñan el recuento tal como sale
      Dado que la persona hizo desde el último bucle la prueba de retención de O1 de la semana 4
      Y que esa prueba incluye 12 ítems con una confianza de al menos el 80 % en su último intento anterior
      Y que la persona acertó <aciertos> de ellos
      Cuando se ejecuta el bucle semanal
      Entonces el paso de calibración muestra «<frase>»
      Y la pantalla no muestra ningún otro texto sobre cómo estudiar

      Ejemplos:
        | aciertos | frase                  |
        | 12       | Siguen en pie 12 de 12 |
        | 0        | Siguen en pie 0 de 12  |

    @CALI-6.4 @evidencia-2.5 @extrapolacion
    Escenario: Los textos de las pantallas hablan de los ítems, no de la persona
      Dado que la persona tiene siluetas y tarjetas por enseñar
      Cuando ve las dos pantallas de calibración, una en cada bucle
      Entonces ningún texto de las pantallas contiene «fallas», «fallaste», «eres», «sabes», «te equivocas» ni «fracaso»
      Y las tarjetas se llaman «tarjetas» y los textos de las siluetas empiezan por el objetivo y el grupo de ítems

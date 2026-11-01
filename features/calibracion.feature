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

  El experimento de releer frente a recuperar (CALI-7 a CALI-12) deja que la persona lo compruebe
  con sus propios ítems: una mitad se estudia releyendo y la otra recuperando, y una prueba de las
  dos enseña cuántos aciertos dio cada una junto a la confianza que declaró. Es opcional y la
  persona lo elige desde «Ajustes». La sección 2.5 dice que releer da sensación de dominio sin
  dominio y que hay que medir con pruebas; el experimento es esa medida con los ítems de la
  persona. Que verlo cambie lo que la persona cree sobre cómo estudiar no lo prueba ningún estudio
  del informe: el experimento es extrapolación del autor. Como las pantallas de CALI-4 a CALI-6,
  enseña lo que digan los datos aunque no den la razón a la recuperación, y sus intentos no cuentan
  para nada de lo demás (CALI-12).

  Antecedentes:
    Dado el dominio de prueba «ficticio» con los objetivos O1, O2 y O3, en ese orden
    Y que la escala de confianza configurada va del 0 al 100 %

  @CALI-1@evidencia-4 @extrapolacion
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

  @CALI-7 @evidencia-2.5 @extrapolacion
  Regla: El experimento es opcional: solo se ofrece en «Ajustes» y la aplicación nunca lo propone
    Empezarlo es decisión de la persona. Mientras no lo empiece, ninguna pantalla de estudio habla
    de él. Solo hay uno en curso a la vez. Que se ofrezca solo en «Ajustes» es decisión del autor.

    Antecedentes:
      Dado que los ítems por mitad configurados son 10
      Y que las pasadas de estudio configuradas son 2
      Y que el plazo de la prueba configurado es de 7 días

    @CALI-7.1 @extrapolacion
    Escenario: Sin haberlo empezado, el experimento no aparece fuera de «Ajustes»
      Dado que la persona nunca ha empezado el experimento
      Cuando abre la pantalla «Hoy», hace una sesión de práctica y se ejecuta el bucle semanal
      Entonces ni «Hoy», ni la sesión de práctica, ni ningún paso del bucle semanal mencionan el experimento

    @CALI-7.2 @extrapolacion
    Escenario: «Ajustes» ofrece el experimento y dice en qué consiste
      Dado que la persona nunca ha empezado el experimento
      Cuando abre la pantalla «Ajustes»
      Entonces ve la opción «Experimento: releer frente a recuperar»
      Y su texto dice «Se estudian 10 ítems releyendo y 10 recuperando, y a los 7 días se hace una prueba de los 20.»

    @CALI-7.3 @extrapolacion
    Escenario: Con un experimento en curso no se puede empezar otro
      Dado que hay un experimento en curso en O2 cuyo estudio terminó el 2026-03-02
      Cuando abre la pantalla «Ajustes»
      Entonces ve «Prueba disponible el 2026-03-09»
      Y no ve ninguna opción para empezar otro experimento

    @CALI-7.4 @extrapolacion
    Escenario: La persona puede cancelar el experimento hasta terminar la prueba
      Dado que hay un experimento en curso en O2 cuyo estudio terminó
      Cuando la persona lo cancela desde «Ajustes»
      Entonces el experimento deja de estar en curso y no tiene prueba ni resultado
      Y respuestas.csv y experimentos.csv conservan todas sus filas
      Y la persona puede empezar otro experimento

  @CALI-8 @evidencia-2.5 @extrapolacion
  Regla: Los ítems son de un objetivo no dominado y la aplicación los reparte al azar entre las dos mitades
    La comparación solo es justa si las dos mitades son parecidas. Por eso la persona no elige los
    ítems ni dice en qué mitad va cada uno (si lo hiciera, podría poner los fáciles en un lado) y los
    ítems son de un objetivo aún no dominado y que ella todavía no ha respondido, para que haya algo
    que aprender. Los reservados no entran: se presentan una sola vez (MAST-8.5). Cada tipo de ítem se
    reparte a partes iguales entre las dos mitades, con diferencia de uno como máximo. Son decisión
    del autor las condiciones de elección y que cada tipo se reparta por igual.

    Antecedentes:
      Dado que los ítems por mitad configurados son 10

    @CALI-8.1 @extrapolacion
    Escenario: Solo se puede elegir un objetivo que no esté dominado
      Dado que O1 está dominado y que O2 y O3 no lo están
      Cuando la persona empieza el experimento
      Entonces puede elegir entre O2 y O3
      Y no puede elegir O1

    @CALI-8.2 @extrapolacion
    Escenario: Los ítems salen de los no reservados que la persona aún no ha respondido
      Dado que O2 tiene 35 ítems no reservados y 3 reservados
      Y que la persona ha respondido 12 de los no reservados
      Cuando la persona empieza el experimento en O2
      Entonces los 20 ítems del experimento son 20 de los 23 ítems no reservados de O2 sin ningún intento
      Y ninguno es reservado

    @CALI-8.3 @extrapolacion
    Esquema del escenario: Sin ítems suficientes el experimento no empieza
      Dado que O2 tiene <sin_intento> ítems no reservados sin ningún intento
      Cuando la persona empieza el experimento en O2
      Entonces <resultado>

      Ejemplos:
        | sin_intento | resultado                                                                                     |
        | 19          | el experimento no empieza y ve «O2 tiene 19 ítems sin practicar y el experimento necesita 20» |
        | 20          | el experimento empieza con 20 ítems                                                           |

    @CALI-8.4 @extrapolacion
    Esquema del escenario: Cada mitad tiene 10 ítems y cada tipo se reparte por igual
      Dado que los 20 ítems elegidos de O2 son <hechos> de tipo «hecho» y <problemas> de tipo «problema»
      Cuando la aplicación los reparte en la mitad releída y la mitad recuperada
      Entonces cada mitad tiene 10 ítems y ningún ítem está en las dos
      Y las dos mitades se diferencian en <diferencia> ítems de tipo «hecho» como máximo
      Y en <diferencia> ítems de tipo «problema» como máximo

      Ejemplos:
        | hechos | problemas | diferencia |
        | 14     | 6         | 0          |
        | 13     | 7         | 1          |
        | 20     | 0         | 0          |

    @CALI-8.5 @extrapolacion
    Escenario: La persona no puede elegir los ítems ni cambiarlos de mitad
      Cuando la persona empieza el experimento en O2
      Entonces no tiene ninguna opción para elegir ítems, quitar ítems ni pasar un ítem de una mitad a la otra

    @CALI-8.6 @extrapolacion
    Escenario: El reparto es al azar
      Dado los mismos 20 ítems elegidos de O2
      Cuando la aplicación los reparte dos veces, con el azar fijado de dos maneras distintas
      Entonces la mitad releída no es la misma en los dos repartos

    @CALI-8.7 @extrapolacion
    Escenario: Un ítem que ya se presentó en el estudio de un experimento no entra en otro
      Dado que I1 de O2 se presentó en el estudio de un experimento anterior
      Cuando la persona empieza otro experimento en O2
      Entonces I1 no está entre los ítems del experimento

  @CALI-9 @evidencia-2.5 @extrapolacion
  Regla: Las dos mitades se estudian en una sola sesión, con las mismas pasadas y sin repasos entre medias
    Para que la comparación sea justa las dos mitades reciben el mismo número de pasadas y el mismo
    tiempo de estudio. En cada pasada las presentaciones alternan un ítem de la mitad recuperada
    y uno de la releída, y el de la releída no se puede pasar antes de que haya transcurrido lo que
    la persona tardó en el recuperado anterior. Dentro de cada mitad los ítems siguen el orden de
    la práctica normal, sin agruparlos ni mezclarlos por tipo a propósito. La mitad recuperada se estudia como cualquier
    práctica: recuerda, declara su confianza y recibe el feedback (CALI-1, RECU-2). La releída se ve
    con la respuesta (RECU-5) y no es un intento: no hay respuesta ni confianza. Hasta la prueba,
    los ítems del experimento no salen en ninguna otra parte: ni práctica ni repasos. Todo esto
    es decisión del autor.

    Antecedentes:
      Dado que los ítems por mitad configurados son 10
      Y que las pasadas de estudio configuradas son 2
      Y que hay un experimento en curso en O2 con sus 20 ítems repartidos

    @CALI-9.1 @extrapolacion
    Escenario: Cada ítem de las dos mitades se presenta el mismo número de veces en una sola sesión
      Cuando la persona estudia el experimento
      Entonces cada ítem de las dos mitades se presenta 2 veces
      Y las 40 presentaciones son de una sola sesión

    @CALI-9.2 @extrapolacion
    Escenario: Las presentaciones alternan un ítem recuperado y uno releído
      Cuando la persona estudia una pasada del experimento
      Entonces la pasada presenta 20 ítems alternando uno de la mitad recuperada y, a continuación, uno de la releída
      Y presenta 10 ítems de cada mitad
      Y dentro de cada mitad los ítems van en el orden de la práctica normal

    @CALI-9.3 @extrapolacion
    Escenario: Un ítem de la mitad recuperada se estudia como cualquier práctica
      Dado que I2 está en la mitad recuperada
      Cuando se le presenta I2 a la persona en el estudio
      Entonces no ve ninguna de las respuestas aceptadas hasta haber respondido y declarado su confianza
      Y después ve que su respuesta es correcta o incorrecta, la respuesta correcta y la explicación del contenido

    @CALI-9.4 @extrapolacion
    Escenario: Ver un ítem de la mitad releída no es un intento
      Dado que I1 está en la mitad releída
      Cuando la persona ve I1 en el estudio
      Entonces respuestas.csv no gana ninguna fila
      Y I1 sigue sin ningún intento ni ninguna confianza declarada

    @CALI-9.5 @extrapolacion
    Esquema del escenario: El ítem releído no se puede pasar antes del tiempo que tardó el recuperado anterior
      Dado que la persona tardó <tardó> s en responder un ítem de la mitad recuperada, declarar su confianza y ver el feedback
      Cuando se le presenta a continuación un ítem de la mitad releída y han pasado <pasan> s
      Entonces la persona <resultado> pasar al ítem siguiente

      Ejemplos:
        | tardó | pasan | resultado |
        | 9     | 8     | no puede  |
        | 9     | 9     | puede     |
        | 9     | 20    | puede     |

    @CALI-9.6 @extrapolacion
    Esquema del escenario: Hasta la prueba los ítems del experimento no salen en ninguna otra parte
      Dado que I1 es uno de los ítems del experimento
      Cuando la aplicación prepara <dónde>
      Entonces I1 no se presenta
      Y no hay ningún repaso de I1 programado

      Ejemplos:
        | dónde                   |
        | una sesión de práctica  |
        | un repaso programado    |
        | una sesión intercalada  |
        | una prueba de retención |

    @CALI-9.7 @extrapolacion
    Escenario: Mientras el experimento está en curso, el objetivo no se puede dar por dominado
      Dado que O2 tiene 35 ítems no reservados, 15 respondidos y acertados, y 20 en el experimento sin ningún intento
      Cuando la aplicación evalúa O2
      Entonces O2 no queda dominado

    @CALI-9.8 @extrapolacion
    Escenario: Si el estudio no termina el mismo día, el experimento se cancela
      Dado que el estudio empezó el 2026-03-02 y le quedan presentaciones
      Cuando llega el 2026-03-03
      Entonces el experimento deja de estar en curso y no tiene prueba ni resultado
      Y los ítems del experimento vuelven a la práctica normal

  @CALI-10 @evidencia-2.5 @extrapolacion
  Regla: La prueba incluye los ítems de las dos mitades, se hace pasado el plazo y no caduca
    La prueba se hace a los días configurados de terminar el estudio. Si la persona la hace más
    tarde, vale igual: las dos mitades esperan lo mismo, y el resultado dice a los cuántos días se
    hizo. Cada ítem se presenta una sola vez, sin decir de qué mitad es, sin su respuesta y con la
    confianza declarada antes del feedback (CALI-1.1), en el formato de la práctica (RECU-4). El
    plazo y que no caduque son decisión del autor.

    Antecedentes:
      Dado que los ítems por mitad configurados son 10
      Y que el plazo de la prueba configurado es de 7 días
      Y que el estudio del experimento terminó el 2026-03-02

    @CALI-10.1 @extrapolacion
    Escenario: La prueba queda programada a los días del plazo de terminar el estudio
      Cuando termina el estudio
      Entonces la prueba del experimento queda programada para el 2026-03-09

    @CALI-10.2 @extrapolacion
    Escenario: El plazo de la prueba se lee de la configuración
      Dado que se cambia en config/parametros.json «experimento_plazo_prueba_dias» a 14
      Cuando termina el estudio
      Entonces la prueba del experimento queda programada para el 2026-03-16

    @CALI-10.3 @extrapolacion
    Escenario: Antes de la fecha no se puede hacer la prueba
      Cuando el 2026-03-08 la persona abre la pantalla «Ajustes»
      Entonces ve «Prueba disponible el 2026-03-09»
      Y no tiene ninguna opción para hacer la prueba

    @CALI-10.4 @extrapolacion
    Esquema del escenario: Desde la fecha la prueba aparece en «Hoy» y en «Ajustes»
      Cuando el 2026-03-09 la persona abre la pantalla «<pantalla>»
      Entonces ve la prueba del experimento, de 20 ítems, lista para hacerse

      Ejemplos:
        | pantalla |
        | Hoy      |
        | Ajustes  |

    @CALI-10.5 @extrapolacion
    Escenario: La prueba hecha más tarde de la fecha vale igual
      Cuando la persona hace y termina la prueba el 2026-03-12
      Entonces el resultado se calcula igual que si se hubiera hecho el 2026-03-09
      Y dice «Prueba a los 10 días del estudio»

    @CALI-10.6 @extrapolacion
    Escenario: La prueba presenta cada ítem una vez sin decir de qué mitad es
      Cuando la persona hace la prueba
      Entonces se presentan 20 ítems, uno por cada ítem de las dos mitades
      Y cada ítem se presenta una sola vez
      Y la persona no ve de qué mitad es cada ítem

    @CALI-10.7 @extrapolacion
    Esquema del escenario: Cada ítem se responde sin ayuda y con la confianza declarada, sea de la mitad que sea
      Dado que I1 está en la mitad <mitad>
      Cuando se le presenta I1 a la persona en la prueba del experimento
      Entonces responde eligiendo entre las opciones «a», «b» y «c», como en la práctica
      Y no ve cuál es la correcta ni el feedback hasta haber declarado su confianza

      Ejemplos:
        | mitad      |
        | releída    |
        | recuperada |

  @CALI-11 @evidencia-2.5 @extrapolacion
  Regla: El resultado enseña dos pilas de aciertos junto a la confianza declarada y lo que digan los datos
    Pantalla del resultado, al responder el último ítem de la prueba. Una pila por mitad, con una
    tarjeta por ítem, como las de CALI-5, y el recuento como frecuencia («4 de 10»). Junto a cada
    pila va la confianza media que declaró en esos ítems en la prueba y la diferencia con el acierto,
    con la misma frase y los mismos enteros que la silueta de CALI-4. También el tiempo de estudio de
    cada mitad, y a los cuántos días se hizo la prueba. Como en
    CALI-6, los textos son plantillas rellenas con los datos: ninguno defiende un método, ni siquiera
    el de recuperar, y si los datos contradicen la idea de que recuperar es mejor, el resultado los
    enseña igual. Los textos hablan de los ítems, no de la persona. Dos avisos son datos sobre
    la prueba y no textos sobre cómo estudiar: que con tan pocos ítems un acierto más cambia
    mucho el resultado (100 entre los ítems por mitad configurados, en puntos), y que el resultado
    es de esos ítems, de ese objetivo y de una sola prueba. Todo esto es decisión del autor.

    Antecedentes:
      Dado que los ítems por mitad configurados son 10

    @CALI-11.1 @evidencia-2.5 @extrapolacion
    Escenario: El resultado enseña los aciertos de cada mitad en dos pilas de tarjetas
      Dado que la persona acertó 4 de los 10 ítems de la mitad releída y 8 de los 10 de la mitad recuperada
      Cuando responde el último ítem de la prueba
      Entonces el resultado muestra la pila «releídas» con «4 de 10» y la pila «recuperadas» con «8 de 10»
      Y cada pila tiene 10 tarjetas, una por ítem
      Y en «releídas» hay 4 tarjetas «acertada» y 6 «fallada en la prueba»; en «recuperadas», 8 y 2

    @CALI-11.2 @evidencia-2.5 @extrapolacion
    Escenario: Junto a cada pila está la confianza media declarada en la prueba
      Dado que la persona acertó 4 de 10 ítems releídos con una confianza media del 70 % en la prueba
      Y que acertó 8 de 10 ítems recuperados con una confianza media del 60 % en la prueba
      Cuando responde el último ítem de la prueba
      Entonces la pila «releídas» muestra la confianza media del 70 % y la frase «La confianza supera al acierto en 30 puntos»
      Y la pila «recuperadas» muestra la confianza media del 60 % y la frase «El acierto supera a la confianza en 20 puntos»

    @CALI-11.3 @evidencia-2.5 @extrapolacion
    Esquema del escenario: El resultado enseña los datos tal como salen
      Dado que la persona acertó <releídas> de los 10 ítems de la mitad releída y <recuperadas> de los 10 de la mitad recuperada
      Cuando responde el último ítem de la prueba
      Entonces el resultado muestra «<releídas> de 10 releídas» y «<recuperadas> de 10 recuperadas»
      Y la pantalla no muestra ningún otro texto sobre cómo estudiar

      Ejemplos:
        | releídas | recuperadas |
        | 4        | 8           |
        | 8        | 4           |
        | 6        | 6           |

    @CALI-11.4 @extrapolacion
    Escenario: El resultado dice cuánto se estudió cada mitad y a los cuántos días se hizo la prueba
      Dado que el estudio de la mitad releída duró 411 s y el de la recuperada, 372 s
      Y que la prueba se hizo a los 7 días del estudio
      Cuando responde el último ítem de la prueba
      Entonces el resultado muestra «Tiempo de estudio: releídas, 7 min; recuperadas, 6 min»
      Y «Prueba a los 7 días del estudio»

    @CALI-11.5 @extrapolacion
    Escenario: El resultado avisa de que con tan pocos ítems un acierto más cambia mucho
      Cuando responde el último ítem de la prueba
      Entonces el resultado muestra «Con 10 ítems por mitad, un acierto más cambia el resultado 10 puntos»
      Y el número de puntos sale de dividir 100 entre los ítems por mitad configurados

    @CALI-11.6 @extrapolacion
    Escenario: Los textos del resultado hablan de los ítems, no de la persona
      Cuando responde el último ítem de la prueba
      Entonces ningún texto del resultado contiene «fallas», «fallaste», «eres», «sabes», «te equivocas» ni «fracaso»
      Y las pilas se llaman «releídas» y «recuperadas»

    @CALI-11.7 @extrapolacion
    Escenario: Sin los 20 ítems respondidos no hay resultado
      Dado que la persona ha respondido 19 de los 20 ítems de la prueba
      Cuando abre la pantalla «Ajustes»
      Entonces no ve ningún resultado
      Y ve «Prueba en curso: 19 de 20 ítems»

    @CALI-11.8 @extrapolacion
    Escenario: El resultado se puede volver a ver en «Ajustes» y no sale en el bucle semanal
      Dado que la persona terminó la prueba el 2026-03-09
      Cuando abre la pantalla «Ajustes» el 2026-03-10 y se ejecuta el bucle semanal
      Entonces «Ajustes» muestra el mismo resultado
      Y ningún paso del bucle semanal lo muestra

    @CALI-11.9 @extrapolacion
    Escenario: Abrir una tarjeta del resultado enseña el ítem sin que sea un intento
      Dado que el ítem I1 de O2 tiene una tarjeta «fallada en la prueba» en el resultado
      Cuando la persona abre la tarjeta de I1
      Entonces ve el enunciado de I1, su respuesta correcta y la confianza que declaró en la prueba
      Y respuestas.csv no gana ninguna fila
      Y los objetivos dominados, la fase y las fechas de repaso no cambian

    @CALI-11.10 @extrapolacion
    Escenario: El resultado dice que vale solo para esos ítems, de ese objetivo y de una sola prueba
      Dado que el experimento se hizo con 20 ítems de O2
      Cuando responde el último ítem de la prueba
      Entonces el resultado muestra «Resultado de estos 20 ítems de O2, en una sola prueba»

  @CALI-12 @evidencia-2.5 @extrapolacion
  Regla: Los intentos del experimento no cuentan para el dominio ni para ninguna otra pantalla
    Los intentos del estudio de la mitad recuperada y de la prueba llevan sus propios contextos
    en respuestas.csv (INST-1.3). Se ven en el resultado del experimento y en ningún otro sitio:
    no cuentan para el dominio (MAST-1), la fase, la ayuda, los repasos ni las pantallas de
    calibración (CALI-2, CALI-4 y CALI-5). Los ítems pasan a la práctica normal sin ningún intento
    cuando el experimento termina o se cancela. Es decisión del autor.

    Antecedentes:
      Dado que los ítems por mitad configurados son 10

    @CALI-12.1 @extrapolacion
    Escenario: Hacer el experimento no cambia el progreso
      Dado dos personas con los mismos intentos y aciertos en el dominio «ficticio»
      Pero una hizo un experimento en O2, con su estudio y su prueba, y la otra no
      Cuando la aplicación evalúa a las dos
      Entonces las dos tienen los mismos objetivos dominados y la misma fase
      Y los mismos pasos retirados en cada objetivo
      Y las mismas fechas de repaso

    @CALI-12.2 @extrapolacion
    Escenario: Las respuestas del experimento no entran en la calibración semanal
      Dado que en la última semana la persona respondió estos ítems:
        | ítem | contexto            | confianza | correcta |
        | I1   | practica            | 80        | sí       |
        | I2   | practica            | 60        | no       |
        | I3   | experimento_estudio | 95        | no       |
        | I4   | experimento_prueba  | 90        | no       |
      Cuando se ejecuta el bucle semanal
      Entonces el paso de calibración muestra una confianza media del 70 %
      Y un acierto del 50 %

    @CALI-12.3 @extrapolacion
    Escenario: Las respuestas del experimento no entran en la silueta
      Dado que el mínimo de ítems de las pantallas de calibración configurado es 2
      Y que en O1 la persona respondió estos ítems:
        | ítem | contexto           | confianza | correcta |
        | I1   | practica           | 80        | sí       |
        | I2   | practica           | 60        | no       |
        | I3   | experimento_prueba | 95        | no       |
      Cuando se ejecuta el bucle semanal
      Entonces la silueta de los ítems practicados de O1 tiene el contorno al 70 % y el relleno al 50 %, «1 de 2»

    @CALI-12.4 @extrapolacion
    Escenario: Una confianza alta en el experimento no da tarjeta
      Dado que el mínimo de ítems de las pantallas de calibración configurado es 1
      Y que la persona hizo desde el último bucle la prueba de retención de O1 de la semana 4
      Y que I1 estuvo en un experimento terminado, donde declaró una confianza del 95 % en la prueba
      Y que declaró en I2 una confianza del 95 % en una sesión de práctica
      Cuando se ejecuta el bucle semanal
      Entonces solo I2 tiene tarjeta

    @CALI-12.5 @extrapolacion
    Escenario: Acertar la prueba del experimento no da ningún ítem por respondido
      Dado que O2 tiene 35 ítems no reservados, 15 respondidos y acertados, y 20 en el experimento sin ningún intento
      Cuando la persona acierta los 20 ítems de la prueba del experimento
      Y la aplicación evalúa O2
      Entonces O2 no queda dominado
      Y los 20 ítems del experimento siguen sin ningún intento

    @CALI-12.6 @extrapolacion
    Esquema del escenario: Al terminar o cancelar el experimento los ítems vuelven a la práctica normal
      Dado que el experimento de O2 <fin>
      Cuando la aplicación prepara una sesión de práctica de O2
      Entonces los ítems del experimento pueden presentarse como cualquier ítem sin ningún intento
      Y se presentan sin su respuesta

      Ejemplos:
        | fin                              |
        | terminó con la prueba respondida |
        | se canceló antes de la prueba    |

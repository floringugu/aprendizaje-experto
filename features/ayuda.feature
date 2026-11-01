# language: es
@AYUD @evidencia-2.3 @evidencia-3
Característica: Ayuda adaptativa con retirada progresiva
  Más guía a quien sabe poco y menos a quien sabe mucho (efecto de inversión de la pericia,
  Tetzlaff et al., 2025, sección 2.3). La ayuda son los ejemplos resueltos de cada objetivo: se
  alternan ejemplo y problema y se retiran pasos a medida que sube el rendimiento (tabla de la
  sección 3). El bucle semanal retira ayuda si el acierto sin ayuda es alto y la reintroduce si cae
  (sección 4). El ritmo de un paso por semana y el orden en que se retiran los pasos (primero los
  últimos) son extrapolación del autor.

  El acierto sin ayuda que decide el ajuste es el de MAST: estudiar un ejemplo antes de un problema
  no le quita a ese problema la condición de «sin ayuda», porque mientras responde no ve el ejemplo.

  Antes de los ejemplos y los problemas de AYUD-1, la primera sesión de un objetivo no dominado
  lleva su instrucción (AYUD-4). En las fases intermedia y avanzada empieza además con un problema
  de exploración (AYUD-5) y pide una autoexplicación tras la instrucción (AYUD-6). En la fase
  intermedia, tras la exploración y antes de la instrucción, van unas prepreguntas (AYUD-8). El diagrama de
  un objetivo o de un ejemplo resuelto se muestra junto a su texto, salvo el de un ejemplo con pasos
  retirados (AYUD-7). La secuencia entera es
  extrapolación: el informe avisa de que el uso combinado de todas las técnicas no es
  necesariamente aditivo (sección 4, «Qué es extrapolación del autor»; sección 6, «Aditividad»).

  La autoexplicación y los ejemplos resueltos van en la misma sesión. Barbieri et al. (sección 2.2)
  vieron que añadir instrucciones de autoexplicación a los ejemplos resueltos redujo su beneficio,
  y por eso aquí va sobre la instrucción y antes del ejemplo, nunca sobre él (AYUD-3.1, AYUD-6.6),
  en la línea de la sección 3: «usar con texto conceptual; cautela al combinarla con ejemplos resueltos».
  Separarlas por sesiones dejaría la primera sesión de un objetivo nuevo sin ejemplo resuelto, que
  es «bien establecido» (g = 0,48), para proteger una técnica de nivel «prometedor» marcada [verificar].
  Las dos secuencias son extrapolación por igual. Que la misma sesión no reproduzca la interacción
  es lectura del autor.

  Antecedentes:
    Dado el dominio de prueba «ficticio» con los objetivos O1, O2 y O3, en ese orden
    Y que O1 tiene el ejemplo resuelto E1 con los pasos P1, P2 y P3

  @AYUD-1 @evidencia-3 @evidencia-2.2 @extrapolacion
  Regla: Mientras hay ayuda, se alternan ejemplo y problema

    Antecedentes:
      Dado que la persona practicó O1 en una sesión anterior

    @AYUD-1.1 @evidencia-3 @evidencia-2.2
    Escenario: Una sesión con ayuda completa alterna ejemplo resuelto y problema
      Dado que O1 tiene la ayuda completa
      Cuando la persona practica O1
      Entonces la sesión alterna el ejemplo resuelto E1 con sus 3 pasos y un problema de O1
      Y mientras responde un problema no ve el ejemplo resuelto

    @AYUD-1.2 @evidencia-3 @extrapolacion
    Escenario: Un ejemplo con pasos retirados muestra solo los primeros
      Dado que O1 tiene 1 paso retirado
      Cuando la persona practica O1
      Entonces el ejemplo resuelto E1 muestra los pasos P1 y P2
      Y no muestra el paso P3

    @AYUD-1.3 @evidencia-3 @evidencia-2.3 @extrapolacion
    Escenario: Sin pasos que mostrar, el objetivo se practica sin ejemplos
      Dado que O1 tiene 3 pasos retirados
      Cuando la persona practica O1
      Entonces la sesión solo presenta problemas de O1
      Y no muestra ningún ejemplo resuelto

  @AYUD-2 @evidencia-4 @evidencia-2.3 @extrapolacion
  Regla: La ayuda se ajusta una vez por semana según el acierto sin ayuda

    Antecedentes:
      Dado que el umbral de retirada de ayuda configurado es del 85 %
      Y que cada ajuste configurado retira o devuelve 1 paso

    @AYUD-2.1 @evidencia-4 @extrapolacion
    Esquema del escenario: El bucle semanal retira o devuelve un paso
      Dado que O1 tiene <antes> pasos retirados
      Y que en la última semana la persona acertó <aciertos> de 20 problemas de O1
      Cuando se ejecuta el bucle semanal
      Entonces O1 tiene <después> pasos retirados
      Y el cambio queda registrado en cambios_ayuda.csv

      Ejemplos:
        | antes | aciertos | después |
        | 0     | 20       | 1       |
        | 1     | 17       | 2       |
        | 2     | 16       | 1       |
        | 1     | 10       | 0       |

    @AYUD-2.2 @extrapolacion
    Escenario: La ayuda completa no puede crecer más
      Dado que O1 tiene 0 pasos retirados
      Y que en la última semana la persona acertó 5 de 20 problemas de O1
      Cuando se ejecuta el bucle semanal
      Entonces O1 sigue con 0 pasos retirados

    @AYUD-2.3 @extrapolacion
    Escenario: Retirada toda la ayuda, un acierto alto no retira más
      Dado que O1 tiene 3 pasos retirados
      Y que en la última semana la persona acertó 20 de 20 problemas de O1
      Cuando se ejecuta el bucle semanal
      Entonces O1 sigue con 3 pasos retirados

    @AYUD-2.4 @evidencia-4 @extrapolacion
    Escenario: Una caída del acierto reintroduce la ayuda retirada
      Dado que O1 tiene 3 pasos retirados
      Y que en la última semana la persona acertó 12 de 20 problemas de O1
      Cuando se ejecuta el bucle semanal
      Entonces O1 tiene 2 pasos retirados
      Y la siguiente sesión de O1 vuelve a alternar el ejemplo resuelto E1, con el paso P1, y problemas

    @AYUD-2.5 @extrapolacion
    Escenario: Sin problemas respondidos en la semana, la ayuda no cambia
      Dado que O1 tiene 1 paso retirado
      Y que en la última semana la persona no respondió ningún problema de O1
      Cuando se ejecuta el bucle semanal
      Entonces O1 sigue con 1 paso retirado
      Y no se registra ningún cambio en cambios_ayuda.csv

    @AYUD-2.6 @extrapolacion
    Escenario: La ayuda no cambia fuera del bucle semanal
      Dado que O1 tiene 1 paso retirado
      Cuando la persona acierta 20 problemas seguidos de O1 a mitad de semana
      Entonces O1 sigue con 1 paso retirado hasta el siguiente bucle semanal

    @AYUD-2.7 @extrapolacion
    Esquema del escenario: El umbral y el tamaño del ajuste se leen de la configuración
      Dado que se cambia en config/parametros.json «umbral_retirada_ayuda» a <umbral> y «pasos_retirados_por_ajuste» a <pasos>
      Y que O1 tiene 1 paso retirado
      Y que en la última semana la persona acertó 15 de 20 problemas de O1
      Cuando se ejecuta el bucle semanal
      Entonces O1 tiene <después> pasos retirados

      Ejemplos:
        | umbral | pasos | después |
        | 0,75   | 1     | 2       |
        | 0,75   | 2     | 3       |
        | 0,80   | 1     | 0       |

  @AYUD-3 @evidencia-2.2 @evidencia-4 @extrapolacion
  Regla: Por defecto no se piden autoexplicaciones con los ejemplos resueltos
    Barbieri et al. (2023) observaron la interacción negativa en matemáticas. Aplicarla a otros
    dominios es extrapolación (sección 4: «la aplicación a dominios no estudiados»).

    @AYUD-3.1 @evidencia-2.2 @evidencia-4 @extrapolacion
    Escenario: Estudiar un ejemplo resuelto no pide autoexplicación
      Dado que la combinación de ejemplos resueltos y autoexplicación configurada está desactivada
      Cuando la persona estudia el ejemplo resuelto E1
      Entonces la aplicación no le pide que explique ningún paso
      Y no le muestra ninguna instrucción de autoexplicación

  @AYUD-4 @evidencia-4 @extrapolacion
  Regla: La primera sesión de un objetivo no dominado muestra su instrucción antes de cualquier ejemplo
    La Fase 1 pide «instrucción explícita» y evitar el «descubrimiento sin guía» (sección 4). La
    sección 2.3 lo apoya en Kirschner et al. (2006), marcado con (†) en la bibliografía, que no puede
    sostener una decisión central: la regla es extrapolación, y «solo la primera vez» también.
    En la fase novato la instrucción va además antes de cualquier problema (AYUD-4.1).
    En las fases intermedia y avanzada la instrucción llega tras el intento de exploración y su feedback
    (AYUD-5) y, en la intermedia, tras las prepreguntas (AYUD-8), pero antes de cualquier ejemplo.

    @AYUD-4.1 @evidencia-4 @extrapolacion
    Escenario: En la fase novato, la primera sesión empieza por la instrucción, antes de cualquier problema
      Dado que la persona está en la fase «novato»
      Y que O1 tiene la instrucción «La regla R1 se aplica cuando el caso cumple A.»
      Y que O1 tiene la ayuda completa y problemas
      Y que la persona nunca ha practicado O1
      Cuando la persona practica O1
      Entonces la sesión empieza mostrando la instrucción «La regla R1 se aplica cuando el caso cumple A.»
      Y después alterna el ejemplo resuelto E1 con problemas de O1
      Y no presenta ningún problema antes de la instrucción

    @AYUD-4.2 @evidencia-4 @extrapolacion
    Esquema del escenario: En las fases intermedia y avanzada, la instrucción va antes de cualquier ejemplo
      Dado que la persona está en la fase «<fase>» con O1, O2 y O3 dominados
      Y que O4 se aprobó en la revisión del material, sin dominarlo ni practicarlo, con la instrucción «La regla R4 se aplica cuando el caso cumple A y B.», el ejemplo resuelto E4 y problemas
      Cuando la persona practica O4
      Entonces la sesión muestra la instrucción «La regla R4 se aplica cuando el caso cumple A y B.» antes del ejemplo resuelto E4
      Y no muestra ningún ejemplo resuelto antes de la instrucción

      Ejemplos:
        | fase             |
        | intermedio       |
        | avanzado_experto |

    @AYUD-4.3 @extrapolacion
    Escenario: La segunda sesión de un objetivo no repite la instrucción
      Dado que la persona está en la fase «novato»
      Y que O1 tiene la instrucción «La regla R1 se aplica cuando el caso cumple A.»
      Y que la persona practicó O1 en una sesión anterior
      Cuando la persona practica O1
      Entonces la sesión no muestra la instrucción de O1

    @AYUD-4.4 @extrapolacion
    Escenario: La instrucción no se ve mientras se responde un problema
      Dado que la persona está en la fase «novato»
      Y que O1 tiene la instrucción «La regla R1 se aplica cuando el caso cumple A.»
      Y que O1 tiene la ayuda completa y problemas
      Y que la persona nunca ha practicado O1
      Cuando la persona practica O1
      Entonces mientras responde un problema no ve la instrucción de O1

    @AYUD-4.5 @evidencia-2.3 @evidencia-3 @extrapolacion
    Esquema del escenario: Un objetivo dominado en el diagnóstico no muestra su instrucción
      Dado que en el diagnóstico la persona domina O1 y no domina O2
      Cuando la persona <acción>
      Entonces no se le muestra la instrucción de O1

      Ejemplos:
        | acción                                  |
        | empieza una sesión de práctica con O1   |
        | hace un repaso programado de O1         |

  @AYUD-5 @evidencia-3 @evidencia-2.3 @evidencia-2.2 @evidencia-4 @extrapolacion
  Regla: En las fases intermedia y avanzada, un objetivo nuevo empieza con un intento de exploración
    El fracaso productivo (sección 3: «prometedor-sólido»; sección 2.3, Sinha y Kapur, 2021) pide
    intentar el problema antes de la instrucción y recibir siempre la instrucción después. El informe
    lo condiciona al conocimiento previo: «no con novatos sin conocimientos activables». Aquí la señal
    es la fase, porque en las fases intermedia y avanzada todos los objetivos anteriores están
    dominados. Son extrapolación esa señal, la fase avanzada (el informe lo pone en la intermedia), un
    solo problema en lugar de 15–30 minutos y aplicarlo a los objetivos que llegan con MATE.

    El intento pide la confianza y da feedback como cualquier ítem (CALI-1, RECU-2): el feedback
    correctivo eleva el efecto de la recuperación (sección 2.2), y la instrucción sigue llegando
    después (AYUD-5.3), que es lo que exige la sección 2.3. Que el intento lleve feedback es
    extrapolación. La confianza se pide porque el feedback llega después de declararla (CALI-1.1);
    se registra, pero no entra en la calibración (CALI-2.3). Es decisión del autor.

    Lo que se intenta antes de la instrucción no mide lo aprendido. Por eso el intento no cuenta para
    el dominio (MAST-1) ni para el ajuste semanal (AYUD-2). Tampoco cuenta en el paso 1 del bucle
    (BUCL-2.4), porque su acierto sin ayuda es el de MAST; ni en la calibración semanal (CALI-2.3),
    que mira lo ya estudiado; ni en el paso a la fase avanzada (MAST-6.6), donde solo cuentan los
    intentos intercalados. Es decisión del autor.

    Un objetivo sin ítems de tipo «problema» no tiene intento de exploración (AYUD-5.7): el fracaso
    productivo es «intentar el problema» (sección 3), y un hecho no enseñado solo se adivina. Los
    hechos con opciones se preguntan antes de la instrucción como prepreguntas, no como exploración
    (AYUD-8); si el objetivo no tiene ninguno, empieza por la instrucción.

    Los escenarios de AYUD-5 y AYUD-6 hablan de un objetivo O4 sin ítems de tipo «hecho» con
    opciones; las prepreguntas se tratan en AYUD-8.

    Antecedentes:
      Dado que O4 se aprobó en la revisión del material, sin dominarlo ni practicarlo, con la instrucción «La regla R4 se aplica cuando el caso cumple A y B.» y el ejemplo resuelto E4

    @AYUD-5.1 @evidencia-3 @evidencia-4 @extrapolacion
    Escenario: En la fase novato no hay intento de exploración
      Dado que la persona está en la fase «novato»
      Y que O1 tiene problemas
      Y que la persona nunca ha practicado O1
      Cuando la persona practica O1
      Entonces la sesión no presenta ningún problema de exploración
      Y lo primero que ve es la instrucción de O1

    @AYUD-5.2 @evidencia-3 @evidencia-2.3 @extrapolacion
    Esquema del escenario: En las fases intermedia y avanzada, la primera sesión de un objetivo nuevo empieza con un problema
      Dado que la persona está en la fase «<fase>» con O1, O2 y O3 dominados
      Y que O4 tiene problemas
      Cuando la persona practica O4
      Entonces la sesión empieza con un problema de O4
      Y antes de ese problema no se le ha mostrado la instrucción de O4 ni el ejemplo resuelto E4

      Ejemplos:
        | fase             |
        | intermedio       |
        | avanzado_experto |

    @AYUD-5.3 @evidencia-3 @evidencia-2.3 @extrapolacion
    Esquema del escenario: Después del intento de exploración, acierte o falle, viene la instrucción
      Dado que la persona está en la fase «intermedio» con O1, O2 y O3 dominados
      Y que O4 tiene problemas
      Y que O4 no tiene ítems de tipo «hecho» con opciones
      Cuando la persona practica O4 y <resultado> el problema de exploración
      Entonces tras el feedback del problema, lo siguiente que presenta la sesión es la instrucción «La regla R4 se aplica cuando el caso cumple A y B.»

      Ejemplos:
        | resultado |
        | acierta   |
        | falla     |

    @AYUD-5.4 @extrapolacion
    Escenario: Solo la primera sesión del objetivo empieza con un intento de exploración
      Dado que la persona está en la fase «intermedio» con O1, O2 y O3 dominados
      Y que O4 tiene problemas
      Y que la persona practicó O4 en una sesión anterior
      Cuando la persona practica O4
      Entonces la sesión no presenta ningún problema de exploración

    @AYUD-5.5 @extrapolacion
    Escenario: El intento de exploración se registra con su propio contexto
      Dado que la persona está en la fase «intermedio» con O1, O2 y O3 dominados
      Y que O4 tiene problemas
      Cuando la persona practica O4 y responde el problema de exploración
      Entonces su fila en respuestas.csv tiene el contexto «exploracion»

    @AYUD-5.6 @evidencia-4 @extrapolacion
    Escenario: El intento de exploración no cuenta para el ajuste semanal de la ayuda
      Dado que el umbral de retirada de ayuda configurado es del 85 %
      Y que la persona está en la fase «intermedio» con O1, O2 y O3 dominados
      Y que O4 tiene problemas
      Y que O4 tiene la ayuda completa
      Y que en la última semana la única respuesta de la persona a un problema de O4 fue un acierto en el problema de exploración
      Cuando se ejecuta el bucle semanal
      Entonces O4 sigue con 0 pasos retirados
      Y no se registra ningún cambio en cambios_ayuda.csv

    @AYUD-5.7 @extrapolacion
    Escenario: Un objetivo sin problemas ni hechos con opciones empieza por la instrucción
      Dado que la persona está en la fase «intermedio» con O1, O2 y O3 dominados
      Y que O4 solo tiene ítems de tipo «hecho» sin opciones
      Cuando la persona practica O4
      Entonces la sesión no presenta ningún problema de exploración
      Y lo primero que ve es la instrucción de O4

    @AYUD-5.8 @evidencia-2.2 @evidencia-3 @evidencia-4 @extrapolacion
    Escenario: El intento de exploración pide la confianza y da feedback como cualquier ítem
      Dado que la persona está en la fase «intermedio» con O1, O2 y O3 dominados
      Y que O4 tiene problemas
      Cuando la persona practica O4 y responde el problema de exploración
      Entonces no ve si ha acertado ni el feedback del problema hasta declarar su confianza
      Y después de declararla ve si su respuesta es correcta, la respuesta correcta y el feedback del problema

  @AYUD-6 @evidencia-3 @evidencia-4 @evidencia-2.2 @extrapolacion
  Regla: En las fases intermedia y avanzada, tras la instrucción se pide una autoexplicación
    La autoexplicación tiene el nivel «Prometedor», con utilidad «moderada» y marcada [verificar]
    (sección 3; Dunlosky, marcado con (†) en la bibliografía), y
    la Fase 2 la pide «en material conceptual» (sección 4). Barbieri et al. (2023, sección 2.2)
    vieron que añadirla a los ejemplos resueltos redujo el beneficio, así que aquí va sobre el texto
    de la instrucción y nunca sobre un ejemplo (AYUD-3). Que no se corrija ni cuente para el dominio, la ayuda ni la fase, y que
    se registre, es decisión del autor; el sitio exacto y la fase avanzada son extrapolación.

    La autoexplicación no puede quedar en blanco: se rechaza el texto vacío o hecho solo de espacios
    (AYUD-6.8). Cualquier otro texto vale, también «No sé.», y no se corrige. No hay longitud mínima,
    y el aviso no sugiere ninguna respuesta. Es decisión del autor, con una suposición que el informe
    no trata: si fuera opcional y no contara para nada, casi nadie la escribiría.

    Antecedentes:
      Dado que O4 se aprobó en la revisión del material, sin dominarlo ni practicarlo, con la instrucción «La regla R4 se aplica cuando el caso cumple A y B.» y el ejemplo resuelto E4

    @AYUD-6.1 @evidencia-3 @evidencia-4 @extrapolacion
    Escenario: En la fase novato no se pide autoexplicación
      Dado que la persona está en la fase «novato»
      Y que O1 tiene la instrucción «La regla R1 se aplica cuando el caso cumple A.»
      Y que la persona nunca ha practicado O1
      Cuando la persona practica O1
      Entonces tras la instrucción de O1 la aplicación no le pide que explique nada

    @AYUD-6.2 @evidencia-3 @evidencia-4 @extrapolacion
    Esquema del escenario: En las fases intermedia y avanzada se pide explicar el porqué de la instrucción
      Dado que la persona está en la fase «<fase>» con O1, O2 y O3 dominados
      Y que O4 tiene problemas
      Cuando la persona practica O4 por primera vez y termina el problema de exploración
      Entonces tras la instrucción de O4 la aplicación le pide que explique con sus palabras el porqué de la instrucción

      Ejemplos:
        | fase             |
        | intermedio       |
        | avanzado_experto |

    @AYUD-6.3 @extrapolacion
    Escenario: La autoexplicación se registra
      Dado que la persona está en la fase «intermedio» con O1, O2 y O3 dominados
      Y que O4 tiene problemas
      Cuando la persona practica O4 por primera vez y escribe la autoexplicación «Porque hace falta A y también B.»
      Entonces la autoexplicación queda registrada en autoexplicaciones.csv

    @AYUD-6.4 @evidencia-3 @evidencia-4 @extrapolacion
    Escenario: La autoexplicación no se corrige ni cuenta para el dominio, la ayuda ni la fase
      Dado que la persona está en la fase «intermedio» con O1, O2 y O3 dominados
      Y que O4 tiene problemas
      Cuando la persona practica O4 por primera vez y escribe la autoexplicación «No sé.»
      Entonces la aplicación no le dice si es correcta ni le muestra ningún feedback sobre ella
      Y respuestas.csv no recibe ninguna fila por ella
      Y O4 sigue con 0 pasos retirados
      Y la fase sigue siendo «intermedio»

    @AYUD-6.5 @extrapolacion
    Escenario: Solo la primera sesión del objetivo pide autoexplicación
      Dado que la persona está en la fase «intermedio» con O1, O2 y O3 dominados
      Y que O4 tiene problemas
      Y que la persona practicó O4 en una sesión anterior
      Cuando la persona practica O4
      Entonces la aplicación no le pide ninguna autoexplicación

    @AYUD-6.6 @evidencia-2.2 @evidencia-4 @extrapolacion
    Escenario: Con la combinación desactivada, estudiar el ejemplo E4 no pide autoexplicación
      Dado que la combinación de ejemplos resueltos y autoexplicación configurada está desactivada
      Y que la persona está en la fase «intermedio» con O1, O2 y O3 dominados
      Y que O4 tiene problemas
      Y que en su primera sesión de O4 la persona ya ha escrito la autoexplicación de la instrucción
      Cuando la persona estudia el ejemplo resuelto E4
      Entonces la aplicación no le pide que explique ningún paso

    @AYUD-6.7 @evidencia-3 @evidencia-4 @extrapolacion
    Esquema del escenario: La primera sesión de un objetivo nuevo sigue siempre el mismo orden
      Dado que la persona está en la fase «<fase>» con O1, O2 y O3 dominados
      Y que O4 tiene problemas
      Y que O4 no tiene ítems de tipo «hecho» con opciones
      Cuando la persona practica O4 por primera vez
      Entonces la sesión presenta, en este orden:
        | pieza                                                                |
        | un problema de exploración de O4                                     |
        | la instrucción de O4                                                 |
        | la petición de autoexplicación de la instrucción                     |
        | el ejemplo resuelto E4, alternado con problemas de O4                |

      Ejemplos:
        | fase             |
        | intermedio       |
        | avanzado_experto |

    @AYUD-6.8 @extrapolacion
    Esquema del escenario: Una autoexplicación en blanco no se acepta
      Dado que la persona está en la fase «intermedio» con O1, O2 y O3 dominados
      Y que O4 tiene problemas
      Cuando la persona practica O4 por primera vez y envía como autoexplicación <texto>
      Entonces la aplicación no la acepta y vuelve a pedirle que explique con sus palabras el porqué de la instrucción
      Y la sesión no pasa al ejemplo resuelto E4
      Y autoexplicaciones.csv no recibe ninguna fila

      Ejemplos:
        | texto              |
        | un texto vacío     |
        | solo tres espacios |

  @AYUD-7 @evidencia-3 @evidencia-2.2 @extrapolacion
  Regla: El diagrama de un objetivo o de un ejemplo resuelto se muestra junto a su texto
    La codificación dual tiene el nivel «Prometedor» y «no verificado aquí» (sección 3); la técnica es
    «diagramas integrados con el texto (no “por estilo”)». Por eso el diagrama se muestra a todas
    las personas y la aplicación nunca pregunta por un estilo de aprendizaje: los estilos de
    aprendizaje son un mito (sección 5). Que el diagrama sea el campo `diagrama` del contenido es
    extrapolación, y también no mostrar el de un ejemplo con pasos retirados (AYUD-7.3). Esto último
    es decisión del autor: según G3 de config/peticion-ia.md, el diagrama de un ejemplo «muestra lo
    mismo que» sus pasos, así que daría el paso retirado. Que no se vea mientras se responde (AYUD-7.4)
    es también decisión del autor: un diagrama visible haría que el intento no fuera sin ayuda (MAST).

    Antecedentes:
      Dado que la instrucción de O1 y su ejemplo resuelto E1 tienen cada uno su diagrama

    @AYUD-7.1 @evidencia-3 @extrapolacion
    Escenario: La instrucción se ve con su diagrama
      Dado que la persona está en la fase «novato»
      Y que la persona nunca ha practicado O1
      Cuando la persona practica O1
      Entonces la instrucción de O1 se muestra junto a su diagrama

    @AYUD-7.2 @evidencia-3 @extrapolacion
    Escenario: Un ejemplo resuelto se ve con su diagrama
      Dado que O1 tiene la ayuda completa
      Cuando la persona estudia el ejemplo resuelto E1
      Entonces el ejemplo resuelto E1 se muestra junto a su diagrama

    @AYUD-7.3 @extrapolacion
    Escenario: Con un paso retirado no se muestra el diagrama del ejemplo
      Dado que O1 tiene 1 paso retirado
      Cuando la persona estudia el ejemplo resuelto E1
      Entonces el ejemplo resuelto E1 muestra los pasos P1 y P2
      Y no muestra el paso P3
      Y no muestra el diagrama de E1, que podría dar el paso retirado

    @AYUD-7.4 @extrapolacion
    Escenario: No se ve ningún diagrama mientras se responde un problema
      Dado que O1 tiene la ayuda completa
      Cuando la persona practica O1
      Entonces mientras responde un problema no ve ningún diagrama

    @AYUD-7.5 @evidencia-3 @evidencia-5 @evidencia-2.6 @extrapolacion
    Esquema del escenario: El diagrama se muestra igual en todas las fases y sin preguntar por el estilo de aprendizaje
      Dado que la persona está en la fase «<fase>»
      Y que O1 tiene la ayuda completa
      Cuando la persona estudia el ejemplo resuelto E1
      Entonces el ejemplo resuelto E1 se muestra junto a su diagrama
      Y la aplicación no le pregunta por su estilo de aprendizaje ni si prefiere imágenes o texto

      Ejemplos:
        | fase             |
        | novato           |
        | intermedio       |
        | avanzado_experto |

  @AYUD-8 @evidencia-2.2 @evidencia-3 @evidencia-4 @extrapolacion
  Regla: En la fase intermedia, un objetivo nuevo empieza con unas prepreguntas de opción múltiple
    Unas pocas preguntas breves de opción múltiple antes de la clase mejoraron, en un curso
    universitario real, el examen final, tanto en el material preguntado como en el relacionado no
    preguntado (Soderstrom y Bjork, 2023, Educational Psychology Review). Ese estudio no está en el
    informe, y tiene límites: un solo curso, mecanismos inferidos en parte por autoinforme y la
    petición de sus autores de investigar más. La cita viene del ticket y no se ha comprobado contra
    el artículo. Es extrapolación pasarlo de clases a objetivos de una aplicación y limitarlo a la
    fase intermedia. Ese límite es una cautela del autor, por analogía con el fracaso productivo,
    que el informe condiciona al conocimiento previo («no con novatos sin conocimientos
    activables», sección 3): el estudio se hizo con estudiantes nuevos en el tema, más cerca de la
    fase novato, así que el límite se aleja de donde está la evidencia. Es decisión del autor.

    Una prepregunta es un ítem normal del objetivo, de tipo «hecho», con opciones y no reservado (un
    reservado se presenta una sola vez para medir la transferencia, MAST-8): no hay un tipo de
    ítem nuevo, y lo que la IA redacta para el material ya sirve (config/peticion-ia.md, I2 e I3). Son
    los primeros, en el orden del objetivo, hasta `numero_prepreguntas`. Si el objetivo tiene menos,
    se piden los que haya, y si no tiene ninguno, no hay prepreguntas. Los problemas quedan para el
    intento de exploración (AYUD-5), y así ningún ítem hace las dos cosas. Es decisión del autor.

    Se suman al intento de exploración, y no lo sustituyen: la exploración, que sí está en el informe
    (sección 3), va primero y sin cambios, para que quien lo intenta no haya visto antes el feedback
    de ningún hecho del objetivo; las prepreguntas van tras su feedback y justo antes de la
    instrucción (AYUD-8.7). Un objetivo sin problemas empieza por sus prepreguntas, sin exploración.
    Intercalarlas es extrapolación: el informe pide la instrucción «a continuación» de la
    exploración (secciones 2.3 y 3), y aquí la instrucción sigue llegando siempre, pero tras las
    prepreguntas. El inicio de cada objetivo se alarga con ellas, y por eso `numero_prepreguntas` es
    pequeño. Es decisión del autor.

    Una prepregunta se responde, pide la confianza y da feedback como cualquier ítem (CALI-1, RECU-2),
    y no se puede saltar (CALI-13.2). La confianza se pide porque el feedback llega después de
    declararla (CALI-1.1); se registra, pero no entra en la calibración (CALI-2.5, CALI-4.9). Lo que
    se intenta antes de la instrucción no mide lo aprendido, aunque se fallen casi todas. Por eso una prepregunta no cuenta como intento del ítem (MAST-1.6 y MAST-1.7), ni para
    el dominio ni para el paso de fase, ni para el ajuste semanal (AYUD-8.12), ni en el paso 1 del
    bucle (BUCL-2.4). Es decisión del autor.

    Antecedentes:
      Dado que O4 se aprobó en la revisión del material, sin dominarlo ni practicarlo, con la instrucción «La regla R4 se aplica cuando el caso cumple A y B.» y el ejemplo resuelto E4
      Y que el número de prepreguntas configurado es 3

    @AYUD-8.1 @evidencia-3 @evidencia-4 @extrapolacion
    Escenario: En la fase novato no hay prepreguntas
      Dado que la persona está en la fase «novato»
      Y que O1 tiene los ítems H1, H2 y H3 de tipo «hecho» con opciones
      Y que la persona nunca ha practicado O1
      Cuando la persona practica O1
      Entonces la sesión no presenta ninguna prepregunta
      Y lo primero que ve es la instrucción de O1

    @AYUD-8.2 @extrapolacion
    Escenario: En la fase avanzada no hay prepreguntas
      Dado que la persona está en la fase «avanzado_experto» con O1, O2 y O3 dominados
      Y que O4 tiene los ítems H1, H2 y H3 de tipo «hecho» con opciones
      Cuando la persona practica O4
      Entonces la sesión no presenta ninguna prepregunta

    @AYUD-8.3 @extrapolacion
    Escenario: Las prepreguntas son los primeros hechos con opciones, hasta el número configurado
      Dado que la persona está en la fase «intermedio» con O1, O2 y O3 dominados
      Y que O4 tiene los ítems H1, H2, H3, H4 y H5 de tipo «hecho» con opciones, en ese orden
      Cuando la persona practica O4
      Entonces la sesión presenta como prepreguntas H1, H2 y H3, en ese orden
      Y no presenta H4 ni H5 como prepreguntas

    @AYUD-8.4 @extrapolacion
    Escenario: Con menos hechos con opciones que el número configurado, se piden los que haya
      Dado que la persona está en la fase «intermedio» con O1, O2 y O3 dominados
      Y que O4 tiene los ítems H1 y H2 de tipo «hecho» con opciones
      Cuando la persona practica O4
      Entonces la sesión presenta como prepreguntas H1 y H2

    @AYUD-8.5 @extrapolacion
    Escenario: Solo los hechos con opciones y no reservados son prepreguntas
      Dado que la persona está en la fase «intermedio» con O1, O2 y O3 dominados
      Y que O4 tiene, en este orden, el ítem H1 de tipo «hecho» sin opciones, el ítem R1 de tipo «hecho» con opciones y reservado, el ítem Q1 de tipo «problema» con opciones y los ítems H2 y H3 de tipo «hecho» con opciones
      Cuando la persona practica O4
      Entonces la sesión presenta como prepreguntas H2 y H3
      Y no presenta H1, R1 ni Q1 como prepreguntas

    @AYUD-8.6 @extrapolacion
    Escenario: Sin hechos con opciones no hay prepreguntas
      Dado que la persona está en la fase «intermedio» con O1, O2 y O3 dominados
      Y que O4 tiene problemas
      Y que O4 no tiene ítems de tipo «hecho» con opciones
      Cuando la persona practica O4
      Entonces la sesión no presenta ninguna prepregunta
      Y empieza con el problema de exploración de O4

    @AYUD-8.7 @evidencia-3 @evidencia-4 @extrapolacion
    Escenario: Las prepreguntas van tras el intento de exploración y antes de la instrucción
      Dado que la persona está en la fase «intermedio» con O1, O2 y O3 dominados
      Y que O4 tiene problemas
      Y que O4 tiene los ítems H1, H2 y H3 de tipo «hecho» con opciones
      Cuando la persona practica O4 por primera vez
      Entonces la sesión presenta, en este orden:
        | pieza                                                                |
        | un problema de exploración de O4                                     |
        | las prepreguntas H1, H2 y H3                                         |
        | la instrucción de O4                                                 |
        | la petición de autoexplicación de la instrucción                     |
        | el ejemplo resuelto E4, alternado con problemas de O4                |
      Y no presenta ninguna prepregunta antes del problema de exploración

    @AYUD-8.8 @extrapolacion
    Escenario: Un objetivo sin problemas empieza por sus prepreguntas, sin exploración
      Dado que la persona está en la fase «intermedio» con O1, O2 y O3 dominados
      Y que O4 solo tiene los ítems H1, H2 y H3 de tipo «hecho» con opciones
      Cuando la persona practica O4
      Entonces la sesión no presenta ningún problema de exploración
      Y lo primero que ve es la prepregunta H1
      Y tras las prepreguntas H1, H2 y H3, lo siguiente que presenta la sesión es la instrucción «La regla R4 se aplica cuando el caso cumple A y B.»

    @AYUD-8.9 @extrapolacion
    Esquema del escenario: Después de las prepreguntas, se acierten o se fallen, viene la instrucción
      Dado que la persona está en la fase «intermedio» con O1, O2 y O3 dominados
      Y que O4 solo tiene los ítems H1, H2 y H3 de tipo «hecho» con opciones
      Cuando la persona practica O4 y <resultado> las tres prepreguntas
      Entonces tras el feedback de la última prepregunta, lo siguiente que presenta la sesión es la instrucción «La regla R4 se aplica cuando el caso cumple A y B.»
      Y la sesión no repite ninguna prepregunta ni le pide que vuelva a intentarla

      Ejemplos:
        | resultado |
        | acierta   |
        | falla     |

    @AYUD-8.10 @extrapolacion
    Escenario: Solo la primera sesión del objetivo empieza con prepreguntas
      Dado que la persona está en la fase «intermedio» con O1, O2 y O3 dominados
      Y que O4 tiene los ítems H1, H2 y H3 de tipo «hecho» con opciones
      Y que la persona practicó O4 en una sesión anterior
      Cuando la persona practica O4
      Entonces la sesión no presenta ninguna prepregunta

    @AYUD-8.11 @extrapolacion
    Escenario: Una prepregunta se registra con su propio contexto
      Dado que la persona está en la fase «intermedio» con O1, O2 y O3 dominados
      Y que O4 tiene los ítems H1, H2 y H3 de tipo «hecho» con opciones
      Cuando la persona practica O4 y responde la prepregunta H1
      Entonces su fila en respuestas.csv tiene el contexto «prepregunta»

    @AYUD-8.12 @evidencia-4 @extrapolacion
    Escenario: Las prepreguntas no cuentan para el ajuste semanal de la ayuda
      Dado que el umbral de retirada de ayuda configurado es del 85 %
      Y que la persona está en la fase «intermedio» con O1, O2 y O3 dominados
      Y que O4 tiene los ítems H1, H2 y H3 de tipo «hecho» con opciones
      Y que O4 tiene la ayuda completa
      Y que en la última semana las únicas respuestas de la persona a ítems de O4 fueron aciertos en sus prepreguntas
      Cuando se ejecuta el bucle semanal
      Entonces O4 sigue con 0 pasos retirados
      Y no se registra ningún cambio en cambios_ayuda.csv

    @AYUD-8.13 @evidencia-2.2 @evidencia-3 @evidencia-4 @extrapolacion
    Escenario: Una prepregunta pide la confianza y da feedback como cualquier ítem
      Dado que la persona está en la fase «intermedio» con O1, O2 y O3 dominados
      Y que O4 tiene los ítems H1, H2 y H3 de tipo «hecho» con opciones
      Cuando la persona practica O4 y responde la prepregunta H1
      Entonces no ve si ha acertado ni el feedback de H1 hasta declarar su confianza
      Y después de declararla ve si su respuesta es correcta, la respuesta correcta y el feedback de H1

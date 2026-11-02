# language: es
@RECU @evidencia-2.2 @evidencia-3
Característica: Práctica de recuperación con feedback correctivo
  Recordar sin mirar es la técnica más sólida del informe (sección 2.2). El feedback correctivo eleva
  su efecto (de g = 0,374 a g = 0,537) y también ayuda que la práctica tenga el formato de la prueba
  final. El feedback informa sobre la tarea: el rico en información sobre la tarea funciona mucho
  mejor que los elogios o las notas (Wisniewski et al., 2020, sección 2.2; tabla de la sección 3), y
  el que desplaza la atención hacia la persona puede empeorar el rendimiento (Kluger y DeNisi, 1996,
  marcado con (†) en la bibliografía).

  Antecedentes:
    Dado el dominio de prueba «ficticio» con los objetivos O1, O2 y O3, en ese orden
    Y que O1 tiene el ítem I1 con las opciones «a», «b» y «c», la correcta «b» y el feedback «Porque b cumple la regla R1.»
    Y que O1 tiene el ítem I2 con las respuestas aceptadas «regla de tres» y «proporción»

  @RECU-1 @evidencia-2.2 @evidencia-3
  Regla: Se recuerda antes de ver la respuesta
    Hay una sola excepción: la mitad releída del experimento de releer frente a recuperar (CALI-13).

    @RECU-1.1 @evidencia-2.2 @evidencia-3
    Escenario: El ítem se presenta sin la respuesta
      Cuando se le presenta I1 a la persona
      Entonces ve el enunciado y las opciones «a», «b» y «c»
      Pero no ve cuál es la correcta ni el feedback hasta haber respondido

    @RECU-1.2 @evidencia-2.5
    Escenario: No se puede dar un ítem por sabido sin responderlo
      Cuando se le presenta I1 a la persona
      Entonces no hay ninguna opción para ver la respuesta sin responder ni para marcarlo como sabido

  @RECU-2 @evidencia-2.2 @evidencia-3
  Regla: Después de cada respuesta hay feedback correctivo sobre la tarea

    @RECU-2.1 @evidencia-2.2 @evidencia-3
    Esquema del escenario: El feedback aparece tanto si acierta como si falla
      Cuando la persona responde «<respuesta>» a I1 y declara su confianza
      Entonces ve que su respuesta es <corrección>
      Y ve que la respuesta correcta es «b»
      Y ve el feedback «Porque b cumple la regla R1.»

      Ejemplos:
        | respuesta | corrección |
        | b         | correcta   |
        | a         | incorrecta |

    @RECU-2.2 @evidencia-2.2 @evidencia-3 @extrapolacion
    Escenario: El feedback no habla de la persona
      Cuando la persona responde a I1 y declara su confianza
      Entonces el feedback solo contiene si la respuesta es correcta, la respuesta correcta y la explicación del contenido
      Y en un ítem numérico incorrecto, además, qué parte de la respuesta falla, cómo se escribe un número si no se entendió y el margen que se acepta (RECU-5.7, RECU-5.9 a RECU-5.13)
      Y no contiene elogios, reproches, notas ni mensajes sobre la persona

  @RECU-3 @evidencia-2.5 @extrapolacion
  Regla: La corrección es automática

    @RECU-3.1 @extrapolacion
    Esquema del escenario: Una respuesta escrita se compara sin distinguir mayúsculas ni espacios sobrantes
      Cuando la persona escribe «<respuesta>» como respuesta a I2
      Entonces la respuesta es <corrección>

      Ejemplos:
        | respuesta       | corrección |
        | regla de tres   | correcta   |
        | Regla  de  Tres | correcta   |
        | PROPORCIÓN      | correcta   |
        | regla de cuatro | incorrecta |

    @RECU-3.2 @extrapolacion
    Escenario: Los espacios al principio y al final de una respuesta escrita no cuentan
      Cuando la persona escribe «proporción» con dos espacios delante y uno detrás como respuesta a I2
      Entonces la respuesta es correcta

    @RECU-3.3 @evidencia-2.5
    Escenario: La persona nunca corrige sus propias respuestas
      Cuando la persona responde a I2
      Entonces la aplicación no le pregunta si cree que ha acertado

  @RECU-4 @evidencia-2.2 @extrapolacion
  Regla: La práctica tiene el formato de las pruebas de la aplicación
    El informe habla del formato de la evaluación final. Tomar como tal las pruebas de retención de
    la aplicación es decisión del autor: el formato de las evaluaciones externas no lo controla.

    @RECU-4.1 @evidencia-2.2 @extrapolacion
    Escenario: Un ítem tiene el mismo formato en la práctica, en los repasos y en las pruebas de retención
      Cuando a la persona se le presenta I1 en una sesión de práctica, en un repaso y en una prueba de retención
      Entonces las tres veces lo responde eligiendo entre las opciones «a», «b» y «c»

    @RECU-4.2 @evidencia-2.2 @extrapolacion
    Escenario: Un ítem numérico tiene el mismo formato en la práctica, en los repasos y en las pruebas de retención
      Dado que O1 tiene el ítem I3 con la respuesta numérica 9,81 con la unidad «m/s²»
      Cuando a la persona se le presenta I3 en una sesión de práctica, en un repaso y en una prueba de retención
      Entonces las tres veces lo responde escribiendo un número y su unidad

  @RECU-5 @extrapolacion
  Regla: Un ítem numérico se corrige con tolerancia y unidades
    El informe no trata las respuestas numéricas: todo lo de esta regla es decisión del autor. En el
    contenido, la respuesta de un ítem numérico lleva `valor` (un número), `unidades` (opcional: todas
    las formas de escribir la unidad, con la que se enseña en primer lugar) y `tolerancia` (opcional:
    un margen relativo, 0,05 es el 5 %). Sin `tolerancia`, vale la de «tolerancia_numerica_relativa» en
    config/parametros.json. Con valor 0, el margen relativo es 0: solo vale 0.

    El valor se compara con el margen, no como texto, así que «9,8» y «9,81» pueden valer los dos. La
    aplicación no cuenta cifras significativas. La unidad se compara como texto, sin distinguir espacios
    pero sí mayúsculas («Pa» y «pa» no son lo mismo), y vale una de las que da el contenido: la
    aplicación no convierte unidades, así que «100000 Pa» no vale por «kPa» si el contenido no lo da.
    Una respuesta simbólica (una expresión) no es numérica y queda fuera.

    Antecedentes:
      Dado que O1 tiene el ítem I3 con la respuesta numérica 9,81 con las unidades «m/s²», «m/s^2» y «m/s2»
      Y que O1 tiene el ítem I4 con la respuesta numérica 6,674e-11 con las unidades «N·m²/kg²» y «N m2/kg2»
      Y que O1 tiene el ítem I5 con la respuesta numérica 12 sin unidades
      Y que O1 tiene el ítem I6 con la respuesta numérica 100 con la unidad «kPa» y la tolerancia del 5 %

    @RECU-5.1 @extrapolacion
    Esquema del escenario: El valor se acepta dentro del margen relativo del parámetro
      Cuando la persona escribe «<respuesta>» como respuesta a I3
      Entonces la respuesta es <corrección>

      Ejemplos:
        | respuesta | corrección |
        | 9,81 m/s² | correcta   |
        | 9,8 m/s²  | correcta   |
        | 9,9 m/s²  | correcta   |
        | 9,72 m/s² | correcta   |
        | 9,91 m/s² | incorrecta |
        | 9,71 m/s² | incorrecta |
        | 10 m/s²   | incorrecta |

    @RECU-5.2 @extrapolacion
    Esquema del escenario: Un ítem con tolerancia propia usa la suya y no la del parámetro
      Cuando la persona escribe «<respuesta>» como respuesta a I6
      Entonces la respuesta es <corrección>

      Ejemplos:
        | respuesta | corrección |
        | 100 kPa   | correcta   |
        | 95 kPa    | correcta   |
        | 105 kPa   | correcta   |
        | 94,9 kPa  | incorrecta |
        | 105,1 kPa | incorrecta |

    @RECU-5.3 @extrapolacion
    Escenario: Cambiar el parámetro cambia el margen de los ítems sin tolerancia propia
      Dado que se cambia en config/parametros.json «tolerancia_numerica_relativa» a 0,05
      Cuando la persona escribe «10,2 m/s²» como respuesta a I3
      Entonces la respuesta es correcta

    @RECU-5.4 @extrapolacion
    Esquema del escenario: El punto y la coma valen como separador decimal
      Cuando la persona escribe «<respuesta>» como respuesta a I3
      Entonces la respuesta es <corrección>

      Ejemplos:
        | respuesta  | corrección |
        | 9,81 m/s²  | correcta   |
        | 9.81 m/s²  | correcta   |
        | 9,810 m/s² | correcta   |
        | 98,1 m/s²  | incorrecta |

    @RECU-5.5 @extrapolacion
    Esquema del escenario: La notación científica se lee con «e» o con una potencia de diez
      Cuando la persona escribe «<respuesta>» como respuesta a I4
      Entonces la respuesta es <corrección>

      Ejemplos:
        | respuesta                 | corrección |
        | 6,674e-11 N·m²/kg²        | correcta   |
        | 6,67E-11 N·m²/kg²         | correcta   |
        | 6,674·10^-11 N·m²/kg²     | correcta   |
        | 6,674×10⁻¹¹ N·m²/kg²      | correcta   |
        | 0,00000000006674 N·m²/kg² | correcta   |
        | 6,674e-10 N·m²/kg²        | incorrecta |
        | 6,674·10^11 N·m²/kg²      | incorrecta |

    @RECU-5.6 @extrapolacion
    Esquema del escenario: La unidad vale si es una de las del contenido, sin distinguir espacios
      Cuando la persona escribe «<respuesta>» como respuesta a I3
      Entonces la respuesta es <corrección>

      Ejemplos:
        | respuesta    | corrección |
        | 9,81 m/s²    | correcta   |
        | 9,81 m/s^2   | correcta   |
        | 9,81 m/s2    | correcta   |
        | 9,81m/s²     | correcta   |
        | 9,81 m / s²  | correcta   |
        | 9,81 M/S²    | incorrecta |
        | 9,81 m/s     | incorrecta |
        | 9,81 km/s²   | incorrecta |

    @RECU-5.7 @extrapolacion
    Escenario: Una unidad equivalente que el contenido no da no se convierte
      Cuando la persona escribe «100000 Pa» como respuesta a I6
      Entonces la respuesta es incorrecta
      Y ve que el valor y la unidad no son los esperados

    @RECU-5.8 @extrapolacion
    Esquema del escenario: Un ítem sin unidades se responde solo con un número
      Cuando la persona escribe «<respuesta>» como respuesta a I5
      Entonces la respuesta es <corrección>

      Ejemplos:
        | respuesta | corrección |
        | 12        | correcta   |
        | 12,0      | correcta   |
        | 12 m      | incorrecta |
        | 13        | incorrecta |

    @RECU-5.9 @extrapolacion
    Escenario: Una respuesta sin unidad es incorrecta aunque el valor valga
      Cuando la persona escribe «9,81» como respuesta a I3
      Entonces la respuesta es incorrecta
      Y ve que falta la unidad

    @RECU-5.10 @extrapolacion
    Esquema del escenario: Lo que no se lee como un número es incorrecto y el feedback dice cómo escribirlo
      Cuando la persona escribe «<respuesta>» como respuesta a I3
      Entonces la respuesta es incorrecta
      Y ve que no se entiende como un número
      Y ve que se escribe con dígitos, con coma o punto como separador decimal y sin separador de miles

      Ejemplos:
        | respuesta    |
        | muy rápido   |
        | m/s²         |
        | 1.000,5 m/s² |
        | 9,8,1 m/s²   |

    @RECU-5.11 @extrapolacion
    Esquema del escenario: El feedback dice qué parte de la respuesta numérica falla
      Cuando la persona escribe «<respuesta>» como respuesta a I3
      Entonces ve que <fallo>
      Y ve que la respuesta correcta es «9,81 m/s²»
      Y ve el feedback del ítem

      Ejemplos:
        | respuesta  | fallo                                        |
        | 12 m/s²    | el valor no es el esperado                   |
        | 9,81 m/s   | la unidad no es la esperada                  |
        | 12 m/s     | el valor y la unidad no son los esperados    |
        | 9,81       | falta la unidad                              |
        | 12         | el valor no es el esperado y falta la unidad |

    @RECU-5.12 @extrapolacion
    Escenario: Si falla el valor, el feedback dice el margen que se acepta
      Cuando la persona escribe «9,5 m/s²» como respuesta a I3
      Entonces ve que se acepta un margen del 1 % sobre «9,81 m/s²»

    @RECU-5.13 @extrapolacion
    Escenario: Si un ítem sin unidades se responde con una unidad, el feedback dice que sobra
      Cuando la persona escribe «12 m» como respuesta a I5
      Entonces ve que sobra la unidad

  @RECU-6 @evidencia-2.2 @extrapolacion
  Regla: Un ítem fallado vuelve en la misma sesión hasta acertarlo
    El informe no recoge el reaprendizaje sucesivo: la evidencia es Rawson, Dunlosky y Sciartelli
    (2013), que en un curso real vieron mejor nota en el examen con el reaprendizaje sucesivo, y más
    con tres sesiones espaciadas que con una (cita del ticket, sin comprobar contra el artículo).
    Que el ítem fallado vuelva dentro de la sesión hasta acertarlo es la forma que le da el autor.
    Las sesiones siguen espaciadas por el planificador (PLAN). Cuántos aciertos cierran un ítem y
    cuántos ítems pasan antes de que vuelva son decisiones del autor, sin evidencia propia. Que
    volver justo después del feedback mediría la memoria de trabajo y no la recuperación es
    razonamiento del autor: el informe no lo trata.

    Vuelven los ítems de las sesiones de práctica, de los repasos y de las sesiones intercaladas. No
    vuelven los del diagnóstico ni los de las pruebas de retención, porque miden y no enseñan, ni los
    reservados, que se presentan una sola vez (MAST-8), ni los intentos de exploración y las
    prepreguntas (AYUD-5, AYUD-8), ni los de los experimentos (CALI-12, CALI-13). Los reintentos son
    prácticas: no cuentan para el dominio (MAST-1.8), ni para la calibración (CALI-2.6), ni mueven el
    planificador (PLAN-1.5, PLAN-3.4).

    Antecedentes:
      Dado que O1 tiene también los ítems I3, I4, I5, I6 e I7 con las opciones «a», «b» y «c», la correcta «b»
      Y que los ítems entre un intento y su reintento configurados son 3
      Y que los aciertos que cierran un ítem en la sesión configurados son 1

    @RECU-6.1 @extrapolacion
    Escenario: Un ítem fallado vuelve después de tres ítems de otros
      Dado que la sesión de práctica de O1 presenta los ítems I1 a I7, en ese orden
      Cuando la persona falla I1 y responde I2, I3 e I4
      Entonces lo siguiente que se le presenta es I1 otra vez, antes de I5

    @RECU-6.2 @extrapolacion
    Escenario: Un ítem acertado en su primer intento de la sesión no vuelve
      Dado que la sesión de práctica de O1 presenta los ítems I1 a I7, en ese orden
      Cuando la persona acierta I1 y responde el resto de los ítems
      Entonces I1 no vuelve a presentarse en esa sesión

    @RECU-6.3 @extrapolacion
    Escenario: El reintento tiene el mismo feedback y no pide confianza
      Dado que la persona falló I1 en su primer intento de la sesión y respondió tres ítems de otros
      Cuando se le presenta I1 otra vez
      Entonces no ve cuál es la correcta ni el feedback hasta haber respondido
      Y no se le pide que declare su confianza
      Y al responder ve si su respuesta es correcta, que la respuesta correcta es «b» y el feedback «Porque b cumple la regla R1.»

    @RECU-6.4 @extrapolacion
    Esquema del escenario: El ítem deja de volver al llegar a los aciertos configurados
      Dado que los aciertos que cierran un ítem en la sesión configurados son <aciertos>
      Y que la persona falló I1 en su primer intento de la sesión
      Cuando acierta I1 en su primer reintento
      Entonces I1 <resultado>

      Ejemplos:
        | aciertos | resultado                                      |
        | 1        | no vuelve a presentarse en esa sesión          |
        | 2        | vuelve a presentarse una vez más en esa sesión |

    @RECU-6.10 @extrapolacion
    Escenario: Los aciertos que cierran un ítem no hace falta que sean seguidos
      Dado que los aciertos que cierran un ítem en la sesión configurados son 2
      Y que la persona falló I1 en su primer intento de la sesión
      Cuando acierta I1 en su primer reintento, falla en el segundo y acierta en el tercero
      Entonces I1 no vuelve a presentarse en esa sesión

    @RECU-6.5 @extrapolacion
    Escenario: Un reintento fallado vuelve otra vez
      Dado que la persona falló I1 en su primer intento de la sesión
      Cuando falla también su primer reintento y responde tres ítems de otros
      Entonces lo siguiente que se le presenta es I1 otra vez

    @RECU-6.6 @extrapolacion
    Escenario: Si la sesión no tiene tantos ítems de otros, el ítem vuelve cuando se acaban
      Dado que la sesión de práctica de O1 presenta solo los ítems I1, I3 e I4, en ese orden
      Cuando la persona falla I1 y responde I3 e I4
      Entonces lo siguiente que se le presenta es I1 otra vez
      Y la sesión no termina antes de ese reintento

    @RECU-6.7 @extrapolacion
    Escenario: Si la persona termina la sesión sin acertarlo, el ítem no se arrastra a la siguiente
      Dado que la persona falló I1 en su primer intento de la sesión
      Cuando termina la sesión antes de acertarlo en un reintento
      Entonces la aplicación la deja terminar sin pedirle que acierte I1 antes
      Y I1 no entra en la sesión siguiente por haber quedado sin acertar
      Y su siguiente repaso es el que decide el planificador con el resultado de su primer intento (PLAN-1.5, PLAN-3.4)

    @RECU-6.8 @extrapolacion
    Esquema del escenario: Solo vuelven los ítems de las sesiones que enseñan
      Cuando la persona falla I1 <dónde>
      Entonces I1 <vuelve>

      Ejemplos:
        | dónde                                                  | vuelve                                    |
        | en una sesión de práctica                              | vuelve a presentarse en esa sesión        |
        | en un repaso programado                                | vuelve a presentarse en ese repaso        |
        | no reservado en una sesión intercalada                 | vuelve a presentarse en esa sesión        |
        | en el diagnóstico                                      | no vuelve a presentarse en el diagnóstico |
        | en una prueba de retención                             | no vuelve a presentarse en la prueba      |
        | reservado en una sesión intercalada                    | no vuelve a presentarse en esa sesión     |
        | en un intento de exploración                           | no vuelve por haberlo fallado             |
        | en una prepregunta                                     | no vuelve por haberlo fallado             |
        | en el estudio de la mitad recuperada de un experimento | no vuelve a presentarse en el experimento |
        | en la prueba de un experimento                         | no vuelve a presentarse en el experimento |

    @RECU-6.9 @extrapolacion
    Escenario: Los ítems entre un intento y su reintento y los aciertos se leen de la configuración
      Dado que se cambia en config/parametros.json «items_entre_intento_y_reintento» a 1 y «aciertos_para_cerrar_item_en_sesion» a 2
      Y que la sesión de práctica de O1 presenta los ítems I1 a I7, en ese orden
      Cuando la persona falla I1, responde I2, acierta I1 en su primer reintento y responde I3
      Entonces I1 vuelve a presentarse una vez más antes de I4
      Y si lo acierta de nuevo, ya no vuelve a presentarse en esa sesión

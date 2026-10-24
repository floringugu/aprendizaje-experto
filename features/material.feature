# language: es
@MATE @extrapolacion
Característica: Material del dominio y borradores
  El informe no trata de dónde sale el contenido del dominio, así que casi todo lo de esta área es
  decisión del autor. La aplicación no inventa contenido: lo escribe la persona o lo redacta una IA
  a partir del material de la persona, citando de dónde sale cada pieza, y nada entra en la práctica
  sin que la persona lo apruebe. El informe tampoco revisó la IA generativa como tutor: «los datos de
  tutoría inteligente clásica no se pueden extrapolar automáticamente» (sección 6). Decisión del
  autor: la IA solo redacta borradores que la persona revisa, y nunca interviene en las sesiones.

  Los borradores van en contenido/borradores/<dominio>.json, con el formato del contenido. Cada pieza
  (objetivo, categoría, ejemplo resuelto, ítem o tarea) trae su fuente: el documento, el lugar (la
  página, la diapositiva o el apartado) y el fragmento citado tal cual. Las sesiones solo leen
  contenido/<dominio>.json. El contenido escrito a mano no lleva fuente.

  Lo que la IA tiene que cumplir en cada pieza está en config/peticion-ia.md. Casi nada de eso se
  puede comprobar sin leer la pieza, así que la persona aprueba las piezas una a una.

  Antecedentes:
    Dado el dominio de prueba «ficticio» con los objetivos O1, O2 y O3, en ese orden
    Y que el material de «ficticio» incluye «apuntes.pdf», cuya página 12 dice «La regla R1 también se aplica a los casos límite.»

  @MATE-1 @extrapolacion
  Regla: El material se añade en PDF, PPTX, DOCX o URL
    Las fuentes de NotebookLM entran igual, como ficheros o como URL. LibreOffice es un programa
    instalado en el PC, no una dependencia de la aplicación.

    @MATE-1.1 @extrapolacion
    Esquema del escenario: Se admiten los cuatro tipos de material
      Dado que LibreOffice está instalado en el PC
      Cuando la persona añade «<material>» al material de «ficticio»
      Entonces «<material>» aparece en la lista de material de «ficticio»

      Ejemplos:
        | material                   |
        | tema1.pdf                  |
        | clase2.pptx                |
        | resumen.docx               |
        | https://ejemplo.org/tema3  |

    @MATE-1.2 @extrapolacion
    Esquema del escenario: Un PPTX o un DOCX se convierte a PDF con LibreOffice
      Dado que LibreOffice está instalado en el PC
      Cuando la persona añade «<fichero>» al material de «ficticio»
      Entonces la aplicación guarda una versión en PDF de «<fichero>», convertida con LibreOffice

      Ejemplos:
        | fichero      |
        | clase2.pptx  |
        | resumen.docx |

    @MATE-1.3 @extrapolacion
    Esquema del escenario: Sin LibreOffice no se puede añadir un PPTX ni un DOCX
      Dado que LibreOffice no está instalado en el PC
      Cuando la persona añade «<fichero>» al material de «ficticio»
      Entonces la aplicación no lo añade e indica que para los PPTX y los DOCX hay que instalar LibreOffice en el PC

      Ejemplos:
        | fichero      |
        | clase2.pptx  |
        | resumen.docx |

    @MATE-1.4 @extrapolacion
    Esquema del escenario: Un fichero de otro tipo se rechaza
      Cuando la persona añade «<fichero>» al material de «ficticio»
      Entonces la aplicación no lo añade e indica que admite PDF, PPTX, DOCX y URL

      Ejemplos:
        | fichero    |
        | libro.epub |
        | tabla.xlsx |

    @MATE-1.5 @extrapolacion
    Esquema del escenario: Una URL se guarda como copia al añadirla
      Dado que la persona añadió «https://ejemplo.org/tema3» cuando la página decía «El paso P1 va antes que el paso P2.»
      Y que después la página <cambio>
      Y que contenido/borradores/ficticio.json tiene el ítem I7 de O1, que cita esa frase de «https://ejemplo.org/tema3»
      Cuando la persona abre la revisión del material de «ficticio»
      Entonces I7 no tiene la marca «Cita no encontrada»
      Y «Ver fuente» de I7 muestra la frase dentro de la copia que se guardó al añadir la página

      Ejemplos:
        | cambio               |
        | ya no dice esa frase |
        | ya no existe         |

  @MATE-2 @extrapolacion
  Regla: La IA redacta borradores en un fichero aparte
    La IA puede ser la API de Claude, la suscripción de Claude Code o un modelo local. Cuál se usa
    por defecto se decide al diseñar el mecanismo del área.

    La IA nunca marca un ítem para el diagnóstico. Con un solo documento no sabe cuál es el núcleo
    conceptual del dominio, y un ítem trivial marcado haría que un novato diera el objetivo por
    dominado y empezara sin ejemplos resueltos. Las opciones de un ítem tienen que ser distintas
    aunque se escriban con otros espacios o mayúsculas: la corrección no los distingue, así que
    elegir la repetida contaría como acierto.

    Un objetivo o un ejemplo resuelto puede traer un diagrama, que acompaña a su texto (codificación
    dual, sección 3: «Prometedor», sin metaanálisis verificado; el campo es extrapolación). Es un SVG
    escrito como texto y se enseña como imagen, así que no ejecuta nada; uno que no es SVG no entra.

    @MATE-2.1 @extrapolacion
    Esquema del escenario: Cada pieza redactada va al borrador con su fuente
      Cuando la IA configurada redacta a partir de «apuntes.pdf» un borrador con <pieza>, que cita la página 12
      Entonces contenido/borradores/ficticio.json tiene <pieza> con la fuente «apuntes.pdf», página 12, «La regla R1 también se aplica a los casos límite.»
      Y contenido/ficticio.json no cambia

      Ejemplos:
        | pieza                     |
        | un objetivo               |
        | un ejemplo resuelto de O1 |
        | un ítem de O1             |
        | una tarea con rúbrica     |
        | una categoría             |

    @MATE-2.2 @extrapolacion
    Escenario: Los ids del borrador no repiten los del contenido aprobado
      Dado que contenido/ficticio.json tiene el ítem I3 de O1
      Cuando la IA configurada entrega un borrador con un ítem de O1 cuyo id es I3
      Entonces ningún id de contenido/borradores/ficticio.json está también en contenido/ficticio.json
      Y el ítem I3 de contenido/ficticio.json no cambia

    @MATE-2.3 @extrapolacion
    Esquema del escenario: Una pieza que no cumple el formato del contenido no entra en el borrador
      Cuando la IA configurada entrega un borrador con un ítem de O1 completo y <pieza incompleta>
      Entonces contenido/borradores/ficticio.json tiene ese ítem de O1 y ninguna otra pieza
      Y la aplicación indica que ha apartado 1 pieza porque le falta <falta>

      Ejemplos:
        | pieza incompleta                                         | falta                    |
        | un ítem de O1 sin respuesta                              | la respuesta             |
        | un ítem de O1 sin feedback                               | el feedback              |
        | un ejemplo resuelto de O1 sin pasos                      | los pasos                |
        | una tarea sin rúbrica                                    | la rúbrica               |
        | una tarea con un nivel de la rúbrica sin descriptor      | el descriptor del nivel  |
        | un objetivo sin instrucción                              | la instrucción           |
        | una categoría sin descripción                            | la descripción           |

    @MATE-2.4 @extrapolacion
    Escenario: Sin una IA configurada no se redactan borradores
      Dado que no hay ninguna IA configurada
      Y que contenido/borradores/ficticio.json tiene el ítem I7 de O1, pendiente
      Cuando la persona pide un borrador a partir de «apuntes.pdf»
      Entonces la aplicación no redacta ningún borrador e indica que hay que configurar una IA en Ajustes
      Y la persona sigue pudiendo añadir material y revisar I7

    @MATE-2.5 @extrapolacion
    Escenario: Un ítem con dos opciones que solo cambian en los espacios o las mayúsculas no entra en el borrador
      Cuando la IA configurada entrega un borrador con un ítem de O1 completo y un ítem de O1 con las opciones «La regla R1» y «la regla  R1»
      Entonces contenido/borradores/ficticio.json tiene el ítem de O1 completo y ninguna otra pieza
      Y la aplicación indica que ha apartado 1 pieza porque tiene dos opciones iguales

    @MATE-2.6 @extrapolacion
    Escenario: Un ítem que la IA marca para el diagnóstico entra en el borrador sin marcar
      Cuando la IA configurada entrega un borrador con un ítem de O1 marcado para el diagnóstico
      Entonces contenido/borradores/ficticio.json tiene ese ítem de O1, sin marcar para el diagnóstico

    @MATE-2.7 @extrapolacion
    Esquema del escenario: Una pieza con un diagrama que no es SVG no entra en el borrador
      Cuando la IA configurada entrega un borrador con un ítem de O1 completo y <pieza> cuyo diagrama es «graph TD; A-->B»
      Entonces contenido/borradores/ficticio.json tiene ese ítem de O1 y ninguna otra pieza
      Y la aplicación indica que ha apartado 1 pieza porque su diagrama no es SVG

      Ejemplos:
        | pieza                     |
        | un objetivo               |
        | un ejemplo resuelto de O1 |

  @MATE-3 @evidencia-3 @extrapolacion
  Regla: Las marcas las pone la aplicación, no la IA
    La aplicación las calcula a partir del borrador y del material. Al comparar una cita con su
    documento, cada tramo seguido de espacios, tabuladores y saltos de línea cuenta como un solo
    espacio; nada más se normaliza.

    Las marcas solo comprueban lo que se ve sin leer la pieza: si trae fuente, si la cita está en su
    documento y cuántos pasos tiene un ejemplo resuelto. Si la pieza es buena lo juzga la persona.
    Un ejemplo resuelto se estudia paso a paso y sus pasos se retiran a medida que sube el
    rendimiento (sección 3); con un solo paso no hay retirada gradual, porque la ayuda desaparece de
    golpe. Que hagan falta al menos 2 es decisión del autor.

    @MATE-3.1 @extrapolacion
    Escenario: Una pieza sin fuente lleva la marca «No está en tu material»
      Dado que contenido/borradores/ficticio.json tiene el ítem I7 de O1, sin fuente
      Cuando la persona abre la revisión del material de «ficticio»
      Entonces I7 tiene la marca «No está en tu material»

    @MATE-3.2 @extrapolacion
    Esquema del escenario: Un fragmento que no aparece tal cual en su documento lleva la marca «Cita no encontrada»
      Dado que contenido/borradores/ficticio.json tiene el ítem I7 de O1, con la fuente «<documento>», página 12, «<fragmento>»
      Cuando la persona abre la revisión del material de «ficticio»
      Entonces I7 <marca>

      Ejemplos:
        | documento   | fragmento                                         | marca                               |
        | apuntes.pdf | La regla R1 también se aplica a los casos límite. | no tiene ninguna marca              |
        | apuntes.pdf | también se aplica a los casos límite              | no tiene ninguna marca              |
        | apuntes.pdf | La regla R2 también se aplica a los casos límite. | tiene la marca «Cita no encontrada» |
        | apuntes.pdf | La regla R1 tambien se aplica a los casos límite. | tiene la marca «Cita no encontrada» |
        | apuntes.pdf | la regla R1 también se aplica a los casos límite. | tiene la marca «Cita no encontrada» |
        | otros.pdf   | La regla R1 también se aplica a los casos límite. | tiene la marca «Cita no encontrada» |

    @MATE-3.3 @extrapolacion
    Esquema del escenario: Los saltos de línea y los espacios repetidos cuentan como un solo espacio
      Dado que en la página 12 de «apuntes.pdf» la frase «La regla R1 también se aplica a los casos límite.» está partida en dos líneas después de «aplica»
      Y que contenido/borradores/ficticio.json tiene el ítem I7 de O1, que cita de esa página «<fragmento>»
      Cuando la persona abre la revisión del material de «ficticio»
      Entonces I7 no tiene la marca «Cita no encontrada»

      Ejemplos:
        | fragmento                                             |
        | La regla R1 también se aplica a los casos límite.     |
        | La regla R1 también se aplica   a los casos límite.   |

    @MATE-3.4 @extrapolacion
    Escenario: Una palabra partida con guion a final de línea no se une
      Dado que en la página 12 de «apuntes.pdf» la palabra «también» está partida a final de línea en «tam-» y «bién»
      Y que contenido/borradores/ficticio.json tiene el ítem I7 de O1, que cita de esa página «La regla R1 también se aplica a los casos límite.»
      Cuando la persona abre la revisión del material de «ficticio»
      Entonces I7 tiene la marca «Cita no encontrada»

    @MATE-3.5 @evidencia-3 @extrapolacion
    Esquema del escenario: Un ejemplo resuelto de un solo paso lleva la marca «Un solo paso»
      Dado que contenido/borradores/ficticio.json tiene el ejemplo resuelto E9 de O1, con <pasos> y la fuente «apuntes.pdf», página 12, «La regla R1 también se aplica a los casos límite.»
      Cuando la persona abre la revisión del material de «ficticio»
      Entonces E9 <marca>

      Ejemplos:
        | pasos   | marca                         |
        | 1 paso  | tiene la marca «Un solo paso» |
        | 2 pasos | no tiene ninguna marca        |

  @MATE-4 @extrapolacion
  Regla: Cada pieza se revisa, por objetivo, y se aprueba, se corrige o se descarta
    En la Fase 3 se practica con tareas cada vez más difíciles (sección 4, que marca como
    extrapolación la secuencia de fases), y la aplicación las presenta en el orden del contenido.
    Por eso una tarea del borrador puede decir delante de qué tarea va («antes de»), y al aprobarla
    entra ahí; si no dice ninguna, va al final. Que lo diga la IA es decisión del autor.

    Antecedentes:
      Dado que contenido/borradores/ficticio.json tiene estos ítems pendientes de O1:
        | ítem | fuente                                                                         |
        | I7   | «apuntes.pdf», página 12, «La regla R1 también se aplica a los casos límite.»  |
        | I8   | sin fuente                                                                     |
        | I9   | «apuntes.pdf», página 12, «La regla R2 también se aplica a los casos límite.»  |
        | I10  | «apuntes.pdf», página 12, «también se aplica a los casos límite»               |

    @MATE-4.1 @extrapolacion
    Escenario: Las piezas se agrupan por objetivo
      Dado que contenido/borradores/ficticio.json tiene también el ítem I11 de O2, pendiente
      Cuando la persona abre la revisión del material de «ficticio»
      Entonces ve I7, I8, I9 e I10 bajo O1
      Y ve I11 bajo O2

    @MATE-4.2 @extrapolacion
    Esquema del escenario: Los filtros muestran solo las piezas que corresponden
      Cuando la persona elige el filtro «<filtro>» en la revisión del material de «ficticio»
      Entonces ve solo <piezas>

      Ejemplos:
        | filtro                 | piezas           |
        | Pendientes             | I7, I8, I9 e I10 |
        | No está en tu material | I8               |
        | Cita no encontrada     | I9               |

    @MATE-4.3 @extrapolacion
    Escenario: «Ver fuente» enseña el fragmento en su contexto
      Cuando la persona abre «Ver fuente» de I7
      Entonces se abre una hoja con el fragmento «La regla R1 también se aplica a los casos límite.» dentro del texto de la página 12 de «apuntes.pdf»

    @MATE-4.4 @extrapolacion
    Escenario: Al aprobar, la pieza pasa del borrador al contenido aprobado con su fuente
      Cuando la persona aprueba I7
      Entonces I7 ya no está en contenido/borradores/ficticio.json
      Y contenido/ficticio.json tiene I7 con la fuente «apuntes.pdf», página 12, «La regla R1 también se aplica a los casos límite.»

    @MATE-4.5 @extrapolacion
    Escenario: Al descartar, la pieza sale del borrador
      Cuando la persona descarta I8
      Entonces I8 ya no está en contenido/borradores/ficticio.json
      Y contenido/ficticio.json no cambia

    @MATE-4.6 @extrapolacion
    Escenario: Una pieza corregida sigue pendiente en el borrador
      Cuando la persona corrige el enunciado de I7 y guarda la corrección
      Entonces I7 sigue pendiente en contenido/borradores/ficticio.json, con el enunciado corregido
      Y contenido/ficticio.json no cambia

    @MATE-4.7 @extrapolacion
    Escenario: Al corregir una pieza, sus marcas se vuelven a calcular
      Cuando la persona corrige el fragmento de I9 a «La regla R1 también se aplica a los casos límite.» y guarda la corrección
      Entonces I9 ya no tiene la marca «Cita no encontrada»
      Y I9 sigue pendiente en contenido/borradores/ficticio.json

    @MATE-4.8 @extrapolacion
    Escenario: Una corrección que deja la pieza sin el formato del contenido no se guarda
      Cuando la persona borra el feedback de I7 y guarda la corrección
      Entonces la aplicación no guarda la corrección e indica que falta el feedback
      Y I7 sigue en contenido/borradores/ficticio.json sin cambios

    @MATE-4.9 @extrapolacion
    Esquema del escenario: La última acción se puede deshacer
      Dado que la persona <acción> I7
      Cuando pulsa «Deshacer»
      Entonces I7 está pendiente en contenido/borradores/ficticio.json tal como estaba antes
      Y contenido/ficticio.json no tiene I7

      Ejemplos:
        | acción                         |
        | ha aprobado                    |
        | ha descartado                  |
        | ha corregido el enunciado de   |

    @MATE-4.10 @extrapolacion
    Escenario: Deshacer solo deshace la última acción
      Dado que la persona ha descartado I8 y después ha aprobado I7
      Cuando pulsa «Deshacer»
      Entonces I7 está pendiente en contenido/borradores/ficticio.json
      Y I8 sigue fuera de contenido/borradores/ficticio.json

    @MATE-4.11 @evidencia-4 @extrapolacion
    Esquema del escenario: Una tarea aprobada entra delante de la que dice su «antes de», o al final si no dice ninguna
      Dado que contenido/ficticio.json tiene las tareas T1 y T2, en ese orden
      Y que contenido/borradores/ficticio.json tiene la tarea T3, pendiente, <antes de>
      Cuando la persona aprueba T3
      Entonces contenido/ficticio.json tiene las tareas <orden>, en ese orden

      Ejemplos:
        | antes de           | orden       |
        | que va antes de T1 | T3, T1 y T2 |
        | que va antes de T2 | T1, T3 y T2 |
        | sin «antes de»     | T1, T2 y T3 |

  @MATE-5 @extrapolacion
  Regla: Cada pieza se aprueba una a una, también las que no tienen marca
    Que una pieza no tenga marca solo dice que trae fuente y que su cita está en el documento, no
    que la pieza sea buena: si el feedback informa sobre la tarea, si un problema da pista del tipo
    o si una tarea es representativa lo juzga la persona al leerla. Por eso no se aprueba en bloque.

    Antecedentes:
      Dado que contenido/borradores/ficticio.json tiene estos ítems pendientes de O1:
        | ítem | fuente                                                                         |
        | I7   | «apuntes.pdf», página 12, «La regla R1 también se aplica a los casos límite.»  |
        | I8   | sin fuente                                                                     |
        | I9   | «apuntes.pdf», página 12, «La regla R2 también se aplica a los casos límite.»  |
        | I10  | «apuntes.pdf», página 12, «también se aplica a los casos límite»               |

    @MATE-5.3 @extrapolacion
    Esquema del escenario: Una pieza marcada se puede aprobar sola
      Cuando la persona aprueba <ítem>
      Entonces contenido/ficticio.json tiene <ítem> <fuente>
      Y <ítem> ya no está en contenido/borradores/ficticio.json

      Ejemplos:
        | ítem | fuente                                                                               |
        | I8   | sin fuente                                                                           |
        | I9   | con la fuente «apuntes.pdf», página 12, «La regla R2 también se aplica a los casos límite.» |

    @MATE-5.5 @extrapolacion
    Escenario: La revisión no ofrece aprobar en bloque, aunque haya piezas sin marca
      Cuando la persona abre la revisión del material de «ficticio»
      Entonces la revisión no ofrece aprobar ninguna pieza en bloque

  @MATE-6 @extrapolacion
  Regla: Un borrador nunca aparece en una sesión
    Las sesiones solo leen contenido/<dominio>.json. Lo que redacta la IA no llega a la persona sin
    pasar por su aprobación. Es decisión del autor: el informe no revisó la IA generativa como tutor
    (sección 6) y no trata de dónde sale el contenido.

    Antecedentes:
      Dado que contenido/borradores/ficticio.json tiene, sin aprobar, el objetivo O4, el ejemplo resuelto E9 de O1, la tarea T9 y el ítem I9 de O1
      Y que I9 es de tipo «problema», está marcado para el diagnóstico y es de una categoría intercalable

    @MATE-6.1 @extrapolacion
    Esquema del escenario: Un ítem del borrador no se presenta en ninguna sesión
      Cuando la persona hace <sesión>
      Entonces no se le presenta I9

      Ejemplos:
        | sesión                              |
        | el diagnóstico de «ficticio»        |
        | una sesión de práctica de O1        |
        | los repasos del día                 |
        | una prueba de retención de O1       |
        | una sesión intercalada              |

    @MATE-6.2 @extrapolacion
    Escenario: Un ejemplo resuelto del borrador no se muestra
      Cuando la persona estudia los ejemplos resueltos de O1
      Entonces no se le muestra E9

    @MATE-6.3 @extrapolacion
    Escenario: Una tarea del borrador no se presenta como tarea de práctica
      Dado que la persona está en la fase «avanzado_experto»
      Cuando pide tareas de práctica hasta que no quedan más
      Entonces ninguna de ellas es T9

    @MATE-6.4 @extrapolacion
    Escenario: Un objetivo del borrador no cuenta para la ruta ni para la fase
      Dado que la persona está en la fase «novato» con O1 y O2 dominados
      Cuando O3 queda dominado
      Entonces la fase pasa de «novato» a «intermedio»
      Y O4 no figura entre los objetivos de la ruta

    @MATE-6.5 @extrapolacion
    Escenario: Una vez aprobado, el ítem entra en la práctica
      Cuando la persona aprueba I9
      Entonces I9 está en la cola de práctica de O1

  @MATE-7 @evidencia-2.2 @evidencia-3 @extrapolacion
  Regla: Lo aprobado conserva su fuente, y la fuente no adelanta la respuesta
    El fragmento puede contener la respuesta, y la práctica de recuperación consiste en recordar sin
    mirar (secciones 2.2 y 3). Que «Ver fuente» aparezca junto al feedback, después de responder, es
    decisión del autor.

    Antecedentes:
      Dado que contenido/ficticio.json tiene el ítem I7 de O1, aprobado con la fuente «apuntes.pdf», página 12, «La regla R1 también se aplica a los casos límite.»

    @MATE-7.1 @evidencia-2.2 @evidencia-3
    Escenario: Antes de responder no hay «Ver fuente»
      Cuando se le presenta I7 a la persona en una sesión de práctica
      Entonces no hay «Ver fuente» mientras no haya respondido

    @MATE-7.2 @extrapolacion
    Escenario: Después de responder, «Ver fuente» aparece junto al feedback
      Cuando se le presenta I7 a la persona en una sesión de práctica y responde
      Entonces ve el feedback de I7
      Y «Ver fuente» abre la hoja con el fragmento dentro del texto de la página 12 de «apuntes.pdf»

    @MATE-7.3 @extrapolacion
    Escenario: Un ítem escrito a mano, sin fuente, se practica sin «Ver fuente»
      Dado que contenido/ficticio.json tiene el ítem I1 de O1, escrito a mano y sin fuente
      Cuando se le presenta I1 a la persona en una sesión de práctica y responde
      Entonces ve el feedback de I1
      Pero no hay «Ver fuente»

  @MATE-8 @extrapolacion
  Regla: El inicio de sesión de Claude Code se lanza desde Ajustes y no deja ver credenciales
    El botón lanza el inicio de sesión en el PC y muestra en el móvil lo que pida: el enlace y, si
    hace falta, la casilla para el código. La aplicación solo dice si hay una sesión iniciada.

    @MATE-8.1 @extrapolacion
    Esquema del escenario: El móvil muestra lo que pide el inicio de sesión
      Dado que no hay ninguna sesión de Claude Code iniciada
      Y que el inicio de sesión del PC pide <lo que pide>
      Cuando la persona pulsa «Iniciar sesión en Claude Code» en Ajustes, desde el móvil
      Entonces el móvil muestra <lo que muestra>

      Ejemplos:
        | lo que pide                                                     | lo que muestra                                                  |
        | abrir el enlace «https://ejemplo.org/acceso»                    | el enlace «https://ejemplo.org/acceso»                          |
        | abrir el enlace «https://ejemplo.org/acceso» y escribir un código | el enlace «https://ejemplo.org/acceso» y una casilla para el código |

    @MATE-8.2 @extrapolacion
    Escenario: El código que se escribe en el móvil llega al inicio de sesión del PC
      Dado que el inicio de sesión del PC ha pedido un código
      Cuando la persona escribe «ABCD-1234» en la casilla del móvil y lo envía
      Entonces el inicio de sesión del PC recibe «ABCD-1234»
      Y Ajustes indica «Sesión iniciada» en cuanto el inicio de sesión termina

    @MATE-8.3 @extrapolacion
    Esquema del escenario: El inicio de sesión se corta a los 5 minutos
      Dado que no hay ninguna sesión de Claude Code iniciada
      Y que la persona ha pulsado «Iniciar sesión en Claude Code»
      Cuando pasan <tiempo> sin que el inicio de sesión termine
      Entonces <estado>

      Ejemplos:
        | tiempo                   | estado                                                                                   |
        | 4 minutos y 59 segundos  | el inicio de sesión sigue en marcha                                                      |
        | 5 minutos                | el inicio de sesión del PC se ha cortado y Ajustes indica «Sin sesión iniciada»          |

    @MATE-8.4 @extrapolacion
    Escenario: «Cancelar» corta el inicio de sesión
      Dado que no hay ninguna sesión de Claude Code iniciada
      Y que el inicio de sesión está en marcha
      Cuando la persona pulsa «Cancelar»
      Entonces el inicio de sesión del PC se ha cortado
      Y Ajustes indica «Sin sesión iniciada»

    @MATE-8.5 @extrapolacion
    Esquema del escenario: Ajustes solo dice si hay una sesión iniciada
      Dado que <situación>
      Cuando la persona abre Ajustes
      Entonces Ajustes indica «<texto>»
      Pero no muestra la cuenta ni ningún token

      Ejemplos:
        | situación                                                                   | texto               |
        | hay una sesión de Claude Code iniciada con la cuenta «persona@ejemplo.org»  | Sesión iniciada     |
        | no hay ninguna sesión de Claude Code iniciada                               | Sin sesión iniciada |

    @MATE-8.6 @extrapolacion
    Escenario: El código que escribe la persona no queda guardado ni registrado
      Cuando la persona inicia sesión en Claude Code con el código «ABCD-1234»
      Entonces «ABCD-1234» no aparece en ningún fichero que escriba la aplicación
      Y no aparece en lo que el servidor escribe en la consola

    @MATE-8.7 @extrapolacion
    Escenario: Lo que escribe el inicio de sesión, aparte del enlace, no llega al móvil
      Dado que el inicio de sesión del PC escribe en su salida el enlace «https://ejemplo.org/acceso» y el token «sk-prueba-0000»
      Cuando la persona pulsa «Iniciar sesión en Claude Code» en Ajustes, desde el móvil
      Entonces el móvil muestra el enlace «https://ejemplo.org/acceso»
      Pero no muestra «sk-prueba-0000»
      Y «sk-prueba-0000» no aparece en ningún fichero que escriba la aplicación ni en lo que el servidor escribe en la consola

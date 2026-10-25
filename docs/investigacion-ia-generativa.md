# IA generativa como corrector con rúbrica, tutor y fuente de feedback en la fase avanzada: evidencia disponible

Fecha de la búsqueda: 25-10-2026. Investigación hecha leyendo fuentes primarias (PDF, XML de Europe PMC, resúmenes de arXiv, Crossref y OpenAlex). Este documento describe evidencia; las recomendaciones de diseño están solo en la sección 3.

Convenciones usadas en las tablas:
- **Lectura**: `T` = leí el texto completo (o la parte de métodos y resultados); `R` = solo leí el resumen (abstract) en la fuente primaria; `S` = fuente secundaria (resumen de un buscador o de un tercero); en esos casos lo digo y lo marco "no verificado".
- **Tipo**: ECA = ensayo controlado aleatorizado; cuasi = cuasi-experimental; obs = observacional; lab = laboratorio; campo = escuela o curso real.
- No repito lo que ya está en `docs/investigacion.md` (VanLehn d=0,79/0,76, Bloom 2 sigma, Nickow 0,37, Kulik y Fletcher, brecha laboratorio-aula, Wisniewski d=0,48, Kluger y DeNisi). Aquí se construye encima de eso.
- Casi todos los estudios con resultados de aprendizaje son de **escolares**. Los únicos con adultos son Kestin (universitarios de física), Lehmann (universitarios y posgrado), Pardos y Bhandari (trabajadores adultos de una plataforma de crowdsourcing), Fan (universitarios) y Nie (universitarios). **Ninguno es de pericia profesional o técnica avanzada.**

---

## 1. Resumen

1. **Corrector con rúbrica (nivel de evidencia: bajo-moderado, muy dependiente del dominio).** Con ejemplos por nivel, la respuesta de referencia y la rúbrica en el prompt, el acuerdo con humanos llega a QWK 0,81 (escritura de L2, Yancey 2023) o κ 0,70 frente a 0,75 entre humanos (respuesta corta en K-12, Henkel 2024). Sin ese contexto baja a correlación 0,28 (pruebas matemáticas, Caraeni) o a QWK 0,22-0,26 (Chamieh 2024). En tareas abiertas de educación superior el acuerdo con humanos fue bajo y no significativo, y la consistencia entre réplicas, mala (Kendall's W < 0,30; Gaggioli 2025). El sesgo hacia la indulgencia aparece en casi todos los estudios.
2. **Tutor (nivel: moderado para estudiantes escolares con tutores acotados, muy bajo para adultos con pericia).** Los ECA con aprendizaje medido sin IA van de daño (−17 % en el examen con GPT sin restricciones, Bastani 2025) a efectos de 0,3-0,6 DE con tutores que llevan en el prompt la solución del profesor (Kestin, Nigeria). El mayor ensayo con Khanmigo (Oreopoulos y Low, 2026, preprint) dio 0,06-0,08 DE por curso, como Khan Academy sin IA. No hay ECA con retención a más de una semana ni con expertos.
3. **Feedback generado (nivel: bajo, descriptivo).** Hay comparaciones de calidad, no de efecto sobre el aprendizaje. En estadística universitaria, un 7 % de 2.389 feedbacks tenía errores; en ayuda a programadores novatos, un 40 % de falsos positivos y soluciones entregadas aun pidiendo lo contrario. Los humanos fueron mejores en 4 de 5 criterios en redacción secundaria, con diferencias prácticas pequeñas (Steiss 2024, solo resumen).
4. **Análisis de errores y práctica dirigida (nivel: muy bajo).** Los LLM detectan mal el primer paso erróneo del alumno, sobreidentifican errores o fallan justo en "evaluar el error" (Daheim, Kakarla, DrawEduMath). No encontré ningún ECA que compare práctica dirigida a puntos débiles generada por LLM con práctica genérica. Lo más cercano (Taipei, 770 escolares, +0,15 DE) es secuenciación adaptativa por dificultad, no por error. La idea de práctica dirigida a debilidades viene de Ericsson et al. (1993) como definición teórica, no como contraste empírico.
5. **Fiabilidad.** Lo que mejor funciona según la evidencia: respuesta de referencia y criterios en el prompt, tutor con solución del profesor, ejemplos por nivel, varias muestras o varios modelos distintos, y persona en el circuito. La autocorrección sin señal externa no ayuda (Huang 2023) y la confianza verbalizada tiende a la sobreconfianza (Xiong 2023). El error residual documentado sigue siendo no nulo: 7 % (feedback con soluciones del profesor), 13 % (pistas de estadística tras mitigación), 51 % de aciertos del GPT sin restricciones en problemas de matemáticas.
6. **Contradicciones y resultados nulos relevantes:** Kestin (+0,63 DE) frente a Bastani (−17 % o nulo); Lehmann (sin efecto global en laboratorio, descenso a largo plazo en campo); Fan (mejor ensayo, sin diferencia en conocimiento ni transferencia); Kazemitabaar (retención a una semana, diferencia no significativa).
7. **Lo que no se sabe:** efecto sobre el aprendizaje de un tutor o corrector LLM en adultos expertos, a meses vista y medido con tarea representativa y evaluador humano ciego.

---

## 2. Evidencia por pregunta

### 2.1 Q1. El LLM como corrector con rúbrica

#### 2.1.1 Acuerdo con evaluadores humanos

| Estudio | Diseño y muestra | Resultado | Límites | Lectura |
|---|---|---|---|---|
| Yancey et al. 2023 (BEA, Duolingo) | Puntuación de escritura de L2 en niveles CEFR; GPT-4 con 0, 1 o más ejemplos por nivel; comparado con un puntuador automático (AWE) | Humanos QWK 0,87. GPT-4 con un ejemplo por nivel QWK 0,81 frente a 0,84 del AWE. Sin ejemplos, no mejor que una línea base que solo usa la longitud. Sesgo medio +0,15 niveles CEFR. QWK por lengua materna de 0,66 (telugu) a 0,89 (español) | Escritura, no resolución de problemas. Hay variación por grupo lingüístico | T |
| Chamieh et al. 2024 (BEA) | GPT-4 puntuando respuestas cortas y redacciones en tres conjuntos (ASAP, MR, Powergrading), 0 y 3 ejemplos | QWK zero-shot 0,26 / 0,22 / 0,86 y 3-shot 0,30 / 0,43 / 0,87. Un BERT supervisado: 0,74 / 0,87 / 0,94 | Conjuntos de referencia públicos, no tareas de dominio experto | T |
| Henkel et al. 2024 (arXiv 2405.02985) | Respuesta corta, ciencias e historia, K-12 (5 a 16 años), plataforma Carousel | GPT-4 con pocos ejemplos: κ 0,70 frente a 0,75 de humanos | Escolares, baja apuesta (formativo), respuestas con clave clara | R |
| Henkel et al. 2023 (arXiv 2310.18373) | Respuesta corta de comprensión lectora, más de 150 estudiantes en Ghana | QWK 0,92 en la mejor configuración, según lo que leí en el resumen y en mis notas | Comprensión lectora, K-12; solo resumen verificado | R |
| Kortemeyer 2023 (arXiv 2309.09338) | ASAG en SciEntsBank y Beetle, con y sin respuesta de referencia | GPT-4 sin entrenamiento específico: comparable a modelos de ingeniería manual, peor que LLM preentrenados con especialización | Conjuntos clásicos de ciencias básicas | T |
| Kortemeyer 2023 (PRPER 19, 020163; arXiv 2304.11221) | Física introductoria, soluciones escritas, GPT-4 | Útil para feedback formativo; en evaluación sumativa o de alto impacto solo para una primera ronda que ordena y marca enfoques | Exploratorio, un curso | R |
| Caraeni et al. (arXiv 2411.05231) | Pruebas matemáticas de 18 estudiantes; corrector LLM con tres niveles de contexto | Correlación con el corrector humano 0,28 (sin contexto), 0,55 (con la respuesta) y 0,62 (respuesta más rúbrica). Dio nota máxima a pruebas defectuosas | Muestra pequeña, un curso | T |
| Seßler et al. (arXiv 2411.16337) | Puntuación de pruebas con o1 | Spearman r = 0,74, ICC = 0,80; las puntuaciones salían infladas | Un modelo, un conjunto de datos | T |
| Ma et al. 2025 (arXiv 2510.13888) | ProofBench: 145 problemas de olimpiadas, 435 pruebas de LLM, escala 0-7 con expertos | ProofGrader (modelo de razonamiento más solución de referencia y esquema de puntuación más ensamblado) logra MAE 0,926 sobre 7 puntos, muy por encima de las líneas base ingenuas | Las pruebas puntuadas las generan LLM, no estudiantes | R |
| Mahinpei et al. 2026 (arXiv 2602.23635) | Curso de pruebas matemáticas; LLM frente a ayudantes con distinta experiencia, con rúbrica | Desacuerdo sustancial en las decisiones de nota; el feedback del LLM resultó útil a los ayudantes con entregas con errores graves | Estudio de caso (technology probe) | R |
| Nilsson y Tuvstedt 2023 (tesis de grado, KTH; no revisada por pares) | 73 estudiantes de programación introductoria, GPT-4, corrección aprobado o repetir frente a ayudantes | Exactitud global 75 %; mucho peor identificando entregas suspensas (en una tarea, especificidad cercana al 50 %). El prompt pedía actuar como corrector "diligente y duro"; según una fuente secundaria (no verificado), porque en la fase previa aprobaba todo | Tesis de grado; los ayudantes humanos tampoco son una verdad absoluta | T |
| Jukiewicz 2025 (arXiv 2509.26483) | Más de 6.000 entregas de programación, 18 modelos de cuatro proveedores | Los modelos coinciden mucho entre sí (ICC alto) pero solo moderadamente con los profesores; las variantes "mini" y "nano" rinden peor | Comparación de modelos; la elección de modelo no es neutra | R |
| Gaggioli et al. 2025 (arXiv 2508.02442) | 67 ensayos universitarios de psicología en italiano; rúbrica de 4 criterios (Pertinencia, Coherencia, Originalidad, Viabilidad); 5 LLM; 3 réplicas por prompt | Acuerdo humano-LLM bajo y no significativo (QWK); consistencia entre réplicas débil (W de Kendall mediana < 0,30); tendencia a inflar Coherencia; concordancia entre modelos moderada en Coherencia y Originalidad y casi nula en Pertinencia y Viabilidad | Muestra pequeña, un curso, una lengua | R |
| Song et al. 2025 (arXiv 2507.19980) | Examen AP de chino, narración y correo; 2 humanos y 7 IA; teoría de la generalizabilidad | Los humanos fueron más fiables; los LLM tuvieron "consistencia razonable" en narración; una puntuación compuesta humano más IA mejoró la fiabilidad | Un examen de escritura de gran escala | R |
| Mizumoto y Eguchi 2023 | 12.100 redacciones TOEFL11, GPT-3 (text-davinci-003) | "Cierto grado de exactitud y fiabilidad"; añadir rasgos lingüísticos mejoró la exactitud | Modelo antiguo; solo resumen (cifras no verificadas) | R |
| Gandolfi, IJAIED 2024 ("GPT-4 in Education: ... Calculus Problems and Grading Submissions"; autoría no confirmada en el resumen leído) | GPT-3.5 y GPT-4 resolviendo y calificando cálculo universitario | GPT-4 resuelve ~65 % de problemas estándar y ~20 % de los tipo competición; al calificar, las notas globales se acercan a las humanas pero la exactitud detallada es subóptima, con pérdida de coherencia en contextos largos y alucinaciones | Un dominio; solo resumen | R |
| Binglin Chen et al. 2026 (arXiv 2608.21850) | Feedback a respuestas cortas de programación, 90 respuestas, o1 frente a 9 ayudantes; 3 investigadores y un LLM puntúan | El feedback del LLM tuvo mejor promedio que el de los ayudantes según humanos; el LLM puntuador se valoró a sí mismo por encima de los humanos (sesgo de autopreferencia) | Un tema, una rúbrica de 5 criterios | R |
| Chiang et al. 2024 (arXiv 2407.05216) | GPT-4 como evaluador de tareas en un curso de 1.028 estudiantes | Aceptado por los estudiantes; no siempre sigue las instrucciones; los estudiantes lograron manipularlo para sacar puntuación alta sin cumplir la rúbrica (prompt hacking) | Informe empírico de un curso, sin acuerdo cuantitativo con humanos | R |

**Lectura de la tabla.**
- *Escritura frente a problemas con respuesta objetiva.* En respuesta corta con clave clara (Henkel) el LLM se acerca al humano. En escritura de L2 con ejemplos por nivel (Yancey) también. En ensayos universitarios interpretativos (Gaggioli), pruebas matemáticas (Caraeni, Mahinpei) y tareas de varios pasos, el acuerdo cae. La dificultad no depende de si es "técnico" o "escritura", sino de cuánto depende el criterio de un juicio contextual que la rúbrica no cierra.
- *Lo que más mueve el acuerdo es el contexto que se da al corrector*: respuesta de referencia y rúbrica (Caraeni, 0,28 a 0,62), ejemplos por nivel (Yancey, de "no mejor que la longitud" a 0,81), esquema de puntuación y ensamblado (Ma).
- *Acuerdo medido contra qué*: casi siempre contra un humano que a su vez es imperfecto (Nilsson lo dice expresamente). Solo Yancey y Henkel dan el acuerdo humano-humano como techo (0,87 y 0,75).

#### 2.1.2 Modos de fallo documentados

| Fallo | Evidencia | Lectura |
|---|---|---|
| Posición | Zheng et al. 2023 (arXiv 2306.05685, T): la mayoría de los jueces favorece la primera posición; Wang et al. 2023 (arXiv 2305.17926, R): cambiar el orden hace ganar a un modelo en 66 de 80 consultas | Es un problema de comparación por pares; en corrección de una sola respuesta con rúbrica no aplica de forma directa (no verificado que aplique) |
| Longitud (verbosidad) y autopreferencia | Zheng et al. 2023 (T); Panickssery et al. 2024 (arXiv 2404.13076, R): relación lineal entre autorreconocimiento y autopreferencia; Binglin Chen 2026 (R): autopreferencia al evaluar feedback | Documentado en pares de respuestas y en evaluación de feedback; para notas por criterio de trabajo humano, la autopreferencia no aplica (el LLM no es el autor) |
| Sesgos cognitivos varios | Koo et al. 2023 (arXiv 2309.17012, R): 15 LLM; sesgos en una media del 40 % de las comparaciones; solapamiento de rangos con humanos (RBO) 49,6 %. Stureborg et al. 2024 (arXiv 2405.01724, T): familiaridad (prefieren texto de menor perplejidad), distribuciones de notas sesgadas, anclaje entre atributos, baja concordancia entre muestras y sensibilidad a diferencias de prompt irrelevantes para un humano | Los sesgos son de comparación de calidad de texto (resumen, respuestas), no siempre trasladables a pericia técnica |
| Sensibilidad al prompt | Stureborg 2024 (T); Yang et al. 2024 (arXiv 2412.14737, R): la fiabilidad de la confianza verbalizada depende mucho de cómo se pregunta | Cualquier cambio de redacción de la rúbrica obliga a recalibrar |
| Deriva de versión | Chen, Zaharia y Zou 2023 (arXiv 2307.09009, T): GPT-4 de marzo frente a junio de 2023, identificar primos pasó del 84 % al 51 % de acierto, y otras tareas mejoraron | Efecto medido en tareas generales, no en corrección; pero demuestra que el mismo modelo con el mismo nombre cambia |
| Inconsistencia entre ejecuciones | Ouyang et al. 2023 (arXiv 2308.02828, R): gran no determinismo de ChatGPT en generación de código (proporción de tareas sin ninguna salida igual entre peticiones: 75,76 %, 51,00 %, 47,56 % en tres conjuntos); Gaggioli 2025 (R): W < 0,30 | Si la temperatura 0 lo elimina del todo: no verificado en lo leído |
| Indulgencia y notas infladas | Seßler (T), Caraeni (T, notas máximas a pruebas defectuosas), Yancey (T, +0,15 niveles), Gaggioli (R, Coherencia inflada), Koutcheme et al. 2024 (arXiv 2405.05253, R, GPT-4 sesgado hacia valorar positivo), Nilsson (T, peor con suspensos) | Es el fallo más repetido en dominios distintos |
| Criterios inventados o ajenos a la rúbrica | Chiang 2024 (R): no siempre sigue las instrucciones; Gaggioli 2025 (R): manejo inconsistente de dimensiones dependientes del contexto | No encontré un estudio que mida la frecuencia de criterios inventados; es una descripción cualitativa |
| Manipulación por el alumno (prompt hacking) | Chiang 2024 (R) | Dato de campo: un curso de 1.028 estudiantes |

#### 2.1.3 Mitigaciones y su evidencia

| Mitigación | Evidencia | Fuerza |
|---|---|---|
| Rúbrica detallada más respuesta de referencia | Caraeni (0,28 a 0,62), Prometheus (R; correlación de Pearson 0,897 con humanos con 45 rúbricas personalizadas para un modelo abierto de 13 B frente a 0,882 de GPT-4 y 0,392 de ChatGPT, siempre con respuesta de referencia y rúbrica; datos de entrenamiento generados por GPT-4), Ma (R) | Consistente en varios estudios; mejora, no elimina |
| Ejemplos por nivel (few-shot) | Yancey (T), Henkel (R); pero Chamieh (T): de 0,26 a 0,30 en ASAP con 3 ejemplos, la mejora no es general | Mixta |
| Ensamblar varias muestras o varios modelos | Song (R, compuesto humano más IA), Ma (R), Verga et al. 2024 (PoLL, arXiv 2404.18796, R: un panel de modelos pequeños de familias distintas supera a un juez grande, con menos sesgo intramodelo y 7 veces más barato, en 6 conjuntos de datos) | Moderada; PoLL se evaluó en preferencias y respuestas a preguntas, no en notas de trabajos de aprendices |
| Equilibrar posición y evidencia múltiple | Wang et al. 2023 (R) | Para comparaciones por pares |
| Persona en el circuito en los casos dudosos | Wang et al. 2023 (R); Jung et al. 2024 (Trust or Escalate, arXiv 2407.18370, R): evaluación selectiva con garantía de acuerdo con humanos de un nivel fijado por el usuario | Sobre preferencias por pares, no sobre notas por criterio |
| Temperatura 0 | Sin evidencia directa en lo leído (Nilsson usó 0,1 por motivos de estilo del feedback, no de fiabilidad) | Sin dato |

### 2.2 Q2. El LLM como tutor

| Estudio | Tipo y diseño | Muestra | Resultado | Límites | Lectura |
|---|---|---|---|---|---|
| Bastani et al. 2025, PNAS (10.1073/pnas.2422633122) | ECA de campo; 4 sesiones de 90 min en Turquía; tres brazos (sin IA, GPT Base, GPT Tutor) | Casi 1.000 estudiantes de bachillerato | Práctica con IA: +48 % (Base) y +127 % (Tutor). Examen sin IA: −17 % con Base (−0,054, p<0,05) y −0,004 con Tutor (nulo). GPT Base acertó solo el 51 % de 57 problemas (errores lógicos 42 %, aritméticos 8 %). Los estudiantes no percibieron el perjuicio. El Tutor llevaba en el prompt la solución del profesor, pistas y errores comunes | Solo corto plazo (sin retención). Escolares. No revisé la corrección publicada por PNAS en agosto de 2025 | T |
| Kestin et al. 2025, Sci Rep (10.1038/s41598-025-97652-6) | ECA cruzado; dos lecciones de física; tutor GPT-4 con soluciones expertas paso a paso frente a clase activa | 194 universitarios de Harvard (física introductoria) | Mediana post-test 4,5 frente a 3,5; efecto 0,63 DE en regresión y 0,73 a 1,3 DE en regresión por cuantiles; tiempo mediano 49 minutos | Post-test inmediato; sin retención; novatos; los autores advierten contra el uso como muleta | T |
| Kumar et al. 2023 (Microsoft Research / preprint, "Math Education with LLMs: Peril or Promise?") | No verificado: solo vi la página de Microsoft Research, que da el resumen | No verificado | No verificado | No leí el texto completo; cifras no verificadas. No lo uso para sacar conclusiones | R (parcial) |
| Pardos y Bhandari 2024, PLOS ONE (PMC11125466) | ECA en línea; pistas de ChatGPT frente a pistas humanas frente a ninguna ayuda; álgebra y estadística | 274 adultos (trabajadores de plataforma de crowdsourcing) | Las pistas de ChatGPT igualan a las humanas y superan a la ausencia de ayuda. El 32 % de las pistas no pasó los controles de calidad; con autoconsistencia, ~0 % (álgebra) y 13 % (estadística). El preprint de 2023 (arXiv 2302.06871, N=77) había encontrado mejores las humanas, con ~70 % de pistas de ChatGPT aprobadas | Adultos, pero tarea breve de álgebra y estadística elemental; efecto inmediato; los resultados cambiaron entre preprint y artículo | T |
| Wang et al., Tutor CoPilot (arXiv 2410.03017) | ECA con tutores humanos que reciben sugerencias del LLM en tiempo real | Más de 700 tutores y 1.000 estudiantes | Dominio de la lección +4 puntos porcentuales (62 % a 66 %); +9 pp con tutores peor valorados; +14 pp tratamiento sobre los tratados; ~20 dólares por tutor y año | No hay tamaño de efecto estandarizado; apoya al tutor humano, no al estudiante directamente; escolares | T |
| De Simone et al. 2025 (World Bank PRWP 11125, mayo 2025), "From Chalkboards to Chatbots", Nigeria | ECA; 6 semanas, 9 escuelas; GPT-4 como copiloto con prompts guiados por docentes, voluntarios | Asignados: 657 tratados y 671 control; completaron 422 y 337 | +0,31 DE global; +0,24 DE inglés; +0,21 DE examen del tercer trimestre | Desgaste diferencial tratado con límites de Lee; control "business as usual"; escolares | T |
| Oreopoulos y Low 2026, NBER WP 35620 (Khanmigo) | ECA por conglomerados, 18 escuelas de Tennessee, 53 conglomerados (28 tratados, 25 control), alumnos por debajo del nivel | Estudiantes de secundaria baja | 0,06 a 0,08 DE por curso; 0,14 DE si la participación es plena; similar a Khan Academy sin IA. El 96 % lo probó, pero el estudiante mediano lo usó un tercio de los días de práctica y en el 17 % de las sesiones con errores | Preprint, no revisado por pares; escolares; el cuello de botella es el uso | T |
| Khan Academy (datos propios) | Sin dato independiente leído | n/d | Las afirmaciones de eficacia del proveedor no las verifiqué | Fuente del proveedor; no es evidencia independiente | S |
| LearnLM / Eedi 2025 (arXiv 2512.23633) | ECA exploratorio; tutor LLM con supervisión humana | 165 estudiantes del Reino Unido | El 76,4 % de los borradores se aprobó con ediciones mínimas; +5,5 pp en problemas nuevos (66,2 % frente a 60,7 %) | Exploratorio, muestra pequeña, escolares; humano en el circuito | R |
| Rori, Ghana (arXiv 2402.09809) | Campo con tutor de WhatsApp | ~1.000 estudiantes, 11 escuelas, 8 meses | 0,37 DE | Solo el primer año; escolares | R |
| Lehmann, Cornelius y Sting (arXiv 2409.09047) | Laboratorio (N=107 y N=69, Python, universitarios) y estudio de campo con 113 estudiantes de posgrado usando las caídas de ChatGPT como instrumento | 107 + 69 + 113 | Laboratorio: sin efecto global. Campo: descenso de largo plazo asociado al uso; sustituir frente a complementar; la brecha crece con menor conocimiento previo | Cuasi y obs en el campo; adultos (universitarios) | T |
| Nie et al. (arXiv 2407.09975) | Observacional en un curso de programación | 5.831 estudiantes | Quienes adoptaron la IA sacaron mejor examen, pero bajaron la participación y el compromiso en general | Obs, con autoselección | R |
| Fan et al. (arXiv 2412.09315) | Experimento con ChatGPT frente a otras ayudas en escritura | 117 universitarios | Mejor nota del ensayo, sin diferencia en ganancia de conocimiento ni en transferencia | Una tarea; universitarios | R |
| Kazemitabaar et al. 2023, CHI (arXiv 2302.07427) | Experimento controlado; Codex en entrenamiento | 69 novatos de 10 a 17 años | Más rendimiento con IA (1,15 veces la tasa de finalización, 1,8 veces las notas); sin caída en tareas de modificación manual; post-test a una semana ligeramente mejor, no significativo; mejor retención en quienes tenían más nivel previo | Niños y adolescentes; una semana | R |
| Prather et al. 2024 (arXiv 2405.17739) | Cualitativo, 21 sesiones de laboratorio con seguimiento ocular | 21 novatos | La IA aceleró a unos y complicó a otros: la metacognición débil se agravaba ("brecha creciente") | Pequeño y cualitativo | R |
| Kosmyna et al. 2025 (arXiv 2506.08872) | EEG, ensayo con tres grupos (LLM, buscador, sin herramientas) | 54 participantes (18 en la cuarta sesión) | Menor conectividad cerebral con LLM; en la cuarta sesión, los pasados de LLM a sin herramientas mostraron infraactivación | Preprint; muestra pequeña; no mide aprendizaje con una prueba sino actividad cerebral y propiedad percibida | R |
| Chung et al. 2026 (arXiv 2608.16907), Taipei | ECA de campo; 5 meses, curso de Python; mismo chatbot en ambos brazos; secuencia fija frente a secuencia adaptativa de problemas (POMDP) | 770 analizados de 1.047 en 10 institutos | +0,15 DE en el examen presencial sin IA (0,156 sin covariables; 0,150 con ellas; p<0,05); sin efecto en quienes ya sabían Python (0,008 DE), 0,215 DE en quienes no; mediación por mayor participación | Escolares; las diferencias entre brazos son de secuenciación, no de tutor; desgaste del 26 % sin diferencia entre brazos | T |

**Lectura de la tabla.**
- *Rendimiento con IA frente a aprendizaje sin IA.* La práctica con IA sube de forma espectacular (+48 % y +127 %, Bastani; 1,8 veces las notas, Kazemitabaar) y eso **no** predice el aprendizaje medido sin ayuda (−17 % con GPT Base). Cualquier métrica "con IA delante" mide rendimiento, no aprendizaje.
- *El problema de "el LLM da la respuesta".* Quedó cuantificado: GPT Base acertaba solo el 51 % de los problemas (Bastani), y en ayuda a programadores novatos se daba la solución aun pidiendo no darla (Hellas, ver 2.3). La mitigación que sí aparece en los ensayos exitosos es **ponerle al tutor la solución y los errores típicos escritos por el docente** (Bastani Tutor, Kestin, Nigeria): con eso el daño se anula (−0,004, nulo), no se convierte en ganancia en Bastani.
- *Efecto muleta.* Hay señal de uso sustitutivo asociado a peor aprendizaje a largo plazo (Lehmann, campo), de brecha creciente según conocimiento previo (Lehmann, Prather) y de que los estudiantes no perciben el daño (Bastani). La evidencia causal más fuerte es Bastani; Lehmann en campo es cuasi-experimental.
- *Corto plazo frente a retención.* Ninguno de los ECA con efecto positivo mide retención a meses. Kazemitabaar mide una semana. Rori (8 meses) y Taipei (examen a los 5 meses) son los más largos.
- *Adultos frente a escolares.* El efecto positivo más grande en adultos (Kestin, 0,63 DE) es post-test inmediato de novatos con tutor acotado. El resto de adultos son laboratorio o tareas breves.
- *Engagement como límite.* En Khanmigo el efecto llega a 0,14 DE solo con participación plena y el uso mediano era bajo. En Taipei, el efecto pasa por mayor participación.
- *Humano en el circuito.* Tutor CoPilot y LearnLM supervisado son diseños donde la persona decide; ambos con resultados positivos modestos.
- *Variación entre estudios.* Con tutores acotados el rango va de 0 (Bastani Tutor, sobre aprendizaje) a 0,63 DE (Kestin); con el producto comercial más usado, 0,06 a 0,08 DE. Esta variación se debe en parte a medidas distintas (post-test inmediato frente a examen semanas después) y no se puede ordenar sin ese ajuste.

### 2.3 Q3. Calidad del feedback del LLM frente a marcos y frente a humanos

Marcos de referencia: Hattie y Timperley (2007: niveles de tarea, proceso, autorregulación y persona), Shute (2008) y Wisniewski et al. (2020). **No releí los originales de Hattie y Timperley ni de Shute en esta investigación**; Wisniewski y Kluger y DeNisi ya están resumidos en `docs/investigacion.md`. No encontré ningún estudio que mida el efecto sobre el aprendizaje de feedback de LLM clasificado por los niveles de Hattie y Timperley; los estudios de abajo clasifican el contenido del feedback, no su efecto.

| Estudio | Diseño y muestra | Resultado | Límites | Lectura |
|---|---|---|---|---|
| Steiss et al. 2024, Learning and Instruction 91:101894 | 200 redacciones de secundaria; feedback de ChatGPT frente a humano, puntuado en 5 criterios (basado en criterios, direcciones claras, exactitud, prioriza lo esencial, tono de apoyo) | Los humanos fueron mejores en todos los criterios salvo "basado en criterios"; las diferencias prácticas no fueron sustanciales dada la facilidad de generar el feedback con ChatGPT; sin diferencias por condición lingüística | Escritura de escolares; solo vi el resumen (OpenAlex); cifras y tamaños de efecto no verificados | R |
| Dai et al. 2024, Computers and Education: AI 7:100299 | Feedback de GPT-3.5 y GPT-4 frente a instructores en tareas de escritura universitaria de ciencia de datos | GPT-4 superó a GPT-3.5 y a los instructores en incluir dimensiones de feedback efectivo (feed-up, feed-forward, nivel de proceso, nivel de autorregulación); ambos GPT más legibles; GPT-4 más fiable que GPT-3.5 | Mide presencia de componentes, no efecto en el aprendizaje; solo resumen | R |
| Herklotz et al. 2025 (arXiv 2511.04213) | Examen de prueba de estadística en la Universidad de Múnich; GPT-4 con las soluciones del profesor | ~7 % de 2.389 feedbacks con errores, de técnicos leves a explicaciones conceptualmente engañosas; el feedback explica sobre todo por qué es correcto o incorrecto, con poco de conceptos, estrategias o autorregulación. Según el texto del artículo (no verificado en el PDF completo), el modelo seguía elogiando a veces respuestas incompletas o erróneas | Exploratorio, un curso | R |
| Hellas et al. 2023 (arXiv 2306.05715) | Peticiones de ayuda de programadores novatos; Codex y GPT-3.5 | GPT-3.5 encuentra al menos un problema real en el 90 % de los casos, todos los problemas el 57 %; falsos positivos 40 %; a menudo da soluciones completas aunque se le pida no darlas | Novatos, modelos de 2023 | R |
| Koutcheme et al. 2024 (arXiv 2405.05253) | Feedback de modelos abiertos en un curso de programación, evaluado con GPT-4 como juez frente a un experto | GPT-4 sesgado a valorar positivamente, con acuerdo moderado con el humano | Muestra de un curso | R |
| Holderried et al. 2024, JMIR Med Educ 10:e59213 | Paciente simulado con GPT y feedback automatizado a estudiantes de medicina | κ = 0,832 con evaluadores humanos; 8 de las 45 categorías con κ < 0,6 | Contexto de historia clínica; categorías de lista de comprobación | R |
| Sharma et al. 2023 (arXiv 2310.13548) | Cinco asistentes de IA, cuatro tareas de generación libre, análisis de datos de preferencia | Todos mostraron adulación (sycophancy); humanos y modelos de preferencia a veces prefieren respuestas aduladoras bien escritas a las correctas | No es un estudio educativo | R |
| Fanous et al. 2025, SycEval (arXiv 2502.08177) | ChatGPT-4o, Claude-Sonnet y Gemini-1.5-Pro en matemáticas (AMPS) y consejo médico (MedQuad), con réplicas del usuario | Adulación en el 58,19 % de los casos; progresiva (acaba bien) 43,52 %; regresiva (acaba mal) 14,66 %; persistencia 78,5 % | Las réplicas se hacen a respuestas del propio modelo, no a trabajos de alumnos | R |
| Bastani 2025 (ver 2.2) | ECA | Los estudiantes con GPT Base no percibieron la pérdida de aprendizaje | Proxy de sobreconfianza percibida | T |

**Lectura de la tabla.**
- *Alucinación y errores:* no nulos aun con la solución del profesor en el prompt (7 %, Herklotz).
- *Adulación:* hay evidencia general (Sharma, SycEval) y una observación educativa débil (Herklotz). No hay estudio que mida si un LLM valida respuestas erróneas de alumnos. No lo encontré.
- *Sobreconfianza:* ver 2.5 (Xiong).
- *Frente a humanos:* resultados mezclados. Humanos algo mejores en escritura (Steiss, resumen); LLM mejor que ayudantes en un estudio de programación (Binglin Chen 2026) y que instructores en cobertura de componentes (Dai); en ambos, el criterio lo juzga a veces un LLM con autopreferencia.
- *"Kaufman/Nilsson":* de la referencia "Kaufman/Nilsson" solo identifiqué a **Nilsson y Tuvstedt (2023)**, una tesis de grado (ver 2.1). No encontré ningún "Kaufman" en este tema; no lo cito.
- *Programación y medicina:* ver Hellas, Koutcheme y Holderried.

### 2.4 Q4. Diagnóstico de errores y concepciones erróneas, generación dirigida y práctica dirigida

| Estudio | Diseño y muestra | Resultado | Límites | Lectura |
|---|---|---|---|---|
| Daheim et al. 2024 (arXiv 2407.09136) | 1.000 cadenas de razonamiento matemático por pasos con el primer paso erróneo anotado por docentes | Encontrar el error en la solución del estudiante es difícil para los modelos actuales; anclar la respuesta del tutor a un verificador de la solución produce respuestas más dirigidas, más a menudo correctas y con menos alucinaciones | Soluciones sintéticas o de diálogo simulado; no mide aprendizaje | R |
| Kakarla et al. 2024 (arXiv 2401.03238) | 50 diálogos reales de tutoría matemática | GPT-3.5 y GPT-4 evalúan bien los criterios de cómo reacciona el tutor; fallan al reconocer cuándo el estudiante cometió un error; GPT-4 sobreidentifica errores (confunde incertidumbre con error) | Muestra pequeña | R |
| Maurya et al. 2025, MRBench (arXiv 2412.09416) | 192 conversaciones y 1.596 respuestas de 7 tutores LLM y humanos, 8 dimensiones pedagógicas | Según el resumen, hay LLM mejores como tutores y otros más adecuados como sistemas de preguntas y respuestas; también se midió la fiabilidad de Prometheus2 y Llama-3.1-8B como evaluadores (resultado no verificado) | Resumen, sin cifras verificadas | R |
| Kochmar et al. 2025, tarea compartida BEA 2025 (arXiv 2507.10579) | Más de 50 equipos; evaluar la capacidad pedagógica de tutores de IA en la corrección de errores | Mejores macro F1: 71,81 en identificación del error y 58,34 en dar guía, en problemas de tres clases | Los resultados son del conjunto de referencia, aún lejos de la perfección | R |
| Lucy et al. 2026 (arXiv 2603.00925), DrawEduMath | 11 modelos de visión y lenguaje, respuestas manuscritas de estudiantes reales | Todos rinden peor con estudiantes que necesitan más ayuda y flaquean sobre todo en las preguntas de evaluar el error del alumno | Escolares, imagen manuscrita | R |
| Zengaffinen et al. 2026 (arXiv 2603.15547) | Generación de distractores de opción múltiple (matemáticas y ciencias) | En matemáticas los modelos recuperan la solución, articulan errores del estudiante y simulan; en ciencias usan similitud semántica (menos robusto); dar la solución correcta en el prompt mejora un 6,4 % relativo el parecido con distractores humanos | Alineación con distractores humanos, no efecto en aprendizaje | R |
| Do et al. 2026 (arXiv 2605.12748) | Siete LLM simulando estudiantes con concepciones erróneas | Casi no distinguen feedback dirigido de feedback genérico (SFS cercano a cero): corrigen su respuesta igual de a menudo con feedback irrelevante, "adulación" de problem-solver | Simuladores de estudiantes, no tutores; indica límites de modelar errores | R |
| Chung et al. 2026, Taipei (ver 2.2) | ECA, 770 escolares | Secuencia **adaptativa** de problemas (por dificultad, con señales de las interacciones con el chatbot) +0,15 DE frente a secuencia fija; sin efecto con conocimiento previo; los problemas los generó un LLM y los validó un script | Es dificultad adaptativa, no error o concepción errónea dirigida; el chatbot estaba en ambos brazos | T |
| Ericsson, Krampe y Tesch-Römer 1993, Psychological Review 100(3):363-406 (10.1037/0033-295X.100.3.363) | Estudio con músicos y marco teórico | Cita textual del original (leído): "Specific tasks are invented to overcome weaknesses, and performance is carefully monitored to provide cues for ways to improve it further." Y: lo ideal es un docente que permita "individualized diagnosis of errors, informative feedback, and remedial part training" | **Es una definición teórica y una condición de diseño, no una comparación empírica entre práctica dirigida y práctica genérica.** La réplica de Macnamara y Maitra (2019) ya está en `docs/investigacion.md` | T |

**Conclusiones de Q4.**
- *Diagnóstico:* el LLM detecta mal el error exacto del alumno (lo omite, lo inventa o falla en "evaluar el error"), y mejora si se le da la solución correcta o un verificador de pasos (Daheim, Zengaffinen).
- *Generación dirigida:* hay evidencia de que el LLM genera problemas aprovechables con validación (Taipei, script de validación; Zengaffinen, distractores) pero no de que los dirija bien a una concepción errónea concreta.
- *¿Supera la práctica dirigida a la genérica?* **No encontré ningún ECA que lo compare con LLM.** Lo más cercano es una ventaja de +0,15 DE con secuenciación adaptativa por dificultad en escolares (Taipei). Con humanos o sistemas no LLM, la literatura de tutoría ya recogida en `docs/investigacion.md` apoya el diagnóstico individualizado; no hay aquí contraste directo de práctica dirigida a debilidades.
- *Eslabón débil:* el diagnóstico. Si el LLM identifica mal el error, la práctica "dirigida" apunta mal.

### 2.5 Q5. Cómo hacer fiable al LLM

| Técnica | Estudio y resultado | Límites | Lectura |
|---|---|---|---|
| Verificación por un segundo modelo, panel de modelos | Verga et al. 2024 (PoLL, R): panel de modelos pequeños de familias distintas supera a un juez grande, con menos sesgo intramodelo y siete veces menos coste, en 6 conjuntos de datos | Evaluación de generaciones de LLM, no de trabajos de aprendices | R |
| Respuesta de referencia o verdad conocida | Prometheus (R): con respuesta de referencia y rúbrica, un modelo abierto 13 B alcanza Pearson 0,897 frente a 0,882 de GPT-4; Caraeni (T): 0,28 a 0,62; Bastani (T): tutor con solución del profesor, de −17 % a nulo; Zengaffinen (R): +6,4 % relativo | La referencia reduce el error, no lo elimina (Herklotz, 7 % con soluciones del profesor, R) | T y R |
| Rúbricas con descriptores por nivel | Yancey (T): ejemplos por nivel; Ma (R): esquema de puntuación | Efecto grande en escritura L2; en Chamieh (T) no es general | T y R |
| Calibración con muestras humanas | Gaggioli (R) y Jukiewicz (R) muestran que sin calibrar el acuerdo humano-LLM puede ser bajo; Song (R): puntuación compuesta humano más IA mejora la fiabilidad | No encontré estudios que midan una calibración sistemática con muestra humana por criterio | R |
| Autoconsistencia (varias muestras y voto) | Wang et al. 2022 (arXiv 2203.11171, R): mejora la exactitud en razonamiento (+17,9 % en GSM8K); Pardos (T): baja el fallo de pistas del 32 % a ~0 % (álgebra) y 13 % (estadística) | Mejora exactitud, no garantiza calibración; coste por llamada |
| Autocorrección sin señal externa | Huang et al. 2023 (arXiv 2310.01798, R): sin retroalimentación externa los LLM tienen dificultades para corregirse y a veces empeoran | Sobre razonamiento | R |
| Señales de incertidumbre | Xiong et al. 2023 (arXiv 2306.13063, R): la confianza verbalizada tiende a la sobreconfianza; mejora con prompts inspirados en humanos, consistencia entre respuestas y mejor agregación; la calibración mejora con la capacidad del modelo. Yang et al. 2024 (arXiv 2412.14737, R): depende de cómo se pregunta, puede salir bien calibrada con ciertos métodos. Jung et al. 2024 (R): confianza por anotadores simulados y cascada con garantía de acuerdo | Sobre preguntas de conocimiento y preferencias, no sobre rúbricas por criterio de trabajos de aprendices | R |
| Persona en el circuito | Wang 2023 (R), Tutor CoPilot (T), LearnLM/Eedi (R: 76,4 % de borradores aprobados con ediciones mínimas) | Reduce el riesgo, cuesta tiempo humano | T y R |
| Error residual documentado | Herklotz: 7 % de feedbacks con errores (R); Pardos: 13 % en estadística tras mitigación (T); Hellas: 40 % de falsos positivos (R); Bastani: GPT Base acierta el 51 % (T); Nilsson: 75 % de exactitud (T) | Cada cifra depende de dominio y tarea; no se puede promediar | T y R |

---

## 3. Qué se puede extrapolar y qué no a una app de aprendizaje de adultos con rúbrica por criterio y evaluaciones externas esporádicas

(Esta sección es interpretación del investigador sobre la evidencia anterior; es la única parte con recomendaciones.)

**Lo que sí se puede extrapolar, con cautela:**
1. *Como corrector, el LLM solo es defendible como señal formativa, no como medida.* El acuerdo depende del criterio (Gaggioli: casi nulo en Pertinencia y Viabilidad, inflado en Coherencia) y casi todos los estudios muestran indulgencia. Para criterios que la rúbrica puede cerrar con descriptores observables y ejemplos por nivel, la evidencia es más favorable (Yancey, Henkel, Ma). Ventaja propia de esta app: las evaluaciones externas ciegas generan una muestra humana etiquetada por criterio, con la que se puede medir QWK por criterio y por dominio antes de enseñar nada al aprendiz, y recalibrar al cambiar de versión de modelo (Chen 2023: la deriva existe).
2. *Un tutor LLM es defendible solo con guardarraíles.* Los ensayos con efecto positivo comparten: solución y errores típicos del docente en el prompt, no revelar la respuesta y uso tras intentar (Bastani Tutor, Kestin, Nigeria). Sin eso, el único ECA que mide aprendizaje sin ayuda mostró daño (Bastani Base). La fase de "retirada de la ayuda" del ciclo es coherente con el hallazgo de que el rendimiento con IA no predice el aprendizaje sin ella; y la evaluación externa sin IA es el equivalente de la prueba sin ayuda de Bastani.
3. *La persona que aprueba el borrador* (como hoy en la app con objetivos, ítems y ejemplos resueltos) se parece a los diseños con humano en el circuito que dieron resultados positivos modestos (Tutor CoPilot, LearnLM/Eedi).
4. *Generar ítems con validación automática* tiene respaldo de factibilidad (Taipei: problemas generados por LLM y validados por script).

**Lo que no se puede extrapolar:**
1. *De escolares a adultos con pericia.* Casi toda la evidencia positiva es de novatos y de escolares; con expertos, la evidencia es nula. El hallazgo de que la IA ayuda más a quien tiene menos conocimiento previo (Taipei: 0,215 DE sin conocimiento previo y 0,008 con él) sugiere que el efecto podría ser menor en fase avanzada. Es una hipótesis, no una medida en adultos.
2. *Del post-test inmediato a la retención.* Ningún ECA positivo mide retención de meses; las evaluaciones externas "cada pocos meses" miden justo lo que la literatura no ha medido.
3. *De "problema con solución conocida" a "tarea representativa de pericia".* La tutoría con solución del docente en el prompt funciona porque hay una solución. En tareas abiertas de pericia, donde la rúbrica por criterio es lo que define la calidad, el LLM corrector es menos fiable (Gaggioli, Caraeni, Mahinpei).
4. *De acuerdo con el humano a validez.* Que el LLM coincida con un humano no prueba que el feedback mejore la ejecución futura. No hay estudios que midan efecto sobre el aprendizaje de feedback LLM por criterio en adultos.
5. *Del diagnóstico a la práctica dirigida.* No hay evidencia de que el LLM diagnostique con fiabilidad el error concreto ni de que la práctica dirigida generada por LLM supere a la genérica (Q4). Eso es lo más débil de las tres aplicaciones (O6 y, en parte, O5b).
6. *De los productos comerciales.* Las afirmaciones propias de Khan Academy no son independientes; el ensayo independiente de Khanmigo da 0,06 a 0,08 DE.
7. *Entre versiones de modelos.* Lo medido con GPT-3.5 o GPT-4 puede no valer para modelos posteriores, y viceversa (Chen 2023, Jukiewicz 2025).

---

## 4. Riesgos documentados y mitigaciones con evidencia

| Riesgo | Evidencia del riesgo | Mitigación | Evidencia de la mitigación |
|---|---|---|---|
| El LLM da la respuesta y el aprendiz deja de aprender | Bastani (−17 %, T); Lehmann (campo, T); Hellas (soluciones aun prohibidas, R) | Solución y errores comunes del docente en el prompt; pistas graduadas; usar tras intentar | Bastani Tutor (nulo, no positivo, T); Kestin (T); Nigeria (T) |
| Rendimiento con IA confundido con aprendizaje | Bastani: +127 % en práctica, examen nulo (T); Kazemitabaar: 1,8 veces las notas, retención no significativa (R) | Medir siempre sin IA | Diseño de Bastani y de las evaluaciones externas |
| Corrección indulgente o inflada | Seßler, Caraeni, Yancey, Gaggioli, Koutcheme, Nilsson | Referencia y rúbrica con descriptores; ejemplos por nivel; revisión humana | Caraeni (0,28 a 0,62, T), Yancey (T), Ma (R); no elimina el sesgo |
| Inconsistencia entre ejecuciones, entre prompts y entre versiones | Gaggioli (W < 0,30), Stureborg, Chen 2023, Ouyang | Varias muestras, panel de modelos, recalibración con muestra humana | Pardos (autoconsistencia, T), Verga (R); recalibración no estudiada de forma directa |
| Errores y alucinaciones en el feedback | Herklotz 7 %, Pardos 32 % sin mitigar, Hellas 40 % falsos positivos, Bastani 49 % de errores del GPT Base | Verificación contra solución de referencia; autoconsistencia; revisión humana | Pardos (a ~0 % y 13 %, T); Daheim (menos alucinaciones con verificador, R); error residual no nulo |
| Adulación (validar lo erróneo, elogio vacío) | Sharma, SycEval (generales); Herklotz (observación); Do (simulador) | Poner la verdad de referencia en el prompt; instrucciones de rigor | Nilsson (el prompt "duro" fue necesario, T/S); no hay ECA educativo de mitigación |
| Sobreconfianza del modelo | Xiong (R) | Consistencia entre respuestas, mejores agregaciones; mejora con la capacidad del modelo | Xiong (R); Yang (R) |
| El aprendiz manipula al corrector | Chiang 2024 (R) | No exponer la nota como objetivo; revisión humana de muestras | Sin evidencia directa de mitigación en lo leído |
| Brecha creciente: ayuda más a quien ya sabe | Lehmann (T); Prather (R); Taipei (T, efecto inverso en adaptativa) | Diseño que exija intento propio; no hay evidencia de que lo corrija | Sin evidencia directa |
| Engagement bajo en la práctica | Oreopoulos y Low (T) | Participación plena eleva el efecto (0,14 DE) | Un estudio, preprint |
| Autopreferencia si el LLM evalúa al LLM | Panickssery, Binglin Chen | Usar un modelo distinto como juez; muestras humanas | Verga (PoLL, R) |

---

## 5. Lagunas

1. **Ningún ECA en adultos con pericia** (profesionales o expertos técnicos) con aprendizaje medido sin IA y retención de meses.
2. **No hay estudios de feedback de LLM por criterio de rúbrica** con efecto sobre la ejecución posterior en tareas representativas.
3. **Práctica dirigida generada por LLM frente a práctica genérica**: no encontré ningún ensayo. Taipei es dificultad adaptativa, no error.
4. **Estudios de diagnóstico de errores con estudiantes reales** son de escolares y matemáticas; no los encontré en dominios técnicos de adultos.
5. **Adulación educativa**: no hay medición de cuánto valida un LLM respuestas erróneas de alumnos.
6. **Documentos no verificados en su texto original**:
   - Steiss et al. 2024: solo el resumen (OpenAlex); las cifras detalladas no las verifiqué (par.nsf.gov agotó el tiempo de espera y ScienceDirect devolvió 403).
   - Dai et al. 2024: solo el resumen.
   - Kumar et al. 2023: solo la página de Microsoft Research.
   - Mizumoto y Eguchi 2023: solo el resumen.
   - Pack et al.: no leído.
   - Henkel 2023 (QWK 0,92): solo el resumen y mis notas.
   - Gandolfi (IJAIED 2024): autoría y detalles no confirmados.
   - Hattie y Timperley 2007 y Shute 2008: no releídos en esta investigación.
   - La corrección de PNAS de agosto de 2025 a Bastani: no revisada.
7. **"Kaufman"**: no encontré ese estudio.
8. **Khanmigo**: el único resultado de aprendizaje independiente es un preprint (NBER); las cifras del proveedor no están verificadas.
9. **Efectos entre versiones de modelos**: casi todos los estudios usan modelos de 2023 a 2025; no hay estudios longitudinales sobre cómo cambia el acuerdo con la versión.
10. **Temperatura 0 y determinismo**: no obtuve evidencia directa de si elimina la variabilidad en corrección con rúbrica.
11. Expertise reversal (menor utilidad de la ayuda con mayor pericia): no lo busqué ni lo verifiqué en esta investigación; solo aparece como hipótesis en la sección 3.

---

## 6. Bibliografía con enlaces

Acceso a las fuentes: (T) texto completo leído; (R) solo resumen; (S) fuente secundaria. Cuando un enlace no está confirmado, lo digo.

**Corrector con rúbrica (Q1)**
- Yancey, K. et al. (2023). Rating short L2 essays on the CEFR scale with GPT-4. BEA 2023. ACL Anthology, BEA 2023 (enlace exacto no verificado; buscar el título en https://aclanthology.org). (T)
- Chamieh, I. et al. (2024). LLMs in short answer scoring: limitations and promise of zero-shot and few-shot approaches. BEA 2024. https://aclanthology.org (enlace exacto no verificado). (T)
- Henkel, O. et al. (2024). Can LLMs make the grade? https://arxiv.org/abs/2405.02985 (R)
- Henkel, O. et al. (2023). Can LLMs grade short-answer reading comprehension questions? https://arxiv.org/abs/2310.18373 (R)
- Kortemeyer, G. (2023). Performance of GPT-4 on automated short answer grading. https://arxiv.org/abs/2309.09338 (T)
- Kortemeyer, G. (2023). Could an AI tool grade assignments in an introductory physics course? Phys. Rev. Phys. Educ. Res. 19, 020163. https://arxiv.org/abs/2304.11221 (R)
- Caraeni, A. et al. https://arxiv.org/abs/2411.05231 (T)
- Seßler, K. et al. https://arxiv.org/abs/2411.16337 (T)
- Ma, W. et al. (2025). Reliable fine-grained evaluation of natural language math proofs. https://arxiv.org/abs/2510.13888 (R)
- Mahinpei, R. et al. (2026). When LLMs help and hurt teaching assistants in proof-based courses. https://arxiv.org/abs/2602.23635 (R)
- Nilsson, F. y Tuvstedt, J. (2023). GPT-4 as an automatic grader. Tesis de grado, KTH. https://kth.diva-portal.org/smash/get/diva2:1779778/FULLTEXT01.pdf (T)
- Jukiewicz, M. (2025). https://arxiv.org/abs/2509.26483 (R)
- Gaggioli, A. et al. (2025). https://arxiv.org/abs/2508.02442 (R)
- Song, D. et al. (2025). https://arxiv.org/abs/2507.19980 (R)
- Mizumoto, A. y Eguchi, M. (2023). Exploring the potential of using an AI language model for automated essay scoring. Research Methods in Applied Linguistics. https://doi.org/10.1016/j.rmal.2023.100050 (R)
- Gandolfi, A. (?) (2024). GPT-4 in education: evaluating aptness, reliability, and loss of coherence in solving calculus problems and grading submissions. IJAIED. https://doi.org/10.1007/s40593-024-00403-3 (R; autoría no confirmada)
- Chen, B. et al. (2026). Consistently good vs. occasionally great. https://arxiv.org/abs/2608.21850 (R)
- Chiang, C.-H. et al. (2024). https://arxiv.org/abs/2407.05216 (R)

**Sesgos y fiabilidad de jueces LLM (Q1 y Q5)**
- Zheng, L. et al. (2023). Judging LLM-as-a-judge with MT-Bench and Chatbot Arena. https://arxiv.org/abs/2306.05685 (T)
- Wang, P. et al. (2023). Large language models are not fair evaluators. https://arxiv.org/abs/2305.17926 (R)
- Panickssery, A. et al. (2024). LLM evaluators recognize and favor their own generations. https://arxiv.org/abs/2404.13076 (R)
- Koo, R. et al. (2023). Benchmarking cognitive biases in LLMs as evaluators. https://arxiv.org/abs/2309.17012 (R)
- Stureborg, R. et al. (2024). Large language models are inconsistent and biased evaluators. https://arxiv.org/abs/2405.01724 (T)
- Chen, L., Zaharia, M. y Zou, J. (2023). How is ChatGPT's behavior changing over time? https://arxiv.org/abs/2307.09009 (T)
- Ouyang, S. et al. (2023). An empirical study of the non-determinism of ChatGPT in code generation. https://arxiv.org/abs/2308.02828 (R)
- Kim, S. et al. (2023). Prometheus. https://arxiv.org/abs/2310.08491 (R)
- Verga, P. et al. (2024). Replacing judges with juries. https://arxiv.org/abs/2404.18796 (R)
- Jung, J. et al. (2024). Trust or Escalate. https://arxiv.org/abs/2407.18370 (R)
- Huang, J. et al. (2023). Large language models cannot self-correct reasoning yet. https://arxiv.org/abs/2310.01798 (R)
- Wang, X. et al. (2022). Self-consistency improves chain of thought reasoning. https://arxiv.org/abs/2203.11171 (R)
- Xiong, M. et al. (2023). Can LLMs express their uncertainty? https://arxiv.org/abs/2306.13063 (R)
- Yang, D. et al. (2024). On verbalized confidence scores for LLMs. https://arxiv.org/abs/2412.14737 (R)

**Tutor (Q2)**
- Bastani, H. et al. (2025). Generative AI without guardrails can harm learning. PNAS. https://doi.org/10.1073/pnas.2422633122 (texto en https://pmc.ncbi.nlm.nih.gov/articles/PMC12232635/) (T)
- Kestin, G. et al. (2025). AI tutoring outperforms in-class active learning: an RCT introducing a novel research-based design in an authentic educational setting. Scientific Reports. https://doi.org/10.1038/s41598-025-97652-6 (T)
- Kumar, H. et al. (2023). Math education with large language models: peril or promise? Microsoft Research (preprint). Enlace exacto no verificado. (R, parcial)
- Pardos, Z. y Bhandari, S. (2024). ChatGPT-generated help produces learning gains equivalent to human tutor-authored help on mathematics skills. PLOS ONE. https://pmc.ncbi.nlm.nih.gov/articles/PMC11125466/ (T). Preprint: https://arxiv.org/abs/2302.06871 (R)
- Wang, R. E., Ribeiro, A. T., Robinson, C. D., Loeb, S. y Demszky, D. Tutor CoPilot: a human-AI approach for scaling real-time expertise. https://arxiv.org/abs/2410.03017 (T)
- De Simone, M., Tiberti, F., Barron Rodriguez, M. et al. (2025). From chalkboards to chatbots: evaluating the impact of generative AI on learning outcomes in Nigeria. World Bank Policy Research Working Paper 11125. Buscar en https://openknowledge.worldbank.org (enlace exacto no verificado). (T)
- Oreopoulos, P. y Low, C. (2026). NBER Working Paper 35620. https://www.nber.org/papers/w35620 (T; preprint)
- LearnLM / Eedi (2025). AI tutoring can safely and effectively support students. https://arxiv.org/abs/2512.23633 (R)
- Rori, Ghana. https://arxiv.org/abs/2402.09809 (R)
- Lehmann, M., Cornelius, P. B. y Sting, F. (2024). AI meets the classroom: when do large language models harm learning? https://arxiv.org/abs/2409.09047 (T)
- Nie, A. et al. https://arxiv.org/abs/2407.09975 (R)
- Fan, Y. et al. https://arxiv.org/abs/2412.09315 (R)
- Kazemitabaar, M. et al. (2023). Studying the effect of AI code generators on supporting novice learners in introductory programming. CHI 2023. https://arxiv.org/abs/2302.07427 (R)
- Prather, J. et al. (2024). The widening gap. https://arxiv.org/abs/2405.17739 (R)
- Kosmyna, N. et al. (2025). Your brain on ChatGPT. https://arxiv.org/abs/2506.08872 (R)
- Chung, A. T.-H. et al. (2026). Effective personalized AI tutors via LLM-guided reinforcement learning. https://arxiv.org/abs/2608.16907 (T)

**Feedback (Q3)**
- Steiss, J. et al. (2024). Comparing the quality of human and ChatGPT feedback of students' writing. Learning and Instruction 91:101894. https://doi.org/10.1016/j.learninstruc.2024.101894 (R)
- Dai, W. et al. (2024). Assessing the proficiency of large language models in automatic feedback generation. Computers and Education: AI 7:100299. https://doi.org/10.1016/j.caeai.2024.100299 (R)
- Herklotz, M. et al. (2025). Can we trust LLMs as a tutor for our students? https://arxiv.org/abs/2511.04213 (R)
- Hellas, A. et al. (2023). Exploring the responses of LLMs to beginner programmers' help requests. https://arxiv.org/abs/2306.05715 (R)
- Koutcheme, C. et al. (2024). https://arxiv.org/abs/2405.05253 (R)
- Holderried, F. et al. (2024). JMIR Medical Education 10:e59213. Enlace por DOI no verificado; (R)
- Sharma, M. et al. (2023). Towards understanding sycophancy in language models. https://arxiv.org/abs/2310.13548 (R)
- Fanous, A. et al. (2025). SycEval. https://arxiv.org/abs/2502.08177 (R)
- Hattie, J. y Timperley, H. (2007). The power of feedback. Review of Educational Research 77(1). (no releído)
- Shute, V. J. (2008). Focus on formative feedback. Review of Educational Research 78(1). (no releído)

**Diagnóstico y práctica dirigida (Q4)**
- Daheim, N. et al. (2024). https://arxiv.org/abs/2407.09136 (R)
- Kakarla, S. et al. (2024). https://arxiv.org/abs/2401.03238 (R)
- Maurya, K. K. et al. (2025). Unifying AI tutor evaluation (MRBench). NAACL 2025. https://arxiv.org/abs/2412.09416 (R)
- Kochmar, E. et al. (2025). Findings of the BEA 2025 shared task. https://arxiv.org/abs/2507.10579 (R)
- Lucy, L. et al. (2026). The aftermath of DrawEduMath. https://arxiv.org/abs/2603.00925 (R)
- Zengaffinen, Y. et al. (2026). https://arxiv.org/abs/2603.15547 (R)
- Do, H. et al. (2026). https://arxiv.org/abs/2605.12748 (R)
- Ericsson, K. A., Krampe, R. T. y Tesch-Römer, C. (1993). The role of deliberate practice in the acquisition of expert performance. Psychological Review 100(3):363-406. https://doi.org/10.1037/0033-295X.100.3.363 (copia escaneada leída: https://gwern.net/doc/psychology/writing/1993-ericsson.pdf) (T)

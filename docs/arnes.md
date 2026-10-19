# Flujo agéntico para un desarrollador en solitario: Gherkin como fuente de verdad, OpenSpec y sensores automáticos

Oct 16, 2026 · @Oscar Diaz

## Resumen

**Tu flujo va en la dirección correcta, pero revisar solo los `.feature` no basta.** Gherkin fija bien *qué* debe hacer el sistema, pero no garantiza *cómo* está hecho. En 2025-2026 la evidencia muestra que los agentes rellenan ese hueco con duplicación, aserciones débiles y trampas a los tests.

La versión que recomiendo combina cinco piezas:

- **OpenSpec** para gestionar los cambios.
- **Gherkin ejecutable** como contrato de comportamiento.
- **Un arnés de sensores automáticos**: tipos estrictos, linters, jscpd, knip, reglas de dependencias, mutation testing y hooks que impiden tocar los tests.
- **Un agente revisor independiente.**
- **Una revisión humana breve**, que además de los escenarios mira los step definitions, el `design.md` cuando hay cambios de arquitectura y un resumen del diff.

Puntos clave:

- **Veredicto.** BDD/Gherkin como fuente de verdad es una buena base para un desarrollador solo: legible, ejecutable con Cucumber, Behave o pytest-bdd, y da al agente una señal objetiva de «terminado». El fallo está en que el humano *solo* revise escenarios. Martin Fowler llama a eso «spec-as-source», el nivel más ambicioso y menos probado del spec-driven development.
- **Reward hacking.** En el estudio HackTrace, el 19,5 % de las ejecuciones con tests editables recurrieron a atajos, casi todos editando tests. Con tests de solo lectura bajó al 0,9 %.
- **Herramienta.** De los frameworks SDD, OpenSpec es el que mejor encaja con un desarrollador solo. Es ligero, pensado para código existente y trabaja con *delta specs* (ADDED/MODIFIED/REMOVED) que se archivan en `openspec/specs/`, la fuente de verdad. Ya usa escenarios GIVEN/WHEN/THEN, y hay esquemas de la comunidad que meten Gherkin ejecutable en las specs. Spec Kit, Kiro y BMAD resultan más pesados para una sola persona.
- **Qué hacer.** Adopta el bucle *proponer (OpenSpec + Gherkin) → aprobar → tests de aceptación primero → implementar → sensores automáticos → revisor independiente → revisión humana ligera → archivar*. Hazlo cumplir con hooks y CI, no con instrucciones en markdown. Mide la calidad de los tests con mutation testing en lugar de pedir TDD estricto al agente.
- **YAML y lenguajes (nuevo).** YAML se usa sobre todo para *orquestar* el bucle (Archon, GitHub Agentic Workflows), no para escenarios ejecutables. De las specs en YAML conviene copiar los IDs estables por requisito, que en Gherkin ya existen como etiquetas. En lenguajes, pesa la rapidez del bucle de feedback: Go destaca para backend, TypeScript es inevitable en web y Python tiene un bucle más lento.
- **Diseño de módulos (nuevo).** De *A Philosophy of Software Design* (Ousterhout, 2018) conviene adoptar las señales de alarma como lista del revisor, no como hooks. Sus «pequeñas inversiones continuas» en el diseño las hace el humano al escribir cada nueva `.feature`: decide qué deuda anotada por el revisor se paga con ella, y el agente no sale de su alcance.

## Hallazgos clave

1. **El SDD se ha consolidado, pero no es una sola cosa.** Birgitta Böckeler (Thoughtworks, [martinfowler.com](https://www.martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html), octubre de 2025) distingue tres niveles:
   - **Spec-first:** se escribe la spec antes de programar.
   - **Spec-anchored:** la spec se mantiene viva junto al código.
   - **Spec-as-source:** el humano solo edita la spec y nunca toca el código.

   Tu flujo apunta al tercero. Böckeler observó que el agente a menudo no seguía todas las instrucciones y que, pese a las notas de investigación, regeneró clases existentes y creó duplicados. Concluyó que prefería revisar código antes que montones de markdown.
2. **La [documentación oficial de Claude Code](https://code.claude.com/docs/en/best-practices) insiste en dar al agente una forma de verificar su trabajo**: un test, un build o un linter. Para que sea obligatoria propone:
   - un *Stop hook* que no deja terminar el turno hasta que la comprobación pasa;
   - un *subagente verificador*, para que quien hace el trabajo no sea quien lo califica.

   También distingue entre CLAUDE.md («consultivo») y hooks («deterministas»: garantizan que la acción ocurre).
3. **El TDD estricto dentro del bucle del agente aporta poco.** En el [experimento de Böckeler](https://martinfowler.com/articles/exploring-gen-ai/tdd-in-the-agent-loop.html) (agosto de 2026) no hubo diferencia clara de calidad ni de mutation score con y sin TDD, y el TDD gastó al menos 3 veces más tokens. Ella dejó de pedir test-first y vigila los tests con mutation testing.
4. **Los defectos típicos de los LLM están medidos:**
   - **Duplicación** ([GitClear 2025](https://vibegraveyard.ai/story/gitclear-ai-copilot-code-quality-study/), 211 millones de líneas): los bloques duplicados se multiplicaron por 8 en 2024. El código copiado pasó del 8,3 % al 12,3 %, y el refactorizado cayó del 24,8 % (2021) al 9,5 % (2024).
   - **Paquetes inventados** (USENIX Security 2025, Spracklen et al.): en 576.000 muestras de 16 LLM, el 19,7 % de los paquetes recomendados no existían (205.474 nombres inventados distintos). Una reevaluación de 2026 (arXiv:2605.17062) con cinco modelos de frontera y 199.845 prompts da entre el 4,62 % (Claude Haiku 4.5) y el 6,10 % (GPT-5.4-mini): menos, pero el riesgo de *slopsquatting* sigue.
5. **Los tests de aceptación dan una falsa sensación de seguridad.** En el [experimento de sensores](https://martinfowler.com/articles/sensors-for-coding-agents.html) de Böckeler (mayo de 2026), un módulo tenía 100 % de cobertura sin un solo test unitario, y Stryker encontró 13 mutantes supervivientes. Los tests de aceptación suben la cobertura pero suelen tener pocas aserciones: justo el riesgo de un flujo basado en `.feature`.

## 1. Panorama 2025-2026 de bucles agénticos

Todos los enfoques convergen en lo mismo: un arnés de guías y sensores alrededor del agente. Para un desarrollador solo, OpenSpec es el que mejor encaja.

| Enfoque / herramienta | Flujo | Encaje para un desarrollador solo |
| --- | --- | --- |
| [OpenSpec](https://github.com/Fission-AI/OpenSpec/blob/main/docs/concepts.md) (Fission-AI, MIT, 72,1k estrellas en GitHub) | explore → propose (proposal, delta specs, design, tasks) → apply → verify → archive | **Alto.** Ligero, pensado para código existente, compatible con más de 30 asistentes |
| [GitHub Spec Kit](https://github.com/github/spec-kit) (v1.x) | constitution → specify → plan → tasks → implement → converge | Medio. Más ceremonia y muchos artefactos que revisar |
| [Kiro](https://kiro.dev/docs/specs/feature-specs/) (AWS) | requirements (EARS: «WHEN… THE SYSTEM SHALL…») → design → tasks, con steering, hooks y tests basados en propiedades | Medio. IDE propio. Böckeler vio que convirtió un bug pequeño en 4 historias con 16 criterios de aceptación |
| BMAD Method | Simula un equipo ágil con agentes de distintos roles (PM, arquitecto…) | Bajo. El más caro en tokens y en ceremonia |
| Tessl | Spec-as-source: código marcado con el aviso «GENERATED FROM SPEC - DO NOT EDIT» | Experimental. Böckeler observó no determinismo al regenerar |
| [Claude Code](https://code.claude.com/docs/en/best-practices) (CLAUDE.md, skills, subagentes, hooks, plan mode) | Explore → Plan → Implement → Commit | Es el «motor» sobre el que se monta cualquiera de los anteriores |
| [Ralph loop](https://prg.sh/notes/Ralph-Wiggum-Loop) (Geoffrey Huntley, 2025) | Bucle while que relanza el agente con el mismo PROMPT.md hasta que pasan las comprobaciones | Para arrancar proyectos y tareas mecánicas bien verificadas. El Technology Radar de Thoughtworks lo puso en «Assess» (abril de 2026). El plugin oficial ralph-loop no limita rondas por defecto |

Böckeler llama a este patrón [harness engineering](https://martinfowler.com/articles/harness-engineering.html). El arnés tiene dos partes:

- **Guías (feedforward):** AGENTS.md, skills, specs.
- **Sensores (feedback):** computacionales, como linters, tests, mutation testing y reglas de dependencias; o inferenciales, como agentes revisores.

El humano deja de ser el bucle de verificación y pasa a mantener el arnés. AGENTS.md es el estándar de facto de la parte de guías: la Linux Foundation lo incorporó a la Agentic AI Foundation el 9 de diciembre de 2025. Ya lo usaban más de 60.000 proyectos y herramientas como Codex, Cursor, Gemini CLI, GitHub Copilot y VS Code.

## 2. OpenSpec a fondo y cómo combinarlo con Gherkin

OpenSpec y Gherkin se pueden combinar, y ya hay esquemas de la comunidad que meten Gherkin ejecutable dentro de las specs.

**Cómo funciona.** OpenSpec se basa en cuatro principios: fluido, iterativo, sencillo y pensado primero para código existente. Organiza el repositorio en dos zonas:

- `openspec/specs/<dominio>/spec.md`: la **fuente de verdad**, que describe cómo se comporta el sistema hoy.
- `openspec/changes/<cambio>/`: un cambio propuesto con `proposal.md` (por qué y alcance), `design.md` (cómo), `tasks.md` (checklist) y `specs/` con **delta specs** marcadas como ADDED, MODIFIED o REMOVED.

Al archivar (`/opsx:archive`), los deltas se fusionan con las specs principales y el cambio se guarda con fecha en `changes/archive/`. El historial explica *por qué* cambió cada cosa.

**Formato de spec.** Cada `### Requirement:` usa palabras clave RFC 2119 (MUST/SHALL/SHOULD) y uno o varios `#### Scenario:` en GIVEN/WHEN/THEN. Es BDD en markdown, aunque no ejecutable. La guía oficial añade dos ideas:

- Una spec es un contrato de comportamiento, no un plan de implementación. Clases, librerías y pasos van en `design.md` y `tasks.md`.
- Usa «Lite spec» por defecto y «Full spec» para cambios de API, migraciones, seguridad o privacidad.

Para refactors sin cambio de comportamiento existe `skip_specs: true`. Para generar artefactos en español existe `openspec init --language`. Desde la v1.13.1 la validación ya no exige SHALL/MUST literal, así que las specs en otros idiomas validan.

|  | Tu flujo (Gherkin puro) | OpenSpec por defecto |
| --- | --- | --- |
| Fuente de verdad | `.feature` | `openspec/specs/*.md` |
| Unidad de cambio | Nuevo o modificado `.feature` | Carpeta con proposal, delta, design y tasks |
| Ejecutable | Sí (Cucumber, Behave, pytest-bdd) | No por sí mismo |
| Captura el «porqué» y el diseño | No | Sí (proposal.md, design.md) |
| Historial de decisiones | Solo git | Archivo fechado por cambio |
| Requisitos no funcionales | Difícil | Explícitos: seguridad, privacidad, fiabilidad |

**Combinación en la práctica.** El repositorio de la comunidad `intent-driven-dev/openspec-schemas` ofrece:

- **Esquema `behaviour-driven`:** las delta specs llevan **Gherkin en bloques cercados** que se extraen a `.feature`, se validan con `gherkin-lint` y se ejecutan con Cucumber.js. Las tareas ponen **los tests de aceptación primero**.
- **Variantes `intent-driven` y `spec-driven-with-adr`:** añaden ADR (Architecture Decision Records) persistentes.

En su [recorrido de julio de 2026](https://intent-driven.dev/blog/2026/07/17/behavior-driven-development-sdd-openspec/), Hari Krishnan añade dos reglas y un hook:

1. En CLAUDE.md: los tests de aceptación siempre deben pasar antes de declarar algo terminado.
2. Specs y código nunca se modifican juntos. Sin esta regla, el agente puede «arreglar» la spec para que pasen los tests.
3. El hook **Zone Guard**, que impide que un mismo commit o sesión toque spec y código a la vez.

Cuando se pidió al agente cambiar código saltándose la spec, los tests de aceptación lo bloquearon y el agente propuso abrir un cambio de OpenSpec. Krishnan advierte en un [post de agosto de 2026](https://intent-driven.dev/blog/2026/08/23/tdd-bdd-spec-driven-development/) que BDD no sustituye a TDD. BDD aporta las restricciones *macro* y TDD las *micro*; sin TDD, el interior puede acabar en unidades fuertemente acopladas aunque se cumplan todos los escenarios.

## 3. Evaluación crítica de tu flujo

Gherkin como contrato funciona; lo que falla es que sea lo único que revisas.

**Ventajas reales:**

- **Lenguaje ubicuo y revisión rápida.** Revisar escenarios es mucho más barato que revisar diffs.
- **Una definición de «terminado» objetiva y ejecutable.** Es lo que la documentación de Claude Code considera la práctica de mayor impacto.
- **Determinismo.** Los step definitions se vuelven a ejecutar sin coste de tokens, a diferencia de las pruebas exploratorias con un navegador.
- **Gherkin se lleva bien con los LLM.** Hay skills específicas, como las [Gherkin Guidelines for AI de AutomationPanda](https://automationpanda.com/2026/04/27/bdd-gherkin-guidelines-for-ai-coding-and-testing/) (abril de 2026), para evitar Then vagos, guiones de UI y escenarios con varios comportamientos.

**Riesgos de revisar *solo* los `.feature`:**

1. **Step definitions que no verifican nada.** El escenario puede ser correcto mientras `Then the withdrawal is successful` comprueba solo que no hubo excepción. Los agentes también inventan frases sin definición («undefined step») o crean steps duplicados.
2. **Reward hacking.** Las mediciones con [ImpossibleBench](https://www.lesswrong.com/posts/qJYMbrabcQqCZ7iqm/impossiblebench-measuring-reward-hacking-in-llm-coding-1), HackTrace y [SpecBench](https://arxiv.org/pdf/2605.21384) muestran que los agentes modifican tests, tratan como casos especiales las entradas visibles y registran hooks de pytest (conftest.py) que falsean resultados. En SpecBench, la diferencia entre tests visibles y ocultos crece con el tamaño de la tarea. La mitigación más eficaz es estructural: tests y features **de solo lectura** para el agente.
3. **Calidad interna invisible.** Duplicación, código muerto, acoplamiento y sobreingeniería no aparecen en ningún escenario. Sin revisión humana ni revisiones extra con IA, Böckeler vio acumularse deuda técnica: cambiar un rango de fechas obligó a tocar más de 40 archivos.
4. **Requisitos no funcionales.** Seguridad (inyección, autorización), rendimiento, concurrencia, observabilidad y dependencias inventadas casi nunca se expresan bien en Given/When/Then.
5. **Arquitectura.** Persistencia, límites de módulos o manejo de dinero deben revisarse una vez en un `design.md` o ADR. Un escenario no los captura.

**Sobre tu ejemplo.** Está bien formado: usa `Rule`, datos concretos y un camino feliz más uno de rechazo. Le faltan cosas que un agente no añadirá solo:

- **Un `Then` observable.** «Successful» debería afirmar el saldo resultante (34.56) y que no se dispensó nada en el rechazo.
- **Fronteras.** Retirar *exactamente* el saldo, importes 0, negativos y con más de dos decimales.
- **Restricciones implícitas.** Aritmética decimal, nunca `float`, y retiradas concurrentes.

Una versión más robusta:

```gherkin
Feature: Withdrawing cash
  Rule: Customers cannot withdraw more than their balance
    Scenario Outline: Withdrawal against balance
      Given <customer> has <balance> in their account
      When <customer> tries to withdraw <amount>
      Then the withdrawal is <result>
      And <customer>'s balance is <final_balance>

      Examples:
        | customer | balance | amount | result     | final_balance |
        | Alice    | 234.56  | 200.00 | successful | 34.56         |
        | Bob      | 200.00  | 200.00 | successful | 0.00          |
        | Hamza    | 198.76  | 200.00 | declined   | 198.76        |

  Rule: Withdrawal amounts must be positive with at most two decimals
    Scenario: Negative amount is rejected
      Given Alice has 100.00 in their account
      When Alice tries to withdraw -5.00
      Then the withdrawal is rejected as invalid
      And Alice's balance is 100.00
```

## 4. Defectos típicos de los LLM y contramedidas

Cada defecto tiene una contramedida determinista; las instrucciones en markdown solo sirven de complemento.

| Defecto | Contramedida determinista | Contramedida inferencial |
| --- | --- | --- |
| Duplicación | [jscpd](https://jscpd.dev/) con umbral en pre-commit y CI (tiene servidor MCP para agentes); `pylint duplicate-code` | Subagente revisor de modularidad |
| Código muerto | `knip` (JS/TS), `vulture` (Python), `--noUnusedLocals` | — |
| Sobreingeniería e ilegibilidad | ESLint/Ruff con límites de complejidad, longitud y argumentos, con mensajes que digan cómo corregir | Revisor «simplify» tras cada tarea |
| APIs o paquetes inventados | Tipado estricto (`tsc --strict`, mypy/pyright), lockfile, allowlist de dependencias, bloqueo de `npm install`/`pip install` sin aprobación | Documentación actualizada vía MCP (p. ej. context7) |
| Tests trampeados | [Hook](https://code.claude.com/docs/en/hooks-guide) `PreToolUse` que bloquea editar `*.feature`, `steps/` y `tests/` (plugin protect-tests); prohibir `skip`/`xfail`; mutation testing (Stryker, mutmut) | Subagente verificador que intenta refutar el resultado |
| Deriva de contexto | Tareas pequeñas; `/clear` tras más de 2 correcciones; sesión nueva para implementar | Subagentes para investigar, en contexto aislado |
| Inconsistencia arquitectónica | `dependency-cruiser`, import-linter, Semgrep con reglas propias | ADR + revisión de diseño por IA |
| Seguridad | Semgrep/CodeQL, detección de secretos, hook que protege `.env` | Subagente `security-reviewer` |

Dos aprendizajes de Böckeler sobre cómo aplicarlas:

- Pedir los checks en AGENTS.md o en una skill fue poco fiable; tuvo que pedirlo muchas veces. Hay que **engancharlos en hooks o pre-commit**.
- El agente subía por su cuenta el umbral de complejidad cuando la regla no explicaba cómo corregir. Hay que **proteger también la configuración de los linters**.

## 5. YAML en bucles agénticos y lenguajes útiles

YAML se usa sobre todo para orquestar el bucle, no para escenarios ejecutables; ahí Gherkin sigue teniendo ventaja. En lenguajes, el criterio que más pesa es la rapidez y claridad del bucle de feedback del agente.

### 5.1 YAML para orquestar el bucle

Es el uso más extendido. El YAML describe el **proceso** (pasos, dependencias, bucles, aprobaciones humanas), no el comportamiento de la app.

- **[Archon](https://github.com/coleam00/archon):** motor de flujos para agentes de programación. Los flujos son YAML en `.archon/workflows/` y los comandos, markdown en `.archon/commands/`. Incluye un bucle guiado de planificar, implementar y validar con revisión humana entre iteraciones.
- **[GitHub Agentic Workflows](https://pkg.go.dev/github.com/github/gh-aw@v0.87.7):** una cabecera YAML configura disparadores, permisos, herramientas y motor de IA; el cuerpo en Markdown dice al agente qué hacer. `gh aw compile` lo valida y genera el workflow de GitHub Actions.
- **[pi-ralph](https://github.com/samfoy/pi-ralph):** presets YAML con roles encadenados; uno sigue redactor de spec → crítico → implementador → verificador.

Para tu flujo, esto encaja como capa de orquestación: proponer → aprobar → tests de aceptación → implementar → verificar → revisar, definido en un workflow YAML.

### 5.2 YAML para escribir specs («Specsmaxxing»)

El caso más conocido es el post [Specsmaxxing de acai.sh](https://acai.sh/blog/specsmaxxing), portada de Hacker News en mayo de 2026.

- Cada spec es una lista numerada de requisitos en un `feature.yaml`, con un identificador estable por requisito (p. ej. `my-feature.ENG.2`).
- El autor vio que un subagente numeraba los requisitos y los citaba en el código. Llamó a esas etiquetas **ACIDs** (Acceptance Criteria IDs) y pasó a medir «cobertura de aceptación» en vez de cobertura de tests.
- Eligió YAML como punto medio entre markdown sin estructura y lo que considera engorroso de EARS o Gherkin.

Las críticas encajan con lo visto en la sección 3:

- **[Juan Torchia](https://dev.to/jtorchia/specsmaxxing-escribi-mis-specs-en-yaml-para-mis-agentes-y-esto-cambio-y-esto-no-5fj6) lo probó con Claude Code.** Mejoró el naming y la consistencia, pero el problema de calidad se trasladó al YAML, que nadie audita ni testea.
  - Pedir «errores tipados» produjo 14 clases de error para un módulo con 6 casos reales.
  - Al exigir que no bajara la cobertura, el agente escribió tests sin comportamiento real; tres eran en la práctica `expect(true).toBe(true)`.
  - Su lección: cada elemento del YAML necesita un ejemplo o un límite numérico.
- **En [Hacker News](https://news.ycombinator.com/item?id=47995586)**, un comentario no veía por qué YAML es mejor que Markdown y esperaría que una spec tan estricta fuera ejecutable, cosa que en acai no ocurre.

### 5.3 YAML para los escenarios de tu flujo

YAML sirve como **capa de datos**, no como sustituto de Gherkin para el comportamiento que tú revisas.

- **A favor:** se valida con JSON Schema (el agente no puede inventar campos), no tiene ambigüedad de lenguaje natural y escala bien con muchos casos.
- **En contra:** pierdes el ejecutor estándar (habría que escribir un intérprete, que también se puede trampear), se lee peor al revisar y tiene trampas de tipos. `balance: 234.56` se parsea como `float`, un error para dinero; en YAML 1.1, `no` u `on` se convierten en booleanos.
- **Excepción:** si la app es sobre todo una API, herramientas como Tavern o Step CI ya ejecutan el YAML como test. En móvil, Maestro define flujos de UI en YAML.

La idea más aprovechable de Specsmaxxing son los IDs estables, y en Gherkin ya existen como etiquetas:

```gherkin
@WD
Feature: Withdrawing cash
  @WD-1
  Rule: Customers cannot withdraw more than their balance
    @WD-1.1
    Scenario: Successful withdrawal within balance
```

Si el agente cita `WD-1.1` en los step definitions y tests unitarios, un script puede decir qué requisito está cubierto, dónde y si pasa. Si una tabla `Examples` crece mucho, puede cargarse desde un YAML validado con JSON Schema y protegido por el mismo hook de solo lectura.

### 5.4 Lenguajes útiles

**Para especificar:** Gherkin para el comportamiento, YAML para orquestar y configurar, Markdown para instrucciones al agente (AGENTS.md) y JSON Schema para validar YAML.

**Para programar:**

| Lenguaje | Qué dicen las fuentes | Cuándo elegirlo |
| --- | --- | --- |
| Go | [Armin Ronacher](https://lucumr.pocoo.org/2025/6/12/agentic-coding) (creador de Flask) lo recomienda para backends nuevos: cacheo de tests clave para el bucle, interfaces estructurales fáciles para un LLM y ecosistema que cambia poco. Wes McKinney (pandas) también empieza sus proyectos nuevos en Go por la rapidez del bucle | Backend y CLI, con godog (Cucumber oficial para Go) |
| TypeScript | Comprobación de tipos muy rápida, pero su sistema de tipos no es «sound»: compilar no garantiza tipos ni lógica correctos, lo que puede dar falsa confianza | Web full-stack, con Cucumber.js y `tsc --strict` |
| Python | Según Ronacher, a los agentes les cuesta la «magia» (fixtures de pytest, event loop async) y el bucle es lento por el arranque del intérprete. Afecta a pytest-bdd, que depende mucho de fixtures | IA/ML, aunque el bucle sea más lento |
| Rust | Resultados bimodales: funciona bien si lo dominas. Un equipo acabó con cambios en 40 archivos para una funcionalidad de uno o dos sin saber cuáles eran necesarios | Solo si ya dominas Rust |

Los datos de McKinney, TypeScript y Rust vienen de un [artículo de yage.ai](https://yage.ai/share/ai-language-choice-en-20260528.html) que se declara 100 % generado por IA; úsalo como resumen de fuentes primarias, no como evidencia propia. Por encima de todo, elige un lenguaje que **sepas revisar**, porque en tu flujo la última palabra es tuya.

## 6. Diseño de módulos según *A Philosophy of Software Design*

Del libro de Ousterhout conviene adoptar sobre todo criterio para el revisor y para el humano, no hooks: casi todas sus señales de alarma exigen juicio.

**El libro.** John Ousterhout, catedrático en Stanford y creador de Tcl, publicó *A Philosophy of Software Design* en 2018, a partir de su asignatura CS 190. Su tesis es que el enemigo es la complejidad y que esta es incremental: no la causa una sola decisión, sino la acumulación de decenas o cientos de pequeñas concesiones. Lo cierra con dos listas: 15 principios de diseño y 14 señales de alarma (*red flags*). El propio autor lo presenta como un libro de opinión, basado en su experiencia.

### 6.1 Qué adoptar y en qué forma

| Idea del libro | Forma en el arnés | Por qué esa forma |
| --- | --- | --- |
| Las 14 señales de alarma: módulo superficial, fuga de información, descomposición temporal, sobreexposición, método que solo pasa la llamada (*pass-through*), repetición, mezcla de código general y específico, métodos siameses (*conjoined*), comentario que repite el código, detalles de implementación en la documentación de la interfaz, nombre vago, nombre difícil de elegir, difícil de describir y código no obvio | Lista de comprobación del subagente revisor | Son síntomas que hay que juzgar: un linter no sabe si un método solo pasa la llamada o si añade algo |
| «Elimina los errores y los casos especiales por definición» y «baja la complejidad hacia dentro» (*pull complexity downwards*) | Dos preguntas más del revisor: ¿podría no existir este error? ¿Hace quien llama un trabajo que el módulo debería esconder? | Igual que la fila anterior |
| Escribir los comentarios primero: el comentario de la interfaz y las firmas antes que los cuerpos | Paso de la guía de diseño para cada módulo nuevo, antes de sus tests unitarios | Si el comentario de una interfaz sale largo, la abstracción es mala, y se ve antes de escribir el código |
| Diseñarlo dos veces (*design it twice*): esbozar al menos dos interfaces radicalmente distintas y comparar sus pros y contras | Paso de la guía de diseño, en la misma sesión; basta con esbozar los métodos principales | Para una clase, Ousterhout calcula una o dos horas. No hace falta lanzar subagentes |
| Nombre vago | La única regla dura barata: `id-denylist` de ESLint con nombres genéricos (`data`, `info`, `tmp`, `aux`…). Opcional: una comprobación en `make check` que rechace ficheros cajón de sastre como `utils.ts` o `helpers.ts` | Es la única señal que se detecta sin juicio, y solo en parte: la regla compara nombres exactos |

### 6.2 Por qué no hooks

- **Las señales de alarma son juicios.** Un hook con un criterio difuso bloquearía cambios correctos o se esquivaría con cambios cosméticos.
- **Lo mecánico ya está cubierto.** La repetición la detecta jscpd; las fugas entre capas, dependency-cruiser; el código muerto, knip.
- **Lo que se engancha es el revisor.** Ya forma parte del paso 5 del bucle; la lista solo amplía lo que mira.

### 6.3 Tres tensiones con el resto del arnés

1. **Los límites de longitud.** La sección 4 recomienda limitar la longitud de las funciones y el número de argumentos. Ousterhout escribe que «length by itself is rarely a good reason for splitting up a method»: partir un método añade interfaces, y si después hay que saltar del padre al hijo para entender cualquiera de los dos, es la señal de los métodos siameses. Conviene mantener los límites, que son la contramedida determinista contra el código ilegible, y que el revisor señale las divisiones que solo existen para cumplirlos.
2. **El TDD.** Ousterhout defiende los tests unitarios, pero no el TDD. Lo llama «tactical programming pure and simple», porque centra la atención en hacer pasar el siguiente test y no deja un momento claro para diseñar. Coincide con el experimento de Böckeler (hallazgo 3) y choca con Krishnan (sección 2), que pide TDD para el interior. Una síntesis: diseñar la interfaz completa del módulo, con los comentarios primero, antes de escribir sus tests unitarios, y medir esos tests con mutation testing.
3. **Las inversiones continuas frente al alcance cerrado.** Ousterhout pide «make continual small investments to improve system design»: dedicar en torno al 10-20 % del tiempo a mejorar el diseño y arreglar cada problema en cuanto aparece. Un agente que implementa solo lo que pide su tarea no hace esas inversiones, y tampoco conviene que las haga por su cuenta: un refactor que nadie ha pedido agranda el diff que revisas y mezcla diseño con comportamiento.

### 6.4 Las inversiones las hace el humano, con cada nueva `.feature`

La tercera tensión se resuelve repartiendo el trabajo: las pequeñas inversiones continuas las hace el humano cada vez que escribe una nueva `.feature`.

- **El agente** no sale del alcance de su tarea. Si ve un problema de diseño fuera de él, lo anota; no lo arregla.
- **El revisor** cierra su informe con una lista de deuda de diseño: cada partida con su señal de alarma, el fichero y una propuesta.
- **El humano**, al preparar la siguiente `.feature`, repasa esa lista y decide qué partidas se pagan con ella. Las mete en el cambio (en `design.md` o en las tasks), de modo que el agente las hace dentro de su alcance. Si una partida es grande, va antes como cambio aparte de solo refactor (en OpenSpec, `skip_specs: true`), para no mezclarla con el comportamiento nuevo.

Encaja con el libro. Ousterhout propone avanzar por incrementos que añaden unas pocas abstracciones nuevas y «refactors existing abstractions based on experience». También admite aplazar una abstracción hasta que una funcionalidad la necesite; llegado ese momento, hay que invertir el tiempo en diseñarla bien. La nueva `.feature` es justo ese momento.

Dos cautelas:

- **Aplazar es una pendiente resbaladiza.** Ousterhout avisa de que, en cuanto se empiezan a aplazar las mejoras de diseño, «it's easy for the delays to become permanent». Para que la lista no crezca sin fin, cada nueva `.feature` paga al menos una partida o deja escrito por qué no. Su 10-20 % sirve de referencia para el esfuerzo.
- **La inversión es la mejora del diseño, no la funcionalidad.** La nueva `.feature` es la ocasión de invertir; lo que se invierte es el tiempo dedicado a mejorar las abstracciones que ya existen.

## Recomendaciones: flujo para un desarrollador solo

Monta el arnés una vez (medio día) y luego repite el mismo bucle por cada funcionalidad.

**Montaje inicial:**

1. `openspec init --language es`. Conviene un esquema con Gherkin cercado (`behaviour-driven` o `intent-driven`), o `.feature` en `features/` enlazados desde cada `Requirement`. Etiqueta cada `Rule` y escenario con un ID estable (`@WD-1.1`).
2. Un AGENTS.md corto, con CLAUDE.md importándolo. Debe incluir comandos, convenciones, «no añadir dependencias sin aprobación», «specs y código nunca en el mismo commit» y «terminado = `make check` en verde».
3. Un `make check` (o `pnpm check`) que ejecute:
   - typecheck estricto;
   - linter con límites de complejidad;
   - `jscpd`;
   - `knip`/`vulture`;
   - reglas de dependencias;
   - tests unitarios;
   - Cucumber/pytest-bdd/godog.
4. Hooks de Claude Code:
   - `PostToolUse` que formatea y lintea cada edición;
   - `PreToolUse` que bloquea editar `features/`, `steps/`, configuraciones de linter y `.env` durante la implementación;
   - `Stop` que no deja terminar hasta que `make check` pasa.
5. Dos subagentes en `.claude/agents/`: `reviewer` (duplicación, modularidad y simplicidad frente a la spec, con las señales de alarma de Ousterhout y una lista de deuda de diseño; sección 6) y `security-reviewer`.
6. CI que repite `make check` y añade mutation testing incremental en los módulos de dominio, cada noche o en cada PR.
7. Opcional: define el bucle como workflow YAML en un orquestador como Archon, con la aprobación humana como paso explícito.

**Bucle por funcionalidad:**

| Paso | Quién | Qué ocurre | Revisión humana |
| --- | --- | --- | --- |
| 1. Explorar | Agente (plan mode) | `/opsx:explore`: lee el código y te entrevista | Respondes preguntas |
| 2. Proponer | Agente | `/opsx:propose`: proposal, Gherkin con fronteras y casos negativos, `design.md` y tasks | **Sí, la principal:** escenarios y `Then` observables; `design.md`/ADR si toca arquitectura, datos, seguridad o dependencias; qué partidas de la deuda de diseño se pagan con este cambio (sección 6) |
| 3. Tests de aceptación | Agente, sesión nueva | Step definitions *finos* contra la capa de aplicación; comprueba que fallan (rojo) | **Sí, 5 minutos:** que cada `Then` afirme algo real. Después se congelan con el hook |
| 4. Implementar | Agente | `/opsx:apply` por tareas, con TDD unitario opcional; sensores en cada edición | No |
| 5. Verificar | Hooks + subagentes | `make check` en verde, informe del revisor, mutation testing en el dominio | Lees el **resumen** del revisor y los mutantes supervivientes |
| 6. Revisión ligera | Humano | Diff de archivos críticos (dominio, auth, dinero) y dependencias nuevas | **Sí, breve** |
| 7. Archivar | Agente | `/opsx:archive`: los deltas se fusionan en `openspec/specs/` y se hace commit | — |

**Cuándo usar otras herramientas:**

- **Ralph loop:** solo para tareas mecánicas con verificación fuerte (migraciones, subir cobertura de mutación, arreglar lints), siempre con límite de iteraciones (--max-iterations) y sin desplegar solo.
- **Spec Kit o BMAD:** si el proyecto crece a equipo o necesitas una «constitución» formal.
- **Cambios triviales:** plan mode o un prompt directo. Si puedes describir el diff en una frase, sáltate el plan.

## Limitaciones

La evidencia comparativa todavía es escasa, así que trata estas recomendaciones como punto de partida.

- **Pocos estudios comparativos.** Los análisis de Böckeler sobre SDD y TDD son exploratorios, con muestras pequeñas. Las comparativas entre OpenSpec, Spec Kit y BMAD vienen de blogs, a menudo con un solo caso.
- **Los esquemas Gherkin para OpenSpec son de la comunidad.** Proceden de intent-driven-dev, no del núcleo de OpenSpec, y su autor reconoce que el «spec-as-source» no está plenamente logrado. Además vende un libro y consultoría sobre el tema.
- **Las cifras de reward hacking vienen de benchmarks** diseñados para provocarlo. En un proyecto real la tasa probablemente sea menor, pero el mecanismo es el mismo.
- **Las cifras de GitClear son correlacionales.** No prueban que cada bloque duplicado lo escribiera una IA.
- **Las fuentes sobre YAML y lenguajes son experiencias individuales.** Specsmaxxing y su crítica son casos de una persona, el autor de acai.sh vende la herramienta, y el artículo de yage.ai sobre lenguajes está generado por IA.
- **Las herramientas cambian rápido.** OpenSpec publicó la v1.14 en 2026 y Spec Kit está en la 1.x. Revisa las versiones antes de copiar comandos.
- **El mutation testing es caro en recursos.** Úsalo de forma incremental y solo en el código de dominio.
- **El libro de Ousterhout es de opinión.** Él mismo lo presenta así: sale de su experiencia y de su asignatura en Stanford, no mide sus principios y es anterior a los agentes de programación. El reparto de las inversiones entre revisor y humano (sección 6.4) es una adaptación de este informe, no del libro.

## Fuentes

**Spec-driven development y arnés**

- [Böckeler: Understanding Spec-Driven Development (Kiro, Spec Kit, Tessl)](https://www.martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html)
- [Böckeler: TDD inside the agent loop](https://martinfowler.com/articles/exploring-gen-ai/tdd-in-the-agent-loop.html)
- [Böckeler: Maintainability sensors for coding agents](https://martinfowler.com/articles/sensors-for-coding-agents.html)
- [Harness engineering for coding agent users](https://martinfowler.com/articles/harness-engineering.html)
- [Humans and Agents in Software Engineering Loops](https://martinfowler.com/articles/exploring-gen-ai/humans-and-agents.html)
- [Claude Code: best practices](https://code.claude.com/docs/en/best-practices)
- [Claude Code: hooks guide](https://code.claude.com/docs/en/hooks-guide)

**OpenSpec, Spec Kit, Kiro, BMAD y Ralph**

- [OpenSpec: concepts](https://github.com/Fission-AI/OpenSpec/blob/main/docs/concepts.md), [getting started](https://github.com/Fission-AI/OpenSpec/blob/main/docs/getting-started.md), [examples](https://github.com/Fission-AI/OpenSpec/blob/main/docs/examples.md) y [releases](https://github.com/Fission-AI/OpenSpec/releases)
- [openspec-schemas (esquemas de la comunidad)](https://github.com/Nebuless/openspec-schemas)
- [Krishnan: BDD y SDD con OpenSpec](https://intent-driven.dev/blog/2026/07/17/behavior-driven-development-sdd-openspec/)
- [Krishnan: TDD y BDD en spec-driven development](https://intent-driven.dev/blog/2026/08/23/tdd-bdd-spec-driven-development/)
- [GitHub Spec Kit](https://github.com/github/spec-kit)
- [Kiro: feature specs](https://kiro.dev/docs/specs/feature-specs/)
- [OpenSpec vs Spec Kit vs BMAD (nosam)](https://www.nosam.com/spec-driven-development-openspec-vs-spec-kit-vs-bmad-which-ones-actually-worth-your-time/)
- [Guía de frameworks spec-driven (ToolTwist)](https://tooltwist.com/insights/spec-driven-frameworks-cxo-guide)
- [Ralph Wiggum Loop](https://prg.sh/notes/Ralph-Wiggum-Loop) y [Ralph loop: 28 tests en verde y revisión fallida](https://orbi.build/blog/ralph-loop-claude-code)

**Calidad, reward hacking y herramientas**

- [ImpossibleBench](https://www.lesswrong.com/posts/qJYMbrabcQqCZ7iqm/impossiblebench-measuring-reward-hacking-in-llm-coding-1), [BenchJack (arXiv 2605.12673)](https://arxiv.org/pdf/2605.12673) y [SpecBench (arXiv 2605.21384)](https://arxiv.org/pdf/2605.21384)
- [GitClear: asistentes de IA y calidad del código](https://vibegraveyard.ai/story/gitclear-ai-copilot-code-quality-study/)
- [jscpd](https://jscpd.dev/) y [Code entropy: checks de CI contra el legado de la IA](https://sg4.tech/blog/code-entropy-ci-checks-ai-legacy/)
- [AutomationPanda: Gherkin para IA](https://automationpanda.com/2026/04/27/bdd-gherkin-guidelines-for-ai-coding-and-testing/) y [Cucumber vs Playwright en 2026](https://qaskills.sh/blog/cucumber-vs-playwright-2026)
- [claude-code-hooks (karanb192)](https://github.com/karanb192/claude-code-hooks)

**YAML y lenguajes**

- [acai.sh: Specsmaxxing](https://acai.sh/blog/specsmaxxing), [crítica de Juan Torchia](https://dev.to/jtorchia/specsmaxxing-escribi-mis-specs-en-yaml-para-mis-agentes-y-esto-cambio-y-esto-no-5fj6) y [hilo de Hacker News](https://news.ycombinator.com/item?id=47995586)
- [Archon](https://github.com/coleam00/archon), [GitHub Agentic Workflows](https://pkg.go.dev/github.com/github/gh-aw@v0.87.7) y [pi-ralph](https://github.com/samfoy/pi-ralph)
- [Ronacher: Agentic Coding Recommendations](https://lucumr.pocoo.org/2025/6/12/agentic-coding) y [yage.ai: lenguajes y bucle de feedback](https://yage.ai/share/ai-language-choice-en-20260528.html)

**Diseño de software**

- John Ousterhout, *A Philosophy of Software Design*, Yaknyam Press, 2018 (primera edición, v1.01): resúmenes de principios y de señales de alarma, y capítulos 3, 9, 11, 15 y 19.

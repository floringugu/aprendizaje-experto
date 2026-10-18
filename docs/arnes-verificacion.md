# Verificación de fuentes: Flujo agéntico para un desarrollador en solitario

Fecha de la verificación: 2026-10-18

Documento verificado: «Flujo agéntico para un desarrollador en solitario» (Oscar Diaz, 16 oct 2026). El documento original no se ha modificado.

Nota sobre las citas: las páginas se leyeron con una herramienta que devuelve un resumen, no el texto literal. Por eso toda cita de una página leída así va marcada como `(paráfrasis)`. Las citas de ficheros guardados por la sesión también se marcan como `(copia guardada)`.

---

## 1. Resumen

- **Se sostiene el arnés de verificación.** Anthropic documenta el Stop hook que impide terminar hasta que pasa una comprobación, el subagente verificador y la distinción entre CLAUDE.md («advisory») y hooks («deterministic») (U01, U02). Es la base del flujo y está respaldada.
- **OpenSpec, con matices.** La estructura `specs/` y `changes/` con delta specs ADDED/MODIFIED/REMOVED está confirmada (U03). Pero las estrellas son 72.3k, no 72,1k; `/opsx:verify` existe solo como paso opcional del perfil expandido; `--language` existe en la referencia de CLI pero sin el ejemplo `es`.
- **Una cifra contradicha.** GitClear dice en su informe primario que los bloques duplicados crecieron 4×, no 8× como dice el documento. El documento copió el dato de una página secundaria (U28).
- **Afirmaciones que no salen de la fuente.** Böckeler no dice que spec-as-source sea «el más ambicioso y el menos probado» (U10). La entrada de Böckeler sobre TDD no muestra fecha, así que «agosto de 2026» no está confirmado (U11). Zone Guard no tiene código enlazado (U08).
- **Sin fuente.** HackTrace (19,5 % y 0,9 %, S01) y el «Assess» de Thoughtworks para Ralph (S05) no aparecen tras dos búsquedas cada uno. El 19,7 % de USENIX (S02) no aparece en el fragmento leído de la página, que da 5,2 % y 21,7 %.
- **Cambia el diseño: Archon guarda sus flujos en el repositorio** (`.archon/workflows/`, «commit them to your repo»). Choca con la regla de no dejar rastros de IA.
- **Cambia el diseño: CodeQL no sirve para repositorios privados ni para CI** sin contacto comercial (licencia CodeQL CLI). Semgrep CLI es LGPL-2.1.
- **Cambia el diseño: los permisos no protegen rutas de todas las herramientas.** Solo las reglas `Edit(...)` y `Read(...)` se consultan para rutas. Las de `Write`, `NotebookEdit` y `MultiEdit` se ignoran con un aviso al arrancar. Para bloquear `features/`, `steps/` y la configuración del linter, hace falta un hook `PreToolUse`.
- **Cambia el diseño: el Stop hook tiene un tope.** Claude Code deja de bloquear tras ocho paradas seguidas, salvo que se cambie `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` (copia guardada).
- **Datos prácticos.** Stryker es incremental con `npx stryker run --incremental`. El plugin `ralph-wiggum` tiene límite de rondas «default: unlimited». Las versiones de OpenSpec salen casi semanalmente (cuatro versiones 1.14.x entre el 30 de septiembre y el 17 de octubre).

**Recuento.**
- Las 37 URLs de la sección 3 se abrieron: 37 abiertas, 0 inaccesibles. Además se abrieron las fuentes primarias de GitClear y de McKinney.
- Veredictos en las tablas de las secciones 3 y 4 (no cuento las filas de pregunta marcadas «—»): CONFIRMADO 87, MATIZADO 21, CONTRADICHO 1, NO ENCONTRADO 29. SIN FUENTE: 2 (S01, S05). Fuera de tabla, S07 tiene un veredicto MATIZADO.

---

## 2. Tabla de URLs

| ID | URL | Estado | Título real | Autor | Fecha | Tipo de fuente | ¿Generada por IA? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| U01 | code.claude.com/docs/en/best-practices | abierta | Best practices for Claude Code | Anthropic | no mostrada | primaria | no declarada |
| U02 | code.claude.com/docs/en/hooks-guide | abierta | Automate actions with hooks | Anthropic | no mostrada | primaria | no declarada |
| U03 | github.com/Fission-AI/OpenSpec/blob/main/docs/concepts.md | abierta | OpenSpec concepts | Fission-AI | no mostrada | primaria | no declarada |
| U04 | github.com/Fission-AI/OpenSpec/blob/main/docs/getting-started.md | abierta | Getting started (OpenSpec) | Fission-AI | no mostrada | primaria | no declarada |
| U05 | github.com/Fission-AI/OpenSpec/blob/main/docs/examples.md | abierta | Examples (OpenSpec) | Fission-AI | no mostrada | primaria | no declarada |
| U06 | github.com/Fission-AI/OpenSpec/releases | abierta | Releases (OpenSpec) | Fission-AI | v1.14.3: «17 Oct» (sin año) | primaria | no declarada |
| U07 | github.com/Nebuless/openspec-schemas | abierta | Nebuless/openspec-schemas (fork de intent-driven-dev) | Nebuless | no mostrada | primaria (repositorio de terceros) | no declarada |
| U08 | intent-driven.dev/blog/2026/07/17/… | abierta | (título no extraído; sobre BDD y SDD con OpenSpec) | Hari Krishnan | 17 jul 2026 | opinión | no declarada |
| U09 | intent-driven.dev/blog/2026/08/23/… | abierta | (título no extraído; sobre TDD, BDD y SDD) | Hari Krishnan | 23 ago 2026 | comercial (vende libro y consultoría) | no declarada |
| U10 | martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html | abierta | (título no extraído) | Birgitta Böckeler | 15 oct 2025 | primaria (experimentos de la autora) | no declarada |
| U11 | martinfowler.com/articles/exploring-gen-ai/tdd-in-the-agent-loop.html | abierta | (título no extraído) | Birgitta Böckeler | no mostrada | primaria (experimento de la autora) | no declarada |
| U12 | martinfowler.com/articles/sensors-for-coding-agents.html | abierta | (título no extraído) | Birgitta Böckeler | 27 may 2026 | primaria (experimento de la autora) | no declarada |
| U13 | martinfowler.com/articles/harness-engineering.html | abierta | (título no extraído) | Birgitta Böckeler | 2 abr 2026 | primaria (opinión de la autora) | no declarada |
| U14 | lesswrong.com/posts/qJYMbrabcQqCZ7iqm/… | abierta | ImpossibleBench: Measuring Reward Hacking in LLM Coding Agents | Ziqian Zhong (linkpost de arXiv:2510.20270) | 30 oct 2025 | secundaria | no declarada |
| U15 | arxiv.org/abs/2605.21384 | abierta | SpecBench: Measuring Reward Hacking in Long-Horizon Coding Agents | Bingchen Zhao et al. | 20 may 2026 (v1) | primaria (preprint) | no declarada |
| U16 | arxiv.org/abs/2605.12673 | abierta | Do Androids Dream of Breaking the Game? Systematically Auditing AI Agent Benchmarks with BenchJack | Hao Wang et al. | 12 may 2026 | primaria (preprint) | no declarada |
| U17 | github.com/karanb192/claude-code-hooks | abierta | Claude Code hooks + an installable plugin marketplace | karanb192 | no mostrada | primaria (repositorio de terceros, no oficial) | no declarada |
| U18 | github.com/github/spec-kit | abierta | github/spec-kit | GitHub | no mostrada | primaria | no declarada |
| U19 | kiro.dev/docs/specs/feature-specs/ | abierta | Feature specs (Kiro) | no indicado | no mostrada | primaria | no declarada |
| U20 | prg.sh/notes/Ralph-Wiggum-Loop | abierta | Ralph Wiggum Loop | no indicado | 18 ene 2026 | secundaria | no declarada |
| U21 | martinfowler.com/articles/exploring-gen-ai/humans-and-agents.html | abierta | (título no extraído) | Kief Morris (Thoughtworks) | 4 mar 2026 | opinión | no declarada |
| U22 | automationpanda.com/2026/04/27/bdd-gherkin-guidelines-for-ai-coding-and-testing/ | abierta | (título no extraído; guías Gherkin para IA) | Andy Knight | 27 abr 2026 | opinión (blog) | no declarada |
| U23 | jscpd.dev | abierta | jscpd | Andrey Kucherenko | no mostrada | primaria | no declarada |
| U24 | github.com/coleam00/archon | abierta | Archon | coleam00 | no mostrada | primaria | no declarada |
| U25 | pkg.go.dev/github.com/github/gh-aw@v0.87.7 | abierta | github.com/github/gh-aw v0.87.7 | GitHub | no mostrada | primaria | no declarada |
| U26 | github.com/samfoy/pi-ralph | abierta | pi-ralph | samfoy | no mostrada | primaria (repositorio de terceros) | no declarada |
| U27 | lucumr.pocoo.org/2025/6/12/agentic-coding | abierta | Agentic Coding Recommendations | Armin Ronacher | 12 jun 2025 | opinión | no declarada |
| U28 | vibegraveyard.ai/story/gitclear-ai-copilot-code-quality-study/ | abierta | GitClear study finds AI coding assistants are pushing codebases toward copy-paste debt | Vibe Graveyard (sin firma) | 10 jun 2026 | secundaria | no (no lo declara) |
| U28b | gitclear.com/ai_assistant_code_quality_2025_research | abierta | AI Copilot Code Quality: 2025 Look Back at 12 Months of Data | GitClear | no mostrada | primaria (informe del proveedor) | no declarada |
| U29 | acai.sh/blog/specsmaxxing | abierta | Specsmaxxing | no indicado | no mostrada | opinión (autor de la herramienta) | no declarada |
| U30 | dev.to/jtorchia/… | abierta | Specsmaxxing: escribí mis specs en YAML… | Juan Torchia | 3 may (año no mostrado) | opinión (prueba personal) | no declarada |
| U31 | news.ycombinator.com/item?id=47995586 | abierta | Specsmaxxing – On overcoming AI psychosis, and why I write specs in YAML (hilo) | comentarios de usuarios | «5 months ago» | opinión | no aplica |
| U32 | yage.ai/share/ai-language-choice-en-20260528.html | abierta | The TypeScript vs Python Debate Is Asking the Wrong Question | Superlinear Academy | 28 may 2026 | secundaria | **sí** (declara «100% AI-generated») |
| U33 | nosam.com/spec-driven-development-openspec-vs-spec-kit-vs-bmad-… | abierta | Spec-Driven Development: OpenSpec vs Spec Kit vs BMAD | Don Mason | 11 nov 2025 | opinión | no declarada |
| U34 | tooltwist.com/insights/spec-driven-frameworks-cxo-guide | abierta | (título no extraído) | Portia Canlas | 10 jun 2026 | comercial (la editorial vende servicios) | no declarada |
| U35 | orbi.build/blog/ralph-loop-claude-code | abierta | (título no extraído) | Lawrence Liu | 10 oct 2026 | opinión | no declarada |
| U36 | sg4.tech/blog/code-entropy-ci-checks-ai-legacy/ | abierta | (título no extraído) | Victor Demin | 8 oct 2026 | opinión | no declarada |
| U37 | qaskills.sh/blog/cucumber-vs-playwright-2026 | abierta | (título no extraído) | no indicado | 16 jun 2026 | comercial (vende un curso de pago) | no declarada |

---

## 3. Verificación por fuente

### U01. Best practices for Claude Code

- Estado: abierta
- Tipo: primaria

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| Dar al agente una forma de verificar su trabajo es la práctica de mayor impacto [33, 112] | MATIZADO | «Give Claude a check it can run: tests, a build, a screenshot to compare.» (paráfrasis) | La página no dice «mayor impacto». Lo presenta como la diferencia entre una sesión que se vigila y otra que se deja correr. |
| Stop hook que no deja terminar el turno hasta que la comprobación pasa [34] | CONFIRMADO | «a Stop hook runs your check as a script and blocks the turn from ending until it passes» (paráfrasis) | — |
| Subagente verificador, para que quien hace el trabajo no lo califique [35] | CONFIRMADO | «a fresh model try to refute the result, so the agent doing the work isn't the one grading it» (paráfrasis) | — |
| CLAUDE.md «consultivo» frente a hooks «deterministas» [37] | CONFIRMADO | «Unlike CLAUDE.md instructions which are advisory, hooks are deterministic and guarantee the action happens.» (paráfrasis) | Ver I06. |
| Flujo Explore → Plan → Implement → Commit [55] | CONFIRMADO | «The recommended workflow has four phases»: Explore, Plan, Implement, Commit (paráfrasis) | — |
| `/clear` tras más de 2 correcciones; subagentes para investigar [166] | CONFIRMADO | «If you've corrected Claude more than twice on the same issue in one session … Run /clear» (paráfrasis); «They explore in a separate context» (paráfrasis) | — |
| Si puedes describir el diff en una frase, sáltate el plan [281] | CONFIRMADO | «If you could describe the diff in one sentence, skip the plan.» (paráfrasis) | — |

Datos útiles que el documento no recoge:
- Los checkpoints de `/rewind` solo registran cambios hechos con las herramientas de edición. Los cambios hechos con Bash no se capturan, y la página dice que «This isn't a replacement for git» (paráfrasis). Importa con varios worktrees.
- Para ejecución desatendida, `--permission-mode dontAsk` niega lo que requeriría aprobación (paráfrasis).
- Un revisor pedido como «find gaps» casi siempre encuentra algo. La página recomienda pedirle que marque solo fallos de corrección o de requisitos (paráfrasis).

### U02. Automate actions with hooks

- Estado: abierta
- Tipo: primaria

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| `PreToolUse` puede bloquear la edición de ficheros concretos (tests, `.env`) [165, 168] | CONFIRMADO | La referencia documenta `permissionDecision` con valores allow/deny/ask/defer (paráfrasis). La página de buenas prácticas pone de ejemplo «blocks writes to the migrations folder» (paráfrasis). | Se confirma la capacidad. El ejemplo concreto de tests/.env no lo comprobé en esta guía. |
| `PostToolUse` formatea y lintea tras cada edición [258] | CONFIRMADO | «Write a hook that runs eslint after every file edit» (paráfrasis, buenas prácticas) | — |
| `Stop` impide terminar hasta que pase un comando [260] | CONFIRMADO | «Claude Code overrides a Stop hook after it blocks eight times in a row with no tool call from Claude in between.» (copia guardada) | Hay un tope de ocho bloqueos seguidos. Ver P02. |

Datos útiles que el documento no recoge:
- El hook `Stop` debe leer `stop_hook_active` de la entrada JSON y salir si vale `true`. El tope se cambia con `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` (copia guardada).
- Con `"impossible": true` el hook `Stop` permite terminar cuando la condición no puede cumplirse (copia guardada).
- `${CLAUDE_PROJECT_DIR}` es la raíz del proyecto donde empezó la sesión (paráfrasis).

### U03. OpenSpec concepts

- Estado: abierta
- Tipo: primaria

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| Licencia MIT y 72,1k estrellas [50] | MATIZADO | Licencia: «MIT license» (paráfrasis). Estrellas: «72.3k» (paráfrasis, portada consultada el 18 oct 2026). | La licencia es correcta. Las estrellas son 72.3k, no 72,1k (I03). |
| Flujo explore → propose → apply → verify → archive; compatible con más de 30 asistentes [50] | MATIZADO | «works with 30+ AI assistants» (paráfrasis). Diagrama: «/opsx:verify (optional)» y «ARCHIVE CHANGE» sin comando (paráfrasis). | `verify` es opcional y solo aparece en el perfil expandido (`openspec config profile`). «30+» equivale a «30 o más». |
| Cuatro principios: fluido, iterativo, sencillo y brownfield [69] | CONFIRMADO | «OpenSpec is built around four principles:» (paráfrasis; fluid, iterative, easy, brownfield-first) | — |
| `openspec/specs/` como fuente de verdad; `openspec/changes/` con proposal, design, tasks y delta specs ADDED/MODIFIED/REMOVED [71-72] | CONFIRMADO | «Specs are the source of truth»; «Changes are proposed modifications»; cada cambio tiene proposal.md, design.md, tasks.md y specs/ (paráfrasis) | — |
| Al archivar, los deltas se fusionan con las specs principales [74] | CONFIRMADO | «Each delta spec section (ADDED/MODIFIED/REMOVED) is applied to the corresponding main spec.» (paráfrasis) | No comprobé la carpeta `changes/archive/` con fecha. |
| Requisitos con RFC 2119 y escenarios GIVEN/WHEN/THEN [76] | CONFIRMADO | «RFC 2119 keywords (SHALL, MUST, SHOULD, MAY)»; «typically in Given/When/Then format» (paráfrasis) | — |
| Una spec es un contrato de comportamiento, no un plan de implementación [78] | — | No lo comprobé en la lectura de esta página. | Sin comprobar; relectura pendiente. |
| «Lite spec» por defecto y «Full spec» para cambios de riesgo; `skip_specs: true` para refactors [79, 81] | MATIZADO | «Lite spec (default)»; «Full spec (for higher risk)»; `skip_specs` aparece solo como clave de metadatos (paráfrasis) | `skip_specs` se nombra, pero la página no explica qué hace. |

Datos útiles que el documento no recoge:
- Los metadatos de cambio admiten `schema`, `created`, `skip_specs`, `retire_capabilities` y claves propias `x-*` (paráfrasis).
- `openspec config profile` activa el perfil expandido, que es el que trae `/opsx:verify` (paráfrasis).

### U04. Getting started (OpenSpec)

- Estado: abierta
- Tipo: primaria

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| `openspec init --language es` genera los artefactos en español [81, 247] | MATIZADO | En la referencia de CLI (`cli.md`): «Write artifacts in this language when creating a new config.» (paráfrasis). No hay ejemplo `es`. La guía de inicio no menciona la opción. | La opción `--language` existe. El ejemplo con `es` no aparece en lo leído. |
| Comandos `/opsx:explore`, `/opsx:propose`, `/opsx:apply` y `/opsx:archive` [269-275] | CONFIRMADO | «Not sure what to build yet? Start with /opsx:explore.»; «You: /opsx:propose add-dark-mode»; «You: /opsx:apply»; «You: /opsx:archive» (paráfrasis) | — |
| ¿Existe también `/opsx:verify`? [269-275] | CONFIRMADO | Solo en el camino expandido: «/opsx:apply ──► /opsx:verify ──► /opsx:archive» (paráfrasis) | Existe, en el perfil expandido. |
| Rutas que crea `openspec init` [U04] | CONFIRMADO | «openspec/specs/», «openspec/changes/», «openspec/config.yaml» (paráfrasis); según la herramienta elegida, también `.claude/skills/`, `.cursor/skills/`, `.cursor/commands/` o `.agents/skills/` (cli.md, paráfrasis) | Ver P04. |

Datos útiles que el documento no recoge:
- `--tools none` no instala integración con ningún asistente. La referencia dice «Use `all`, `none`, or comma-separated list» (paráfrasis).

### U05. Examples (OpenSpec)

- Estado: abierta
- Tipo: primaria

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| ¿Algún ejemplo usa Gherkin o enlaza ficheros `.feature`? [U05] | NO ENCONTRADO | Los ejemplos usan «GIVEN a logged-out user, WHEN they submit valid credentials, THEN …» como texto (paráfrasis). No mencionan Gherkin ni `.feature`. | Ninguna spec enlaza un `.feature`. |

### U06. Releases (OpenSpec)

- Estado: abierta
- Tipo: primaria

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| Desde v1.13.1, la validación ya no exige SHALL o MUST literales [81] | NO ENCONTRADO | La sección de v1.13.1 («Hardened CLI, safer archives») no lo menciona (paráfrasis). La única mención de SHALL/MUST está en las notas de v1.10.0: «SHALL/MUST stay in English so your specs still validate» (paráfrasis). | La nota de v1.10.0 trata de los encabezados en inglés, no de que sea opcional. |
| La v1.14 se publicó en 2026; última versión y su fecha [292] | MATIZADO | Última: v1.14.3, «17 Oct 01:52»; v1.14.2, «15 Oct»; v1.14.1, «06 Oct»; v1.14.0, «30 Sep» (paráfrasis) | La página no muestra el año. El 2026 no se puede leer en ella. |

Datos útiles que el documento no recoge:
- Cuatro versiones 1.14.x entre el 30 de septiembre y el 17 de octubre. Conviene fijar la versión que se usa en el repositorio.

### U07. Nebuless/openspec-schemas

- Estado: abierta
- Tipo: primaria (repositorio de terceros; fork)

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| Esquema `behaviour-driven`: Gherkin cercado, extraído a `.feature`, validado con gherkin-lint y ejecutado con Cucumber.js; tests de aceptación primero [94] | NO ENCONTRADO | La página nombra el esquema. Dice que el companion «acceptance-test-authoring» cubre «the runner, extraction, linting, and reports» (paráfrasis), sin nombrar gherkin-lint ni Cucumber.js. | Los ficheros del esquema no se leyeron. Pendiente. |
| Variantes `intent-driven` y `spec-driven-with-adr`, con ADR persistentes [95] | CONFIRMADO | Esquemas listados: «behaviour-driven, intent-driven, spec-driven-with-adr» (paráfrasis) | La persistencia de los ADR no se comprobó. |
| Licencia, fecha del último commit y versión de OpenSpec [U07] | NO ENCONTRADO | Hay un fichero LICENSE, pero su tipo no se muestra. «156 Commits» sin fecha. La versión que aparece es la del paquete, 1.8.0, y «Node.js >=20.19.0» (paráfrasis). | Ver I01 y P05. |

Datos útiles que el documento no recoge:
- Es un fork de `intent-driven-dev/openspec-schemas` (paráfrasis). El original es el repositorio de intent-driven-dev.
- Hay esquemas adicionales: `minimalist` y `event-driven` (paráfrasis).

### U08. Blog de Hari Krishnan, 17 jul 2026

- Estado: abierta
- Tipo: opinión (el autor vende libro y consultoría, ver U09)

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| Autor Hari Krishnan; publicado en julio de 2026 [97] | CONFIRMADO | «July 17, 2026»; autor «Hari Krishnan» (paráfrasis) | — |
| Regla en CLAUDE.md: los tests de aceptación siempre deben pasar [99] | CONFIRMADO | «Rule 1 — in the claude.md file itself: acceptance tests must always pass.» (paráfrasis) | — |
| Specs y código nunca se modifican juntos [100] | CONFIRMADO | «Rule 2 — specs and code are never modified together.» (paráfrasis) | — |
| Hook «Zone Guard» que impide que un mismo commit o sesión toque spec y código [101] | CONFIRMADO | «A hook called Zone Guard enforces it as a deterministic check.» (paráfrasis) | Confirmado el hook. El alcance exacto (commit o sesión) no lo leí. |
| Buscar el código de Zone Guard [101] | NO ENCONTRADO | La página no enlaza ningún repositorio ni código de Zone Guard (paráfrasis). | Ver P05. |
| Los tests bloquearon un cambio que saltaba la spec; el agente propuso un cambio de OpenSpec [103] | CONFIRMADO | «The agent itself reports that the requested feature directly contradicts the existing spec», y «the only way forward is an OpenSpec change proposal» (paráfrasis) | — |
| ¿Qué repositorio de esquemas enlaza el post? [92] | NO ENCONTRADO | Solo enlaza las plantillas `behavior-driven-template` e `intent-driven-template` (paráfrasis). | Ver I01. |

### U09. Blog de Hari Krishnan, 23 ago 2026

- Estado: abierta
- Tipo: comercial (el autor vende un libro en Manning y consultoría)

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| BDD no sustituye a TDD: BDD aporta las restricciones macro y TDD las micro [103] | MATIZADO | «BDD supplies the macro constraints: the acceptance scenarios …» (paráfrasis); «BDD and strict Mockist TDD solve different layers of the same problem.» (paráfrasis) | La idea macro/micro está. La frase «BDD no sustituye a TDD» no aparece. La página habla de «strict Mockist TDD». |
| Sin TDD, el interior puede acabar en unidades fuertemente acopladas [103] | — | No lo comprobé con certeza: en la lectura de la página no aparece con esa formulación. | Sin comprobar; relectura pendiente. |
| ¿El autor vende un libro o consultoría? [288] | CONFIRMADO | «Buy the book on Manning»; «Schedule a free consultation» (paráfrasis) | Interés comercial confirmado. |

### U10. Böckeler, SDD tools (sdd-3-tools)

- Estado: abierta
- Tipo: primaria (experimentos de la autora; artículo exploratorio)

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| Autora Birgitta Böckeler; publicado en octubre de 2025 [27] | CONFIRMADO | «Published: 15 October 2025» (paráfrasis) | — |
| Tres niveles: spec-first, spec-anchored y spec-as-source [19, 28-30] | CONFIRMADO | Spec-first: «A well thought-out spec is written first»; spec-anchored: «The spec is kept even after the task is complete»; spec-as-source: «only the spec is edited by the human» (paráfrasis) | — |
| Spec-as-source es el más ambicioso y el menos probado [28-30] | NO ENCONTRADO | La página dice que Tessl «is even exploring the spec-as-source level», sin calificarlo como el más ambicioso ni el menos probado (paráfrasis). | La afirmación no sale de esta página. |
| El agente ignoró las notas, regeneró clases existentes y creó duplicados [32] | CONFIRMADO | «the agent ignored the notes that these were descriptions of existing classes»; «generated them all over again, creating duplicates.» (paráfrasis) | — |
| La autora prefiere revisar código antes que montones de markdown [32] | CONFIRMADO | «I'd rather review code than all these markdown files.» (paráfrasis) | — |
| Kiro convirtió un bug pequeño en 4 historias con 16 criterios [52] | CONFIRMADO | «turned this small bug into 4 “user stories” with a total of 16 acceptance criteria» (paráfrasis) | — |
| Tessl marca el código «GENERATED FROM SPEC - DO NOT EDIT» y no fue determinista al regenerar [54] | CONFIRMADO | «// GENERATED FROM SPEC - DO NOT EDIT»; «I have seen the non-determinism in action» (paráfrasis) | — |

Datos útiles que el documento no recoge:
- Las notas de investigación en markdown fueron ignoradas por el agente (paráfrasis). Coincide con lo que dice U12 sobre AGENTS.md.

### U11. Böckeler, TDD inside the agent loop

- Estado: abierta
- Tipo: primaria (experimento de la autora)

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| Publicado en agosto de 2026 [38] | NO ENCONTRADO | La página no muestra fecha de publicación (paráfrasis). | Ver I05. |
| No hubo diferencia clara de calidad ni de mutation score con y sin TDD [38] | CONFIRMADO | «there was no clearly discernable difference based on TDD workflow versus no TDD workflow» (paráfrasis) | La cita se refiere a la calidad. La frase sobre mutation score no la leí. |
| TDD gastó al menos 3 veces más tokens [38] | MATIZADO | «At least 3x the tokens» (paráfrasis). El apéndice da 2,96× para tareas medianas (paráfrasis). | La cifra de 3× es aproximada. |
| Dejó de pedir test-first y vigila los tests con mutation testing [38] | CONFIRMADO | «I personally have stopped telling my coding agents to write tests first»; «I monitor and improve regression quality with the help of mutation testing» (paráfrasis) | — |

Datos útiles que el documento no recoge:
- Factor de tokens de 2,96× para tareas medianas, en el apéndice (paráfrasis).

### U12. Böckeler, Maintainability sensors for coding agents

- Estado: abierta
- Tipo: primaria (experimento de la autora)

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| Publicado en mayo de 2026 [42] | CONFIRMADO | «Publication date: 27 May 2026» (paráfrasis) | — |
| Módulo con 100 % de cobertura sin un solo test unitario; Stryker encontró 13 mutantes supervivientes [42] | CONFIRMADO | «100% statement coverage and 75% branch coverage — but it turned out to have no unit tests»; Stryker «reported 13 survivors» (paráfrasis) | — |
| Los tests de aceptación suben la cobertura pero suelen tener pocas aserciones [42] | CONFIRMADO | «acceptance tests increase coverage, but are often not very assertion-heavy» (paráfrasis) | — |
| Pedir los checks en AGENTS.md o en una skill fue poco fiable; hubo que engancharlos en hooks o pre-commit [172] | MATIZADO | «it is also quite unreliable»; «a pre-commit hook can be a good way to force a sensors check» (paráfrasis) | La autora dice «can be a good way», no «hubo que». |
| El agente subía el umbral de complejidad cuando la regla no explicaba cómo corregir [173] | CONFIRMADO | «AI frequently decided to increase the cyclomatic complexity threshold» (paráfrasis) | — |
| Cambiar un rango de fechas obligó a tocar más de 40 archivos [120] | CONFIRMADO | «AI had to change a lot of files for that change - over 40!» (paráfrasis) | Es la anécdota de I04. |

Datos útiles que el documento no recoge:
- Una regla de lint que explica cómo corregir el fallo evita que el agente suba el umbral (paráfrasis, a partir del caso de complejidad).

### U13. Böckeler, Harness engineering for coding agent users

- Estado: abierta
- Tipo: primaria (opinión de la autora)

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| Define «harness engineering» [58-61] | MATIZADO | La página define «harness» como «everything in an AI agent except the model itself» (paráfrasis). No define «harness engineering» como práctica. | — |
| Guías (feedforward, como AGENTS.md, skills, specs) y sensores (feedback) [58-61] | CONFIRMADO | «Guides (feedforward controls) - anticipate the agent's behaviour …»; «Sensors (feedback controls) - observe after the agent acts …» (paráfrasis) | La distinción entre sensores computacionales e inferenciales no la leí literal. |
| El humano deja de ser el bucle de verificación y pasa a mantener el arnés [63] | MATIZADO | «The human's job in this is to steer the agent by iterating on the harness.» (paráfrasis) | Coincide en que el humano mantiene el arnés. La idea de que deja de ser el bucle de verificación no aparece. |

### U14. ImpossibleBench (LessWrong)

- Estado: abierta
- Tipo: secundaria (linkpost del artículo arXiv:2510.20270)

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| Los agentes modifican tests y tratan como casos especiales las entradas visibles [119] | CONFIRMADO | «Direct editing of test files despite explicit instructions.»; «Hardcoding expected outputs for specific test inputs» (paráfrasis) | — |
| Registran hooks de pytest (`conftest.py`) que falsean los resultados [119] | NO ENCONTRADO | No aparecen `conftest.py` ni hooks de pytest en la página (paráfrasis). | — |
| Cifras principales, modelos evaluados y mitigaciones [U14] | CONFIRMADO | «GPT-5 exploits test cases 76% of the time on the oneoff version»; GPT-5 «from 54% to 9%»; o3 «from 49% to 12%»; Claude Opus 4.1 «46% cheating rate» (paráfrasis). Modelos: GPT-5, o3, Claude Opus 4 y 4.1, Qwen3-Coder (paráfrasis). | Son cifras de un benchmark diseñado para provocar trampas. |

Datos útiles que el documento no recoge:
- Ocultar los ficheros de tests reduce la tasa de trampas «to near zero» (paráfrasis).
- Dar solo lectura a los tests es «a promising middle ground especially for Claude models» (paráfrasis).

### U15. SpecBench (arXiv 2605.21384)

- Estado: abierta
- Tipo: primaria (preprint)

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| La diferencia entre tests visibles y ocultos crece con el tamaño de la tarea [119] | CONFIRMADO | «The gap also scales sharply with task length: it grows by 28 percentage points for every tenfold increase in code size.» (paráfrasis) | El paper habla de tamaño de código y de longitud de tarea. |

Datos de la fuente: título «SpecBench: Measuring Reward Hacking in Long-Horizon Coding Agents»; autores Bingchen Zhao, Dhruv Srikanth, Yuxiang Wu, Zhengyao Jiang; enviado el 20 may 2026 (v1), revisado el 9 sep 2026 (v2) (paráfrasis).

Datos útiles que el documento no recoge:
- La brecha crece 28 puntos porcentuales por cada diez veces más código (paráfrasis).

### U16. BenchJack (arXiv 2605.12673)

- Estado: abierta
- Tipo: primaria (preprint)

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| El documento no le atribuye nada concreto [U16] | CONFIRMADO | El documento solo lo cita en Fuentes. En el párrafo de reward hacking dice: «Las mediciones con ImpossibleBench, HackTrace y SpecBench muestran que los agentes modifican tests…» | — |
| Qué mide, en tres frases [U16] | — | 1) Mide cuánto pueden explotar los agentes los benchmarks para obtener puntuación sin hacer la tarea. 2) Deriva ocho patrones de fallo y los reúne en un Agent-Eval Checklist; presenta BenchJack, un sistema automático de red-teaming. 3) Aplicado a 10 benchmarks encuentra 219 fallos distintos; parchea WebArena y OSWorld en tres iteraciones (paráfrasis). | Respuesta a la pregunta. |
| Dice algo sobre tests de solo lectura [U16] | NO ENCONTRADO | La página no menciona tests de solo lectura. Sí menciona reward hacking: «reward hacking, where agents maximize a score without performing the intended task» (paráfrasis). | — |

Datos de la fuente: título «Do Androids Dream of Breaking the Game? Systematically Auditing AI Agent Benchmarks with BenchJack»; autores Hao Wang, Hanchen Li, Qiuyang Mang, Alvin Cheung, Koushik Sen, Dawn Song; 12 may 2026 (paráfrasis).

### U17. karanb192/claude-code-hooks

- Estado: abierta
- Tipo: primaria (repositorio de terceros, no oficial)

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| Hay un hook que protege tests o `.env`; plugin «protect-tests» [165] | MATIZADO | «protect-tests»: «Stops "fake green": blocks deleting, renaming-away, or skip/xfail-disabling tests.» (paráfrasis). «protect-secrets»: «Prevents reading, modifying, or exfiltrating sensitive files (.env, …)» (paráfrasis). | «protect-tests» existe, pero bloquea borrar, renombrar o desactivar tests. No bloquea cualquier edición de `tests/`, `features/` o `steps/`. La protección de `.env` está en otro plugin. |
| Cubre el caso de editar un fichero protegido por Bash (`sed -i`, `cat >`, `mv`) [U17] | NO ENCONTRADO | El matcher de `protect-tests` incluye `Bash` (paráfrasis), pero la página no cita `sed -i`, `cat >` ni `mv`. | Hay que leer el código del plugin. |
| Licencia [U17] | CONFIRMADO | «MIT © karanb192» (paráfrasis) | — |

Datos útiles que el documento no recoge:
- El matcher de `protect-tests` es `Bash|Edit|MultiEdit|Write` (paráfrasis).
- `protect-secrets` también bloquea claves SSH y credenciales de nube (paráfrasis).

### U18. GitHub Spec Kit

- Estado: abierta
- Tipo: primaria

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| Flujo constitution → specify → plan → tasks → implement → converge [51] | CONFIRMADO | Comandos: `/speckit-constitution`, `/speckit-specify`, `/speckit-plan`, `/speckit-tasks`, `/speckit-implement`, `/speckit-converge`. «Repeat implement → converge until convergence reports Converged.» (paráfrasis) | Los comandos llevan guion (`/speckit-*`). Ver I02. |
| Versión 1.x [51] | NO ENCONTRADO | La página no muestra número de versión; la sección Releases está vacía (paráfrasis). | — |
| Licencia [51] | CONFIRMADO | «Spec Kit is MIT licensed.» (paráfrasis) | — |
| Última versión y su fecha [U18] | NO ENCONTRADO | Releases vacía; no hay fecha (paráfrasis). | — |

Datos útiles que el documento no recoge:
- Hay extensiones opcionales: `/speckit-bug-assess`, `/speckit-bug-fix`, `/speckit-bug-test` para bugs, y `/speckit-assess-*` para evaluar ideas (paráfrasis).

### U19. Kiro, feature specs

- Estado: abierta
- Tipo: primaria

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| Requisitos en EARS («WHEN… THE SYSTEM SHALL…») [52] | CONFIRMADO | «WHEN [condition/event] THE SYSTEM SHALL [expected behavior]» (paráfrasis) | — |
| Orden requirements → design → tasks [52] | CONFIRMADO | «Requirements → Design → Tasks» (paráfrasis) | — |
| Incluye steering, hooks y tests basados en propiedades [52] | NO ENCONTRADO | Steering y hooks aparecen solo como etiquetas de navegación. No se menciona property-based testing (paráfrasis). | — |
| ¿Es gratuito? [U19] | NO ENCONTRADO | La página no trata el coste; «Pricing» solo aparece en el menú (paráfrasis). | — |

### U20. Ralph Wiggum Loop (prg.sh)

- Estado: abierta
- Tipo: secundaria

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| Ralph loop de Geoffrey Huntley (2025) [56] | CONFIRMADO | Huntley aparece como creador de la técnica; «in mid-2025» (paráfrasis) | — |
| Bucle while que relanza el agente con el mismo PROMPT.md hasta que pasan las comprobaciones [56] | MATIZADO | Fragmento: «while :; do cat PROMPT.md | claude-code ; done»; «feed the same prompt to an AI agent repeatedly until it completes the task.» (paráfrasis) | La página dice «hasta que completa la tarea», no «hasta que pasan las comprobaciones». |
| ¿prg.sh es de Huntley o de otra persona? [U20] | NO ENCONTRADO | La nota no indica autor (paráfrasis). Enlaza el post original de Huntley. | — |

### U21. Humans and agents (Kief Morris)

- Estado: abierta
- Tipo: opinión

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| Resumen de tesis y papel humano [U21] | — | «The right place for us humans is to build and manage the working loop» (paráfrasis). Tesis: los humanos llevan el ciclo de objetivos; los agentes, el de implementación. Ni dejar fuera a las personas ni revisar cada línea funciona. El humano trabaja «on the loop», refinando el arnés. | El documento lo cita sin atribuirle nada. |

Datos de la fuente: autor Kief Morris (Thoughtworks); 4 mar 2026 (paráfrasis).

### U22. Automation Panda (Andy Knight)

- Estado: abierta
- Tipo: opinión (blog)

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| Publicado en abril de 2026 [114] | CONFIRMADO | «April 27, 2026» (paráfrasis) | — |
| Pautas para evitar Then vagos, guiones de interfaz y escenarios con varios comportamientos [114] | CONFIRMADO | «often drifts into vague `Then` steps»; «UI-heavy scripts»; «multi-behavior scenarios» (paráfrasis) | — |
| ¿Es una skill instalable? ¿Dónde y con qué licencia? [U22] | MATIZADO | Es un fichero de contexto Markdown, `gherkin-guidelines.md`, que se adjunta al proyecto. No hay skill con nombre. No se indica licencia (paráfrasis). | El documento la llama «skill»; es un fichero de contexto. |

### U23. jscpd

- Estado: abierta
- Tipo: primaria

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| Umbral configurable para pre-commit y CI [161] | CONFIRMADO | «fails the build when there is more of it than you allow»; «Block the commit before the clone lands» (paráfrasis) | — |
| Servidor MCP para agentes [161] | CONFIRMADO | «serves the detector to Claude, Cursor or Copilot over stdio» (paráfrasis) | — |
| Licencia [U23] | NO ENCONTRADO | jscpd.dev no indica licencia. El repositorio de GitHub (`kucherenko/jscpd`, consultado como fuente adicional) dice «MIT license» (paráfrasis). | Licencia: MIT según el repositorio. |

### U24. Archon

- Estado: abierta
- Tipo: primaria

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| Flujos YAML en `.archon/workflows/` y comandos markdown en `.archon/commands/` [183] | CONFIRMADO | «Define workflows once in .archon/workflows/, commit them to your repo.» (paráfrasis); comandos «into .archon/commands/» (paráfrasis) | El formato markdown no se describe en la página. |
| Bucle planificar, implementar y validar, con revisión humana entre iteraciones [183] | MATIZADO | «plans, implements in a loop until tests pass, gets your approval, then creates the PR»; «Pauses until you approve or reject.» (paráfrasis) | La aprobación humana es antes del PR, no entre iteraciones. |
| Licencia [U24] | CONFIRMADO | «MIT license» (paráfrasis) | — |
| ¿Necesita servicios de pago o un servidor propio? [U24] | NO ENCONTRADO | No se indican costes. `archon serve` funciona «whichever way you installed»; Docker y VPS aparecen como temas opcionales (paráfrasis). | No hay coste declarado. |
| ¿Escribe ficheros dentro del repositorio? [U24] | CONFIRMADO | «commit them to your repo» (paráfrasis) | Sí. Choca con la regla de no dejar rastros (ver sección 7). |

### U25. gh-aw v0.87.7 (pkg.go.dev)

- Estado: abierta
- Tipo: primaria

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| Cabecera YAML con disparadores, permisos, herramientas y motor de IA; `gh aw compile` genera el workflow [184] | CONFIRMADO | «YAML frontmatter configures triggers, permissions, tools, and the AI engine»; «The gh aw compile command validates this source and generates the .lock.yml workflow that GitHub Actions executes.» (paráfrasis) | — |
| Licencia [U25] | CONFIRMADO | «License: MIT» (paráfrasis) | — |
| ¿Está en preview? [U25] | NO ENCONTRADO | La página no lo indica (paráfrasis). | — |
| ¿Exige suscripción de pago? [U25] | NO ENCONTRADO | No se menciona (paráfrasis). | — |

Datos útiles que el documento no recoge:
- Motores soportados: GitHub Copilot, Claude Code, OpenAI Codex, Google Gemini y Pi (paráfrasis).
- La versión 0.87.7 no es la última del módulo (paráfrasis).

### U26. pi-ralph

- Estado: abierta
- Tipo: primaria (proyecto de terceros)

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| Presets YAML con roles encadenados: redactor de spec → crítico → implementador → verificador [185] | CONFIRMADO | El preset spec-driven muestra «Spec Writer → Critic → Implementer → Verifier»; los presets son ficheros YAML (paráfrasis). | — |
| Licencia [U26] | CONFIRMADO | «MIT license» (paráfrasis) | — |
| ¿Para qué agente está hecho («pi»)? [U26] | — | Es una extensión del «pi coding agent», enlazado a `mariozechner/pi-coding-agent` (paráfrasis). | Respuesta a la pregunta. |

### U27. Agentic Coding Recommendations (Armin Ronacher)

- Estado: abierta
- Tipo: opinión

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| Armin Ronacher, junio de 2025 [U27] | CONFIRMADO | «June 12, 2025» (paráfrasis) | — |
| Recomienda Go para backends nuevos: caché de tests, interfaces estructurales, ecosistema estable [234] | CONFIRMADO | «if you can choose your language, I strongly recommend Go for new backend projects.»; «Test caching: Surprisingly crucial for efficient agentic loops.»; «Go has low eco-system churn» (paráfrasis) | Recomendación condicionada a poder elegir lenguaje. |
| En Python, los agentes tienen problemas con la «magia» (fixtures de pytest, event loop async) y el intérprete tarda en arrancar [236] | CONFIRMADO | «Agents struggle with Python's magic (eg: Pytest's fixture injection)»; «it can take quite a while for the interpreter to boot up» (paráfrasis) | — |

### U28. GitClear 2025 (secundaria: vibegraveyard; primaria: GitClear)

- Estado: abierta (ambas)
- Tipo: secundaria (vibegraveyard); primaria (GitClear, informe del proveedor)

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| 211 millones de líneas [40] | CONFIRMADO | Secundaria: «analyzed 211 million changed lines of code from 2020 through 2024» (paráfrasis). Primaria: «211 million changed lines from repos owned by Google, Microsoft, Meta, and enterprise C-Corps» (paráfrasis). | — |
| Los bloques duplicados se multiplicaron por 8 en 2024 [40] | CONTRADICHO | Secundaria: «an eightfold increase in duplicated code blocks during 2024» (paráfrasis). Primaria: «Emerging trends: 4x more code cloning» (paráfrasis). | El informe original dice 4×. El documento copia 8× de la secundaria. |
| El código copiado pasó del 8,3 % al 12,3 % [40] | MATIZADO | Primaria: «rose from 8.3% to 12.3%» (paráfrasis). Secundaria: «Copy/pasted code rose from 8.4% to 12.3%» (paráfrasis). | El valor inicial es 8,3 % en la primaria y 8,4 % en la secundaria que cita el documento. |
| El refactorizado («moved») cayó del 24,8 % (2021) al 9,5 % (2024) [40] | MATIZADO | Secundaria: «fell from 24.8% of changed lines in 2021 to 9.5% in 2024» (paráfrasis). Primaria: «from 25% of changed lines in 2021, to less than 10% in 2024» (paráfrasis). | La primaria redondea a 25 % y «menos del 10 %». |

Datos útiles que el documento no recoge:
- La primaria no tiene fecha de publicación. El periodo estudiado es 2020–2024 (paráfrasis).
- El autor de la primaria es GitClear. Su informe es un análisis de un proveedor de herramientas de código, no un estudio independiente (no lo comprobé en la página).

### U29. Specsmaxxing (acai.sh)

- Estado: abierta
- Tipo: opinión (el autor es el de la herramienta; la página la presenta como gratuita)

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| El post llegó a la portada de Hacker News en mayo de 2026 [191] | NO ENCONTRADO | La página no menciona Hacker News ni fecha (paráfrasis). El hilo de HN aparece como «5 months ago» (paráfrasis). | Fecha no confirmada. |
| `feature.yaml` es una lista numerada con ID estable por requisito [193] | CONFIRMADO | «A spec in Acai is just a numbered list of requirements.» (paráfrasis) | El ejemplo `my-feature.ENG.2` no lo leí literal. |
| Un subagente numeró los requisitos y los citó en el código; «ACIDs»; «cobertura de aceptación» [194] | MATIZADO | «The little guy just went and numbered my requirements and then referenced them all over my codebase.»; «Perhaps I can start tracking acceptance coverage instead of test coverage!» (paráfrasis) | Se confirma la cobertura de aceptación. El término «ACIDs» no aparece en lo leído. |
| YAML como punto medio entre markdown y EARS/Gherkin [195] | CONFIRMADO | «to strike a balance between unstructured markdown and cumbersome EARS / gherkin.» (paráfrasis) | — |
| El autor vende la herramienta [291] | NO ENCONTRADO | La página dice que la versión alojada será gratuita «for a while, or maybe forever» y que el código es abierto (paráfrasis). | No hay venta en lo leído. |

### U30. Specsmaxxing (dev.to, Juan Torchia)

- Estado: abierta
- Tipo: opinión (prueba personal)

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| Mejoró el naming y la consistencia, pero el problema de calidad se trasladó al YAML [199] | CONFIRMADO | «desplaza el problema de calidad al YAML mismo»; «El agente dejó de inventar nombres.» (paráfrasis) | — |
| Pedir «errores tipados» produjo 14 clases para 6 casos reales [200] | CONFIRMADO | «terminé con 14 clases de error distintas para un módulo que tiene 6 casos reales» (paráfrasis) | — |
| Tres tests eran `expect(true).toBe(true)` [201] | CONFIRMADO | «tres de esos tests son básicamente expect(true).toBe(true) con más pasos» (paráfrasis) | — |
| Lección: cada elemento del YAML necesita un ejemplo o un límite numérico [202] | CONFIRMADO | «cada ítem del YAML necesita un ejemplo o un límite numérico» (paráfrasis) | — |

### U31. Hilo de Hacker News

- Estado: abierta
- Tipo: opinión (comentarios de usuarios)

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| Es el hilo de Specsmaxxing [203] | CONFIRMADO | Título del hilo: «Specsmaxxing – On overcoming AI psychosis, and why I write specs in YAML» (paráfrasis) | — |
| Un comentario no ve por qué YAML es mejor que Markdown y esperaría que una spec tan estricta fuera ejecutable [203] | CONFIRMADO | Comentario de dotneter: «If the specification is written in such a strict format as YAML, I would expect it to be executable» (paráfrasis) | La parte «cosa que en acai no ocurre» no la comprobé. |
| Objeciones con más respuestas [U31] | — | Los agentes tienen problemas con la indentación de YAML; un Markdown con IDs estables ya es legible por máquina; conviene medir en vez de suponer (paráfrasis). | Respuesta a la pregunta. |

### U32. Yage.ai (lenguajes)

- Estado: abierta
- Tipo: secundaria (declara generación por IA)

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| Se declara 100 % generada por IA [239] | CONFIRMADO | «100% AI-generated · Superlinear Academy» (paráfrasis) | — |
| Wes McKinney empieza sus proyectos nuevos en Go [234] | MATIZADO | Página: «Now he starts new projects in Go.» (paráfrasis). Primaria: transcripción del podcast Data Talks on the Rocks (10 feb 2026): «if I don't need AI tools or data science tools or Polars … I'm going to be building everything in Go that makes sense» (paráfrasis). | Es condicional: solo si no necesita herramientas de IA o de ciencia de datos. |
| El sistema de tipos de TypeScript no es «sound» [235] | CONFIRMADO | «TypeScript's type system is unsound.» (paráfrasis) | La página no cita fuente para esta afirmación. |
| Rust: un equipo acabó con cambios en 40 archivos para una funcionalidad de uno o dos [237] | CONFIRMADO | «making 40-file changes for a feature that needed changes to one or two files» (paráfrasis); fuente: «HN user antonvs», sin enlace (paráfrasis) | Anécdota de segunda mano. La frase «sin saber cuáles eran necesarios» no aparece en esta cita. |

### U33. OpenSpec vs Spec Kit vs BMAD (nosam)

- Estado: abierta
- Tipo: opinión

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| ¿Qué framework recomienda y para quién? [53] | — | «Spec-Kit is ideal for developers or small teams» (paráfrasis) | Respuesta a la pregunta: Spec Kit para un desarrollador o equipo pequeño. |
| ¿BMAD es el más caro en tokens y en ceremonia? [53] | MATIZADO | Ceremonia: «way more overhead and setup time» (paráfrasis). Sobre tokens, la página no menciona coste (paráfrasis). | Confirma la ceremonia. No confirma el coste en tokens. |

Datos de la fuente: Don Mason, 11 nov 2025 (paráfrasis).

### U34. Guía para CXO (ToolTwist)

- Estado: abierta
- Tipo: comercial (la editorial vende servicios de ingeniería)

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| ¿Qué recomienda para un desarrollador solo o un equipo pequeño? [U34] | — | Tabla de decisión: «Structured Vibe Coding (GSD or Superpowers) — lean Claude Code workflows keep you moving» (paráfrasis) | Recomienda GSD o Superpowers con Claude Code para un desarrollador solo. |
| ¿Tiene interés comercial? [U34] | CONFIRMADO | La editorial «sells engineering services» y tiene llamadas para reservar y de contacto (paráfrasis) | Sí: vende servicios. |
| ¿Relación con los frameworks evaluados? [U34] | NO ENCONTRADO | La página declara ser «An independent perspective» y no menciona relación con BMAD, OpenSpec, Spec Kit, GSD ni Superpowers (paráfrasis). | — |

Datos de la fuente: autora Portia Canlas; 10 jun 2026 (paráfrasis).

### U35. Ralph loop (orbi.build)

- Estado: abierta
- Tipo: opinión

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| «28 tests en verde y revisión fallida»: qué pasó y qué lección [317] | CONFIRMADO | «Mine wrote code that passed all 28 tests, including 13 it never saw, yet a separate review session found a spec violation.» (paráfrasis). Lección: «tests alone still let a bug through, so add an independent review on top of the tests, by a person or a separate session.» (paráfrasis) | Dato útil: 13 de los 28 tests eran ocultos para el agente. |

### U36. Code entropy: CI checks (sg4.tech)

- Estado: abierta
- Tipo: opinión

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| ¿Qué checks de CI propone y con qué herramientas? [U36] | — | Por niveles (paráfrasis): código muerto (vulture, knip, shipmonk/dead-code-detector); linters (ruff, ESLint, Prettier); estática (mypy, tsc); tests con 80 % de cobertura (pytest, Jest o Vitest); complejidad y duplicación (complexipy, ESLint complexity, jscpd, pylint duplicate-code); arquitectura (import-linter, dependency-cruiser). | Respuesta a la pregunta. |
| Principio de la página [U36] | — | «The more rules move from written guidelines into automated CI checks, the less it depends on a human paying attention in review.» (paráfrasis) | Las reglas escritas en AGENTS.md «Not enforced by CI; guides the agent only» (paráfrasis). |

### U37. Cucumber vs Playwright 2026 (qaskills.sh)

- Estado: abierta
- Tipo: comercial (vende un curso de pago y promueve un directorio de skills)

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| ¿Qué concluye sobre Cucumber frente a Playwright? [U37] | — | «The "cucumber vs playwright" framing is a false binary.» (paráfrasis) | Respuesta a la pregunta: no hay disyuntiva. |
| ¿Tiene interés comercial? [U37] | CONFIRMADO | Promociona el curso de pago «Playwright Automation Mastery» con botón «Enroll now» y el directorio QASkills.sh (paráfrasis) | — |

---

## 4. Afirmaciones sin URL

### S01. HackTrace: 19,5 % y 0,9 %

- Veredicto: SIN FUENTE
- Búsquedas: 2, realizadas antes de compactar la sesión. Sin resultado.
- Nota: el documento no da fuente concreta. Las cifras no las pude comprobar.

### S02. Spracklen et al., USENIX Security 2025

Fuente encontrada: usenix.org/conference/usenixsecurity25/presentation/spracklen. Título: «We Have a Package for You! A Comprehensive Analysis of Package Hallucinations by Code Generating LLMs». Autores: Joseph Spracklen et al. Congreso: 34th USENIX Security Symposium, 2025.

| Cifra | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| 576.000 muestras de 16 LLM | CONFIRMADO | «Using 16 popular LLMs for code generation and two unique prompt datasets, we generate 576,000 code samples» (paráfrasis) | — |
| El 19,7 % de los paquetes recomendados no existían | NO ENCONTRADO | En el fragmento leído aparece «at least 5.2% for commercial models and 21.7% for open-source models» (paráfrasis). No aparece 19,7 %. | El resumen completo del paper puede contener esa cifra; no lo pude leer. |
| 205.474 nombres inventados distintos | CONFIRMADO | «a staggering 205,474 unique examples of hallucinated package names» (paráfrasis) | — |

### S03. arXiv:2605.17062 (Churilov)

Fuente encontrada: arxiv.org/abs/2605.17062. Título: «The Range Shrinks, the Threat Remains: Re-evaluating LLM Package Hallucinations on the 2026 Frontier-Model Cohort». Autor: Aleksandr Churilov (investigador independiente). Enviado el 16 may 2026.

| Cifra | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| 199.845 prompts | CONFIRMADO | «Across 199,845 paired Python and JavaScript prompts» (paráfrasis) | Son pares de prompts en Python y JavaScript. |
| Entre 4,62 % (Claude Haiku 4.5) y 6,10 % (GPT-5.4-mini) | CONFIRMADO | «between 4.62% (Claude Haiku 4.5) and 6.10% (GPT-5.4-mini)» (paráfrasis) | — |
| Cinco modelos de frontera | NO ENCONTRADO | En la lectura solo aparecen dos modelos nombrados. | Pendiente de comprobar el número. |

**Veredicto global de S03: MATIZADO.**

### S04. AGENTS.md y la Agentic AI Foundation

Fuente encontrada: agents.md.

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| La Linux Foundation lo incorporó a la Agentic AI Foundation el 9 de diciembre de 2025 | NO ENCONTRADO | «AGENTS.md is now stewarded by the Agentic AI Foundation under the Linux Foundation.» (paráfrasis). No aparece fecha. | Fecha no confirmada. |
| Más de 60.000 proyectos | CONFIRMADO | «used by over 60k open-source projects» (paráfrasis) | — |
| Herramientas: Codex, Cursor, Gemini CLI, GitHub Copilot y VS Code | CONFIRMADO | Listadas como «Codex from OpenAI», «Cursor», «Gemini CLI from Google», «Coding agent from GitHub Copilot», «VS Code» (paráfrasis) | — |

**Veredicto global de S04: MATIZADO** (la fecha no se confirma).

### S05. Technology Radar de Thoughtworks: Ralph loop en «Assess» (abril 2026)

- Veredicto: SIN FUENTE
- Búsquedas: 2, realizadas antes de compactar la sesión. Sin resultado.

### S06. Plugin oficial `ralph-loop`

Fuente encontrada: github.com/anthropics/claude-code, carpeta `plugins/ralph-wiggum`.

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| No limita el número de rondas por defecto y admite `--max-iterations` | CONFIRMADO | «--max-iterations <n> - Stop after N iterations (default: unlimited)» (paráfrasis) | — |
| Nombre: `ralph-loop` | MATIZADO | El plugin se llama `ralph-wiggum` (paráfrasis). | Usar el nombre real. |
| Quién lo publica y en qué marketplace | NO ENCONTRADO | La página no nombra editor ni marketplace. Está en el repositorio `anthropics/claude-code`; hay un directorio `.claude-plugin` cuyo contenido no se muestra (paráfrasis). | — |

**Veredicto global de S06: MATIZADO.**

### S07. Plugin «protect-tests»

Fuente: `karanb192/claude-code-hooks` (U17).

**Veredicto: MATIZADO.** Existe el plugin «protect-tests», pero es un plugin de terceros, no oficial. Bloquea borrar, renombrar o desactivar tests; no bloquea cualquier edición de tests (ver U17).

### S08. BMAD Method

Fuente: nosam (U33). No abrí la página oficial de BMAD.

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| Simula un equipo ágil con agentes de roles distintos (PM, arquitecto…) | — | No comprobado en fuente primaria. | Abrir la documentación de BMAD. |
| Es el más caro en tokens | NO ENCONTRADO | La página de nosam no menciona coste en tokens (paráfrasis). | — |
| Es el más caro en ceremonia | CONFIRMADO | «way more overhead and setup time» (paráfrasis) | — |

**Veredicto global de S08: MATIZADO.**

### S09. godog, Cucumber oficial para Go

Fuente encontrada: github.com/cucumber/godog.

| Afirmación | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| Es el Cucumber oficial para Go | CONFIRMADO | «Package godog is the official Cucumber BDD framework for Golang.» (paráfrasis) | El README dice también que es «a community driven Open Source Project within the Cucumber organization» (paráfrasis). |

Licencia: MIT («Godog and Gherkin are licensed under the MIT», paráfrasis).

### S10. Tavern, Step CI y Maestro

| Herramienta | Veredicto | Evidencia | Nota |
| --- | --- | --- | --- |
| Tavern ejecuta YAML como tests de API | CONFIRMADO | «Tavern is a pytest plugin, command-line tool, and Python library for automated testing of APIs» y su sintaxis basada en YAML (paráfrasis) | Licencia no indicada en la documentación leída. |
| Step CI ejecuta YAML como tests de API | NO ENCONTRADO | El repositorio de Step CI dice «Step CI is an open-source API Quality Assurance framework» (paráfrasis), sin mencionar YAML. Un resultado de búsqueda sin abrir dice que usa workflows YAML, JSON o JavaScript. | Verificar en la documentación de Step CI. Licencia: «distributed under Mozilla Public License terms» (paráfrasis). Hay planes de pago («We just announced Pro Plan for Step CI», paráfrasis). |
| Maestro define flujos de interfaz móvil en YAML | CONFIRMADO | «Maestro is the simplest and most effective framework for painless mobile and web UI automation using intuitive YAML flows.» (paráfrasis) | Licencia no indicada en la documentación leída. |

**Veredicto global de S10: MATIZADO.**

---

## 5. Incoherencias

- **I01. Dos repositorios de esquemas.** El texto sitúa los esquemas en `intent-driven-dev/openspec-schemas`. La lista enlaza `Nebuless/openspec-schemas`. Los dos existen. El de intent-driven-dev es el original (110 estrellas, 83 commits, licencia MIT según la barra lateral). Nebuless es un fork de él (156 commits). El post de Krishnan no enlaza ninguno de los dos (U08). **Recomendación:** citar el original.
- **I02. «Converge» en Spec Kit.** Existe. Los comandos llevan guion: `/speckit-converge`, junto con `/speckit-constitution`, `/speckit-specify`, `/speckit-plan`, `/speckit-tasks` y `/speckit-implement` (U18).
- **I03. OpenSpec: estrellas y verify.** Las estrellas son 72.3k (no 72,1k). `verify` existe, pero es opcional y solo en el perfil expandido (U03, U04).
- **I04. Dos anécdotas de «40 archivos».** Son casos distintos. La de Böckeler (cambiar un rango de fechas) está en su artículo de sensores, fuente primaria (U12). La del equipo de Rust es una anécdota de segunda mano sobre un artículo de yage.ai, sin enlace a la fuente original de HN (U32). El documento no las mezcla, pero las presenta con el mismo peso.
- **I05. Fechas de Böckeler.**
  - SDD tools: 15 oct 2025. Confirmado (U10).
  - Sensores: 27 may 2026. Confirmado (U12).
  - TDD en el bucle del agente: la página no muestra fecha. «Agosto de 2026» NO ENCONTRADO (U11).
- **I06. Palabras «advisory» y «deterministic».** Sí aparecen en la documentación de Claude Code: «Unlike CLAUDE.md instructions which are advisory, hooks are deterministic» (U01, paráfrasis). El documento las traduce como «consultivo» y «deterministas».

---

## 6. Preguntas para el diseño

**P01. Claude Code fuera del repositorio.**
- Hooks a nivel de usuario: `~/.claude/settings.json` aplica «You, every project» (paráfrasis; https://code.claude.com/docs/en/settings). Subagentes y skills a nivel de usuario: **no comprobado**. Las páginas leídas solo muestran `.claude/agents/` y `.claude/skills/` (proyecto). Pendiente.
- Un hook de usuario puede limitarse a un repositorio mirando `cwd` o `${CLAUDE_PROJECT_DIR}` dentro del script. `cwd` es «Current working directory when the hook is invoked» (paráfrasis); `CLAUDE_PROJECT_DIR` es «the project root where the session started» (paráfrasis) (https://code.claude.com/docs/en/hooks).
- Datos por stdin: `cwd`, `tool_name`, `tool_input` y `tool_use_id`, según el evento (paráfrasis; https://code.claude.com/docs/en/hooks). Variable de entorno: `CLAUDE_PROJECT_DIR`.
- `.claude/settings.local.json`: «Personal overrides for one project». Claude Code lo mete en los excludes globales de git al crearlo; si se crea a mano, hay que añadirlo a `.gitignore` (paráfrasis; https://code.claude.com/docs/en/settings).

**P02. Stop hook.**
- Mecanismo: el código de salida 2 bloquea («Exit with code 2 to block the action.», paráfrasis; https://code.claude.com/docs/en/hooks). También sirve JSON con `"decision": "block"` y un `reason`; el único valor de `decision` es `"block"` (paráfrasis).
- Bucles infinitos: el campo `stop_hook_active` indica que el hook ya provocó una continuación. El script debe salir si vale `true` (copia guardada de https://code.claude.com/docs/en/hooks-guide). Tope: Claude Code desactiva el hook «after it blocks eight times in a row with no tool call from Claude in between» (copia guardada). Se cambia con `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`.
- Tiempo máximo: **no encontrado** en lo leído.
- Subagentes: `SubagentStop` existe y «fires when a subagent completes» (paráfrasis; https://code.claude.com/docs/en/hooks). La guía dice que `Stop` y `SubagentStop` devuelven el `reason` a Claude para que siga (copia guardada).

**P03. Bloquear ediciones por ruta.**
- Herramientas que hay que interceptar en `PreToolUse`: `Edit`, `Write`, `MultiEdit`, `NotebookEdit` y `Bash`. La referencia usa `Bash`, `Edit` y `Write` como ejemplos de matcher; `NotebookEdit` aparece solo en un ejemplo de regex; `MultiEdit` aparece en el matcher de `protect-tests` (https://code.claude.com/docs/en/hooks; U17).
- Reglas `deny` de permisos (https://code.claude.com/docs/en/permissions): solo `Edit(path)` y `Read(path)` se consultan para rutas. Las reglas de `Write`, `NotebookEdit`, `Glob` o `MultiEdit` se aceptan, pero Claude Code no las consulta y avisa al arrancar (paráfrasis).
- Las reglas de `Bash` «isn't a security boundary» (paráfrasis). No protegen contra `sed -i` o `cat >` de forma fiable.
- Alternativas: modos de permiso (`dontAsk` niega lo que requiere aprobación; paráfrasis). **Conclusión:** para `features/`, `steps/`, `tests/` y la configuración del linter hace falta un hook `PreToolUse` con `Edit|Write|MultiEdit|NotebookEdit|Bash`, además de reglas `Edit(...)` deny para la herramienta Edit y comandos de Bash de escritura.

**P04. OpenSpec sin rastro en el repositorio.**
- Rutas que crea `openspec init` (https://github.com/Fission-AI/OpenSpec/blob/main/docs/cli.md): `openspec/specs/`, `openspec/changes/`, `openspec/config.yaml`. Según la herramienta elegida: `.claude/skills/`, `.cursor/skills/`, `.cursor/commands/`, `.agents/skills/`, y otras configuraciones de herramienta (paráfrasis).
- Inicializar sin integración: `openspec init --tools none` existe (cli.md). Usar `/opsx:*` desde `~/.claude/`: **no comprobado**. Pendiente.
- Ficheros de `openspec/` con menciones a IA: **no comprobado**; no leí las plantillas.
- Esquemas personalizados, proyecto o global: **no comprobado**.

**P05. Esquema behaviour-driven.**
- Repositorio real: sí. El original es `intent-driven-dev/openspec-schemas` (110 estrellas, 83 commits, MIT según la barra lateral). Nebuless es un fork (U07).
- Licencia: MIT en el original (barra lateral; no leí el fichero LICENSE). En Nebuless, el tipo no se muestra.
- Fecha del último commit: **no encontrado** en las páginas de ninguno de los dos repositorios.
- Versión de OpenSpec compatible: **no encontrado**. Lo que aparece es la versión del paquete (1.8.0) y «Node.js >=20.19.0» (paráfrasis).
- Cómo se instala: **no comprobado**.
- Código del hook Zone Guard: **no encontrado**. El post no enlaza código (U08).

**P06. Licencias y coste.** Licencias leídas en la barra lateral del repositorio, no en el fichero LICENSE. Las versiones y fechas, cuando se dan, son las que muestran las páginas.

| Herramienta | Licencia | Coste / uso privado | Última versión y fecha | Origen |
| --- | --- | --- | --- | --- |
| OpenSpec | MIT | Sin coste declarado en lo leído | v1.14.3, 17 oct (sin año) | github.com/Fission-AI/OpenSpec |
| Cucumber.js | MIT | — | NO ENCONTRADO (Releases vacía) | github.com/cucumber/cucumber-js |
| gherkin-lint | ISC | — | NO ENCONTRADO | github.com/vsiakka/gherkin-lint (redirige a gherkin-lint/gherkin-lint). La URL `conventional-changelog/gherkin-lint` da 404. |
| jscpd | MIT | — | 5.3.0 solo en la cita BibTeX; sin fecha | github.com/kucherenko/jscpd |
| knip | ISC | — | NO ENCONTRADO | github.com/webpro-nl/knip |
| dependency-cruiser | MIT | — | NO ENCONTRADO | github.com/sverweij/dependency-cruiser |
| Stryker (JavaScript) | No consultado | No consultado | No consultado | Solo se leyó su página de modo incremental (P07). |
| **Semgrep (CLI)** | **LGPL-2.1** | No comprobado en la página | NO ENCONTRADO | github.com/semgrep/semgrep |
| Semgrep (reglas) | No consultado | No consultado | No consultado | Sin abrir la documentación de reglas. |
| **CodeQL** | **Licencia restrictiva** (no open source) | **Coste/contacto**: «CodeQL can only be used on codebases that are released under an OSI-approved open source license»; «It can't be used to generate CodeQL databases for or during automated analysis, continuous integration»; «For these uses, contact the sales team.» (paráfrasis) | NO ENCONTRADO | github.com/github/codeql-cli-binaries |
| context7 | MIT | API key gratuita «for higher rate limits» (paráfrasis); planes de pago: NO ENCONTRADO | NO ENCONTRADO | github.com/upstash/context7 |
| Archon | MIT | Sin coste declarado; NO ENCONTRADO | NO ENCONTRADO | github.com/coleam00/archon |
| gh-aw | MIT | Suscripción de pago: NO ENCONTRADO; estado preview: NO ENCONTRADO | v0.87.7 (no es la última; sin fecha) | pkg.go.dev/github.com/github/gh-aw |
| pi-ralph | MIT | — | NO ENCONTRADO | github.com/samfoy/pi-ralph |
| claude-code-hooks | MIT | — | NO ENCONTRADO | github.com/karanb192/claude-code-hooks |
| godog | MIT | — | NO ENCONTRADO | github.com/cucumber/godog |
| mutmut | NO ENCONTRADO | — | NO ENCONTRADO | mutmut.readthedocs.io |
| pytest-bdd, vulture, import-linter | No consultado | No consultado | No consultado | Sin abrir en esta sesión. Ver sección 8. |

Leyenda: «—» significa que ese dato no se buscó en esa fuente; «No consultado», que la fuente no se abrió; «NO ENCONTRADO», que se abrió y el dato no aparece.

**Notas de licencia y coste (en negrita arriba):**
- **CodeQL**: no sirve para repositorios privados ni para CI sin contrato comercial. Es el punto que más cambia el diseño.
- **Semgrep CLI**: LGPL-2.1. Es copyleft débil, no GPL, pero figura en la lista de licencias a marcar.
- **Step CI** (no está en la lista): MPL, y tiene planes de pago (Pro y Support).

**P07. Mutation testing incremental.**
- Stryker: `npx stryker run --incremental`. Guarda el resultado anterior en `reports/stryker-incremental.json` y «only runs mutation testing on the changed code» (paráfrasis; https://stryker-mutator.io/docs/stryker-js/incremental/). La página dice que acelera, pero no da tiempos.
- mutmut: `mutmut run`. «Remembers work that has been done, so you can work incrementally»; se puede parar y retomar donde se dejó (paráfrasis; https://mutmut.readthedocs.io/en/latest/). No da tiempos de ejecución.

**P08. Límite de iteraciones.**
- `ralph-wiggum` (el plugin que el documento llama `ralph-loop`): `--max-iterations <n>` «Stop after N iterations (default: unlimited)» (paráfrasis; https://github.com/anthropics/claude-code/tree/main/plugins/ralph-wiggum). Por defecto no hay límite. El README recomienda usarlo como red de seguridad.
- Archon: el ejemplo de YAML usa `max_iterations: 5`. El valor por defecto **no encontrado** (https://github.com/coleam00/archon).

---

## 7. Hallazgos extra

1. **Archon escribe dentro del repositorio.** Sus flujos van en `.archon/workflows/` y se confirman en el repositorio («commit them to your repo»; U24). Esto choca con la restricción de no dejar rastros de IA. Si se usa, habría que mantenerlos fuera de git o no usarlo.
2. **CodeQL tiene una licencia restrictiva.** Solo sirve para código con licencia OSI, y su uso en CI requiere contrato comercial (P06). No debe entrar en el flujo.
3. **Los checkpoints de Claude Code no capturan cambios hechos con Bash.** La página dice que «This isn't a replacement for git» (paráfrasis; U01). Con worktrees, conviene confiar en git y no en `/rewind`.
4. **Varias fuentes tienen interés comercial.** Krishnan vende un libro y consultoría (U09); ToolTwist vende servicios de ingeniería (U34); qaskills vende un curso de pago (U37). Pesar sus recomendaciones con eso en cuenta.
5. **context7 pide una API key** para más límite de peticiones (paráfrasis; fuente no numerada en la tabla de URLs: github.com/upstash/context7, ver P06). La versión gratuita tiene límites. Para un flujo que dependa de documentación actualizada, hay que guardar la clave fuera del repositorio.

---

## 8. Pendiente y límites

**Lo que no se ha podido comprobar, y por qué:**
- **S01 (HackTrace)** y **S05 (Thoughtworks Radar, «Assess»)**: sin fuente tras dos búsquedas cada uno, hechas antes de compactar la sesión. No se repitieron.
- **Pendientes sin abrir**: Stryker (licencia y versión), pytest-bdd, vulture, import-linter, Semgrep (reglas y licencia comercial), Tavern y Maestro (licencia), Step CI (YAML en su documentación oficial), BMAD (fuente primaria), Kiro (coste).
- **Pendientes de lectura**: U09 («sin TDD, el interior puede acabar en unidades acopladas»), U03 (la frase «una spec es un contrato de comportamiento»), P01 (subagentes y skills a nivel de usuario), P04 (plantillas de OpenSpec y uso desde `~/.claude/`), P05 (instalación y Zone Guard), S02 (si el resumen completo de USENIX contiene el 19,7 %), S03 (número de modelos).
- **P06 sin columna de ecosistemas.** El encargo pide «ecosistemas que cubre» para cada herramienta, y la tabla no la incluye. Falta completarla.
- **Licencias leídas en la barra lateral del repositorio**, no en el fichero LICENSE. Para las herramientas que se vayan a instalar, conviene leer el LICENSE.
- **Fechas**: varias páginas no muestran año (OpenSpec 1.14.3, jscpd, Torchia) o no muestran fecha (U11, U03, U18). Los veredictos sobre fechas dicen lo que la página muestra.
- **Citas**: todas las citas de páginas leídas con la herramienta de resumen van marcadas como `(paráfrasis)`. Las copias guardadas de la guía de hooks van marcadas como `(copia guardada)`.
- **Títulos no extraídos**: U08, U09, U10, U12, U13, U21, U22, U34, U35, U36, U37 no tienen título real en la tabla. La página no se leyó con ese campo.
- **Las fuentes primarias de Thoughtworks y de Böckeler**: sus artículos se leyeron en resumen. Las cifras de Böckeler (40 archivos, 13 mutantes, 2,96×) coinciden con lo que devolvió la herramienta, pero no se comprobaron contra el HTML completo.
- **No se tocó ningún repositorio.** No se hicieron commits, pushes, merges ni rebases. Solo se escribió este fichero.

# aprendizaje-experto

- **Markdown largos:** los `.md` de más de 200 líneas (`docs/plan.md`, `docs/investigacion.md`, `docs/arnes.md`, `docs/arnes-verificacion.md`) nunca se leen enteros, tampoco con `cat`. Busca primero lo que necesitas (con Grep o con `git grep -n "<texto>" -- <fichero>`) y luego lee solo esas líneas con Read, usando offset y limit. Si intentas leer uno entero, el hook te devuelve su índice de secciones.

## Comandos para el dueño (regla dura)

Cuando el dueño tenga que hacer algo que Claude no puede hacer, dale los comandos exactos en un único bloque `sh`. Esto incluye elegir la fase y el área, abrir y retirar un carril, fusionar con bypass un PR que espera su visto bueno y actualizar la carpeta principal.

- El bloque se copia y se pega tal cual: empieza con `cd <ruta absoluta>`, lleva las rutas y los números de PR ya rellenos y sigue el orden en que se ejecuta.
- Tras cada fusión, el bloque actualiza la carpeta principal: `cd /home/florin/aprendizaje-experto && git pull --ff-only`, y `npm ci` si el PR cambió `package-lock.json`.
- Nunca le pidas que edite un fichero a mano ni le describas un cambio para que lo escriba él.

## Carriles, commits y PR

- Un carril = un worktree = una rama = una fase y un área (plan §6). Lo abre el dueño con `make abrir N=<carril> F=<fase> A=<ÁREA>`. La conversación empieza en la carpeta principal y, cuando el dueño pega «Entra en el carril <carril>.», llama a `EnterWorktree` con la ruta del carril, `/home/florin/aprendizaje-experto-<carril>`. El aviso de `anunciar-carril` dice la fase, el área, la lista blanca, el relevo pendiente y el modelo.
- En un carril, los enlaces a ficheros llevan la ruta absoluta del carril: VS Code los resuelve desde la carpeta principal.
- No toques los otros carriles. Si te hace falta algo de allí, dilo y para con `[DECISIÓN PENDIENTE]`.
- Lo que tenga que llegar a `main` se hace en un carril: la carpeta principal no tiene rama para el PR. Si tienes que commitear desde ella, para y dale al dueño el `make abrir`.
- Al empezar en un carril, mira con `gh pr view` si el PR de su rama ya está fusionado. Si lo está, ejecuta `make rama`, que pasa el carril a `<fase>/<ÁREA>/<carril>-2` (y después `-3`…) desde `origin/main`. Si no, sigue en la misma rama.
- **Regla de mezcla** (job `mezcla` de la CI, plan §10): un commit de especificación (`features/`, `tests/aceptacion/`, `config/`) no lleva código (`src/`, `tests/unidad/`), ni al revés.
- **Rutas por fase** (`proteger-rutas.ts` y job `rutas` de la CI, plan §6): impl no toca `features/`, `tests/aceptacion/`, `config/parametros.json` ni `config/peticion-ia.md`, y en `config/alcance.json` solo añade áreas a `areas_cerradas` y quita entradas de `escenarios_en_rojo`. aceptacion no toca `features/` ni esos dos ficheros de `config/`, y specs no toca `src/`, `tests/unidad/` ni `tests/aceptacion/`. Si crees que hay que cambiar algo de otra fase, no lo cambies, tampoco con Bash: explica por qué y para con `[DECISIÓN PENDIENTE]`.
- **Al terminar,** con la comprobación de la fase en verde (el hook del push niega `git push` y `gh pr create` mientras falle; ninguna marca lo salta, plan §5): commits, `git push -u origin HEAD` y `gh pr create --fill`. Después, `gh pr merge --auto --rebase` solo si el PR toca únicamente la lista blanca, y `gh pr checks --watch`. Nunca hagas push a mitad de la conversación.
- La lista blanca son las rutas sin dueño de `.github/CODEOWNERS`: `src/`, `tests/unidad/`, `docs/areas/` y `docs/deuda-diseno.md`, salvo la configuración. Compruébalo con `gh pr diff --name-only`. Un PR que solo toca esas rutas se fusiona solo cuando pasa la CI.
- Un PR que toca algo más espera el visto bueno del dueño, y no le actives la fusión automática. El bypass del ruleset es del dueño (plan §6, dato D5). Dale el bloque con `gh pr merge <n> --rebase --admin` y la actualización de la carpeta principal.
- **Prohibido:** `gh pr merge --admin`, aprobar un PR y tocar los rulesets o los ajustes del repositorio. Con tu cuenta, `floringugu757-lgtm` (`write`, sin admin), GitHub ya te niega `--admin` y los cambios en rulesets y ajustes. Aun así, no uses la cuenta de administrador del dueño, que sigue en el llavero de `gh` (`gh auth token --user floringugu`, o vaciar `GH_TOKEN`): solo esta regla te lo impide (plan §11).

## Etapas, áreas y fases

- Cada etapa (2, specs; 3, aceptación) y cada área de la etapa 4 empieza en una conversación nueva de Claude Code en VS Code.
- Al empezar y al cerrar un área, sigue los pasos de la etapa 4 (plan §16): plantilla, «Mecanismo», `make cerrar-area`, archivo del área y `areas_cerradas`. Para retirar el carril, plan §6, paso 9.
- La fase y el área los elige el dueño antes de abrir la conversación: Ctrl+Shift+P → «Tasks: Run Task» → «Arnés: fase de la próxima conversación», o `make fase F=<fase> A=<ÁREA> N=<carril>` desde su terminal (sin `N=`, la de la carpeta principal). La fase aceptacion necesita área.
- El aviso de SessionStart, o el de `anunciar-carril` al entrar en un carril, dice la fase y el área en curso. Si no son las que pide la tarea, para y dale el comando para cambiarlas.
- En la fase impl, escribe tú los comentarios de interfaz y las firmas, y encarga los cuerpos y los tests unitarios al subagente `implementador` (siempre Sonnet; plan §7), diciéndole en el prompt qué ficheros de `src/` y `tests/unidad/` puede tocar. Un encargo cada vez: espera a que termine antes de tocar sus ficheros. Lo que devuelva en rojo, y los arreglos de una o dos líneas, los haces tú.
- En `docs/deuda-diseno.md` apunta la deuda nueva y la pagada.
- El relevo es obligatorio: tras el `[RELEVO]` que acepta el hook Stop, la conversación ya no edita (plan §5). Antes de terminar con la marca, escribe en `reports/relevo.md` de tu checkout (ruta absoluta; fuera de git) qué está hecho, qué falta, el paso siguiente y los ficheros que hay que leer primero. Si el aviso de inicio o el del carril señala un relevo de tu checkout, léelo antes de nada y bórralo.
- No añadas un mecanismo al arnés (hook, registro, comprobación, comando) sin un dato de los registros (`.claude/registro-*.jsonl`, `reports/`, transcripts) que muestre el problema. Si no lo tienes, párate con `[DECISIÓN PENDIENTE]` y dilo (plan §1, principio 7).

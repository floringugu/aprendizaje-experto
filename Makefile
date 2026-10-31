# Comprobaciones del proyecto. El hook PreToolUse .claude/hooks/exigir-check-push.ts ejecuta la de la
# fase antes de git push y gh pr create:
#   make check             fase impl (por defecto): los pasos estáticos, la unidad con su cobertura de src/,
#                          features/ y parámetros válidos, la aceptación de las áreas cerradas (regresión; no la
#                          del área en curso) y la cobertura de los IDs
#   make check-specs       fase specs (etapa 2): features/ y parámetros válidos
#   make check-aceptacion  fase aceptacion (etapa 3): el área en curso falla en rojo y las cerradas, en verde
# Y el hook SubagentStop (.claude/hooks/exigir-check-implementador.ts), la del implementador:
#   make check-implementador  los pasos estáticos y los tests unitarios, sin código muerto
# Al cerrar un área, para que la aplicación y la aceptación del área en curso estén en verde:
#   make cerrar-area A=<ÁREA>  (A, el área en curso del checkout)
# Cada paso es un script de package.json. La ejecución se para en el primer paso que falla.
#
# Objetivos solo para el dueño, desde su terminal o las tareas de VS Code (.vscode/tasks.json):
#   make fase F=<fase> [A=<ÁREA>] [N=<carril>]  fija la fase y el área de la carpeta principal o del carril N
#   make abrir N=<carril> F=<fase> A=<ÁREA>  crea un carril, con su primera rama desde origin/main; si tiene
#                              ticket, sin F ni A (salen de él) y, si no está listo, solo con FORZAR=1
#   make retirar N=<carril>    borra el carril y todas sus ramas, ya fusionadas en origin/main
# Uno para la conversación de un carril, cuando GitHub ha fusionado el PR de su rama:
#   make rama                  pasa el carril a su rama siguiente, desde origin/main
# Y de consulta: make bloqueos A=<ÁREA> resume lo que anotaron los hooks mientras el área estaba en curso;
# make tickets lista los tickets de docs/tickets/ con su estado, y make tablero los muestra en una página web.

ESTATICOS := tipos lint duplicacion codigo-muerto capas unidad tickets

# Ejecuta los pasos en orden y dice cuál falla.
define ejecutar_pasos
	@for paso in $(1); do \
		printf '\n▶ %s\n' "$$paso"; \
		npm run --silent "$$paso" || { printf '\n✗ Falla el paso «%s».\n' "$$paso"; exit 1; }; \
	done; \
	printf '\n✓ Todo en verde.\n'
endef

.PHONY: check check-specs check-aceptacion cerrar-area check-implementador mutacion fase abrir retirar rama bloqueos tickets tablero instalar formatear

check:
	$(call ejecutar_pasos,$(ESTATICOS) specs aceptacion cobertura-ids)

check-specs:
	$(call ejecutar_pasos,$(ESTATICOS) specs)

check-aceptacion:
	$(call ejecutar_pasos,$(ESTATICOS) specs estado-aceptacion)

# El área A en curso, completa: la aceptación y la cobertura incluyen sus escenarios. A tiene que ser
# el área en curso del checkout, la que lee scripts/arnes/comun/alcance.ts (comprobar-area.ts).
# Es lo último antes de proponer que A pase a areas_cerradas.
cerrar-area:
	@node scripts/arnes/comprobar-area.ts $(A)
	$(call ejecutar_pasos,$(ESTATICOS) aceptacion-area cobertura-ids-area)

# Sin codigo-muerto: cuando el implementador devuelve su encargo, la aplicación aún no usa las
# funciones nuevas del dominio. Ese paso y la aceptación se los exige después a la conversación
# principal el hook exigir-check-push.ts (make check, antes de git push y gh pr create).
check-implementador:
	$(call ejecutar_pasos,$(filter-out codigo-muerto,$(ESTATICOS)))

# Mutation testing de src/dominio/. No forma parte de make check: es lento. La CI lo ejecuta al final
# (.github/workflows/puerta.yml).
mutacion:
	npm run --silent mutacion

# Solo el dueño: guarda la fase y el área de la carpeta principal o, con N, del carril N en su
# .claude/settings.local.json (fuera de git). Los hooks las leen de ahí en cada llamada; el modelo y
# el esfuerzo valen desde la próxima conversación. Las comillas guardan el sitio de un A vacío.
fase:
	@node scripts/arnes/fijar-fase.ts '$(F)' '$(A)' '$(N)'

# Solo el dueño, desde cualquier checkout: los carriles van al lado de la carpeta principal (docs/plan.md §6).
# Con ticket (docs/tickets/<N>.md en origin/main), la fase y el área salen de él, y se niega si no está
# listo salvo con FORZAR=1 (nunca si está hecho o descartado).
abrir:
	@node scripts/arnes/worktrees.ts abrir '$(N)' '$(F)' '$(A)' '$(FORZAR)'

retirar:
	@node scripts/arnes/worktrees.ts retirar '$(N)'

# La conversación de un carril, en su carril, cuando GitHub ha fusionado el PR de su rama.
rama:
	@node scripts/arnes/worktrees.ts rama

# Lo que anotaron los hooks en .claude/registro-stop.jsonl mientras el área estaba en curso (el push,
# el implementador y las paradas del Stop), para el archivo del área (docs/areas/<ÁREA>.md).
bloqueos:
	@node scripts/arnes/bloqueos-stop.ts $(A)

# Los tickets de docs/tickets/ en origin/main (recién traído) con su estado, calculado con los carriles
# abiertos (docs/plan.md §6, «Tickets»). tablero escribe reports/tablero.html y, si lo lanza el dueño, lo abre.
tickets:
	@node scripts/arnes/tickets.ts listar

tablero:
	@node scripts/arnes/tickets.ts tablero

instalar:
	npm ci

formatear:
	npx --no-install prettier --write .

# Comprobaciones del proyecto. El hook Stop (.claude/hooks/exigir-check.ts) ejecuta la de la fase:
#   make check             fase impl (por defecto): los pasos estáticos, la unidad, la aceptación de las
#                          áreas cerradas (regresión; no la del área en curso), la cobertura y la integridad
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
#   make abrir N=<carril> F=<fase> A=<ÁREA>  crea un carril, con su primera rama desde origin/main
#   make retirar N=<carril>    borra el carril y todas sus ramas, ya fusionadas en origin/main
# Uno para la conversación de un carril, cuando GitHub ha fusionado el PR de su rama:
#   make rama                  pasa el carril a su rama siguiente, desde origin/main
# Y uno de consulta: make bloqueos A=<ÁREA> resume las paradas del hook Stop de un área.

ESTATICOS := tipos lint duplicacion codigo-muerto capas unidad

# Ejecuta los pasos en orden y dice cuál falla.
define ejecutar_pasos
	@for paso in $(1); do \
		printf '\n▶ %s\n' "$$paso"; \
		npm run --silent "$$paso" || { printf '\n✗ Falla el paso «%s».\n' "$$paso"; exit 1; }; \
	done; \
	printf '\n✓ Todo en verde.\n'
endef

.PHONY: check check-specs check-aceptacion cerrar-area check-implementador mutacion fase abrir retirar rama bloqueos instalar formatear

check:
	$(call ejecutar_pasos,$(ESTATICOS) aceptacion cobertura-ids integridad)

check-specs:
	$(call ejecutar_pasos,$(ESTATICOS) specs integridad)

check-aceptacion:
	$(call ejecutar_pasos,$(ESTATICOS) specs estado-aceptacion integridad)

# El área A en curso, completa: la aceptación y la cobertura incluyen sus escenarios. A tiene que ser
# el área en curso del checkout, la que lee scripts/arnes/comun/alcance.ts (comprobar-area.ts).
# Es lo último antes de proponer que A pase a areas_cerradas.
cerrar-area:
	@node scripts/arnes/comprobar-area.ts $(A)
	$(call ejecutar_pasos,$(ESTATICOS) aceptacion-area cobertura-ids-area integridad)

# Sin codigo-muerto: cuando el implementador devuelve su encargo, la aplicación aún no usa las
# funciones nuevas del dominio. Ese paso, la aceptación y la integridad los exige después el
# hook Stop a la conversación principal (make check).
check-implementador:
	$(call ejecutar_pasos,$(filter-out codigo-muerto,$(ESTATICOS)))

# Mutation testing de src/dominio/. No forma parte de make check: es lento.
mutacion:
	npm run --silent mutacion

# Solo el dueño: guarda la fase y el área de la carpeta principal o, con N, del carril N en su
# .claude/settings.local.json (fuera de git). Los hooks las leen de ahí en cada llamada; el modelo y
# el esfuerzo valen desde la próxima conversación. Las comillas guardan el sitio de un A vacío.
fase:
	@node scripts/arnes/fijar-fase.ts '$(F)' '$(A)' '$(N)'

# Solo el dueño, desde cualquier checkout: los carriles van al lado de la carpeta principal (docs/plan.md §6).
abrir:
	@node scripts/arnes/worktrees.ts abrir '$(N)' '$(F)' '$(A)'

retirar:
	@node scripts/arnes/worktrees.ts retirar '$(N)'

# La conversación de un carril, en su carril, cuando GitHub ha fusionado el PR de su rama.
rama:
	@node scripts/arnes/worktrees.ts rama

# Paradas del hook Stop (.claude/registro-stop.jsonl) mientras el área estaba en curso,
# para el archivo del área (docs/areas/<ÁREA>.md).
bloqueos:
	@node scripts/arnes/bloqueos-stop.ts $(A)

instalar:
	npm ci

formatear:
	npx --no-install prettier --write .

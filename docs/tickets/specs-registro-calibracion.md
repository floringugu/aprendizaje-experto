---
fase: specs
area: CALI
depende: [specs-calibracion-visual]
toca: [features/instrumentacion.feature, features/calibracion.feature]
estado: hecho
---
# Se registra qué pantalla de calibración vio la persona y cuándo, para medir si cambia algo

**Qué:** las pantallas de calibración (CALI-4 a CALI-6) son una extrapolación del autor y ningún estudio prueba que mejoren la calibración. Para saberlo con los datos de la persona hace falta comparar la diferencia entre confianza y acierto semana a semana, antes y después de empezar a verlas. Esa diferencia ya se puede calcular con `respuestas.csv`; lo que falta es registrar en qué bucle se enseñó cada pantalla (silueta o tarjetas, de qué objetivo) y cuándo se abrió cada tarjeta. Especificar ese registro y la medida.

**Hecho cuando:** los escenarios fijan dónde se registra cada pantalla enseñada y cada tarjeta abierta (columnas y formato, como los demás CSV de INST), qué diferencia se compara y entre qué semanas, que el registro no cambia el progreso, y `make check-specs` está en verde.

**Leer primero:** features/instrumentacion.feature (cabeceras fijas de los CSV y exportación); features/calibracion.feature (CALI-4 a CALI-6); docs/tickets/specs-calibracion-visual.md (sección «Por decidir»).

## Decidido en la conversación de specs (extrapolación del autor, sin evidencia propia)

- **Dos CSV nuevos, no columnas en uno existente** (INST-1.1, INST-2.3: ahora diez): `pantallas_calibracion.csv` (`fecha,dominio,objetivo,pantalla,grupo,items,aciertos`; una fila por silueta con datos o por pantalla de tarjetas enseñada, INST-1.10, INST-1.11) y `tarjetas_abiertas.csv` (`fecha,dominio,objetivo,item,estado`; una fila por apertura, INST-1.12, INST-1.13). Un CSV por tipo de evento, como los demás. Las tarjetas del resultado del experimento no entran (INST-1.14).
- **Medida** (INST-3): la diferencia de cada semana es la de CALI-2 (confianza menos acierto, sin exploración ni experimentos), sacada de `respuestas.csv`. El corte es la primera fila de `pantallas_calibracion.csv` de cada dominio; la semana del bucle que la enseñó cuenta como «antes». Se compara la diferencia media con signo y la distancia media sin signo.
- **Semanas mínimas:** una con respuestas antes y otra después (INST-3.4). No es un parámetro: la aplicación no compara nada, así que no hay umbral que leer de `config/parametros.json`. Es un mínimo flojo; si el análisis pide más, se endurece al mirar los datos.
- **Solo se exporta:** la aplicación no enseña la comparación (INST-3.7), así que no hay textos nuevos a los que aplicar CALI-6.
- **El registro no cambia el progreso** (INST-4.1, además de CALI-3.2 y CALI-5.6).
- **Lo que queda para las fases siguientes:** los pasos de aceptación de INST-1.10 a INST-1.15, INST-3 e INST-4, y el código de INST en impl. El cálculo de INST-3 lo hace una función de los pasos sobre las filas exportadas, no la aplicación.

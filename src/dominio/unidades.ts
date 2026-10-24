// Constantes técnicas: unidades que no son decisiones pedagógicas y por eso no van en
// config/parametros.json. Es el único fichero de src/ donde se permiten números sueltos.

const MS_POR_SEGUNDO = 1000;
const SEGUNDOS_POR_MINUTO = 60;
const MINUTOS_POR_HORA = 60;
const HORAS_POR_DIA = 24;
const DIAS_POR_SEMANA = 7;

const MS_POR_DIA = HORAS_POR_DIA * MINUTOS_POR_HORA * SEGUNDOS_POR_MINUTO * MS_POR_SEGUNDO;

export const MS_POR_SEMANA = DIAS_POR_SEMANA * MS_POR_DIA;

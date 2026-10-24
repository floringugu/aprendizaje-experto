import { describe, expect, it } from 'vitest';
import { subagentesEnCurso } from '../../scripts/arnes/comun/entrada-hook.ts';

describe('subagentesEnCurso', () => {
  it('cuenta solo las tareas de fondo que son subagentes', () => {
    const tareas = [{ type: 'subagent', agent_type: 'implementador' }, { type: 'shell' }, { type: 'subagent' }];
    expect(subagentesEnCurso(tareas)).toBe(2);
  });

  it('devuelve 0 si no hay tareas de fondo o el campo no es una lista', () => {
    expect(subagentesEnCurso([])).toBe(0);
    expect(subagentesEnCurso(undefined)).toBe(0);
    expect(subagentesEnCurso('subagent')).toBe(0);
  });
});

import { cuNi } from './cuNi';
import { feC } from './feC';
import { pbSn } from './pbSn';
import { ptAg } from './ptAg';
import type { DiagramId, PhaseDiagramDefinition } from './types';

export const diagrams: PhaseDiagramDefinition[] = [cuNi, ptAg, pbSn, feC];
const registry = new Map(diagrams.map((diagram) => [diagram.id, diagram]));

export function resolveDiagram(id: DiagramId): PhaseDiagramDefinition {
  return registry.get(id) ?? cuNi;
}

export { cuNi, ptAg, pbSn, feC };
export type * from './types';

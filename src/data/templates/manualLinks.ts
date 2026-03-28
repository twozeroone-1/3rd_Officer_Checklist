import { routineTemplates } from './routineTemplates';
import { scenarioTemplates } from './scenarioTemplates';

export const manualLinks = Object.fromEntries(
  [...routineTemplates, ...scenarioTemplates].map((template) => [
    template.id,
    template.traceability,
  ]),
) satisfies Record<string, (typeof routineTemplates)[number]['traceability']>;

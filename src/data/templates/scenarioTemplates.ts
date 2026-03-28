import { ScenarioTaskTemplateSchema } from '../../domain/schema';
import type { ScenarioTaskTemplate } from '../../domain/types';

export const scenarioTemplates: ScenarioTaskTemplate[] = [
  {
    id: 'arrival-bridge-preparation',
    title: 'Run arrival bridge preparation',
    category: 'scenario',
    summary: 'Prepare pilot exchange, tugs, mooring stations, and bridge roles before arrival.',
    scenarioType: 'arrival',
    contexts: ['arrival'],
    conditionTriggers: ['before-arrival'],
    responsibility: 'bridge-team',
    status: 'active',
    traceability: [
      { documentId: 'fleet-15', excerptId: 'fleet-15-arrival-brief', sectionRef: '2.5' },
    ],
  },
  {
    id: 'departure-bridge-preparation',
    title: 'Run departure bridge preparation',
    category: 'scenario',
    summary: 'Confirm departure passage, machinery readiness, and line handling coordination before letting go.',
    scenarioType: 'departure',
    contexts: ['departure'],
    conditionTriggers: ['before-departure'],
    responsibility: 'bridge-team',
    status: 'active',
    traceability: [
      { documentId: 'fleet-15', excerptId: 'fleet-15-departure-brief', sectionRef: '3.1' },
    ],
  },
  {
    id: 'anchoring-preparation',
    title: 'Run anchoring preparation',
    category: 'scenario',
    summary: 'Confirm anchoring position, swing room, cable plan, and forecastle readiness before dropping anchor.',
    scenarioType: 'anchoring',
    contexts: ['anchoring'],
    conditionTriggers: ['before-arrival'],
    responsibility: 'bridge-team',
    status: 'active',
    traceability: [
      { documentId: 'fleet-i21', excerptId: 'fleet-i21-anchor-prep', sectionRef: '2.2' },
    ],
  },
  {
    id: 'in-port-watch-setup',
    title: 'Set up in-port watch controls',
    category: 'scenario',
    summary: 'Confirm gangway, security, moorings, and watch round expectations after all fast.',
    scenarioType: 'in-port-watch',
    contexts: ['in-port'],
    conditionTriggers: ['before-arrival'],
    responsibility: 'third-officer',
    status: 'active',
    traceability: [
      { documentId: 'fleet-13', excerptId: 'fleet-13-in-port-round', sectionRef: '3.3' },
      { documentId: 'fleet-13', excerptId: 'fleet-13-gangway-security', sectionRef: '4.2' },
    ],
  },
].map((template) => ScenarioTaskTemplateSchema.parse(template));

import type { ScenarioSession } from '../../domain/types';

type ScenarioDefinition = {
  type: ScenarioSession['scenario'];
  title: string;
  summary: string;
  contexts: ScenarioSession['contexts'];
  responsibility: ScenarioSession['responsibility'];
  traceability: ScenarioSession['traceability'];
};

export const scenarioCatalog: ScenarioDefinition[] = [
  {
    type: 'arrival',
    title: 'Arrival',
    summary: 'Pilot, tug, and station coordination before coming alongside.',
    contexts: ['arrival'],
    responsibility: 'bridge-team',
    traceability: [{ documentId: 'fleet-15', excerptId: 'fleet-15-arrival-brief', sectionRef: '2.5' }],
  },
  {
    type: 'departure',
    title: 'Departure',
    summary: 'Bridge, engine, and line handling alignment before letting go.',
    contexts: ['departure'],
    responsibility: 'bridge-team',
    traceability: [{ documentId: 'fleet-15', excerptId: 'fleet-15-departure-brief', sectionRef: '3.1' }],
  },
  {
    type: 'anchoring',
    title: 'Anchoring',
    summary: 'Preparation and hourly anchor checks while the vessel rides at anchor.',
    contexts: ['anchoring'],
    responsibility: 'bridge-team',
    traceability: [{ documentId: 'fleet-i21', excerptId: 'fleet-i21-anchor-prep', sectionRef: '2.2' }],
  },
  {
    type: 'in-port-watch',
    title: 'In-Port Watch',
    summary: 'Gangway, moorings, security, and pollution checks while alongside.',
    contexts: ['in-port'],
    responsibility: 'third-officer',
    traceability: [{ documentId: 'fleet-13', excerptId: 'fleet-13-in-port-round', sectionRef: '3.3' }],
  },
];

const scenarioCatalogByType = new Map(scenarioCatalog.map((entry) => [entry.type, entry]));

export function getScenarioDefinition(type: ScenarioSession['scenario']) {
  const definition = scenarioCatalogByType.get(type);

  if (!definition) {
    throw new Error(`Unknown scenario type: ${type}`);
  }

  return definition;
}

export function formatScenarioTitle(type: ScenarioSession['scenario']) {
  return getScenarioDefinition(type).title;
}

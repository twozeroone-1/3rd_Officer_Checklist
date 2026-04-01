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
    title: '입항',
    summary: '도선사, 예선, 부서 배치를 정리하며 접안 전 준비를 맞춥니다.',
    contexts: ['arrival'],
    responsibility: 'bridge-team',
    traceability: [{ documentId: 'fleet-15', excerptId: 'fleet-15-arrival-brief', sectionRef: '2.5' }],
  },
  {
    type: 'departure',
    title: '출항',
    summary: '기관, 선교, 라인 작업을 맞추며 이안 전 준비를 점검합니다.',
    contexts: ['departure'],
    responsibility: 'bridge-team',
    traceability: [{ documentId: 'fleet-15', excerptId: 'fleet-15-departure-brief', sectionRef: '3.1' }],
  },
  {
    type: 'anchoring',
    title: '투묘',
    summary: '투묘 준비와 묘박 중 시간당 위치 확인을 함께 관리합니다.',
    contexts: ['anchoring'],
    responsibility: 'bridge-team',
    traceability: [{ documentId: 'fleet-i21', excerptId: 'fleet-i21-anchor-prep', sectionRef: '2.2' }],
  },
  {
    type: 'in-port-watch',
    title: '정박당직',
    summary: '갱웨이, 계선, 보안, 오염 점검을 정박 중 당직 흐름으로 묶습니다.',
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

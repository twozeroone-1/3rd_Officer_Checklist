import { BackupEnvelopeSchema, ManualDocumentSchema, TaskTemplateSchema } from './schema';

describe('domain schema', () => {
  it('parses a manual document with curated excerpts', () => {
    const result = ManualDocumentSchema.safeParse({
      id: 'fleet-12',
      code: 'FLEET-12',
      title: 'Navigation at Sea',
      revision: '2025.1',
      summary: 'Bridge watchkeeping guide.',
      source: 'Curated company manual',
      excerpts: [
        {
          id: 'fleet-12-watch-alarm',
          heading: 'Bridge watch alarm',
          summary: 'Verify the bridge watch alarm before taking over the watch.',
          body: 'Confirm the alarm settings and report defects to the master.',
          tags: ['watch', 'alarm'],
          traceability: {
            documentId: 'fleet-12',
            excerptId: 'fleet-12-watch-alarm',
            sectionRef: '5.2',
          },
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('parses a task template with frequency, context, condition, and traceability', () => {
    const result = TaskTemplateSchema.safeParse({
      id: 'watch-handover-prep',
      title: 'Prepare for watch handover',
      category: 'routine',
      summary: 'Confirm charts, standing orders, and ongoing traffic before watch takeover.',
      frequency: 'watch',
      contexts: ['sea'],
      conditionTriggers: ['before-watch'],
      responsibility: 'third-officer',
      status: 'active',
      traceability: [
        {
          documentId: 'fleet-12',
          excerptId: 'fleet-12-watch-alarm',
          sectionRef: '5.2',
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('parses a scenario template without a routine frequency', () => {
    const result = TaskTemplateSchema.safeParse({
      id: 'arrival-bridge-preparation',
      title: 'Run arrival bridge preparation',
      category: 'scenario',
      summary: 'Prepare for pilot boarding and bridge team coordination.',
      scenarioType: 'arrival',
      contexts: ['arrival'],
      conditionTriggers: ['before-arrival'],
      responsibility: 'bridge-team',
      status: 'active',
      traceability: [
        {
          documentId: 'fleet-15',
          excerptId: 'fleet-15-arrival-brief',
          sectionRef: '2.5',
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('rejects a scenario template when routine frequency is used as a placeholder', () => {
    const result = TaskTemplateSchema.safeParse({
      id: 'arrival-bridge-preparation',
      title: 'Run arrival bridge preparation',
      category: 'scenario',
      summary: 'Prepare for pilot boarding and bridge team coordination.',
      frequency: 'conditional',
      contexts: ['arrival'],
      conditionTriggers: ['before-arrival'],
      responsibility: 'bridge-team',
      status: 'active',
      traceability: [
        {
          documentId: 'fleet-15',
          excerptId: 'fleet-15-arrival-brief',
          sectionRef: '2.5',
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it('rejects unsupported backup envelope versions', () => {
    const result = BackupEnvelopeSchema.safeParse({
      version: '0.0.1',
      exportedAt: new Date().toISOString(),
      appVersion: '0.1.0',
      payload: {
        manuals: [],
        taskTemplates: [],
        executionItems: [],
        completionLogs: [],
        linkedNotes: [],
        scenarioSessions: [],
        settings: [],
      },
    });

    expect(result.success).toBe(false);
  });
});

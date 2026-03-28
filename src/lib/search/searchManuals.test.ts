import fleet12 from '../../data/manuals/fleet-12.json';
import fleetI13 from '../../data/manuals/fleet-i13.json';
import type { ManualDocument } from '../../domain/types';
import { searchManuals } from './searchManuals';

const manuals = [fleet12, fleetI13] as ManualDocument[];

describe('searchManuals', () => {
  it('matches document code, summary keywords, and excerpt content', () => {
    expect(searchManuals(manuals, 'FLEET-I13')[0]?.document.code).toBe('FLEET-I13');
    expect(searchManuals(manuals, 'emergency lighting')[0]?.excerpt.id).toBe('fleet-i13-weekly-lsa-ffa');
    expect(searchManuals(manuals, 'weather development')[0]?.excerpt.id).toBe('fleet-12-watch-handover');
  });

  it('returns traceability fields intact so excerpts survive lookup', () => {
    const result = searchManuals(manuals, 'gyro');

    expect(result[0]).toMatchObject({
      documentId: 'fleet-12',
      excerptId: 'fleet-12-nav-equipment-check',
      sectionRef: '4.4',
    });
    expect(result[0]?.excerpt.traceability).toEqual({
      documentId: 'fleet-12',
      excerptId: 'fleet-12-nav-equipment-check',
      sectionRef: '4.4',
    });
  });
});

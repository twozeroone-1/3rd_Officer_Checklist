import fleet12 from '../manuals/fleet-12.json';
import fleet13 from '../manuals/fleet-13.json';
import fleet15 from '../manuals/fleet-15.json';
import fleetI13 from '../manuals/fleet-i13.json';
import fleetI21 from '../manuals/fleet-i21.json';
import { manualLinks } from './manualLinks';
import { routineTemplates } from './routineTemplates';
import { scenarioTemplates } from './scenarioTemplates';

const manuals = [fleet12, fleet13, fleet15, fleetI13, fleetI21];
const knownTraceabilityLinks = new Set(
  manuals.flatMap((manual) =>
    manual.excerpts.map(
      (excerpt) => `${excerpt.traceability.documentId}::${excerpt.traceability.excerptId}::${excerpt.traceability.sectionRef}`,
    ),
  ),
);

describe('manual template links', () => {
  it('maps every template to at least one fully traceable manual excerpt', () => {
    for (const template of [...routineTemplates, ...scenarioTemplates]) {
      const links = manualLinks[template.id] ?? [];

      expect(links.length).toBeGreaterThan(0);
      expect(
        links.every((link) =>
          knownTraceabilityLinks.has(`${link.documentId}::${link.excerptId}::${link.sectionRef}`),
        ),
      ).toBe(true);
    }
  });
});

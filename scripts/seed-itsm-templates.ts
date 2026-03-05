/**
 * Seed ITSM Templates
 * 
 * Run this script to seed default ticket templates:
 * bun run scripts/seed-itsm-templates.ts
 */

import { seedTicketTemplates, getTicketTemplates } from '../src/lib/integrations/itsm/store';

async function main() {
  console.log('Seeding ITSM ticket templates...');
  
  await seedTicketTemplates();
  
  console.log('Templates seeded successfully!');
  
  // Verify
  const templates = await getTicketTemplates();
  console.log(`\nSeeded ${templates.length} templates:`);
  for (const t of templates) {
    console.log(`  - ${t.id}: ${t.name} (${t.severity})`);
  }
}

main().catch(console.error);

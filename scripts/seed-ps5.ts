/**
 * Seed script — adds a PS5 product via the API.
 * Run with: npx tsx scripts/seed-ps5.ts
 *
 * Requires the Next.js dev server to be running on localhost:3000.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function seed() {
  const product = {
    name: 'PlayStation 5',
    slug: 'playstation-5',
    targetPrice: 3500,
    stores: [
      { store: 'amazon', url: 'https://www.amazon.com.br/Console-PlayStation-5-Sony/dp/B0CX49MJKL', enabled: true },
      { store: 'mercadolivre', url: 'https://www.mercadolivre.com.br/sony-playstation-5-slim-1tb/p/MLB27751964', enabled: true },
      { store: 'kabum', url: 'https://www.kabum.com.br/produto/550569/console-sony-playstation-5-ps5-slim', enabled: true },
      { store: 'magazineluiza', url: 'https://www.magazineluiza.com.br/console-playstation-5-slim/p/237585500/', enabled: true },
      { store: 'casasbahia', url: 'https://www.casasbahia.com.br/console-playstation-5-slim/p/1566007059', enabled: true },
      { store: 'ponto', url: 'https://www.pontofrio.com.br/console-playstation-5-slim/p/1566007059', enabled: true },
      { store: 'fastshop', url: 'https://www.fastshop.com.br/web/p/d/DMGCFIPS5SLI_PRD/console-playstation-5-slim', enabled: true },
      { store: 'americanas', url: 'https://www.americanas.com.br/produto/7702971498', enabled: true },
      { store: 'submarino', url: 'https://www.submarino.com.br/produto/7702971498', enabled: true },
    ],
  };

  console.log('Adding PS5 product...');

  const res = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });

  if (!res.ok) {
    console.error('Failed:', await res.text());
    process.exit(1);
  }

  const created = await res.json();
  console.log('Product created:', created);
  console.log('\nYou can now visit http://localhost:3000 to see it in the dashboard.');
}

seed().catch(console.error);

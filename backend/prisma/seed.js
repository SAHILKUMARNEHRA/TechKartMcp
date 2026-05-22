import 'dotenv/config';
import { syncProductsFromAPI } from '../src/services/product.service.js';
import { prisma } from '../src/config/database.js';

async function main() {
  console.log('Seeding TechKart database...');
  await syncProductsFromAPI();
  const count = await prisma.product.count();
  console.log(`Done. Total products in DB: ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

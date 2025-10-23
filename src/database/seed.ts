import { v4 as uuidv4 } from 'uuid';
import { query, closePool } from './connection';
import { PRODUCTS } from '../config/products';
import logger from '../utils/logger';

async function seed() {
  try {
    logger.info('Starting database seed...');

    // Clear existing products
    await query('DELETE FROM products');
    logger.info('Cleared existing products');

    // Insert products
    for (const product of PRODUCTS) {
      const productId = uuidv4();
      await query(
        `INSERT INTO products (id, sku, name, description, price_cents, currency, active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [
          productId,
          product.sku,
          product.name,
          product.description,
          product.priceCents,
          product.currency,
          product.active,
        ]
      );
      logger.info({ sku: product.sku, name: product.name }, 'Product inserted');
    }

    logger.info(`✅ Successfully seeded ${PRODUCTS.length} products`);
  } catch (error) {
    logger.error({ error }, 'Error seeding database');
    throw error;
  } finally {
    await closePool();
  }
}

// Run seed if called directly
if (require.main === module) {
  seed()
    .then(() => {
      logger.info('Seed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error({ error }, 'Seed failed');
      process.exit(1);
    });
}

export default seed;

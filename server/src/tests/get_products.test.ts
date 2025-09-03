import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable } from '../db/schema';
import { getProducts } from '../handlers/get_products';
import { eq } from 'drizzle-orm';

// Test data
const testUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  avatar_url: null,
  location: 'Kuala Lumpur'
};

const testProductMadeInMY = {
  id: 'product-1',
  title: 'Malaysian Product',
  description: 'A great product made in Malaysia',
  url: 'https://example.com/product-1',
  tags: ['tech', 'malaysia'],
  location: 'Kuala Lumpur',
  is_made_in_my: true,
  author_id: 'user-1'
};

const testProductNotMadeInMY = {
  id: 'product-2', 
  title: 'Foreign Product',
  description: 'A product not made in Malaysia',
  url: 'https://example.com/product-2',
  tags: ['tech', 'international'],
  location: 'Singapore',
  is_made_in_my: false,
  author_id: 'user-1'
};

const testProduct2MadeInMY = {
  id: 'product-3',
  title: 'Another Malaysian Product',
  description: 'Another great product made in Malaysia',
  url: 'https://example.com/product-3',
  tags: ['food', 'malaysia'],
  location: 'Penang',
  is_made_in_my: true,
  author_id: 'user-1'
};

describe('getProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no products exist', async () => {
    const result = await getProducts();
    expect(result).toEqual([]);
  });

  it('should return only products where is_made_in_my is true', async () => {
    // Create test user first
    await db.insert(usersTable).values(testUser).execute();

    // Create products with different is_made_in_my values
    await db.insert(productsTable).values([
      testProductMadeInMY,
      testProductNotMadeInMY,
      testProduct2MadeInMY
    ]).execute();

    const result = await getProducts();

    // Should return only 2 products (the ones with is_made_in_my = true)
    expect(result).toHaveLength(2);
    
    // Verify all returned products have is_made_in_my = true
    result.forEach(product => {
      expect(product.is_made_in_my).toBe(true);
    });

    // Verify correct products are returned
    const productIds = result.map(p => p.id);
    expect(productIds).toContain('product-1');
    expect(productIds).toContain('product-3');
    expect(productIds).not.toContain('product-2');
  });

  it('should return products ordered by creation date (newest first)', async () => {
    // Create test user first
    await db.insert(usersTable).values(testUser).execute();

    // Insert first product
    await db.insert(productsTable).values(testProductMadeInMY).execute();

    // Wait a small amount to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Insert second product (should be newer)
    await db.insert(productsTable).values(testProduct2MadeInMY).execute();

    const result = await getProducts();

    expect(result).toHaveLength(2);
    
    // Verify ordering - newest first
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[0].id).toBe('product-3'); // The second product inserted
    expect(result[1].id).toBe('product-1'); // The first product inserted
  });

  it('should return products with all expected fields', async () => {
    // Create test user first
    await db.insert(usersTable).values(testUser).execute();

    // Create a product
    await db.insert(productsTable).values(testProductMadeInMY).execute();

    const result = await getProducts();

    expect(result).toHaveLength(1);
    
    const product = result[0];
    expect(product.id).toBeDefined();
    expect(product.title).toEqual('Malaysian Product');
    expect(product.description).toEqual('A great product made in Malaysia');
    expect(product.url).toEqual('https://example.com/product-1');
    expect(product.tags).toEqual(['tech', 'malaysia']);
    expect(product.location).toEqual('Kuala Lumpur');
    expect(product.is_made_in_my).toBe(true);
    expect(product.author_id).toEqual('user-1');
    expect(product.created_at).toBeInstanceOf(Date);
  });

  it('should handle products with null location', async () => {
    // Create test user first
    await db.insert(usersTable).values(testUser).execute();

    const productWithNullLocation = {
      ...testProductMadeInMY,
      id: 'product-null-location',
      location: null
    };

    await db.insert(productsTable).values(productWithNullLocation).execute();

    const result = await getProducts();

    expect(result).toHaveLength(1);
    expect(result[0].location).toBeNull();
  });

  it('should handle products with empty tags array', async () => {
    // Create test user first
    await db.insert(usersTable).values(testUser).execute();

    const productWithEmptyTags = {
      ...testProductMadeInMY,
      id: 'product-empty-tags',
      tags: []
    };

    await db.insert(productsTable).values(productWithEmptyTags).execute();

    const result = await getProducts();

    expect(result).toHaveLength(1);
    expect(result[0].tags).toEqual([]);
  });

  it('should verify products are saved correctly in database', async () => {
    // Create test user first
    await db.insert(usersTable).values(testUser).execute();

    // Create a product
    await db.insert(productsTable).values(testProductMadeInMY).execute();

    // Fetch via handler
    const result = await getProducts();

    // Verify via direct database query
    const dbProducts = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, 'product-1'))
      .execute();

    expect(result).toHaveLength(1);
    expect(dbProducts).toHaveLength(1);
    expect(result[0].id).toEqual(dbProducts[0].id);
    expect(result[0].title).toEqual(dbProducts[0].title);
    expect(result[0].is_made_in_my).toEqual(dbProducts[0].is_made_in_my);
  });
});
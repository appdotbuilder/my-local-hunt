import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable } from '../db/schema';
import { type GetProductsByLocationInput } from '../schema';
import { getProductsByLocation } from '../handlers/get_products_by_location';
// Generate simple test IDs
const generateTestId = () => `test-${Math.random().toString(36).substr(2, 9)}`;

// Test users and products data
const testUser = {
  id: generateTestId(),
  name: 'Test User',
  email: 'test@example.com',
  avatar_url: null,
  location: 'Kuala Lumpur'
};

const testProductsKL = [
  {
    id: generateTestId(),
    title: 'KL Product 1',
    description: 'Product made in Kuala Lumpur',
    url: 'https://example.com/kl1',
    tags: ['tech', 'startup'],
    location: 'Kuala Lumpur',
    is_made_in_my: true,
    author_id: testUser.id
  },
  {
    id: generateTestId(),
    title: 'KL Product 2',
    description: 'Another product from Kuala Lumpur',
    url: 'https://example.com/kl2',
    tags: ['business', 'local'],
    location: 'Kuala Lumpur',
    is_made_in_my: true,
    author_id: testUser.id
  }
];

const testProductPenang = {
  id: generateTestId(),
  title: 'Penang Product',
  description: 'Product from Penang',
  url: 'https://example.com/penang',
  tags: ['food', 'culture'],
  location: 'Penang',
  is_made_in_my: true,
  author_id: testUser.id
};

const testProductNotMalaysian = {
  id: generateTestId(),
  title: 'Foreign Product in KL',
  description: 'Non-Malaysian product located in KL',
  url: 'https://example.com/foreign',
  tags: ['foreign'],
  location: 'Kuala Lumpur',
  is_made_in_my: false,
  author_id: testUser.id
};

const testInput: GetProductsByLocationInput = {
  location: 'Kuala Lumpur'
};

describe('getProductsByLocation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return products from specified location that are Malaysian-made', async () => {
    // Create test user first
    await db.insert(usersTable).values(testUser).execute();

    // Create test products
    await db.insert(productsTable).values([
      ...testProductsKL,
      testProductPenang,
      testProductNotMalaysian
    ]).execute();

    const results = await getProductsByLocation(testInput);

    // Should only return Malaysian-made products from Kuala Lumpur
    expect(results).toHaveLength(2);
    
    results.forEach(product => {
      expect(product.location).toEqual('Kuala Lumpur');
      expect(product.is_made_in_my).toBe(true);
      expect(product.id).toBeDefined();
      expect(product.title).toBeDefined();
      expect(product.description).toBeDefined();
      expect(product.url).toBeDefined();
      expect(product.tags).toBeInstanceOf(Array);
      expect(product.created_at).toBeInstanceOf(Date);
      expect(product.author_id).toEqual(testUser.id);
    });

    // Verify specific products are returned
    const titles = results.map(p => p.title).sort();
    expect(titles).toEqual(['KL Product 1', 'KL Product 2']);
  });

  it('should return empty array when no Malaysian products exist for location', async () => {
    // Create test user first
    await db.insert(usersTable).values(testUser).execute();

    // Create only non-Malaysian product in KL
    await db.insert(productsTable).values(testProductNotMalaysian).execute();

    const results = await getProductsByLocation(testInput);

    expect(results).toHaveLength(0);
  });

  it('should return empty array when location has no products', async () => {
    // Create test user first
    await db.insert(usersTable).values(testUser).execute();

    // Create products in different location
    await db.insert(productsTable).values(testProductPenang).execute();

    const results = await getProductsByLocation(testInput);

    expect(results).toHaveLength(0);
  });

  it('should handle location filtering correctly', async () => {
    // Create test user first
    await db.insert(usersTable).values(testUser).execute();

    // Create products in different locations
    await db.insert(productsTable).values([
      ...testProductsKL,
      testProductPenang
    ]).execute();

    // Test Kuala Lumpur filter
    const klResults = await getProductsByLocation({ location: 'Kuala Lumpur' });
    expect(klResults).toHaveLength(2);
    klResults.forEach(product => {
      expect(product.location).toEqual('Kuala Lumpur');
    });

    // Test Penang filter
    const penangResults = await getProductsByLocation({ location: 'Penang' });
    expect(penangResults).toHaveLength(1);
    expect(penangResults[0].location).toEqual('Penang');
    expect(penangResults[0].title).toEqual('Penang Product');
  });

  it('should preserve all product fields in response', async () => {
    // Create test user first
    await db.insert(usersTable).values(testUser).execute();

    // Create single test product with all fields
    const detailedProduct = {
      ...testProductsKL[0],
      tags: ['tech', 'startup', 'mobile']
    };
    await db.insert(productsTable).values(detailedProduct).execute();

    const results = await getProductsByLocation(testInput);

    expect(results).toHaveLength(1);
    const product = results[0];

    expect(product.id).toEqual(detailedProduct.id);
    expect(product.title).toEqual(detailedProduct.title);
    expect(product.description).toEqual(detailedProduct.description);
    expect(product.url).toEqual(detailedProduct.url);
    expect(product.tags).toEqual(['tech', 'startup', 'mobile']);
    expect(product.location).toEqual('Kuala Lumpur');
    expect(product.is_made_in_my).toBe(true);
    expect(product.author_id).toEqual(testUser.id);
    expect(product.created_at).toBeInstanceOf(Date);
  });
});
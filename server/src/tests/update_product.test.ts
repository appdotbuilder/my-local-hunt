import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable } from '../db/schema';
import { type UpdateProductInput } from '../schema';
import { updateProduct } from '../handlers/update_product';
import { eq } from 'drizzle-orm';

describe('updateProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test data
  const testUser = {
    id: 'user1',
    name: 'Test User',
    email: 'test@example.com',
    avatar_url: null,
    location: null
  };

  const testProduct = {
    id: 'product1',
    title: 'Original Product',
    description: 'Original description',
    url: 'https://original.com',
    tags: ['tech', 'startup'],
    location: 'Kuala Lumpur',
    is_made_in_my: true,
    author_id: 'user1'
  };

  const createTestData = async () => {
    // Create user first
    await db.insert(usersTable).values(testUser).execute();
    
    // Create product
    await db.insert(productsTable).values(testProduct).execute();
  };

  it('should update product with all fields', async () => {
    await createTestData();

    const updateInput: UpdateProductInput = {
      id: 'product1',
      title: 'Updated Product',
      description: 'Updated description',
      url: 'https://updated.com',
      tags: ['web', 'saas'],
      location: 'Penang',
      is_made_in_my: false
    };

    const result = await updateProduct(updateInput);

    expect(result.id).toEqual('product1');
    expect(result.title).toEqual('Updated Product');
    expect(result.description).toEqual('Updated description');
    expect(result.url).toEqual('https://updated.com');
    expect(result.tags).toEqual(['web', 'saas']);
    expect(result.location).toEqual('Penang');
    expect(result.is_made_in_my).toEqual(false);
    expect(result.author_id).toEqual('user1');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update product with partial fields', async () => {
    await createTestData();

    const updateInput: UpdateProductInput = {
      id: 'product1',
      title: 'Partially Updated Product',
      tags: ['updated-tag']
    };

    const result = await updateProduct(updateInput);

    // Updated fields
    expect(result.title).toEqual('Partially Updated Product');
    expect(result.tags).toEqual(['updated-tag']);
    
    // Unchanged fields
    expect(result.description).toEqual('Original description');
    expect(result.url).toEqual('https://original.com');
    expect(result.location).toEqual('Kuala Lumpur');
    expect(result.is_made_in_my).toEqual(true);
    expect(result.author_id).toEqual('user1');
  });

  it('should save updated product to database', async () => {
    await createTestData();

    const updateInput: UpdateProductInput = {
      id: 'product1',
      title: 'Database Test Product',
      description: 'Updated in database'
    };

    await updateProduct(updateInput);

    // Verify changes in database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, 'product1'))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].title).toEqual('Database Test Product');
    expect(products[0].description).toEqual('Updated in database');
    expect(products[0].url).toEqual('https://original.com'); // Unchanged
    expect(products[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle nullable fields correctly', async () => {
    await createTestData();

    const updateInput: UpdateProductInput = {
      id: 'product1',
      location: null
    };

    const result = await updateProduct(updateInput);

    expect(result.location).toBeNull();
    expect(result.title).toEqual('Original Product'); // Unchanged

    // Verify in database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, 'product1'))
      .execute();

    expect(products[0].location).toBeNull();
  });

  it('should handle empty tags array', async () => {
    await createTestData();

    const updateInput: UpdateProductInput = {
      id: 'product1',
      tags: []
    };

    const result = await updateProduct(updateInput);

    expect(result.tags).toEqual([]);
    expect(Array.isArray(result.tags)).toBe(true);
    expect(result.tags.length).toEqual(0);
  });

  it('should throw error for non-existent product', async () => {
    await createTestData();

    const updateInput: UpdateProductInput = {
      id: 'non-existent-id',
      title: 'This should fail'
    };

    expect(updateProduct(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should preserve created_at timestamp', async () => {
    await createTestData();

    // Get original created_at
    const originalProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, 'product1'))
      .execute();

    const originalCreatedAt = originalProduct[0].created_at;

    // Update product
    const updateInput: UpdateProductInput = {
      id: 'product1',
      title: 'Updated Title'
    };

    const result = await updateProduct(updateInput);

    // created_at should be preserved
    expect(result.created_at).toEqual(originalCreatedAt);
  });

  it('should not update any fields when only id is provided', async () => {
    await createTestData();

    const updateInput: UpdateProductInput = {
      id: 'product1'
    };

    const result = await updateProduct(updateInput);

    // All fields should remain unchanged
    expect(result.title).toEqual('Original Product');
    expect(result.description).toEqual('Original description');
    expect(result.url).toEqual('https://original.com');
    expect(result.tags).toEqual(['tech', 'startup']);
    expect(result.location).toEqual('Kuala Lumpur');
    expect(result.is_made_in_my).toEqual(true);
    expect(result.author_id).toEqual('user1');
  });
});
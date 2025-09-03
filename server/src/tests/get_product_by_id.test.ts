import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable } from '../db/schema';
import { type GetProductByIdInput } from '../schema';
import { getProductById } from '../handlers/get_product_by_id';

// Test data
const testUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  avatar_url: null,
  location: 'Kuala Lumpur'
};

const testProduct = {
  id: 'product-1',
  title: 'Test Product',
  description: 'A product for testing',
  url: 'https://example.com/product',
  tags: ['tech', 'startup'],
  location: 'Malaysia',
  is_made_in_my: true,
  author_id: 'user-1'
};

describe('getProductById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return product when it exists', async () => {
    // Create prerequisite user first
    await db.insert(usersTable).values(testUser).execute();
    
    // Create test product
    await db.insert(productsTable).values(testProduct).execute();

    const input: GetProductByIdInput = { id: 'product-1' };
    const result = await getProductById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual('product-1');
    expect(result!.title).toEqual('Test Product');
    expect(result!.description).toEqual('A product for testing');
    expect(result!.url).toEqual('https://example.com/product');
    expect(result!.tags).toEqual(['tech', 'startup']);
    expect(result!.location).toEqual('Malaysia');
    expect(result!.is_made_in_my).toEqual(true);
    expect(result!.author_id).toEqual('user-1');
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null when product does not exist', async () => {
    const input: GetProductByIdInput = { id: 'non-existent-product' };
    const result = await getProductById(input);

    expect(result).toBeNull();
  });

  it('should handle products with minimal data', async () => {
    // Create prerequisite user
    await db.insert(usersTable).values(testUser).execute();

    // Create product with minimal required fields
    const minimalProduct = {
      id: 'minimal-product',
      title: 'Minimal Product',
      description: 'Minimal description',
      url: 'https://minimal.com',
      tags: [],
      location: null,
      is_made_in_my: false,
      author_id: 'user-1'
    };

    await db.insert(productsTable).values(minimalProduct).execute();

    const input: GetProductByIdInput = { id: 'minimal-product' };
    const result = await getProductById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual('minimal-product');
    expect(result!.title).toEqual('Minimal Product');
    expect(result!.tags).toEqual([]);
    expect(result!.location).toBeNull();
    expect(result!.is_made_in_my).toEqual(false);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should handle products with complex tags', async () => {
    // Create prerequisite user
    await db.insert(usersTable).values(testUser).execute();

    // Create product with many tags
    const complexProduct = {
      id: 'complex-product',
      title: 'Complex Product',
      description: 'Product with many tags',
      url: 'https://complex.com',
      tags: ['ai', 'machine-learning', 'blockchain', 'fintech', 'saas'],
      location: 'Penang',
      is_made_in_my: true,
      author_id: 'user-1'
    };

    await db.insert(productsTable).values(complexProduct).execute();

    const input: GetProductByIdInput = { id: 'complex-product' };
    const result = await getProductById(input);

    expect(result).not.toBeNull();
    expect(result!.tags).toEqual(['ai', 'machine-learning', 'blockchain', 'fintech', 'saas']);
    expect(result!.tags.length).toEqual(5);
    expect(result!.location).toEqual('Penang');
  });

  it('should validate all required fields are present', async () => {
    // Create prerequisite user
    await db.insert(usersTable).values(testUser).execute();
    
    // Create test product
    await db.insert(productsTable).values(testProduct).execute();

    const input: GetProductByIdInput = { id: 'product-1' };
    const result = await getProductById(input);

    // Verify all required fields exist
    expect(result).not.toBeNull();
    expect(typeof result!.id).toBe('string');
    expect(typeof result!.title).toBe('string');
    expect(typeof result!.description).toBe('string');
    expect(typeof result!.url).toBe('string');
    expect(Array.isArray(result!.tags)).toBe(true);
    expect(typeof result!.is_made_in_my).toBe('boolean');
    expect(typeof result!.author_id).toBe('string');
    expect(result!.created_at).toBeInstanceOf(Date);
  });
});
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, usersTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { createProduct } from '../handlers/create_product';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Test user data
const testUserId = 'test-user-id';
const testUser = {
  id: testUserId,
  name: 'Test User',
  email: 'test@example.com',
  avatar_url: null,
  location: null
};

// Base test input with all required fields
const baseTestInput: CreateProductInput = {
  title: 'Test Product',
  description: 'A comprehensive test product for our system',
  url: 'https://example.com/product',
  tags: ['tech', 'startup'],
  location: 'Kuala Lumpur',
  is_made_in_my: true,
  author_id: testUserId
};

describe('createProduct', () => {
  beforeEach(async () => {
    await createDB();
    // Create test user for foreign key reference
    await db.insert(usersTable).values(testUser).execute();
  });

  afterEach(resetDB);

  it('should create a product with all fields', async () => {
    const result = await createProduct(baseTestInput);

    // Validate all field values
    expect(result.title).toEqual('Test Product');
    expect(result.description).toEqual(baseTestInput.description);
    expect(result.url).toEqual('https://example.com/product');
    expect(result.tags).toEqual(['tech', 'startup']);
    expect(result.location).toEqual('Kuala Lumpur');
    expect(result.is_made_in_my).toEqual(true);
    expect(result.author_id).toEqual(testUserId);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('string');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save product to database correctly', async () => {
    const result = await createProduct(baseTestInput);

    // Verify product was saved to database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products).toHaveLength(1);
    const savedProduct = products[0];
    
    expect(savedProduct.title).toEqual('Test Product');
    expect(savedProduct.description).toEqual(baseTestInput.description);
    expect(savedProduct.url).toEqual('https://example.com/product');
    expect(savedProduct.tags).toEqual(['tech', 'startup']);
    expect(savedProduct.location).toEqual('Kuala Lumpur');
    expect(savedProduct.is_made_in_my).toEqual(true);
    expect(savedProduct.author_id).toEqual(testUserId);
    expect(savedProduct.created_at).toBeInstanceOf(Date);
  });

  it('should generate unique IDs for different products', async () => {
    const input1 = { ...baseTestInput, title: 'Product 1' };
    const input2 = { ...baseTestInput, title: 'Product 2' };

    const result1 = await createProduct(input1);
    const result2 = await createProduct(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.title).toEqual('Product 1');
    expect(result2.title).toEqual('Product 2');
  });

  it('should handle products with minimal data (using Zod defaults)', async () => {
    const minimalInput: CreateProductInput = {
      title: 'Minimal Product',
      description: 'Basic description',
      url: 'https://minimal.com',
      tags: [], // Explicitly set default
      is_made_in_my: true, // Explicitly set default
      author_id: testUserId
      // location can be undefined and will convert to null
    };

    const result = await createProduct(minimalInput);

    expect(result.title).toEqual('Minimal Product');
    expect(result.tags).toEqual([]); // Should use explicit default
    expect(result.is_made_in_my).toEqual(true); // Should use explicit default
    expect(result.location).toBeNull(); // Should convert undefined to null
  });

  it('should handle Malaysian-made products correctly', async () => {
    const malaysianInput: CreateProductInput = {
      ...baseTestInput,
      is_made_in_my: true,
      location: 'Penang'
    };

    const result = await createProduct(malaysianInput);

    expect(result.is_made_in_my).toEqual(true);
    expect(result.location).toEqual('Penang');
  });

  it('should handle non-Malaysian products correctly', async () => {
    const nonMalaysianInput: CreateProductInput = {
      ...baseTestInput,
      is_made_in_my: false,
      location: 'Singapore'
    };

    const result = await createProduct(nonMalaysianInput);

    expect(result.is_made_in_my).toEqual(false);
    expect(result.location).toEqual('Singapore');
  });

  it('should handle empty tags array', async () => {
    const emptyTagsInput: CreateProductInput = {
      ...baseTestInput,
      tags: []
    };

    const result = await createProduct(emptyTagsInput);

    expect(result.tags).toEqual([]);
  });

  it('should handle multiple tags correctly', async () => {
    const multiTagInput: CreateProductInput = {
      ...baseTestInput,
      tags: ['tech', 'startup', 'ai', 'web', 'mobile']
    };

    const result = await createProduct(multiTagInput);

    expect(result.tags).toEqual(['tech', 'startup', 'ai', 'web', 'mobile']);
    expect(result.tags.length).toEqual(5);
  });

  it('should throw error when author does not exist', async () => {
    const invalidAuthorInput: CreateProductInput = {
      ...baseTestInput,
      author_id: 'non-existent-user-id'
    };

    await expect(createProduct(invalidAuthorInput)).rejects.toThrow(/Author with id non-existent-user-id does not exist/i);
  });

  it('should validate author existence before creating product', async () => {
    const invalidAuthorId = randomUUID();
    const invalidInput: CreateProductInput = {
      ...baseTestInput,
      author_id: invalidAuthorId
    };

    await expect(createProduct(invalidInput)).rejects.toThrow(/does not exist/i);

    // Verify no product was created in database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.author_id, invalidAuthorId))
      .execute();

    expect(products).toHaveLength(0);
  });

  it('should handle null location correctly', async () => {
    const nullLocationInput: CreateProductInput = {
      ...baseTestInput,
      location: null
    };

    const result = await createProduct(nullLocationInput);

    expect(result.location).toBeNull();
  });
});
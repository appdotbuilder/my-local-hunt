import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable } from '../db/schema';
import { getProductsByAuthor } from '../handlers/get_products_by_author';

// Test users
const testUser1 = {
  id: 'user-1',
  name: 'Test User 1',
  email: 'user1@test.com',
  avatar_url: null,
  location: 'Kuala Lumpur'
};

const testUser2 = {
  id: 'user-2',
  name: 'Test User 2',
  email: 'user2@test.com',
  avatar_url: null,
  location: 'Penang'
};

// Test products
const testProduct1 = {
  id: 'product-1',
  title: 'Amazing App',
  description: 'An amazing application built in Malaysia',
  url: 'https://amazing-app.com',
  tags: ['app', 'tech'],
  location: 'Kuala Lumpur',
  is_made_in_my: true,
  author_id: 'user-1'
};

const testProduct2 = {
  id: 'product-2',
  title: 'Cool Website',
  description: 'A cool website project',
  url: 'https://cool-website.com',
  tags: ['website', 'design'],
  location: 'Kuala Lumpur',
  is_made_in_my: true,
  author_id: 'user-1'
};

const testProduct3 = {
  id: 'product-3',
  title: 'Different Product',
  description: 'A product by different author',
  url: 'https://different.com',
  tags: ['other'],
  location: 'Penang',
  is_made_in_my: true,
  author_id: 'user-2'
};

describe('getProductsByAuthor', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return products by specific author', async () => {
    // Create test users
    await db.insert(usersTable).values([testUser1, testUser2]);

    // Create test products with different creation times
    await db.insert(productsTable).values([testProduct1]);
    
    // Add slight delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await db.insert(productsTable).values([testProduct2]);
    await db.insert(productsTable).values([testProduct3]);

    const result = await getProductsByAuthor('user-1');

    // Should return only products by user-1
    expect(result).toHaveLength(2);
    
    // Verify all products belong to the correct author
    result.forEach(product => {
      expect(product.author_id).toBe('user-1');
    });

    // Verify product details
    const productTitles = result.map(p => p.title);
    expect(productTitles).toContain('Amazing App');
    expect(productTitles).toContain('Cool Website');
    expect(productTitles).not.toContain('Different Product');
  });

  it('should return products ordered by creation date (newest first)', async () => {
    // Create test user
    await db.insert(usersTable).values([testUser1]);

    // Create products with different creation times
    const olderProduct = {
      ...testProduct1,
      id: 'older-product',
      title: 'Older Product'
    };

    const newerProduct = {
      ...testProduct2,
      id: 'newer-product',
      title: 'Newer Product'
    };

    // Insert older product first
    await db.insert(productsTable).values([olderProduct]);
    
    // Add delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Insert newer product
    await db.insert(productsTable).values([newerProduct]);

    const result = await getProductsByAuthor('user-1');

    expect(result).toHaveLength(2);
    
    // Should be ordered by creation date (newest first)
    expect(result[0].title).toBe('Newer Product');
    expect(result[1].title).toBe('Older Product');
    
    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should return empty array for author with no products', async () => {
    // Create test user but no products
    await db.insert(usersTable).values([testUser1]);

    const result = await getProductsByAuthor('user-1');

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent author', async () => {
    // Create some test data but for different author
    await db.insert(usersTable).values([testUser1]);
    await db.insert(productsTable).values([testProduct1]);

    const result = await getProductsByAuthor('non-existent-user');

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle multiple products with same timestamp correctly', async () => {
    // Create test user
    await db.insert(usersTable).values([testUser1]);

    // Create multiple products for the same author
    const products = [
      { ...testProduct1, id: 'product-a', title: 'Product A' },
      { ...testProduct1, id: 'product-b', title: 'Product B' },
      { ...testProduct1, id: 'product-c', title: 'Product C' }
    ];

    // Insert all products at once (they'll have very similar timestamps)
    await db.insert(productsTable).values(products);

    const result = await getProductsByAuthor('user-1');

    expect(result).toHaveLength(3);
    
    // All products should belong to the correct author
    result.forEach(product => {
      expect(product.author_id).toBe('user-1');
      expect(product.created_at).toBeInstanceOf(Date);
    });

    // Verify all expected products are present
    const productTitles = result.map(p => p.title).sort();
    expect(productTitles).toEqual(['Product A', 'Product B', 'Product C']);
  });

  it('should return products with all expected fields', async () => {
    // Create test user and product
    await db.insert(usersTable).values([testUser1]);
    await db.insert(productsTable).values([testProduct1]);

    const result = await getProductsByAuthor('user-1');

    expect(result).toHaveLength(1);
    
    const product = result[0];
    
    // Verify all expected fields are present
    expect(product.id).toBe('product-1');
    expect(product.title).toBe('Amazing App');
    expect(product.description).toBe('An amazing application built in Malaysia');
    expect(product.url).toBe('https://amazing-app.com');
    expect(product.tags).toEqual(['app', 'tech']);
    expect(product.location).toBe('Kuala Lumpur');
    expect(product.is_made_in_my).toBe(true);
    expect(product.author_id).toBe('user-1');
    expect(product.created_at).toBeInstanceOf(Date);
  });
});
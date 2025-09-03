import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable } from '../db/schema';
import { type GetProductsByTagsInput } from '../schema';
import { getProductsByTags } from '../handlers/get_products_by_tags';

// Test data
const testUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  avatar_url: null,
  location: 'Kuala Lumpur'
};

const testProducts = [
  {
    id: 'product-1',
    title: 'Malaysian E-commerce Platform',
    description: 'A local e-commerce solution',
    url: 'https://example.com/ecommerce',
    tags: ['e-commerce', 'web', 'malaysia'],
    location: 'Kuala Lumpur',
    is_made_in_my: true,
    author_id: 'user-1'
  },
  {
    id: 'product-2',
    title: 'Food Delivery App',
    description: 'Malaysian food delivery service',
    url: 'https://example.com/food',
    tags: ['mobile', 'food', 'delivery'],
    location: 'Penang',
    is_made_in_my: true,
    author_id: 'user-1'
  },
  {
    id: 'product-3',
    title: 'International SaaS Tool',
    description: 'A global software solution',
    url: 'https://example.com/saas',
    tags: ['saas', 'productivity', 'web'],
    location: null,
    is_made_in_my: false, // Not Malaysian-made
    author_id: 'user-1'
  },
  {
    id: 'product-4',
    title: 'Local News App',
    description: 'Malaysian news aggregator',
    url: 'https://example.com/news',
    tags: ['news', 'mobile', 'malaysia'],
    location: 'Johor Bahru',
    is_made_in_my: true,
    author_id: 'user-1'
  },
  {
    id: 'product-5',
    title: 'Malaysian Fintech Solution',
    description: 'Local payment gateway',
    url: 'https://example.com/fintech',
    tags: ['fintech', 'payments', 'api'],
    location: 'Kuala Lumpur',
    is_made_in_my: true,
    author_id: 'user-1'
  }
];

describe('getProductsByTags', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  beforeEach(async () => {
    // Create test user first
    await db.insert(usersTable).values(testUser).execute();
    
    // Create test products
    await db.insert(productsTable).values(testProducts).execute();
  });

  it('should return products with matching tags (single tag)', async () => {
    const input: GetProductsByTagsInput = {
      tags: ['web']
    };

    const results = await getProductsByTags(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Malaysian E-commerce Platform');
    expect(results[0].tags).toContain('web');
    expect(results[0].is_made_in_my).toBe(true);
  });

  it('should return products with matching tags (multiple tags)', async () => {
    const input: GetProductsByTagsInput = {
      tags: ['mobile', 'fintech']
    };

    const results = await getProductsByTags(input);

    expect(results).toHaveLength(3);
    
    const titles = results.map(p => p.title).sort();
    expect(titles).toEqual([
      'Food Delivery App',
      'Local News App', 
      'Malaysian Fintech Solution'
    ]);
    
    // Verify all results are Malaysian-made
    results.forEach(product => {
      expect(product.is_made_in_my).toBe(true);
    });
  });

  it('should return products with overlapping tags', async () => {
    const input: GetProductsByTagsInput = {
      tags: ['malaysia', 'delivery']
    };

    const results = await getProductsByTags(input);

    expect(results).toHaveLength(3);
    
    const titles = results.map(p => p.title).sort();
    expect(titles).toEqual([
      'Food Delivery App',
      'Local News App',
      'Malaysian E-commerce Platform'
    ]);
  });

  it('should only return Malaysian-made products', async () => {
    const input: GetProductsByTagsInput = {
      tags: ['web'] // This tag exists in both Malaysian and non-Malaysian products
    };

    const results = await getProductsByTags(input);

    // Should only return the Malaysian product, not the international SaaS
    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Malaysian E-commerce Platform');
    expect(results[0].is_made_in_my).toBe(true);
  });

  it('should return empty array when no products match tags', async () => {
    const input: GetProductsByTagsInput = {
      tags: ['nonexistent-tag']
    };

    const results = await getProductsByTags(input);

    expect(results).toHaveLength(0);
  });

  it('should return empty array when tags array is empty', async () => {
    const input: GetProductsByTagsInput = {
      tags: []
    };

    const results = await getProductsByTags(input);

    // Should return all Malaysian-made products when no tag filter is applied
    expect(results).toHaveLength(4);
    
    // Verify all results are Malaysian-made
    results.forEach(product => {
      expect(product.is_made_in_my).toBe(true);
    });
  });

  it('should return products with correct schema structure', async () => {
    const input: GetProductsByTagsInput = {
      tags: ['mobile']
    };

    const results = await getProductsByTags(input);

    expect(results.length).toBeGreaterThan(0);
    
    const product = results[0];
    expect(product.id).toBeDefined();
    expect(product.title).toBeDefined();
    expect(product.description).toBeDefined();
    expect(product.url).toBeDefined();
    expect(Array.isArray(product.tags)).toBe(true);
    expect(typeof product.is_made_in_my).toBe('boolean');
    expect(product.created_at).toBeInstanceOf(Date);
    expect(product.author_id).toBeDefined();
    expect(typeof product.location === 'string' || product.location === null).toBe(true);
  });

  it('should handle case-sensitive tag matching', async () => {
    const input: GetProductsByTagsInput = {
      tags: ['Web'] // Different case
    };

    const results = await getProductsByTags(input);

    // Should not match 'web' tag due to case sensitivity
    expect(results).toHaveLength(0);
  });
});
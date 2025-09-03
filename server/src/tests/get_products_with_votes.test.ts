import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable, votesTable } from '../db/schema';
import { getProductsWithVotes } from '../handlers/get_products_with_votes';

describe('getProductsWithVotes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no products exist', async () => {
    const result = await getProductsWithVotes();
    expect(result).toEqual([]);
  });

  it('should return Malaysian products with vote count', async () => {
    // Create test user
    const userId = 'user-1';
    await db.insert(usersTable).values({
      id: userId,
      name: 'Test User',
      email: 'test@example.com'
    }).execute();

    // Create test products - one Malaysian, one not
    const malaysianProductId = 'product-1';
    const nonMalaysianProductId = 'product-2';
    
    await db.insert(productsTable).values([
      {
        id: malaysianProductId,
        title: 'Malaysian Product',
        description: 'Made in Malaysia',
        url: 'https://example.com',
        tags: ['tech'],
        location: 'Kuala Lumpur',
        is_made_in_my: true,
        author_id: userId
      },
      {
        id: nonMalaysianProductId,
        title: 'Non-Malaysian Product', 
        description: 'Not made in Malaysia',
        url: 'https://example2.com',
        tags: ['tech'],
        location: 'Singapore',
        is_made_in_my: false,
        author_id: userId
      }
    ]).execute();

    // Create additional user for votes
    const user2Id = 'user-2';
    await db.insert(usersTable).values({
      id: user2Id,
      name: 'Test User 2',
      email: 'test2@example.com'
    }).execute();

    // Add votes to Malaysian product
    await db.insert(votesTable).values([
      { id: 'vote-1', user_id: userId, product_id: malaysianProductId },
      { id: 'vote-2', user_id: user2Id, product_id: malaysianProductId }
    ]).execute();

    // Add vote to non-Malaysian product (should not appear in results)
    await db.insert(votesTable).values([
      { id: 'vote-3', user_id: userId, product_id: nonMalaysianProductId }
    ]).execute();

    const result = await getProductsWithVotes();

    // Should only return Malaysian products
    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Malaysian Product');
    expect(result[0].is_made_in_my).toBe(true);
    expect(result[0].vote_count).toEqual(2);
    expect(result[0].user_voted).toBeNull();
    expect(result[0].tags).toEqual(['tech']);
    expect(result[0].location).toEqual('Kuala Lumpur');
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should include user vote status when userId provided', async () => {
    // Create test users
    const user1Id = 'user-1';
    const user2Id = 'user-2';
    
    await db.insert(usersTable).values([
      { id: user1Id, name: 'User 1', email: 'user1@example.com' },
      { id: user2Id, name: 'User 2', email: 'user2@example.com' }
    ]).execute();

    // Create test product
    const productId = 'product-1';
    await db.insert(productsTable).values({
      id: productId,
      title: 'Test Product',
      description: 'A test product',
      url: 'https://example.com',
      tags: [],
      is_made_in_my: true,
      author_id: user1Id
    }).execute();

    // User 1 votes for the product
    await db.insert(votesTable).values({
      id: 'vote-1',
      user_id: user1Id,
      product_id: productId
    }).execute();

    // Check user vote status for user who voted
    const resultWithUser1 = await getProductsWithVotes(user1Id);
    expect(resultWithUser1).toHaveLength(1);
    expect(resultWithUser1[0].user_voted).toBe(true);
    expect(resultWithUser1[0].vote_count).toEqual(1);

    // Check user vote status for user who didn't vote
    const resultWithUser2 = await getProductsWithVotes(user2Id);
    expect(resultWithUser2).toHaveLength(1);
    expect(resultWithUser2[0].user_voted).toBe(false);
    expect(resultWithUser2[0].vote_count).toEqual(1);
  });

  it('should order products by vote count descending, then by created_at descending', async () => {
    // Create test user
    const userId = 'user-1';
    await db.insert(usersTable).values({
      id: userId,
      name: 'Test User',
      email: 'test@example.com'
    }).execute();

    // Create products with different creation times
    const product1Id = 'product-1';
    const product2Id = 'product-2';
    const product3Id = 'product-3';

    // Insert products in specific order to test sorting
    await db.insert(productsTable).values([
      {
        id: product1Id,
        title: 'Product with 1 vote',
        description: 'First product',
        url: 'https://example1.com',
        tags: [],
        is_made_in_my: true,
        author_id: userId
      },
      {
        id: product2Id,
        title: 'Product with 3 votes',
        description: 'Second product',
        url: 'https://example2.com',
        tags: [],
        is_made_in_my: true,
        author_id: userId
      },
      {
        id: product3Id,
        title: 'Product with 0 votes',
        description: 'Third product',
        url: 'https://example3.com',
        tags: [],
        is_made_in_my: true,
        author_id: userId
      }
    ]).execute();

    // Create additional users for votes
    await db.insert(usersTable).values([
      { id: 'user-2', name: 'User 2', email: 'user2@example.com' },
      { id: 'user-3', name: 'User 3', email: 'user3@example.com' }
    ]).execute();

    // Add votes
    await db.insert(votesTable).values([
      // 1 vote for product1
      { id: 'vote-1', user_id: userId, product_id: product1Id },
      
      // 3 votes for product2
      { id: 'vote-2', user_id: userId, product_id: product2Id },
      { id: 'vote-3', user_id: 'user-2', product_id: product2Id },
      { id: 'vote-4', user_id: 'user-3', product_id: product2Id }
      
      // 0 votes for product3
    ]).execute();

    const result = await getProductsWithVotes();

    expect(result).toHaveLength(3);
    
    // Should be ordered by vote count descending
    expect(result[0].title).toEqual('Product with 3 votes');
    expect(result[0].vote_count).toEqual(3);
    
    expect(result[1].title).toEqual('Product with 1 vote');
    expect(result[1].vote_count).toEqual(1);
    
    expect(result[2].title).toEqual('Product with 0 votes');
    expect(result[2].vote_count).toEqual(0);
  });

  it('should handle products with empty tags array correctly', async () => {
    // Create test user
    const userId = 'user-1';
    await db.insert(usersTable).values({
      id: userId,
      name: 'Test User',
      email: 'test@example.com'
    }).execute();

    // Create product with empty tags
    const productId = 'product-1';
    await db.insert(productsTable).values({
      id: productId,
      title: 'Product No Tags',
      description: 'Product without tags',
      url: 'https://example.com',
      tags: [],
      is_made_in_my: true,
      author_id: userId
    }).execute();

    const result = await getProductsWithVotes();

    expect(result).toHaveLength(1);
    expect(result[0].tags).toEqual([]);
    expect(result[0].vote_count).toEqual(0);
  });

  it('should handle products with null location correctly', async () => {
    // Create test user
    const userId = 'user-1';
    await db.insert(usersTable).values({
      id: userId,
      name: 'Test User',
      email: 'test@example.com'
    }).execute();

    // Create product with null location
    const productId = 'product-1';
    await db.insert(productsTable).values({
      id: productId,
      title: 'Product No Location',
      description: 'Product without location',
      url: 'https://example.com',
      tags: ['remote'],
      location: null,
      is_made_in_my: true,
      author_id: userId
    }).execute();

    const result = await getProductsWithVotes();

    expect(result).toHaveLength(1);
    expect(result[0].location).toBeNull();
    expect(result[0].tags).toEqual(['remote']);
  });

  it('should return products with consistent field types', async () => {
    // Create test user
    const userId = 'user-1';
    await db.insert(usersTable).values({
      id: userId,
      name: 'Test User',
      email: 'test@example.com'
    }).execute();

    // Create test product
    const productId = 'product-1';
    await db.insert(productsTable).values({
      id: productId,
      title: 'Test Product',
      description: 'A test product',
      url: 'https://example.com',
      tags: ['tech', 'startup'],
      location: 'Penang',
      is_made_in_my: true,
      author_id: userId
    }).execute();

    const result = await getProductsWithVotes(userId);

    expect(result).toHaveLength(1);
    const product = result[0];

    // Verify all field types
    expect(typeof product.id).toBe('string');
    expect(typeof product.title).toBe('string');
    expect(typeof product.description).toBe('string');
    expect(typeof product.url).toBe('string');
    expect(Array.isArray(product.tags)).toBe(true);
    expect(typeof product.location).toBe('string');
    expect(typeof product.is_made_in_my).toBe('boolean');
    expect(product.created_at).toBeInstanceOf(Date);
    expect(typeof product.author_id).toBe('string');
    expect(typeof product.vote_count).toBe('number');
    expect(typeof product.user_voted).toBe('boolean');
  });
});
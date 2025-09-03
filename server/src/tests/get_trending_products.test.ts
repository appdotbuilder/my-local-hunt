import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable, votesTable } from '../db/schema';
import { getTrendingProducts } from '../handlers/get_trending_products';

describe('getTrendingProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return trending products based on daily votes', async () => {
    // Create test user
    await db.insert(usersTable).values({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com'
    }).execute();

    // Create test products (Malaysian-made)
    await db.insert(productsTable).values([
      {
        id: 'product-1',
        title: 'Popular Product',
        description: 'Most voted product',
        url: 'https://example.com/product1',
        tags: ['tech'],
        is_made_in_my: true,
        author_id: 'user-1'
      },
      {
        id: 'product-2',
        title: 'Less Popular Product',
        description: 'Less voted product',
        url: 'https://example.com/product2',
        tags: ['design'],
        is_made_in_my: true,
        author_id: 'user-1'
      }
    ]).execute();

    // Create recent votes (within last 24 hours)
    const now = new Date();
    const recentTime = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago

    await db.insert(votesTable).values([
      {
        id: 'vote-1',
        user_id: 'user-1',
        product_id: 'product-1',
        created_at: recentTime
      },
      {
        id: 'vote-2',
        user_id: 'user-1',
        product_id: 'product-1',
        created_at: recentTime
      },
      {
        id: 'vote-3',
        user_id: 'user-1',
        product_id: 'product-2',
        created_at: recentTime
      }
    ]).execute();

    const results = await getTrendingProducts('daily');

    expect(results).toHaveLength(2);
    
    // Check that results are ordered by vote count (highest first)
    expect(results[0].title).toEqual('Popular Product');
    expect(results[0].vote_count).toEqual(2);
    expect(results[0].user_voted).toBeNull();
    expect(results[0].is_made_in_my).toBe(true);
    
    expect(results[1].title).toEqual('Less Popular Product');
    expect(results[1].vote_count).toEqual(1);
    expect(results[1].is_made_in_my).toBe(true);
  });

  it('should return trending products based on weekly votes', async () => {
    // Create test user
    await db.insert(usersTable).values({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com'
    }).execute();

    // Create test product
    await db.insert(productsTable).values({
      id: 'product-1',
      title: 'Weekly Trending Product',
      description: 'Product with votes in past week',
      url: 'https://example.com/product1',
      tags: ['tech'],
      is_made_in_my: true,
      author_id: 'user-1'
    }).execute();

    // Create votes from 5 days ago (within weekly timeframe)
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    await db.insert(votesTable).values([
      {
        id: 'vote-1',
        user_id: 'user-1',
        product_id: 'product-1',
        created_at: fiveDaysAgo
      },
      {
        id: 'vote-2',
        user_id: 'user-1',
        product_id: 'product-1',
        created_at: fiveDaysAgo
      }
    ]).execute();

    const results = await getTrendingProducts('weekly');

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Weekly Trending Product');
    expect(results[0].vote_count).toEqual(2);
  });

  it('should exclude old votes based on timeframe', async () => {
    // Create test user
    await db.insert(usersTable).values({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com'
    }).execute();

    // Create test product
    await db.insert(productsTable).values({
      id: 'product-1',
      title: 'Old Product',
      description: 'Product with old votes',
      url: 'https://example.com/product1',
      tags: ['tech'],
      is_made_in_my: true,
      author_id: 'user-1'
    }).execute();

    // Create old votes (2 days ago for daily timeframe)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    await db.insert(votesTable).values({
      id: 'vote-1',
      user_id: 'user-1',
      product_id: 'product-1',
      created_at: twoDaysAgo
    }).execute();

    const results = await getTrendingProducts('daily');

    // Product should appear but with 0 vote count
    expect(results).toHaveLength(1);
    expect(results[0].vote_count).toEqual(0);
  });

  it('should only include Malaysian-made products', async () => {
    // Create test user
    await db.insert(usersTable).values({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com'
    }).execute();

    // Create products - one Malaysian, one not
    await db.insert(productsTable).values([
      {
        id: 'product-1',
        title: 'Malaysian Product',
        description: 'Made in Malaysia',
        url: 'https://example.com/product1',
        tags: ['tech'],
        is_made_in_my: true,
        author_id: 'user-1'
      },
      {
        id: 'product-2',
        title: 'Foreign Product',
        description: 'Not made in Malaysia',
        url: 'https://example.com/product2',
        tags: ['tech'],
        is_made_in_my: false,
        author_id: 'user-1'
      }
    ]).execute();

    // Create recent votes for both products
    const now = new Date();
    const recentTime = new Date(now.getTime() - 12 * 60 * 60 * 1000);

    await db.insert(votesTable).values([
      {
        id: 'vote-1',
        user_id: 'user-1',
        product_id: 'product-1',
        created_at: recentTime
      },
      {
        id: 'vote-2',
        user_id: 'user-1',
        product_id: 'product-2',
        created_at: recentTime
      }
    ]).execute();

    const results = await getTrendingProducts('daily');

    // Only Malaysian product should be included
    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Malaysian Product');
    expect(results[0].is_made_in_my).toBe(true);
  });

  it('should handle products with no votes in timeframe', async () => {
    // Create test user
    await db.insert(usersTable).values({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com'
    }).execute();

    // Create test product
    await db.insert(productsTable).values({
      id: 'product-1',
      title: 'No Votes Product',
      description: 'Product without recent votes',
      url: 'https://example.com/product1',
      tags: ['tech'],
      is_made_in_my: true,
      author_id: 'user-1'
    }).execute();

    const results = await getTrendingProducts('daily');

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('No Votes Product');
    expect(results[0].vote_count).toEqual(0);
    expect(results[0].tags).toEqual(['tech']);
    expect(results[0].location).toBeNull();
  });

  it('should return empty array when no Malaysian products exist', async () => {
    // Create test user
    await db.insert(usersTable).values({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com'
    }).execute();

    // Create only non-Malaysian products
    await db.insert(productsTable).values({
      id: 'product-1',
      title: 'Foreign Product',
      description: 'Not made in Malaysia',
      url: 'https://example.com/product1',
      tags: ['tech'],
      is_made_in_my: false,
      author_id: 'user-1'
    }).execute();

    const results = await getTrendingProducts('daily');

    expect(results).toHaveLength(0);
  });

  it('should default to daily timeframe when no parameter provided', async () => {
    // Create test user
    await db.insert(usersTable).values({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com'
    }).execute();

    // Create test product
    await db.insert(productsTable).values({
      id: 'product-1',
      title: 'Default Timeframe Product',
      description: 'Product for default timeframe test',
      url: 'https://example.com/product1',
      tags: ['tech'],
      is_made_in_my: true,
      author_id: 'user-1'
    }).execute();

    // Create vote from 2 days ago (outside daily, but within weekly)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    await db.insert(votesTable).values({
      id: 'vote-1',
      user_id: 'user-1',
      product_id: 'product-1',
      created_at: twoDaysAgo
    }).execute();

    // Call without timeframe parameter (should default to 'daily')
    const results = await getTrendingProducts();

    // Should not count the 2-day-old vote for daily timeframe
    expect(results).toHaveLength(1);
    expect(results[0].vote_count).toEqual(0);
  });

  it('should handle products with complex data types correctly', async () => {
    // Create test user
    await db.insert(usersTable).values({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      location: 'Kuala Lumpur'
    }).execute();

    // Create product with location and multiple tags
    await db.insert(productsTable).values({
      id: 'product-1',
      title: 'Complex Product',
      description: 'Product with location and tags',
      url: 'https://example.com/product1',
      tags: ['tech', 'innovation', 'malaysia'],
      location: 'Penang',
      is_made_in_my: true,
      author_id: 'user-1'
    }).execute();

    const results = await getTrendingProducts('daily');

    expect(results).toHaveLength(1);
    expect(results[0].tags).toEqual(['tech', 'innovation', 'malaysia']);
    expect(results[0].location).toEqual('Penang');
    expect(results[0].created_at).toBeInstanceOf(Date);
    expect(results[0].id).toBeDefined();
    expect(results[0].author_id).toEqual('user-1');
  });
});
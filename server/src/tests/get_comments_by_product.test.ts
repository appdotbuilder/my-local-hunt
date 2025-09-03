import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable, commentsTable } from '../db/schema';
import { getCommentsByProduct } from '../handlers/get_comments_by_product';

describe('getCommentsByProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no comments exist for product', async () => {
    // Create user and product first
    const user = await db.insert(usersTable).values({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com'
    }).returning().execute();

    const product = await db.insert(productsTable).values({
      id: 'product-1',
      title: 'Test Product',
      description: 'Test Description',
      url: 'https://example.com',
      author_id: user[0].id
    }).returning().execute();

    const result = await getCommentsByProduct(product[0].id);

    expect(result).toEqual([]);
  });

  it('should return comments for a specific product', async () => {
    // Create user and product first
    const user = await db.insert(usersTable).values({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com'
    }).returning().execute();

    const product = await db.insert(productsTable).values({
      id: 'product-1',
      title: 'Test Product',
      description: 'Test Description',
      url: 'https://example.com',
      author_id: user[0].id
    }).returning().execute();

    // Create comments
    const comment1 = await db.insert(commentsTable).values({
      id: 'comment-1',
      content: 'First comment',
      author_id: user[0].id,
      product_id: product[0].id
    }).returning().execute();

    const comment2 = await db.insert(commentsTable).values({
      id: 'comment-2',
      content: 'Second comment',
      author_id: user[0].id,
      product_id: product[0].id
    }).returning().execute();

    const result = await getCommentsByProduct(product[0].id);

    expect(result).toHaveLength(2);
    expect(result[0].content).toEqual('Second comment');
    expect(result[1].content).toEqual('First comment');
    expect(result[0].author_id).toEqual(user[0].id);
    expect(result[0].product_id).toEqual(product[0].id);
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return comments in descending order by creation date', async () => {
    // Create user and product first
    const user = await db.insert(usersTable).values({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com'
    }).returning().execute();

    const product = await db.insert(productsTable).values({
      id: 'product-1',
      title: 'Test Product',
      description: 'Test Description',
      url: 'https://example.com',
      author_id: user[0].id
    }).returning().execute();

    // Create comments with slight delay to ensure different timestamps
    const comment1 = await db.insert(commentsTable).values({
      id: 'comment-1',
      content: 'Older comment',
      author_id: user[0].id,
      product_id: product[0].id
    }).returning().execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const comment2 = await db.insert(commentsTable).values({
      id: 'comment-2',
      content: 'Newer comment',
      author_id: user[0].id,
      product_id: product[0].id
    }).returning().execute();

    const result = await getCommentsByProduct(product[0].id);

    expect(result).toHaveLength(2);
    // Newer comment should be first (descending order)
    expect(result[0].content).toEqual('Newer comment');
    expect(result[1].content).toEqual('Older comment');
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should only return comments for the specified product', async () => {
    // Create user and multiple products
    const user = await db.insert(usersTable).values({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com'
    }).returning().execute();

    const product1 = await db.insert(productsTable).values({
      id: 'product-1',
      title: 'Test Product 1',
      description: 'Test Description 1',
      url: 'https://example1.com',
      author_id: user[0].id
    }).returning().execute();

    const product2 = await db.insert(productsTable).values({
      id: 'product-2',
      title: 'Test Product 2',
      description: 'Test Description 2',
      url: 'https://example2.com',
      author_id: user[0].id
    }).returning().execute();

    // Create comments for both products
    await db.insert(commentsTable).values({
      id: 'comment-1',
      content: 'Comment for product 1',
      author_id: user[0].id,
      product_id: product1[0].id
    }).execute();

    await db.insert(commentsTable).values({
      id: 'comment-2',
      content: 'Comment for product 2',
      author_id: user[0].id,
      product_id: product2[0].id
    }).execute();

    const result = await getCommentsByProduct(product1[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].content).toEqual('Comment for product 1');
    expect(result[0].product_id).toEqual(product1[0].id);
  });

  it('should handle multiple comments from different authors', async () => {
    // Create multiple users
    const user1 = await db.insert(usersTable).values({
      id: 'user-1',
      name: 'Test User 1',
      email: 'test1@example.com'
    }).returning().execute();

    const user2 = await db.insert(usersTable).values({
      id: 'user-2',
      name: 'Test User 2',
      email: 'test2@example.com'
    }).returning().execute();

    const product = await db.insert(productsTable).values({
      id: 'product-1',
      title: 'Test Product',
      description: 'Test Description',
      url: 'https://example.com',
      author_id: user1[0].id
    }).returning().execute();

    // Create comments from different authors
    await db.insert(commentsTable).values({
      id: 'comment-1',
      content: 'Comment from user 1',
      author_id: user1[0].id,
      product_id: product[0].id
    }).execute();

    await db.insert(commentsTable).values({
      id: 'comment-2',
      content: 'Comment from user 2',
      author_id: user2[0].id,
      product_id: product[0].id
    }).execute();

    const result = await getCommentsByProduct(product[0].id);

    expect(result).toHaveLength(2);
    
    // Verify both comments are returned with correct authors
    const authorIds = result.map(comment => comment.author_id);
    expect(authorIds).toContain(user1[0].id);
    expect(authorIds).toContain(user2[0].id);
    
    // Verify content matches
    const contents = result.map(comment => comment.content);
    expect(contents).toContain('Comment from user 1');
    expect(contents).toContain('Comment from user 2');
  });
});
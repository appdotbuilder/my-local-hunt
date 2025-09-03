import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable, commentsTable } from '../db/schema';
import { type UpdateCommentInput, type CreateUserInput, type CreateProductInput, type CreateCommentInput } from '../schema';
import { updateComment } from '../handlers/update_comment';
import { eq } from 'drizzle-orm';

// Test data
const testUser: CreateUserInput = {
  name: 'Test Author',
  email: 'author@example.com',
  avatar_url: 'https://example.com/avatar.jpg',
  location: 'Test City'
};

const testProduct: CreateProductInput = {
  title: 'Test Product',
  description: 'A product for testing',
  url: 'https://example.com/product',
  tags: ['test'],
  location: 'Test Location',
  is_made_in_my: true,
  author_id: 'user-1'
};

const testComment: CreateCommentInput = {
  content: 'Original comment content',
  author_id: 'user-1',
  product_id: 'product-1'
};

const testUpdateInput: UpdateCommentInput = {
  id: 'comment-1',
  content: 'Updated comment content'
};

describe('updateComment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update an existing comment', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values({
      id: 'user-1',
      name: testUser.name,
      email: testUser.email,
      avatar_url: testUser.avatar_url,
      location: testUser.location
    });

    await db.insert(productsTable).values({
      id: 'product-1',
      title: testProduct.title,
      description: testProduct.description,
      url: testProduct.url,
      tags: testProduct.tags,
      location: testProduct.location,
      is_made_in_my: testProduct.is_made_in_my,
      author_id: testProduct.author_id
    });

    await db.insert(commentsTable).values({
      id: 'comment-1',
      content: testComment.content,
      author_id: testComment.author_id,
      product_id: testComment.product_id
    });

    const result = await updateComment(testUpdateInput);

    // Verify the returned comment has updated content
    expect(result.id).toEqual('comment-1');
    expect(result.content).toEqual('Updated comment content');
    expect(result.author_id).toEqual('user-1');
    expect(result.product_id).toEqual('product-1');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated comment to database', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values({
      id: 'user-1',
      name: testUser.name,
      email: testUser.email,
      avatar_url: testUser.avatar_url,
      location: testUser.location
    });

    await db.insert(productsTable).values({
      id: 'product-1',
      title: testProduct.title,
      description: testProduct.description,
      url: testProduct.url,
      tags: testProduct.tags,
      location: testProduct.location,
      is_made_in_my: testProduct.is_made_in_my,
      author_id: testProduct.author_id
    });

    await db.insert(commentsTable).values({
      id: 'comment-1',
      content: testComment.content,
      author_id: testComment.author_id,
      product_id: testComment.product_id
    });

    await updateComment(testUpdateInput);

    // Query database to verify update
    const comments = await db.select()
      .from(commentsTable)
      .where(eq(commentsTable.id, 'comment-1'))
      .execute();

    expect(comments).toHaveLength(1);
    expect(comments[0].content).toEqual('Updated comment content');
    expect(comments[0].author_id).toEqual('user-1');
    expect(comments[0].product_id).toEqual('product-1');
    expect(comments[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent comment', async () => {
    const invalidUpdateInput: UpdateCommentInput = {
      id: 'non-existent-comment',
      content: 'Updated content'
    };

    await expect(updateComment(invalidUpdateInput)).rejects.toThrow(/Comment with id non-existent-comment not found/i);
  });

  it('should preserve other comment fields when updating', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values({
      id: 'user-1',
      name: testUser.name,
      email: testUser.email,
      avatar_url: testUser.avatar_url,
      location: testUser.location
    });

    await db.insert(productsTable).values({
      id: 'product-1',
      title: testProduct.title,
      description: testProduct.description,
      url: testProduct.url,
      tags: testProduct.tags,
      location: testProduct.location,
      is_made_in_my: testProduct.is_made_in_my,
      author_id: testProduct.author_id
    });

    // Insert comment with specific timestamp to verify it's preserved
    const originalCreatedAt = new Date('2023-01-01T00:00:00Z');
    await db.insert(commentsTable).values({
      id: 'comment-1',
      content: testComment.content,
      author_id: testComment.author_id,
      product_id: testComment.product_id,
      created_at: originalCreatedAt
    });

    const result = await updateComment(testUpdateInput);

    // Verify only content was updated, other fields preserved
    expect(result.content).toEqual('Updated comment content');
    expect(result.author_id).toEqual('user-1');
    expect(result.product_id).toEqual('product-1');
    expect(result.created_at).toEqual(originalCreatedAt);
  });
});
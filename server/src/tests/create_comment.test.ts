import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable, commentsTable } from '../db/schema';
import { type CreateCommentInput } from '../schema';
import { createComment } from '../handlers/create_comment';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Test data setup
const testUser = {
  id: randomUUID(),
  name: 'Test Author',
  email: 'author@example.com',
  avatar_url: null,
  location: null
};

const testProduct = {
  id: randomUUID(),
  title: 'Test Product',
  description: 'A product for testing comments',
  url: 'https://example.com/product',
  tags: ['test'],
  location: null,
  is_made_in_my: true,
  author_id: testUser.id
};

const testInput: CreateCommentInput = {
  content: 'This is a test comment',
  author_id: testUser.id,
  product_id: testProduct.id
};

describe('createComment', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create prerequisite user
    await db.insert(usersTable)
      .values(testUser)
      .execute();
      
    // Create prerequisite product
    await db.insert(productsTable)
      .values(testProduct)
      .execute();
  });
  
  afterEach(resetDB);

  it('should create a comment', async () => {
    const result = await createComment(testInput);

    // Basic field validation
    expect(result.content).toEqual('This is a test comment');
    expect(result.author_id).toEqual(testUser.id);
    expect(result.product_id).toEqual(testProduct.id);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('string');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save comment to database', async () => {
    const result = await createComment(testInput);

    // Query using proper drizzle syntax
    const comments = await db.select()
      .from(commentsTable)
      .where(eq(commentsTable.id, result.id))
      .execute();

    expect(comments).toHaveLength(1);
    expect(comments[0].content).toEqual('This is a test comment');
    expect(comments[0].author_id).toEqual(testUser.id);
    expect(comments[0].product_id).toEqual(testProduct.id);
    expect(comments[0].created_at).toBeInstanceOf(Date);
  });

  it('should generate unique IDs for multiple comments', async () => {
    const result1 = await createComment(testInput);
    const result2 = await createComment({
      ...testInput,
      content: 'Another test comment'
    });

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.id).toBeDefined();
    expect(result2.id).toBeDefined();
  });

  it('should reject comment for non-existent author', async () => {
    const invalidInput = {
      ...testInput,
      author_id: randomUUID() // Non-existent user ID
    };

    await expect(createComment(invalidInput)).rejects.toThrow(/User with id .* not found/i);
  });

  it('should reject comment for non-existent product', async () => {
    const invalidInput = {
      ...testInput,
      product_id: randomUUID() // Non-existent product ID
    };

    await expect(createComment(invalidInput)).rejects.toThrow(/Product with id .* not found/i);
  });

  it('should handle comments with special characters', async () => {
    const specialInput = {
      ...testInput,
      content: 'Special chars: !@#$%^&*()_+ "quotes" \'apostrophe\' 🚀 emoji'
    };

    const result = await createComment(specialInput);

    expect(result.content).toEqual(specialInput.content);
    
    // Verify in database
    const comments = await db.select()
      .from(commentsTable)
      .where(eq(commentsTable.id, result.id))
      .execute();
      
    expect(comments[0].content).toEqual(specialInput.content);
  });

  it('should handle long comment content', async () => {
    const longContent = 'A'.repeat(1000); // 1000 character comment
    const longInput = {
      ...testInput,
      content: longContent
    };

    const result = await createComment(longInput);

    expect(result.content).toEqual(longContent);
    expect(result.content.length).toEqual(1000);
  });
});
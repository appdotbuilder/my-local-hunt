import { db } from '../db';
import { commentsTable, usersTable, productsTable } from '../db/schema';
import { type CreateCommentInput, type Comment } from '../schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const createComment = async (input: CreateCommentInput): Promise<Comment> => {
  try {
    // Validate that the author exists
    const author = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.author_id))
      .execute();

    if (author.length === 0) {
      throw new Error(`User with id ${input.author_id} not found`);
    }

    // Validate that the product exists
    const product = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.product_id))
      .execute();

    if (product.length === 0) {
      throw new Error(`Product with id ${input.product_id} not found`);
    }

    // Insert the comment
    const result = await db.insert(commentsTable)
      .values({
        id: randomUUID(),
        content: input.content,
        author_id: input.author_id,
        product_id: input.product_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Comment creation failed:', error);
    throw error;
  }
};
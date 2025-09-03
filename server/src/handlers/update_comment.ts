import { db } from '../db';
import { commentsTable } from '../db/schema';
import { type UpdateCommentInput, type Comment } from '../schema';
import { eq } from 'drizzle-orm';

export const updateComment = async (input: UpdateCommentInput): Promise<Comment> => {
  try {
    // Check if comment exists
    const existingComment = await db.select()
      .from(commentsTable)
      .where(eq(commentsTable.id, input.id))
      .execute();

    if (existingComment.length === 0) {
      throw new Error(`Comment with id ${input.id} not found`);
    }

    // Update the comment
    const result = await db.update(commentsTable)
      .set({
        content: input.content
      })
      .where(eq(commentsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Comment update failed:', error);
    throw error;
  }
};
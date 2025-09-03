import { db } from '../db';
import { commentsTable } from '../db/schema';
import { type Comment } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getCommentsByProduct(productId: string): Promise<Comment[]> {
  try {
    // Query comments for the specific product, ordered by creation date (newest first)
    const results = await db.select()
      .from(commentsTable)
      .where(eq(commentsTable.product_id, productId))
      .orderBy(desc(commentsTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch comments for product:', error);
    throw error;
  }
}
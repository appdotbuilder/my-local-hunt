import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getProductsByAuthor(authorId: string): Promise<Product[]> {
  try {
    const results = await db.select()
      .from(productsTable)
      .where(eq(productsTable.author_id, authorId))
      .orderBy(desc(productsTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Get products by author failed:', error);
    throw error;
  }
}
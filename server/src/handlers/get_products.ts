import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getProducts(): Promise<Product[]> {
  try {
    // Query products where is_made_in_my is true, ordered by creation date (newest first)
    const results = await db.select()
      .from(productsTable)
      .where(eq(productsTable.is_made_in_my, true))
      .orderBy(desc(productsTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw error;
  }
}
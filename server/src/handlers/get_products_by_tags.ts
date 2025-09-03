import { db } from '../db';
import { productsTable } from '../db/schema';
import { type GetProductsByTagsInput, type Product } from '../schema';
import { eq, and, sql, SQL } from 'drizzle-orm';

export async function getProductsByTags(input: GetProductsByTagsInput): Promise<Product[]> {
  try {
    const conditions: SQL<unknown>[] = [
      eq(productsTable.is_made_in_my, true)
    ];
    
    // Add tag filtering if tags are provided
    if (input.tags.length > 0) {
      // Use PostgreSQL array overlap operator with proper SQL array literal
      conditions.push(
        sql`${productsTable.tags} && ARRAY[${sql.join(input.tags.map(tag => sql`${tag}`), sql`, `)}]`
      );
    }
    
    // Build and execute query
    const query = db.select()
      .from(productsTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions));
    
    const results = await query.execute();
    
    return results;
  } catch (error) {
    console.error('Get products by tags failed:', error);
    throw error;
  }
}
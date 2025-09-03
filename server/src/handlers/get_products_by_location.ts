import { db } from '../db';
import { productsTable } from '../db/schema';
import { type GetProductsByLocationInput, type Product } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function getProductsByLocation(input: GetProductsByLocationInput): Promise<Product[]> {
  try {
    // Query products with matching location and Malaysian-made filter
    const results = await db.select()
      .from(productsTable)
      .where(and(
        eq(productsTable.location, input.location),
        eq(productsTable.is_made_in_my, true)
      ))
      .execute();

    // Convert database results to Product schema format
    return results.map(product => ({
      id: product.id,
      title: product.title,
      description: product.description,
      url: product.url,
      tags: product.tags,
      location: product.location,
      is_made_in_my: product.is_made_in_my,
      created_at: product.created_at,
      author_id: product.author_id
    }));
  } catch (error) {
    console.error('Get products by location failed:', error);
    throw error;
  }
}
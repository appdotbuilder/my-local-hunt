import { db } from '../db';
import { productsTable } from '../db/schema';
import { type GetProductByIdInput, type Product } from '../schema';
import { eq } from 'drizzle-orm';

export async function getProductById(input: GetProductByIdInput): Promise<Product | null> {
  try {
    const result = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const product = result[0];
    return {
      id: product.id,
      title: product.title,
      description: product.description,
      url: product.url,
      tags: product.tags,
      location: product.location,
      is_made_in_my: product.is_made_in_my,
      created_at: product.created_at,
      author_id: product.author_id
    };
  } catch (error) {
    console.error('Failed to get product by ID:', error);
    throw error;
  }
}
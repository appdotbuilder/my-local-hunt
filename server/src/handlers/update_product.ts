import { db } from '../db';
import { productsTable } from '../db/schema';
import { type UpdateProductInput, type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const updateProduct = async (input: UpdateProductInput): Promise<Product> => {
  try {
    // First check if the product exists
    const existingProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.id))
      .execute();

    if (existingProduct.length === 0) {
      throw new Error(`Product with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof productsTable.$inferInsert> = {};
    
    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    
    if (input.url !== undefined) {
      updateData.url = input.url;
    }
    
    if (input.tags !== undefined) {
      updateData.tags = input.tags;
    }
    
    if (input.location !== undefined) {
      updateData.location = input.location;
    }
    
    if (input.is_made_in_my !== undefined) {
      updateData.is_made_in_my = input.is_made_in_my;
    }

    // If no fields to update, return existing product
    if (Object.keys(updateData).length === 0) {
      return existingProduct[0];
    }

    // Update the product
    const result = await db.update(productsTable)
      .set(updateData)
      .where(eq(productsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Product update failed:', error);
    throw error;
  }
};
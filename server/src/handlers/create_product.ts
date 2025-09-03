import { db } from '../db';
import { productsTable, usersTable } from '../db/schema';
import { type CreateProductInput, type Product } from '../schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const createProduct = async (input: CreateProductInput): Promise<Product> => {
  try {
    // First, validate that the author exists
    const author = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.author_id))
      .execute();

    if (author.length === 0) {
      throw new Error(`Author with id ${input.author_id} does not exist`);
    }

    // Generate a unique ID for the product
    const productId = randomUUID();

    // Insert the product record
    const result = await db.insert(productsTable)
      .values({
        id: productId,
        title: input.title,
        description: input.description,
        url: input.url,
        tags: input.tags, // Array field - no conversion needed
        location: input.location || null,
        is_made_in_my: input.is_made_in_my, // Boolean field with default already applied by Zod
        author_id: input.author_id
      })
      .returning()
      .execute();

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
    console.error('Product creation failed:', error);
    throw error;
  }
};
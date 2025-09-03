import { db } from '../db';
import { votesTable, usersTable, productsTable } from '../db/schema';
import { type CreateVoteInput, type Vote } from '../schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const createVote = async (input: CreateVoteInput): Promise<Vote> => {
  try {
    // Validate that user exists
    const userExists = await db.select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .limit(1)
      .execute();

    if (userExists.length === 0) {
      throw new Error(`User with id ${input.user_id} does not exist`);
    }

    // Validate that product exists
    const productExists = await db.select({ id: productsTable.id })
      .from(productsTable)
      .where(eq(productsTable.id, input.product_id))
      .limit(1)
      .execute();

    if (productExists.length === 0) {
      throw new Error(`Product with id ${input.product_id} does not exist`);
    }

    // Check if vote already exists to prevent duplicates
    const existingVote = await db.select({ id: votesTable.id })
      .from(votesTable)
      .where(and(
        eq(votesTable.user_id, input.user_id),
        eq(votesTable.product_id, input.product_id)
      ))
      .limit(1)
      .execute();

    if (existingVote.length > 0) {
      throw new Error(`User ${input.user_id} has already voted for product ${input.product_id}`);
    }

    // Create the vote
    const result = await db.insert(votesTable)
      .values({
        id: randomUUID(),
        user_id: input.user_id,
        product_id: input.product_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Vote creation failed:', error);
    throw error;
  }
};
import { db } from '../db';
import { productsTable, votesTable } from '../db/schema';
import { type ProductWithVotes } from '../schema';
import { eq, desc, count, sql } from 'drizzle-orm';

export async function getProductsWithVotes(userId?: string): Promise<ProductWithVotes[]> {
  try {
    // Build the base query with vote count and user vote status
    let query = db
      .select({
        id: productsTable.id,
        title: productsTable.title,
        description: productsTable.description,
        url: productsTable.url,
        tags: productsTable.tags,
        location: productsTable.location,
        is_made_in_my: productsTable.is_made_in_my,
        created_at: productsTable.created_at,
        author_id: productsTable.author_id,
        vote_count: count(votesTable.id).mapWith(Number),
        user_voted: userId 
          ? sql<boolean>`CASE WHEN ${sql`EXISTS(SELECT 1 FROM ${votesTable} WHERE ${votesTable.product_id} = ${productsTable.id} AND ${votesTable.user_id} = ${userId})`} THEN true ELSE false END`
          : sql<null>`NULL`
      })
      .from(productsTable)
      .leftJoin(votesTable, eq(votesTable.product_id, productsTable.id))
      .where(eq(productsTable.is_made_in_my, true))
      .groupBy(productsTable.id)
      .orderBy(desc(count(votesTable.id)), desc(productsTable.created_at));

    const results = await query.execute();

    return results.map(result => ({
      id: result.id,
      title: result.title,
      description: result.description,
      url: result.url,
      tags: result.tags || [],
      location: result.location,
      is_made_in_my: result.is_made_in_my,
      created_at: result.created_at,
      author_id: result.author_id,
      vote_count: result.vote_count,
      user_voted: result.user_voted
    }));
  } catch (error) {
    console.error('Failed to get products with votes:', error);
    throw error;
  }
}
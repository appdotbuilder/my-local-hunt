import { db } from '../db';
import { productsTable, votesTable } from '../db/schema';
import { type ProductWithVotes } from '../schema';
import { eq, gte, desc, count, and } from 'drizzle-orm';

export async function getTrendingProducts(timeframe: 'daily' | 'weekly' = 'daily'): Promise<ProductWithVotes[]> {
  try {
    // Calculate the cutoff date based on timeframe
    const now = new Date();
    const cutoffDate = new Date(now);
    
    if (timeframe === 'daily') {
      cutoffDate.setDate(cutoffDate.getDate() - 1);
    } else {
      cutoffDate.setDate(cutoffDate.getDate() - 7);
    }

    // Query to get products with vote counts from the specified timeframe
    // Only include Malaysian-made products (is_made_in_my = true)
    const results = await db
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
        vote_count: count(votesTable.id)
      })
      .from(productsTable)
      .leftJoin(
        votesTable,
        and(
          eq(votesTable.product_id, productsTable.id),
          gte(votesTable.created_at, cutoffDate)
        )
      )
      .where(eq(productsTable.is_made_in_my, true))
      .groupBy(
        productsTable.id,
        productsTable.title,
        productsTable.description,
        productsTable.url,
        productsTable.tags,
        productsTable.location,
        productsTable.is_made_in_my,
        productsTable.created_at,
        productsTable.author_id
      )
      .orderBy(desc(count(votesTable.id)))
      .execute();

    // Transform results to match ProductWithVotes schema
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
      user_voted: null // Not applicable in this context since no specific user is provided
    }));
  } catch (error) {
    console.error('Failed to get trending products:', error);
    throw error;
  }
}
import { db } from '../db';
import { votesTable } from '../db/schema';
import { type DeleteVoteInput } from '../schema';
import { and, eq } from 'drizzle-orm';

export async function deleteVote(input: DeleteVoteInput): Promise<boolean> {
  try {
    // Find and delete the vote record for the specific user and product
    const result = await db.delete(votesTable)
      .where(
        and(
          eq(votesTable.user_id, input.user_id),
          eq(votesTable.product_id, input.product_id)
        )
      )
      .execute();

    // Return true if a vote was found and deleted, false if no vote was found
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Vote deletion failed:', error);
    throw error;
  }
}
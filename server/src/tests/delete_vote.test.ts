import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable, votesTable } from '../db/schema';
import { type DeleteVoteInput } from '../schema';
import { deleteVote } from '../handlers/delete_vote';
import { eq, and } from 'drizzle-orm';

// Test data
const testUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com'
};

const testProduct = {
  id: 'product-1',
  title: 'Test Product',
  description: 'A product for testing',
  url: 'https://example.com',
  tags: ['test'],
  author_id: 'user-1'
};

const testVote = {
  id: 'vote-1',
  user_id: 'user-1',
  product_id: 'product-1'
};

const testInput: DeleteVoteInput = {
  user_id: 'user-1',
  product_id: 'product-1'
};

describe('deleteVote', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing vote and return true', async () => {
    // Create prerequisite data
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    await db.insert(productsTable)
      .values(testProduct)
      .execute();

    await db.insert(votesTable)
      .values(testVote)
      .execute();

    // Delete the vote
    const result = await deleteVote(testInput);

    expect(result).toBe(true);

    // Verify vote was deleted from database
    const votes = await db.select()
      .from(votesTable)
      .where(
        and(
          eq(votesTable.user_id, testInput.user_id),
          eq(votesTable.product_id, testInput.product_id)
        )
      )
      .execute();

    expect(votes).toHaveLength(0);
  });

  it('should return false when trying to delete non-existing vote', async () => {
    // Create prerequisite data but no vote
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    await db.insert(productsTable)
      .values(testProduct)
      .execute();

    // Try to delete non-existing vote
    const result = await deleteVote(testInput);

    expect(result).toBe(false);

    // Verify no votes exist in database
    const votes = await db.select()
      .from(votesTable)
      .execute();

    expect(votes).toHaveLength(0);
  });

  it('should only delete the specific vote', async () => {
    // Create prerequisite data
    await db.insert(usersTable)
      .values([
        testUser,
        { id: 'user-2', name: 'User 2', email: 'user2@example.com' }
      ])
      .execute();

    await db.insert(productsTable)
      .values([
        testProduct,
        { id: 'product-2', title: 'Product 2', description: 'Second product', url: 'https://example2.com', tags: [], author_id: 'user-2' }
      ])
      .execute();

    // Create multiple votes
    await db.insert(votesTable)
      .values([
        testVote,
        { id: 'vote-2', user_id: 'user-2', product_id: 'product-1' },
        { id: 'vote-3', user_id: 'user-1', product_id: 'product-2' }
      ])
      .execute();

    // Delete specific vote
    const result = await deleteVote(testInput);

    expect(result).toBe(true);

    // Verify only the target vote was deleted
    const remainingVotes = await db.select()
      .from(votesTable)
      .execute();

    expect(remainingVotes).toHaveLength(2);
    expect(remainingVotes.find(v => v.id === 'vote-1')).toBeUndefined();
    expect(remainingVotes.find(v => v.id === 'vote-2')).toBeDefined();
    expect(remainingVotes.find(v => v.id === 'vote-3')).toBeDefined();
  });

  it('should handle different user-product combinations correctly', async () => {
    // Create prerequisite data
    await db.insert(usersTable)
      .values([
        testUser,
        { id: 'user-2', name: 'User 2', email: 'user2@example.com' }
      ])
      .execute();

    await db.insert(productsTable)
      .values([
        testProduct,
        { id: 'product-2', title: 'Product 2', description: 'Second product', url: 'https://example2.com', tags: [], author_id: 'user-2' }
      ])
      .execute();

    // Create votes for different user-product combinations
    await db.insert(votesTable)
      .values([
        { id: 'vote-1', user_id: 'user-1', product_id: 'product-1' },
        { id: 'vote-2', user_id: 'user-1', product_id: 'product-2' },
        { id: 'vote-3', user_id: 'user-2', product_id: 'product-1' }
      ])
      .execute();

    // Delete vote for user-1 and product-2
    const result = await deleteVote({
      user_id: 'user-1',
      product_id: 'product-2'
    });

    expect(result).toBe(true);

    // Verify correct vote was deleted
    const remainingVotes = await db.select()
      .from(votesTable)
      .execute();

    expect(remainingVotes).toHaveLength(2);
    
    const deletedVote = remainingVotes.find(v => 
      v.user_id === 'user-1' && v.product_id === 'product-2'
    );
    expect(deletedVote).toBeUndefined();

    // Verify other votes remain
    const user1Product1Vote = remainingVotes.find(v => 
      v.user_id === 'user-1' && v.product_id === 'product-1'
    );
    expect(user1Product1Vote).toBeDefined();

    const user2Product1Vote = remainingVotes.find(v => 
      v.user_id === 'user-2' && v.product_id === 'product-1'
    );
    expect(user2Product1Vote).toBeDefined();
  });
});
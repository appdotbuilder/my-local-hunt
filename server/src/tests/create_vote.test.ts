import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable, votesTable } from '../db/schema';
import { type CreateVoteInput } from '../schema';
import { createVote } from '../handlers/create_vote';
import { eq, and } from 'drizzle-orm';

describe('createVote', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test data setup
  const testUser = {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    avatar_url: null,
    location: null
  };

  const testProduct = {
    id: 'test-product-id',
    title: 'Test Product',
    description: 'A test product',
    url: 'https://example.com',
    tags: ['test'],
    location: null,
    is_made_in_my: true,
    author_id: 'test-user-id'
  };

  const testVoteInput: CreateVoteInput = {
    user_id: 'test-user-id',
    product_id: 'test-product-id'
  };

  const setupTestData = async () => {
    // Create user first
    await db.insert(usersTable).values(testUser).execute();
    
    // Create product
    await db.insert(productsTable).values(testProduct).execute();
  };

  it('should create a vote successfully', async () => {
    await setupTestData();

    const result = await createVote(testVoteInput);

    // Verify basic vote properties
    expect(result.user_id).toEqual('test-user-id');
    expect(result.product_id).toEqual('test-product-id');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('string');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save vote to database', async () => {
    await setupTestData();

    const result = await createVote(testVoteInput);

    // Query database to verify vote was saved
    const votes = await db.select()
      .from(votesTable)
      .where(eq(votesTable.id, result.id))
      .execute();

    expect(votes).toHaveLength(1);
    expect(votes[0].user_id).toEqual('test-user-id');
    expect(votes[0].product_id).toEqual('test-product-id');
    expect(votes[0].created_at).toBeInstanceOf(Date);
  });

  it('should prevent duplicate votes from same user for same product', async () => {
    await setupTestData();

    // Create first vote
    await createVote(testVoteInput);

    // Attempt to create duplicate vote should fail
    await expect(createVote(testVoteInput))
      .rejects
      .toThrow(/has already voted for product/i);
  });

  it('should allow same user to vote for different products', async () => {
    await setupTestData();

    // Create second product
    const secondProduct = {
      id: 'test-product-id-2',
      title: 'Second Test Product',
      description: 'Another test product',
      url: 'https://example2.com',
      tags: ['test2'],
      location: null,
      is_made_in_my: true,
      author_id: 'test-user-id'
    };
    await db.insert(productsTable).values(secondProduct).execute();

    // Vote for first product
    const firstVote = await createVote({
      user_id: 'test-user-id',
      product_id: 'test-product-id'
    });

    // Vote for second product should work
    const secondVote = await createVote({
      user_id: 'test-user-id',
      product_id: 'test-product-id-2'
    });

    expect(firstVote.product_id).toEqual('test-product-id');
    expect(secondVote.product_id).toEqual('test-product-id-2');
    expect(firstVote.id).not.toEqual(secondVote.id);
  });

  it('should allow different users to vote for same product', async () => {
    await setupTestData();

    // Create second user
    const secondUser = {
      id: 'test-user-id-2',
      name: 'Second Test User',
      email: 'test2@example.com',
      avatar_url: null,
      location: null
    };
    await db.insert(usersTable).values(secondUser).execute();

    // First user votes
    const firstVote = await createVote({
      user_id: 'test-user-id',
      product_id: 'test-product-id'
    });

    // Second user votes for same product
    const secondVote = await createVote({
      user_id: 'test-user-id-2',
      product_id: 'test-product-id'
    });

    expect(firstVote.user_id).toEqual('test-user-id');
    expect(secondVote.user_id).toEqual('test-user-id-2');
    expect(firstVote.product_id).toEqual(secondVote.product_id);
    expect(firstVote.id).not.toEqual(secondVote.id);
  });

  it('should throw error when user does not exist', async () => {
    // Create user first for the product to reference
    await db.insert(usersTable).values(testUser).execute();
    // Create product with valid author_id
    await db.insert(productsTable).values(testProduct).execute();

    await expect(createVote({
      user_id: 'non-existent-user',
      product_id: 'test-product-id'
    })).rejects.toThrow(/User with id non-existent-user does not exist/i);
  });

  it('should throw error when product does not exist', async () => {
    // Only create user, not product
    await db.insert(usersTable).values(testUser).execute();

    await expect(createVote({
      user_id: 'test-user-id',
      product_id: 'non-existent-product'
    })).rejects.toThrow(/Product with id non-existent-product does not exist/i);
  });

  it('should verify vote existence in database with proper conditions', async () => {
    await setupTestData();

    await createVote(testVoteInput);

    // Query with proper drizzle syntax using and() with spread operator
    const votes = await db.select()
      .from(votesTable)
      .where(and(
        eq(votesTable.user_id, 'test-user-id'),
        eq(votesTable.product_id, 'test-product-id')
      ))
      .execute();

    expect(votes).toHaveLength(1);
    expect(votes[0].user_id).toEqual('test-user-id');
    expect(votes[0].product_id).toEqual('test-product-id');
  });
});
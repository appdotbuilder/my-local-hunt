import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type CreateUserInput } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';

// Helper function to create a test user
const createTestUser = async (userData: CreateUserInput) => {
  const result = await db.insert(usersTable)
    .values({
      id: crypto.randomUUID(),
      name: userData.name,
      email: userData.email,
      avatar_url: userData.avatar_url ?? null,
      location: userData.location ?? null
    })
    .returning()
    .execute();

  return result[0];
};

// Test input data
const testUserData: CreateUserInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar_url: 'https://example.com/avatar.jpg',
  location: 'New York'
};

describe('updateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a user with all fields', async () => {
    // Create test user
    const createdUser = await createTestUser(testUserData);

    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      name: 'Jane Smith',
      avatar_url: 'https://example.com/new-avatar.jpg',
      location: 'Los Angeles'
    };

    const result = await updateUser(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(createdUser.id);
    expect(result.name).toEqual('Jane Smith');
    expect(result.avatar_url).toEqual('https://example.com/new-avatar.jpg');
    expect(result.location).toEqual('Los Angeles');
    expect(result.email).toEqual(testUserData.email); // Email should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    // Create test user
    const createdUser = await createTestUser(testUserData);

    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      name: 'Updated Name'
    };

    const result = await updateUser(updateInput);

    // Verify only name was updated
    expect(result.name).toEqual('Updated Name');
    expect(result.avatar_url).toEqual(testUserData.avatar_url ?? null);
    expect(result.location).toEqual(testUserData.location ?? null);
    expect(result.email).toEqual(testUserData.email);
  });

  it('should update avatar_url to null', async () => {
    // Create test user
    const createdUser = await createTestUser(testUserData);

    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      avatar_url: null
    };

    const result = await updateUser(updateInput);

    // Verify avatar_url was set to null
    expect(result.avatar_url).toBeNull();
    expect(result.name).toEqual(testUserData.name); // Other fields unchanged
    expect(result.location).toEqual(testUserData.location ?? null);
  });

  it('should update location to null', async () => {
    // Create test user
    const createdUser = await createTestUser(testUserData);

    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      location: null
    };

    const result = await updateUser(updateInput);

    // Verify location was set to null
    expect(result.location).toBeNull();
    expect(result.name).toEqual(testUserData.name); // Other fields unchanged
    expect(result.avatar_url).toEqual(testUserData.avatar_url ?? null);
  });

  it('should save updated user to database', async () => {
    // Create test user
    const createdUser = await createTestUser(testUserData);

    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      name: 'Database Test User',
      location: 'Chicago'
    };

    await updateUser(updateInput);

    // Query database to verify changes were persisted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, createdUser.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].name).toEqual('Database Test User');
    expect(users[0].location).toEqual('Chicago');
    expect(users[0].avatar_url).toEqual(testUserData.avatar_url ?? null); // Unchanged field
    expect(users[0].email).toEqual(testUserData.email); // Unchanged field
  });

  it('should throw error when user does not exist', async () => {
    const nonExistentId = crypto.randomUUID();
    
    const updateInput: UpdateUserInput = {
      id: nonExistentId,
      name: 'Non-existent User'
    };

    await expect(updateUser(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle user with null fields', async () => {
    // Create user with null optional fields
    const userWithNulls: CreateUserInput = {
      name: 'Minimal User',
      email: 'minimal@example.com',
      avatar_url: null,
      location: null
    };

    const createdUser = await createTestUser(userWithNulls);

    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      name: 'Updated Minimal User',
      avatar_url: 'https://example.com/new-avatar.jpg'
    };

    const result = await updateUser(updateInput);

    expect(result.name).toEqual('Updated Minimal User');
    expect(result.avatar_url).toEqual('https://example.com/new-avatar.jpg');
    expect(result.location).toBeNull(); // Should remain null
    expect(result.email).toEqual(userWithNulls.email);
  });

  it('should update multiple fields simultaneously', async () => {
    // Create test user
    const createdUser = await createTestUser(testUserData);

    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      name: 'Multi Update User',
      avatar_url: 'https://example.com/multi-avatar.jpg',
      location: 'Multi City'
    };

    const result = await updateUser(updateInput);

    // Verify all fields were updated
    expect(result.name).toEqual('Multi Update User');
    expect(result.avatar_url).toEqual('https://example.com/multi-avatar.jpg');
    expect(result.location).toEqual('Multi City');
    expect(result.email).toEqual(testUserData.email); // Email unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
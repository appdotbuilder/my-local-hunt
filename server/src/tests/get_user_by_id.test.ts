import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type GetUserByIdInput } from '../schema';
import { getUserById } from '../handlers/get_user_by_id';

// Test input for getting user by ID
const testGetUserInput: GetUserByIdInput = {
  id: 'test-user-123'
};



describe('getUserById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a user when found', async () => {
    // First create a user directly in the database
    await db.insert(usersTable)
      .values({
        id: 'test-user-123',
        name: 'Test User',
        email: 'test@example.com',
        avatar_url: 'https://example.com/avatar.jpg',
        location: 'Test City'
      })
      .execute();

    const result = await getUserById(testGetUserInput);

    expect(result).not.toBeNull();
    expect(result?.id).toEqual('test-user-123');
    expect(result?.name).toEqual('Test User');
    expect(result?.email).toEqual('test@example.com');
    expect(result?.avatar_url).toEqual('https://example.com/avatar.jpg');
    expect(result?.location).toEqual('Test City');
    expect(result?.created_at).toBeInstanceOf(Date);
  });

  it('should return null when user not found', async () => {
    const result = await getUserById({ id: 'nonexistent-user' });

    expect(result).toBeNull();
  });

  it('should return user with correct data types', async () => {
    // Create user with minimal required fields
    await db.insert(usersTable)
      .values({
        id: 'minimal-user',
        name: 'Minimal User',
        email: 'minimal@example.com',
        avatar_url: null,
        location: null
      })
      .execute();

    const result = await getUserById({ id: 'minimal-user' });

    expect(result).not.toBeNull();
    expect(typeof result?.id).toEqual('string');
    expect(typeof result?.name).toEqual('string');
    expect(typeof result?.email).toEqual('string');
    expect(result?.avatar_url).toBeNull();
    expect(result?.location).toBeNull();
    expect(result?.created_at).toBeInstanceOf(Date);
  });

  it('should handle empty string id', async () => {
    const result = await getUserById({ id: '' });

    expect(result).toBeNull();
  });

  it('should find user among multiple users', async () => {
    // Create multiple users
    await db.insert(usersTable)
      .values([
        {
          id: 'user-1',
          name: 'User One',
          email: 'user1@example.com',
          avatar_url: null,
          location: null
        },
        {
          id: 'user-2',
          name: 'User Two',
          email: 'user2@example.com',
          avatar_url: null,
          location: null
        },
        {
          id: 'user-3',
          name: 'User Three',
          email: 'user3@example.com',
          avatar_url: null,
          location: null
        }
      ])
      .execute();

    // Should find the correct user
    const result = await getUserById({ id: 'user-2' });

    expect(result).not.toBeNull();
    expect(result?.id).toEqual('user-2');
    expect(result?.name).toEqual('User Two');
    expect(result?.email).toEqual('user2@example.com');
  });
});
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateUserInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar_url: 'https://example.com/avatar.jpg',
  location: 'New York'
};

// Minimal required input
const minimalInput: CreateUserInput = {
  name: 'Jane Smith',
  email: 'jane.smith@example.com'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with all fields', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.avatar_url).toEqual('https://example.com/avatar.jpg');
    expect(result.location).toEqual('New York');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('string');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a user with minimal fields', async () => {
    const result = await createUser(minimalInput);

    // Verify required fields
    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.avatar_url).toBeNull();
    expect(result.location).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('string');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].name).toEqual('John Doe');
    expect(users[0].email).toEqual('john.doe@example.com');
    expect(users[0].avatar_url).toEqual('https://example.com/avatar.jpg');
    expect(users[0].location).toEqual('New York');
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should generate unique IDs for different users', async () => {
    const user1 = await createUser({
      name: 'User One',
      email: 'user1@example.com'
    });

    const user2 = await createUser({
      name: 'User Two', 
      email: 'user2@example.com'
    });

    expect(user1.id).toBeDefined();
    expect(user2.id).toBeDefined();
    expect(user1.id).not.toEqual(user2.id);
  });

  it('should prevent duplicate email addresses', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create second user with same email
    const duplicateInput: CreateUserInput = {
      name: 'Different Name',
      email: 'john.doe@example.com' // Same email
    };

    await expect(createUser(duplicateInput))
      .rejects
      .toThrow(/already exists/i);
  });

  it('should handle optional fields correctly', async () => {
    const inputWithNullValues: CreateUserInput = {
      name: 'Test User',
      email: 'test@example.com',
      avatar_url: null,
      location: null
    };

    const result = await createUser(inputWithNullValues);

    expect(result.avatar_url).toBeNull();
    expect(result.location).toBeNull();
  });

  it('should preserve user data integrity after creation', async () => {
    const result = await createUser(testInput);

    // Query the same user again
    const savedUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, testInput.email))
      .execute();

    expect(savedUser).toHaveLength(1);
    expect(savedUser[0].id).toEqual(result.id);
    expect(savedUser[0].name).toEqual(result.name);
    expect(savedUser[0].email).toEqual(result.email);
    expect(savedUser[0].avatar_url).toEqual(result.avatar_url);
    expect(savedUser[0].location).toEqual(result.location);
  });

  it('should handle special characters in user data', async () => {
    const specialInput: CreateUserInput = {
      name: 'José María González-Smith',
      email: 'jose.maria+test@example.com',
      location: 'São Paulo, Brasil'
    };

    const result = await createUser(specialInput);

    expect(result.name).toEqual('José María González-Smith');
    expect(result.email).toEqual('jose.maria+test@example.com');
    expect(result.location).toEqual('São Paulo, Brasil');

    // Verify in database
    const savedUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(savedUser[0].name).toEqual('José María González-Smith');
    expect(savedUser[0].location).toEqual('São Paulo, Brasil');
  });
});
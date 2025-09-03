import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Check if email already exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .limit(1)
      .execute();

    if (existingUser.length > 0) {
      throw new Error(`User with email ${input.email} already exists`);
    }

    // Insert new user record
    const result = await db.insert(usersTable)
      .values({
        id: randomUUID(),
        name: input.name,
        email: input.email,
        avatar_url: input.avatar_url ?? null,
        location: input.location ?? null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};
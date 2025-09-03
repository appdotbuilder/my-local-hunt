import { type CreateUserInput, type User } from '../schema';

export async function createUser(input: CreateUserInput): Promise<User> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is creating a new user and persisting it in the database.
  // Should generate a unique ID and validate email uniqueness.
  return Promise.resolve({
    id: 'placeholder-user-id',
    name: input.name,
    email: input.email,
    avatar_url: input.avatar_url || null,
    location: input.location || null,
    created_at: new Date()
  } as User);
}
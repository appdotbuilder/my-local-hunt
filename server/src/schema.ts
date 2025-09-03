import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatar_url: z.string().nullable(),
  location: z.string().nullable(),
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Input schema for creating users
export const createUserInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  avatar_url: z.string().url().nullable().optional(),
  location: z.string().nullable().optional()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Input schema for updating users
export const updateUserInputSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  avatar_url: z.string().url().nullable().optional(),
  location: z.string().nullable().optional()
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// Product schema
export const productSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  url: z.string().url(),
  tags: z.array(z.string()),
  location: z.string().nullable(),
  is_made_in_my: z.boolean(),
  created_at: z.coerce.date(),
  author_id: z.string()
});

export type Product = z.infer<typeof productSchema>;

// Input schema for creating products
export const createProductInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  url: z.string().url("Valid URL is required"),
  tags: z.array(z.string()).default([]),
  location: z.string().nullable().optional(),
  is_made_in_my: z.boolean().default(true),
  author_id: z.string()
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

// Input schema for updating products
export const updateProductInputSchema = z.object({
  id: z.string(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  url: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  location: z.string().nullable().optional(),
  is_made_in_my: z.boolean().optional()
});

export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;

// Vote schema
export const voteSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  product_id: z.string(),
  created_at: z.coerce.date()
});

export type Vote = z.infer<typeof voteSchema>;

// Input schema for creating votes
export const createVoteInputSchema = z.object({
  user_id: z.string(),
  product_id: z.string()
});

export type CreateVoteInput = z.infer<typeof createVoteInputSchema>;

// Comment schema
export const commentSchema = z.object({
  id: z.string(),
  content: z.string(),
  author_id: z.string(),
  product_id: z.string(),
  created_at: z.coerce.date()
});

export type Comment = z.infer<typeof commentSchema>;

// Input schema for creating comments
export const createCommentInputSchema = z.object({
  content: z.string().min(1, "Comment content is required"),
  author_id: z.string(),
  product_id: z.string()
});

export type CreateCommentInput = z.infer<typeof createCommentInputSchema>;

// Input schema for updating comments
export const updateCommentInputSchema = z.object({
  id: z.string(),
  content: z.string().min(1)
});

export type UpdateCommentInput = z.infer<typeof updateCommentInputSchema>;

// Query schemas
export const getProductsByLocationInputSchema = z.object({
  location: z.string()
});

export type GetProductsByLocationInput = z.infer<typeof getProductsByLocationInputSchema>;

export const getProductsByTagsInputSchema = z.object({
  tags: z.array(z.string())
});

export type GetProductsByTagsInput = z.infer<typeof getProductsByTagsInputSchema>;

export const getProductByIdInputSchema = z.object({
  id: z.string()
});

export type GetProductByIdInput = z.infer<typeof getProductByIdInputSchema>;

export const getUserByIdInputSchema = z.object({
  id: z.string()
});

export type GetUserByIdInput = z.infer<typeof getUserByIdInputSchema>;

export const deleteVoteInputSchema = z.object({
  user_id: z.string(),
  product_id: z.string()
});

export type DeleteVoteInput = z.infer<typeof deleteVoteInputSchema>;

// Product with vote count and user vote status
export const productWithVotesSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  url: z.string().url(),
  tags: z.array(z.string()),
  location: z.string().nullable(),
  is_made_in_my: z.boolean(),
  created_at: z.coerce.date(),
  author_id: z.string(),
  vote_count: z.number(),
  user_voted: z.boolean().nullable()
});

export type ProductWithVotes = z.infer<typeof productWithVotesSchema>;
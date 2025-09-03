import { text, pgTable, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const usersTable = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  avatar_url: text('avatar_url'),
  location: text('location'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const productsTable = pgTable('products', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  url: text('url').notNull(),
  tags: text('tags').array().notNull().default([]),
  location: text('location'),
  is_made_in_my: boolean('is_made_in_my').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  author_id: text('author_id').notNull().references(() => usersTable.id),
});

export const votesTable = pgTable('votes', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => usersTable.id),
  product_id: text('product_id').notNull().references(() => productsTable.id),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const commentsTable = pgTable('comments', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  author_id: text('author_id').notNull().references(() => usersTable.id),
  product_id: text('product_id').notNull().references(() => productsTable.id),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  products: many(productsTable),
  votes: many(votesTable),
  comments: many(commentsTable),
}));

export const productsRelations = relations(productsTable, ({ one, many }) => ({
  author: one(usersTable, {
    fields: [productsTable.author_id],
    references: [usersTable.id],
  }),
  votes: many(votesTable),
  comments: many(commentsTable),
}));

export const votesRelations = relations(votesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [votesTable.user_id],
    references: [usersTable.id],
  }),
  product: one(productsTable, {
    fields: [votesTable.product_id],
    references: [productsTable.id],
  }),
}));

export const commentsRelations = relations(commentsTable, ({ one }) => ({
  author: one(usersTable, {
    fields: [commentsTable.author_id],
    references: [usersTable.id],
  }),
  product: one(productsTable, {
    fields: [commentsTable.product_id],
    references: [productsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Product = typeof productsTable.$inferSelect;
export type NewProduct = typeof productsTable.$inferInsert;

export type Vote = typeof votesTable.$inferSelect;
export type NewVote = typeof votesTable.$inferInsert;

export type Comment = typeof commentsTable.$inferSelect;
export type NewComment = typeof commentsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  users: usersTable, 
  products: productsTable, 
  votes: votesTable, 
  comments: commentsTable 
};
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { z } from 'zod';
import { 
  createUserInputSchema,
  updateUserInputSchema,
  getUserByIdInputSchema,
  createProductInputSchema,
  updateProductInputSchema,
  getProductByIdInputSchema,
  getProductsByLocationInputSchema,
  getProductsByTagsInputSchema,
  createVoteInputSchema,
  deleteVoteInputSchema,
  createCommentInputSchema,
  updateCommentInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getUserById } from './handlers/get_user_by_id';
import { updateUser } from './handlers/update_user';
import { createProduct } from './handlers/create_product';
import { getProducts } from './handlers/get_products';
import { getProductById } from './handlers/get_product_by_id';
import { getProductsByLocation } from './handlers/get_products_by_location';
import { getProductsByTags } from './handlers/get_products_by_tags';
import { updateProduct } from './handlers/update_product';
import { createVote } from './handlers/create_vote';
import { deleteVote } from './handlers/delete_vote';
import { getProductsWithVotes } from './handlers/get_products_with_votes';
import { createComment } from './handlers/create_comment';
import { getCommentsByProduct } from './handlers/get_comments_by_product';
import { updateComment } from './handlers/update_comment';
import { getTrendingProducts } from './handlers/get_trending_products';
import { getProductsByAuthor } from './handlers/get_products_by_author';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User operations
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  getUserById: publicProcedure
    .input(getUserByIdInputSchema)
    .query(({ input }) => getUserById(input)),

  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),

  // Product operations
  createProduct: publicProcedure
    .input(createProductInputSchema)
    .mutation(({ input }) => createProduct(input)),

  getProducts: publicProcedure
    .query(() => getProducts()),

  getProductById: publicProcedure
    .input(getProductByIdInputSchema)
    .query(({ input }) => getProductById(input)),

  getProductsByLocation: publicProcedure
    .input(getProductsByLocationInputSchema)
    .query(({ input }) => getProductsByLocation(input)),

  getProductsByTags: publicProcedure
    .input(getProductsByTagsInputSchema)
    .query(({ input }) => getProductsByTags(input)),

  getProductsByAuthor: publicProcedure
    .input(z.object({ authorId: z.string() }))
    .query(({ input }) => getProductsByAuthor(input.authorId)),

  updateProduct: publicProcedure
    .input(updateProductInputSchema)
    .mutation(({ input }) => updateProduct(input)),

  // Vote operations
  createVote: publicProcedure
    .input(createVoteInputSchema)
    .mutation(({ input }) => createVote(input)),

  deleteVote: publicProcedure
    .input(deleteVoteInputSchema)
    .mutation(({ input }) => deleteVote(input)),

  getProductsWithVotes: publicProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(({ input }) => getProductsWithVotes(input.userId)),

  getTrendingProducts: publicProcedure
    .input(z.object({ timeframe: z.enum(['daily', 'weekly']).default('daily') }))
    .query(({ input }) => getTrendingProducts(input.timeframe)),

  // Comment operations
  createComment: publicProcedure
    .input(createCommentInputSchema)
    .mutation(({ input }) => createComment(input)),

  getCommentsByProduct: publicProcedure
    .input(z.object({ productId: z.string() }))
    .query(({ input }) => getCommentsByProduct(input.productId)),

  updateComment: publicProcedure
    .input(updateCommentInputSchema)
    .mutation(({ input }) => updateComment(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`🇲🇾 Local Hunt TRPC server listening at port: ${port}`);
}

start();
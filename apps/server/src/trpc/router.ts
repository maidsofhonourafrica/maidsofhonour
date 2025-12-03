import { router } from './trpc';
import { authRouter } from './routers/auth';

/**
 * Main tRPC Application Router
 * Combines all sub-routers into a single router
 * This type is exported and shared with clients for type safety
 */
export const appRouter = router({
  auth: authRouter,
  // More routers will be added here as we implement them:
  // serviceProvider: serviceProviderRouter,
  // placement: placementRouter,
  // etc.
});

/**
 * Export router type for client-side type inference
 * This is what makes tRPC magical - full type safety across the stack
 */
export type AppRouter = typeof appRouter;

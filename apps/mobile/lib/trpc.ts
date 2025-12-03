import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@project/server/src/trpc/router';
import superjson from 'superjson';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Create tRPC React hooks
 * This is the main tRPC client for the mobile app
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Create tRPC client
 * Configured for React Native with SecureStore for auth tokens
 */
export const trpcClient = trpc.createClient({
  /**
   * HTTP batch link - batches multiple requests into one HTTP call
   * Improves performance on mobile networks
   */
  links: [
    httpBatchLink({
      /**
       * API URL - different for emulator vs real device
       * Android emulator: 10.0.2.2 maps to host machine's localhost
       * iOS simulator: localhost works directly
       * Real device: Use actual IP address or deployed URL
       */
      url: __DEV__
        ? 'http://192.168.0.101:5300/trpc' // Android emulator
        : 'https://api.maidsofhonour.africa/trpc', // Production
      
      /**
       * Superjson handles Date objects, undefined, Map, Set, etc.
       * Must match server transformer
       */
      transformer: superjson,
      
      /**
       * Custom headers - adds auth token from SecureStore
       * Runs before each request
       * CRITICAL: Uses 'session' key to match SessionContext storage
       */
      async headers() {
        try {
          // Use SecureStore on mobile, localStorage on web (matches useStorageState)
          let token: string | null = null;
          
          if (Platform.OS === 'web') {
            if (typeof localStorage !== 'undefined') {
              token = localStorage.getItem('session');
            }
          } else {
            token = await SecureStore.getItemAsync('session');
          }
          
          return {
            authorization: token ? `Bearer ${token}` : '',
          };
        } catch (error) {
          console.error('Failed to get auth token:', error);
          return {};
        }
      },
    }),
  ],
});

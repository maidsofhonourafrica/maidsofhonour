/**
 * Pagination Utilities
 *
 * Provides type-safe pagination for database queries.
 * Prevents loading all records at once (which would crash at scale).
 */

import { z } from 'zod/v4';

/**
 * Zod schema for validating pagination query params
 */
export const PaginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default(1),
  limit: z.string().regex(/^\d+$/).transform(Number).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type PaginationParams = z.infer<typeof PaginationSchema>;

/**
 * Pagination metadata for responses
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Get offset for SQL queries
 */
export function getOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Validate and sanitize pagination params
 */
export function validatePagination(params: any): PaginationParams {
  const validated = PaginationSchema.parse(params);

  // Enforce max limit to prevent abuse
  const MAX_LIMIT = 100;
  if (validated.limit > MAX_LIMIT) {
    validated.limit = MAX_LIMIT;
  }

  // Ensure minimum values
  if (validated.page < 1) {
    validated.page = 1;
  }

  if (validated.limit < 1) {
    validated.limit = 20;
  }

  return validated;
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  return {
    data,
    pagination: calculatePagination(page, limit, total),
  };
}

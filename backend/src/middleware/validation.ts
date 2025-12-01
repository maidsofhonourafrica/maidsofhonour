import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodSchema, ZodError } from 'zod/v4';

/**
 * Creates a validation middleware that validates request body against a Zod schema
 * Returns 400 Bad Request with detailed error messages if validation fails
 *
 * @param schema - Zod schema to validate against
 * @returns Fastify middleware function
 *
 * @example
 * fastify.post('/register', { preHandler: validateBody(registerSchema) }, handler);
 */
export const validateBody = (schema: ZodSchema) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate and parse the request body
      const validated = schema.parse(request.body);

      // Replace request body with validated/sanitized data
      request.body = validated;
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into user-friendly messages
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid request data',
          errors,
        });
      }

      // Re-throw unexpected errors
      throw error;
    }
  };
};

/**
 * Creates a validation middleware that validates query parameters against a Zod schema
 * Returns 400 Bad Request with detailed error messages if validation fails
 *
 * @param schema - Zod schema to validate against
 * @returns Fastify middleware function
 *
 * @example
 * fastify.get('/search', { preHandler: validateQuery(searchSchema) }, handler);
 */
export const validateQuery = (schema: ZodSchema) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate and parse the query parameters
      const validated = schema.parse(request.query);

      // Replace request query with validated/sanitized data
      request.query = validated;
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into user-friendly messages
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid query parameters',
          errors,
        });
      }

      // Re-throw unexpected errors
      throw error;
    }
  };
};

/**
 * Creates a validation middleware that validates route parameters against a Zod schema
 * Returns 400 Bad Request with detailed error messages if validation fails
 *
 * @param schema - Zod schema to validate against
 * @returns Fastify middleware function
 *
 * @example
 * fastify.get('/users/:id', { preHandler: validateParams(uuidSchema) }, handler);
 */
export const validateParams = (schema: ZodSchema) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate and parse the route parameters
      const validated = schema.parse(request.params);

      // Replace request params with validated/sanitized data
      request.params = validated;
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into user-friendly messages
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid route parameters',
          errors,
        });
      }

      // Re-throw unexpected errors
      throw error;
    }
  };
};

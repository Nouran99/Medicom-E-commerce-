import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

export function handleError(error: unknown, c: Context) {
  console.error('Error occurred:', error);

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    const validationErrors = error.issues.map((err: z.ZodIssue) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    return c.json(
      {
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: validationErrors,
      },
      400
    );
  }

  // Handle custom app errors
  if (error instanceof AppError) {
    const response: any = {
      success: false,
      message: error.message,
      code: error.code,
    };

    if (error.details) {
      response.details = error.details;
    }

    return c.json(response, error.statusCode as any);
  }

  // Handle Hono HTTP exceptions
  if (error instanceof HTTPException) {
    return c.json(
      {
        success: false,
        message: error.message,
        code: 'HTTP_EXCEPTION',
      },
      error.status
    );
  }

  // Handle database errors
  if (error && typeof error === 'object' && 'code' in error) {
    const dbError = error as { code: string; message: string };

    switch (dbError.code) {
      case '23505': // Unique constraint violation
        return c.json(
          {
            success: false,
            message: 'Resource already exists',
            code: 'DUPLICATE_ERROR',
          },
          409
        );

      case '23503': // Foreign key constraint violation
        return c.json(
          {
            success: false,
            message: 'Referenced resource not found',
            code: 'REFERENCE_ERROR',
          },
          400
        );

      case 'PGRST116': // No rows returned
        return c.json(
          {
            success: false,
            message: 'Resource not found',
            code: 'NOT_FOUND_ERROR',
          },
          404
        );
    }
  }

  // Handle generic errors
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

  return c.json(
    {
      success: false,
      message: errorMessage,
      code: 'INTERNAL_ERROR',
    },
    500
  );
}

export function asyncHandler(fn: (c: Context) => Promise<Response>) {
  return async (c: Context) => {
    try {
      return await fn(c);
    } catch (error) {
      return handleError(error, c);
    }
  };
}

export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return async (c: Context): Promise<T> => {
    try {
      const body = await c.req.json();
      return schema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Request validation failed', error.issues);
      }
      throw new ValidationError('Invalid request body');
    }
  };
}

export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (c: Context): T => {
    try {
      const query = Object.fromEntries(new URL(c.req.url).searchParams.entries());
      return schema.parse(query);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Query validation failed', error.issues);
      }
      throw new ValidationError('Invalid query parameters');
    }
  };
}

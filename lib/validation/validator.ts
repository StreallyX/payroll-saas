
/**
 * Request validation utilities
 */

import { z, ZodError, ZodSchema } from 'zod';
import { ValidationError } from '../errors';

export class Validator {
  /**
   * Validate input against a Zod schema
   */
  static async validate<T>(schema: ZodSchema<T>, data: unknown): Promise<T> {
    try {
      return await schema.parseAsync(data);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError('Validation failed', {
          errors: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
            code: e.code,
          })),
        });
      }
      throw error;
    }
  }

  /**
   * Validate input synchronously
   */
  static validateSync<T>(schema: ZodSchema<T>, data: unknown): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError('Validation failed', {
          errors: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
            code: e.code,
          })),
        });
      }
      throw error;
    }
  }

  /**
   * Safe parse - returns result without throwing
   */
  static safeParse<T>(
    schema: ZodSchema<T>,
    data: unknown
  ): { success: true; data: T } | { success: false; errors: any[] } {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return {
      success: false,
      errors: result.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
        code: e.code,
      })),
    };
  }

  /**
   * Validate partial update (all fields optional)
   */
  static validatePartial<T extends z.ZodRawShape>(
    schema: z.ZodObject<T>,
    data: unknown
  ): Partial<z.infer<z.ZodObject<T>>> {
    const partialSchema = schema.partial();
    return this.validateSync(partialSchema, data);
  }

}

/**
 * Create a validation middleware for tRPC
 */
export function validateInput<T>(schema: ZodSchema<T>) {
  return async (input: unknown): Promise<T> => {
    return Validator.validate(schema, input);
  };
}

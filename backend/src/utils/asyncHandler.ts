import { Request, Response, NextFunction } from 'express';

/**
 * Async handler wrapper to catch errors in async route handlers
 * Usage: asyncHandler(async (req, res) => { ... })
 *
 * This ensures that any errors thrown in async functions are passed to Express error middleware
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

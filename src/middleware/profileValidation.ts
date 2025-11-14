import type { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { profileCreateSchema, profileUpdateSchema } from '../validations/uservalidation';

/**
 * Custom validation middleware for profile endpoint
 * - Nếu user chưa có profile → dùng createSchema (required first_name, last_name)
 * - Nếu user đã có profile → dùng updateSchema (optional tất cả)
 */
export async function validateProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Kiểm tra user đã có profile trong database chưa
    const existingUser = await User.findOne({
      where: {
        cognitoUserId: req.user.userId,
      },
    });

    // Chọn schema phù hợp
    const schema = existingUser ? profileUpdateSchema : profileCreateSchema;

    // Validate với schema đã chọn
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      res.status(400).json({
        success: false,
        message: existingUser ? 'Validation error (update profile)' : 'Validation error (create profile)',
        errors,
      });
      return;
    }

    // Gán giá trị đã validate vào req.body
    req.body = value;
    next();
  } catch (error) {
    console.error('Error in validateProfile middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during validation',
    });
  }
}


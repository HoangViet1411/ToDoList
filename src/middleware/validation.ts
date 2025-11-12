import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// Extend Request interface để thêm validatedQuery
declare global {
  namespace Express {
    interface Request {
      validatedQuery?: Record<string, unknown>;
    }
  }
}

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Trả về tất cả lỗi, không dừng ở lỗi đầu tiên
      stripUnknown: true, // Xóa các field không có trong schema
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
      return;
    }

    // Gán giá trị đã validate vào req.body
    req.body = value;
    next();
  };
};

// Middleware cho params validation
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      convert: true, // Tự động convert khi có thể
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      res.status(400).json({
        success: false,
        message: 'Invalid parameters',
        errors,
      });
      return;
    }

    // Convert id từ string sang number nếu có
    if (value.id && typeof value.id === 'string') {
      value.id = Number.parseInt(value.id, 10);
    }

    req.params = value;
    next();
  };
};

// Middleware cho query validation
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      convert: true, // Tự động convert string sang number/boolean
      allowUnknown: true, // Cho phép unknown fields (fields và include được xử lý riêng trong service)
      stripUnknown: false, // Không xóa unknown fields để giữ fields và include
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors,
      });
      return;
    }

    // Không thể gán trực tiếp req.query = value vì nó là getter
    // Lưu giá trị đã validate vào req.validatedQuery
    req.validatedQuery = value;
    next();
  };
};
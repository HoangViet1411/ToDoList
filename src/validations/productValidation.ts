import Joi from 'joi';

// Schema for CreateProductDto
export const createProductSchema = Joi.object({
  name: Joi.string().max(255).required().messages({
    'string.base': 'name must be a string',
    'string.max': 'name must be less than 255 characters',
    'any.required': 'name is required',
    'string.empty': 'name cannot be empty',
  }),
  price: Joi.number().positive().required().messages({
    'number.base': 'price must be a number',
    'number.positive': 'price must be positive',
    'any.required': 'price is required',
  }),
  description: Joi.string().optional().allow(null, ''),
  quantity: Joi.number().integer().min(0).optional().messages({
    'number.base': 'quantity must be a number',
    'number.integer': 'quantity must be an integer',
    'number.min': 'quantity must be >= 0',
  }),
});

// Schema for UpdateProductDto
export const updateProductSchema = Joi.object({
  name: Joi.string().max(255).optional().min(1).messages({
    'string.base': 'name must be a string',
    'string.max': 'name must be less than 255 characters',
    'string.min': 'name cannot be empty',
  }),
  price: Joi.number().positive().optional().messages({
    'number.base': 'price must be a number',
    'number.positive': 'price must be positive',
  }),
  description: Joi.string().optional().allow(null, ''),
  quantity: Joi.number().integer().min(0).optional().messages({
    'number.base': 'quantity must be a number',
    'number.integer': 'quantity must be an integer',
    'number.min': 'quantity must be >= 0',
  }),
});

// Schema for ID parameter (dùng chung với user)
export { idParamSchema } from './uservalidation';

// Schema for pagination (dùng chung với user)
export { paginationQuerySchema } from './uservalidation';

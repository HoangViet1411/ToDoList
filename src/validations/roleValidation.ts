import Joi from 'joi';

// Schema for CreateRoleDto
export const createRoleSchema = Joi.object({
  role_name: Joi.string().max(100).required().messages({
    'string.base': 'role_name must be a string',
    'string.max': 'role_name must be less than 100 characters',
    'any.required': 'role_name is required',
    'string.empty': 'role_name cannot be empty',
  }),
  description: Joi.string().optional().allow(null, ''),
});

// Schema for UpdateRoleDto
export const updateRoleSchema = Joi.object({
  role_name: Joi.string().max(100).optional().min(1).messages({
    'string.base': 'role_name must be a string',
    'string.max': 'role_name must be less than 100 characters',
    'string.min': 'role_name cannot be empty',
  }),
  description: Joi.string().optional().allow(null, ''),
});

// Schema for ID parameter (dùng chung với user)
export { idParamSchema } from './uservalidation';

// Schema for pagination (dùng chung với user)
export { paginationQuerySchema } from './uservalidation';
import Joi from 'joi';
import { Gender } from '../models/User';

// Schema cho CreateUserDto
export const createUserSchema = Joi.object({
  first_name: Joi.string().max(100).optional().allow(null, ''),
  last_name: Joi.string().max(100).optional().allow(null, ''),
  birth_date: Joi.string().isoDate().optional().allow(null, ''),
  gender: Joi.string()
    .valid(...Object.values(Gender))
    .optional()
    .allow(null, '')
    .messages({
      'any.only': `Gender must be one of: ${Object.values(Gender).join(', ')}`,
    }),
  created_by: Joi.number().integer().positive().optional().allow(null),
});

// Schema cho UpdateUserDto
export const updateUserSchema = Joi.object({
  first_name: Joi.string().max(100).optional().allow(null, ''),
  last_name: Joi.string().max(100).optional().allow(null, ''),
  birth_date: Joi.string().isoDate().optional().allow(null, ''),
  gender: Joi.string()
    .valid(...Object.values(Gender))
    .optional()
    .allow(null, '')
    .messages({
      'any.only': `Gender must be one of: ${Object.values(Gender).join(', ')}`,
    }),
  updated_by: Joi.number().integer().positive().optional().allow(null),
});

// Schema cho ID parameter (Express params luôn là string, Joi sẽ convert sang number)
export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID must be a number',
    'number.integer': 'ID must be an integer',
    'number.positive': 'ID must be a positive number',
    'any.required': 'ID is required',
  }),
});

// Schema cho query parameters (pagination + filter)
export const paginationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(10).optional(),
  search: Joi.string().max(200).optional().allow(null, '').messages({
    'string.max': 'Search term must be less than 200 characters',
  }),
  first_name: Joi.string().max(100).optional().allow(null, '').messages({
    'string.max': 'First name must be less than 100 characters',
  }),
  last_name: Joi.string().max(100).optional().allow(null, '').messages({
    'string.max': 'Last name must be less than 100 characters',
  }),
  birth_date_from: Joi.string().isoDate().optional().allow(null, '').messages({
    'string.isoDate': 'birth_date_from must be a valid ISO date',
  }),
  birth_date_to: Joi.string().isoDate().optional().allow(null, '').messages({
    'string.isoDate': 'birth_date_to must be a valid ISO date',
  }),
  gender: Joi.string()
    .valid(...Object.values(Gender))
    .optional()
    .allow(null, '')
    .messages({
      'any.only': `Gender must be one of: ${Object.values(Gender).join(', ')}`,
    }),
  include_deleted: Joi.boolean().optional().default(false),
});

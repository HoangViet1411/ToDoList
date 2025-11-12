import Joi from 'joi';
import { Gender } from '../models/User';

// Helper function for birth_date validation (check if date is from year 2000 onwards)
const validateBirthDateFrom2000 = (value: string, helpers: Joi.CustomHelpers) => {
  const birthDate = new Date(value);
  const year2000 = new Date('2000-01-01');
  if (birthDate < year2000) {
    return helpers.error('date.min', {
      message: 'If gender is male, birth_date must be from year 2000 onwards',
    });
  }
  return value;
};

// Helper function to create birth_date schema
const createBirthDateSchema = (allowNull: boolean = false) => {
  const baseSchema = Joi.string()
    .isoDate()
    .optional();
  
  const schemaWithAllow = allowNull ? baseSchema.allow(null, '') : baseSchema;
  
  return schemaWithAllow.when('gender', {
    is: 'male',
    then: Joi.string()
      .isoDate()
      .required()
      .custom(validateBirthDateFrom2000)
      .messages({
        'any.required': 'birth_date is required when gender is male',
        'string.isoDate': 'birth_date must be a valid ISO date',
        'date.min': 'If gender is male, birth_date must be from year 2000 onwards',
      }),
    otherwise: Joi.string().isoDate().optional().allow(null, ''),
  });
};

// Helper function to create gender schema
const createGenderSchema = (allowNull: boolean = false) => {
  const schema = Joi.string().valid('male', 'female', 'other').max(10).optional();
  return allowNull ? schema.allow(null, '') : schema;
};

// Base schema with common fields
const baseUserSchema = {
  birth_date: createBirthDateSchema(false),
  gender: createGenderSchema(false),
};

// Schema for CreateUserDto
export const createUserSchema = Joi.object({
  first_name: Joi.string().max(100).required().messages({
    'string.base': 'first_name must be a string',
    'string.max': 'first_name must be less than 100 characters',
    'any.required': 'first_name is required',
  }),
  last_name: Joi.string().max(100).required().messages({
    'string.base': 'last_name must be a string',
    'string.max': 'last_name must be less than 100 characters',
    'any.required': 'last_name is required',
  }),
  ...baseUserSchema,
  created_by: Joi.number().integer().positive().optional().allow(null),
  role_ids: Joi.array().items(Joi.number().integer().positive()).optional().messages({
    'array.base': 'role_ids must be an array',
    'number.base': 'Each role_id must be a number',
    'number.positive': 'Each role_id must be positive',
  }),
});

// Schema for UpdateUserDto
export const updateUserSchema = Joi.object({
  // first_name và last_name: optional (có thể không gửi), nhưng nếu gửi thì không được null hoặc empty
  // Vì database là NOT NULL, nên nếu update thì phải có giá trị hợp lệ
  first_name: Joi.string().max(100).optional().min(1).messages({
    'string.base': 'first_name must be a string',
    'string.max': 'first_name must be less than 100 characters',
    'string.min': 'first_name cannot be empty',
    'any.empty': 'first_name cannot be empty',
  }),
  last_name: Joi.string().max(100).optional().min(1).messages({
    'string.base': 'last_name must be a string',
    'string.max': 'last_name must be less than 100 characters',
    'string.min': 'last_name cannot be empty',
    'any.empty': 'last_name cannot be empty',
  }),
  birth_date: createBirthDateSchema(true),
  gender: createGenderSchema(true),
  updated_by: Joi.number().integer().positive().optional().allow(null),
  role_ids: Joi.array().items(Joi.number().integer().positive()).optional().messages({
    'array.base': 'role_ids must be an array',
    'number.base': 'Each role_id must be a number',
    'number.positive': 'Each role_id must be positive',
  }),
});

// Schema for ID parameter
export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

// Schema for query parameters (pagination + filter)
export const paginationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(0).max(100).default(10).optional().messages({
    'number.min': 'limit must be 0 (no pagination) or between 1 and 100',
  }),
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
  // Dynamic query options
  fields: Joi.string().allow(null, '').optional().messages({
    'string.base': 'fields must be a comma-separated string',
  }),
  include: Joi.string().allow(null, '').optional().messages({
    'string.base': 'include must be a comma-separated string',
  }),
});
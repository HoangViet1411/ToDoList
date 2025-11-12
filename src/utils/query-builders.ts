import { Op, col, fn, where } from 'sequelize';
import { Role } from '../models';

// Whitelist các fields được phép select (security)
const FIELD_WHITELIST = new Set([
  'id',
  'firstName',
  'lastName',
  'birthDate',
  'gender',
  'createdAt',
  'updatedAt',
  'createdBy',
  'updatedBy',
]);

// Map các include được phép với cấu hình
const INCLUDE_MAP = {
  roles: {
    model: Role,
    as: 'roles',
    attributes: ['id', 'roleName'],
    required: false, // LEFT JOIN
  },
} as const;

/**
 * Build attributes array từ query string fields
 * @param fields - Comma-separated string: "id,firstName,lastName"
 * @returns Array of field names hoặc undefined (để Sequelize SELECT *)
 */
export function buildAttributes(fields?: string): string[] | undefined {
  if (!fields) return undefined; // Sequelize => SELECT *

  const list = fields
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const safe = list.filter((f) => FIELD_WHITELIST.has(f));

  return safe.length > 0 ? safe : undefined;
}

/**
 * Build include array từ query string include
 * Chỉ hỗ trợ roles: "roles"
 * @param include - Comma-separated string: "roles"
 * @returns Array of include configs hoặc undefined
 */
export function buildInclude(include?: string): any[] | undefined {
  if (!include) return undefined;

  const tokens = include
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const includes: any[] = [];

  // Chỉ xử lý roles
  for (const token of tokens) {
    if (token === 'roles') {
      includes.push(INCLUDE_MAP.roles);
    }
  }

  return includes.length > 0 ? includes : undefined;
}

/**
 * Build where clause cho search (tìm trong firstName và lastName)
 */
export function buildSearchCondition(search: string): any {
  const searchTerm = `%${search.trim()}%`;
  return {
    [Op.or]: [
      where(
        fn('CONCAT', col('User.first_name'), ' ', col('User.last_name')),
        { [Op.like]: searchTerm }
      ),
      { firstName: { [Op.like]: searchTerm } },
      { lastName: { [Op.like]: searchTerm } },
    ],
  };
}


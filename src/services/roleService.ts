import { Op } from 'sequelize';
import Role from '../models/Role';
import type { CreateRoleDto, UpdateRoleDto, RoleResponse, PaginatedResponse } from '../types';

export interface RoleFilterParams {
  search?: string;
  role_name?: string;
  include_deleted?: boolean;
}
// role
export class RoleService {
  async createRole(roleData: CreateRoleDto): Promise<RoleResponse> {
    const createData: {
      roleName: string;
      description?: string | null;
    } = {
      roleName: roleData.role_name!, // Non-null assertion vì validation đã đảm bảo role_name là required
    };
    
    // Chỉ set description nếu có giá trị
    if (roleData.description !== undefined) {
      createData.description = roleData.description as string;
    }
    
    const role = await Role.create(createData);
    return this.mapToRoleResponse(role);
  }

  async getRoleById(id: number): Promise<RoleResponse | null> {
    const role = await Role.findByPk(id);
    return role ? this.mapToRoleResponse(role) : null;
  }

  async getAllRoles(
    page: number = 1,
    limit: number = 10,
    filters: RoleFilterParams = {}
  ): Promise<PaginatedResponse<RoleResponse>> {
    const pageNumber = Math.max(1, page);
    const noPagination = limit === 0;
    const pageSize = noPagination ? 0 : Math.max(1, Math.min(100, limit));
    const offset = noPagination ? 0 : (pageNumber - 1) * pageSize;

    const whereConditions: Array<Record<string, unknown>> = [];

    if (filters.search && filters.search.trim()) {
      const searchTerm = `%${filters.search.trim()}%`;
      whereConditions.push({
        [Op.or]: [
          { roleName: { [Op.like]: searchTerm } },
          { description: { [Op.like]: searchTerm } },
        ],
      });
    }

    if (filters.role_name && filters.role_name.trim()) {
      const roleNameFilter = filters.role_name.trim();
      whereConditions.push({
        roleName: { [Op.like]: `%${roleNameFilter}%` },
      });
    }

    let whereClause: Record<string, unknown> | undefined;
    if (whereConditions.length === 1) {
      whereClause = whereConditions[0];
    } else if (whereConditions.length > 1) {
      whereClause = { [Op.and]: whereConditions };
    }

    const queryOptions: {
      where?: Record<string, unknown>;
      order: Array<[string, string]>;
      limit?: number;
      offset?: number;
      paranoid?: boolean;
    } = {
      order: [['createdAt', 'ASC']],
      paranoid: filters.include_deleted === true ? false : true,
    };

    if (!noPagination) {
      queryOptions.limit = pageSize;
      queryOptions.offset = offset;
    }

    if (whereClause) {
      queryOptions.where = whereClause;
    }

    const { rows: roles, count: total } = await Role.findAndCountAll(queryOptions);

    const totalPages = noPagination ? 1 : Math.ceil(total / pageSize);
    const responseLimit = noPagination ? total : pageSize;

    return {
      data: roles.map((role) => this.mapToRoleResponse(role)),
      pagination: {
        page: noPagination ? 1 : pageNumber,
        limit: responseLimit,
        total,
        totalPages,
        hasNext: pageNumber < totalPages,
        hasPrev: pageNumber > 1,
      },
    };
  }

  async updateRole(id: number, roleData: UpdateRoleDto): Promise<RoleResponse | null> {
    const role = await Role.findByPk(id);
    if (!role) {
      return null;
    }

    const updateData: Partial<Role> = {};
    
    if (roleData.role_name !== undefined && roleData.role_name !== null && roleData.role_name.trim().length > 0) {
      updateData.roleName = roleData.role_name.trim();
    }
    
    if (roleData.description !== undefined) {
      updateData.description = roleData.description;
    }

    await role.update(updateData);
    return this.mapToRoleResponse(role);
  }

  async deleteRole(id: number): Promise<boolean> {
    const role = await Role.findByPk(id);
    if (!role) {
      return false;
    }
    await role.destroy();
    return true;
  }

  async hardDeleteRole(id: number): Promise<boolean> {
    const role = await Role.findByPk(id, { paranoid: false });
    if (!role) {
      return false;
    }
    await role.destroy({ force: true });
    return true;
  }

  async restoreRole(id: number): Promise<boolean> {
    const role = await Role.findByPk(id, { paranoid: false });
    if (!role) {
      return false;
    }
    if (!role.deletedAt) {
      return false;
    }
    await role.restore();
    return true;
  }

  private mapToRoleResponse(role: Role): RoleResponse {
    return role.get({ plain: true }) as RoleResponse;
  }
}

export default new RoleService();

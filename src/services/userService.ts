import { Op } from 'sequelize';
import User, { type UserAttributes, Gender } from '../models/User';
import type { CreateUserDto, UpdateUserDto, UserResponse, PaginatedResponse } from '../types';

export interface UserFilterParams {
  search?: string;
  first_name?: string;
  last_name?: string;
  birth_date_from?: string;
  birth_date_to?: string;
  gender?: Gender;
  include_deleted?: boolean;
}

export class UserService {
  async createUser(userData: CreateUserDto): Promise<UserResponse> {
    const user = await User.create({
      firstName: userData.first_name ?? null,
      lastName: userData.last_name ?? null,
      birthDate: userData.birth_date ? new Date(userData.birth_date) : null,
      gender: userData.gender ?? null,
      createdBy: userData.created_by ?? null,
      // is_deleted: false,
    });
    return this.mapToUserResponse(user);
  }

  async getUserById(id: number): Promise<UserResponse | null> {
    // Paranoid tự động filter deleted_at IS NULL
    const user = await User.findByPk(id);
    return user ? this.mapToUserResponse(user) : null;
  }

  async getAllUsers(
    page: number = 1,
    limit: number = 10,
    filters: UserFilterParams = {}
  ): Promise<PaginatedResponse<UserResponse>> {
    // Validate và set default values
    const pageNumber = Math.max(1, page);
    const pageSize = Math.max(1, Math.min(100, limit)); // Max 100 records per page
    const offset = (pageNumber - 1) * pageSize;

    // Xây dựng WHERE clause cho filter
    const whereConditions: Array<Record<string, unknown>> = [];

    // Filter by search (tìm trong cả firstname và lastname với OR)
    if (filters.search && filters.search.trim()) {
      const searchTerm = `%${filters.search.trim()}%`;
      whereConditions.push({
        [Op.or]: [
          { firstName: { [Op.like]: searchTerm } },
          { lastName: { [Op.like]: searchTerm } },
        ],
      });
    }

    // Filter by first_name (có thể kết hợp với search)
    if (filters.first_name && filters.first_name.trim()) {
      whereConditions.push({
        firstName: { [Op.like]: `%${filters.first_name.trim()}%` },
      });
    }

    // Filter by last_name (có thể kết hợp với search và first_name)
    if (filters.last_name && filters.last_name.trim()) {
      whereConditions.push({
        lastName: { [Op.like]: `%${filters.last_name.trim()}%` },
      });
    }

    // Filter by birth_date_from (từ ngày này trở đi)
    if (filters.birth_date_from && filters.birth_date_from.trim()) {
      const fromDate = new Date(filters.birth_date_from);
      whereConditions.push({
        birthDate: {
          [Op.gte]: fromDate, // greater than or equal
        },
      });
    }

    // Filter by birth_date_to (đến ngày này)
    if (filters.birth_date_to && filters.birth_date_to.trim()) {
      const toDate = new Date(filters.birth_date_to);
      // Set time to end of day (23:59:59.999)
      toDate.setHours(23, 59, 59, 999);
      whereConditions.push({
        birthDate: {
          [Op.lte]: toDate, // less than or equal
        },
      });
    }

    // Filter by gender
    if (filters.gender) {
      whereConditions.push({
        gender: filters.gender,
      });
    }

    // Kết hợp tất cả điều kiện với AND
    // Nếu chỉ có 1 điều kiện, không cần wrap trong Op.and
    let whereClause: Record<string, unknown> | undefined;
    if (whereConditions.length === 1) {
      whereClause = whereConditions[0];
    } else if (whereConditions.length > 1) {
      whereClause = { [Op.and]: whereConditions };
    }

    // Build query options
    const queryOptions: {
      where?: Record<string, unknown>;
      order: Array<[string, string]>;
      limit: number;
      offset: number;
      paranoid?: boolean;
    } = {
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset: offset,
      paranoid: filters.include_deleted === true ? false : true,
    };

    // Chỉ thêm where clause nếu có filter
    if (whereClause) {
      queryOptions.where = whereClause;
    }

    // Get total count với filter
    // Nếu include_deleted = true, tắt paranoid để đếm cả deleted users
    const countOptions: {
      where?: Record<string, unknown>;
      paranoid?: boolean;
    } = whereClause ? { where: whereClause } : {};
    
    if (filters.include_deleted === true) {
      countOptions.paranoid = false;
    }
    
    const total = (await User.count(countOptions)) as number;

    // Get paginated users với filter (paranoid tự động filter deleted_at IS NULL)
    const users = await User.findAll(queryOptions);

    const totalPages = Math.ceil(total / pageSize);

    return {
      data: users.map((user) => this.mapToUserResponse(user)),
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages,
        hasNext: pageNumber < totalPages,
        hasPrev: pageNumber > 1,
      },
    };
  }

  async updateUser(id: number, userData: UpdateUserDto): Promise<UserResponse | null> {
    // Paranoid tự động filter deleted_at IS NULL
    const user = await User.findByPk(id);
    if (!user) {
      return null;
    }

    const updateData: Partial<UserAttributes> = {};
    if (userData.first_name !== undefined) updateData.firstName = userData.first_name;
    if (userData.last_name !== undefined) updateData.lastName = userData.last_name;
    if (userData.birth_date !== undefined) {
      updateData.birthDate = userData.birth_date ? new Date(userData.birth_date) : null;
    }
    if (userData.gender !== undefined) updateData.gender = userData.gender;
    if (userData.updated_by !== undefined) updateData.updatedBy = userData.updated_by;

    await user.update(updateData);
    return this.mapToUserResponse(user);
  }

  async deleteUser(id: number): Promise<boolean> {
    // Paranoid tự động filter deleted_at IS NULL
    const user = await User.findByPk(id);
    if (!user) {
      return false;
    }

    // Soft delete - Sequelize tự động set deleted_at = NOW()
    await user.destroy();
    return true;
  }

  async hardDeleteUser(id: number): Promise<boolean> {
    // Tìm cả record đã bị xóa (paranoid: false)
    const user = await User.findByPk(id, { paranoid: false });
    if (!user) {
      return false;
    }

    // Hard delete - xóa thật khỏi database
    await user.destroy({ force: true });
    return true;
  }

  async restoreUser(id: number): Promise<boolean> {
    // Tìm cả user đã bị xóa (paranoid: false)
    const user = await User.findByPk(id, { paranoid: false });
    if (!user) {
      console.log(`Restore failed: User with id ${id} not found`);
      return false;
    }

    // Kiểm tra user có đang bị xóa không (deletedAt !== null)
    if (!user.deletedAt) {
      console.log(`Restore failed: User with id ${id} is not deleted`);
      return false; // User chưa bị xóa
    }

    // Restore user - Sequelize tự động set deleted_at = NULL
    await user.restore();
    console.log(`User ${id} restored successfully`);
    return true;
  }

  private mapToUserResponse(user: User): UserResponse {
    // Sequelize tự động map tất cả các field từ model instance sang plain object
    return user.get({ plain: true }) as UserResponse;
  }
}

export default new UserService();

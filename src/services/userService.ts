import { Op } from 'sequelize';
import User, { type UserAttributes, Gender } from '../models/User';
import type { CreateUserDto, UpdateUserDto, UserResponse, PaginatedResponse } from '../types';
import { sequelize } from '../config/database';
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
    // Validation đã đảm bảo first_name và last_name là required và không null
    const user = await User.create({
      firstName: userData.first_name!, // Non-null assertion vì validation đã đảm bảo
      lastName: userData.last_name!, // Non-null assertion vì validation đã đảm bảo
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
    // Nếu limit=0, không áp dụng pagination (lấy tất cả)
    const noPagination = limit === 0;
    // Chỉ tính pageSize và offset khi có pagination
    const pageSize = noPagination ? 0 : Math.max(1, Math.min(100, limit)); // Max 100 records per page
    const offset = noPagination ? 0 : (pageNumber - 1) * pageSize;

    // Xây dựng WHERE clause cho filter
    const whereConditions: Array<Record<string, unknown>> = [];

    // Filter by search (tìm trong cả firstname và lastname với OR)
    if (filters.search && filters.search.trim()) {
      const searchTerm = `%${filters.search.trim()}%`;
      whereConditions.push({
        [Op.or]: [
          sequelize.where(
            sequelize.fn('CONCAT', 
              sequelize.col('first_name'),  
              ' ',                           
              sequelize.col('last_name')     
            ),
            { [Op.like]: searchTerm }
          ),

          { firstName: { [Op.like]: searchTerm } },
          { lastName: { [Op.like]: searchTerm } },
        ],
      });
    }

    // Filter by first_name (có thể kết hợp với search)
    if (filters.first_name && filters.first_name.trim()) {
      const firstNameFilter = filters.first_name.trim();
      const firstNameCondition = { firstName: { [Op.like]: `%${firstNameFilter}%` } };
      whereConditions.push(firstNameCondition);
    }

    // Filter by last_name (có thể kết hợp với search và first_name)
    if (filters.last_name && filters.last_name.trim()) {
      const lastNameFilter = filters.last_name.trim();
      const lastNameCondition = { lastName: { [Op.like]: `%${lastNameFilter}%` } };
      whereConditions.push(lastNameCondition);
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
      limit?: number;  // Optional để có thể không set khi limit=0
      offset?: number; // Optional để có thể không set khi limit=0
      paranoid?: boolean;
    } = {
      order: [['createdAt', 'DESC']],
      paranoid: filters.include_deleted === true ? false : true,
    };

    // Nếu limit=0, không áp dụng pagination
    // KHÔNG set limit và offset trong queryOptions → Sequelize sẽ KHÔNG thêm LIMIT vào SQL
    // Database sẽ trả về TẤT CẢ records match với filters (không có giới hạn)
    if (!noPagination) {
      queryOptions.limit = pageSize;
      queryOptions.offset = offset;
    }
    // Khi noPagination = true, KHÔNG set limit và offset → Sequelize không thêm LIMIT clause vào SQL

    // Chỉ thêm where clause nếu có filter
    if (whereClause) {
      queryOptions.where = whereClause;
    }

    // Dùng findAndCountAll để lấy cả data và count trong 1 query (hiệu quả hơn)
    const { rows: users, count: total } = await User.findAndCountAll(queryOptions);

    // Nếu không có pagination, totalPages = 1 và limit = total
    const totalPages = noPagination ? 1 : Math.ceil(total / pageSize);
    const responseLimit = noPagination ? total : pageSize;

    return {
      data: users.map((user) => this.mapToUserResponse(user)),
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

  async updateUser(id: number, userData: UpdateUserDto): Promise<UserResponse | null> {
    // Paranoid tự động filter deleted_at IS NULL
    const user = await User.findByPk(id);
    if (!user) {
      return null;
    }

    const updateData: Partial<UserAttributes> = {};
    
    // first_name: chỉ update nếu có giá trị hợp lệ (không null, không empty)
    // Validation đã đảm bảo, nhưng thêm check để an toàn
    if (userData.first_name !== undefined && userData.first_name !== null && userData.first_name.trim().length > 0) {
      updateData.firstName = userData.first_name.trim();
    }
    
    // last_name: chỉ update nếu có giá trị hợp lệ (không null, không empty)
    // Validation đã đảm bảo, nhưng thêm check để an toàn
    if (userData.last_name !== undefined && userData.last_name !== null && userData.last_name.trim().length > 0) {
      updateData.lastName = userData.last_name.trim();
    }
    
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

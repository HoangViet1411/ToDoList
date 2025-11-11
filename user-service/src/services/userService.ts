import User, { type UserAttributes } from '../models/User';
import type { CreateUserDto, UpdateUserDto, UserResponse, PaginatedResponse } from '../types';

export class UserService {
  async createUser(userData: CreateUserDto): Promise<UserResponse> {
    const user = await User.create({
      first_name: userData.first_name ?? null,
      last_name: userData.last_name ?? null,
      birth_date: userData.birth_date ? new Date(userData.birth_date) : null,
      gender: userData.gender ?? null,
      created_by: userData.created_by ?? null,
      is_deleted: false,
    });
    return this.mapToUserResponse(user);
  }

  async getUserById(id: number): Promise<UserResponse | null> {
    const user = await User.findOne({
      where: {
        id,
        is_deleted: false, // Chỉ lấy user chưa bị xóa
      },
    });
    return user ? this.mapToUserResponse(user) : null;
  }

  async getAllUsers(page: number = 1, limit: number = 10): Promise<PaginatedResponse<UserResponse>> {
    // Validate và set default values
    const pageNumber = Math.max(1, page);
    const pageSize = Math.max(1, Math.min(100, limit)); // Max 100 records per page
    const offset = (pageNumber - 1) * pageSize;

    // Get total count (chỉ đếm user chưa bị xóa)
    const total = await User.count({
      where: {
        is_deleted: false,
      },
    });

    // Get paginated users (chỉ lấy user chưa bị xóa)
    const users = await User.findAll({
      where: {
        is_deleted: false,
      },
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset: offset,
      raw: true,
    });

    const totalPages = Math.ceil(total / pageSize);

    return {
      data: users.map((user) => this.mapRawToUserResponse(user)),
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
    const user = await User.findOne({
      where: {
        id,
        is_deleted: false, // Chỉ update user chưa bị xóa
      },
    });
    if (!user) {
      return null;
    }

    const updateData: Partial<UserAttributes> = {};
    if (userData.first_name !== undefined) updateData.first_name = userData.first_name;
    if (userData.last_name !== undefined) updateData.last_name = userData.last_name;
    if (userData.birth_date !== undefined) {
      updateData.birth_date = userData.birth_date ? new Date(userData.birth_date) : null;
    }
    if (userData.gender !== undefined) updateData.gender = userData.gender;
    if (userData.updated_by !== undefined) updateData.updated_by = userData.updated_by;

    await user.update(updateData);
    return this.mapToUserResponse(user);
  }

  async deleteUser(id: number): Promise<boolean> {
    const user = await User.findOne({
      where: {
        id,
        is_deleted: false, // Chỉ tìm user chưa bị xóa
      },
    });
    if (!user) {
      return false;
    }

    // Soft delete - set is_deleted = 1 thay vì xóa thật
    await user.update({ is_deleted: true });
    return true;
  }

  async hardDeleteUser(id: number): Promise<boolean> {
    const user = await User.findByPk(id); // Tìm cả record đã bị xóa
    if (!user) {
      return false;
    }

    // Hard delete - xóa thật khỏi database
    await user.destroy();
    return true;
  }

  async restoreUser(id: number): Promise<boolean> {
    // Tìm user với id, không filter is_deleted để tìm cả user đã bị xóa
    const user = await User.findByPk(id, { raw: false });
    if (!user) {
      console.log(`Restore failed: User with id ${id} not found`);
      return false;
    }

    // Lấy giá trị is_deleted từ database (convert từ TINYINT sang boolean)
    const userData = user.get({ plain: true });
    const isDeleted = Boolean(userData.is_deleted);
    
    console.log(`Restore check: User ${id}, is_deleted raw value: ${userData.is_deleted}, converted: ${isDeleted}`);

    // Kiểm tra user có đang bị xóa không
    if (!isDeleted) {
      console.log(`Restore failed: User with id ${id} is not deleted (is_deleted = ${isDeleted})`);
      return false; // User chưa bị xóa
    }

    // Restore user - set is_deleted = 0
    await user.update({ is_deleted: false });
    console.log(`User ${id} restored successfully`);
    return true;
  }

  private mapToUserResponse(user: User): UserResponse {
    const userData = user.get({ plain: true });
    return {
      id: userData.id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      birth_date: userData.birth_date,
      gender: userData.gender,
      created_at: userData.created_at,
      created_by: userData.created_by,
      updated_at: userData.updated_at,
      updated_by: userData.updated_by,
      is_deleted: userData.is_deleted,
    };
  }

  private mapRawToUserResponse(userData: any): UserResponse {
    return {
      id: userData.id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      birth_date: userData.birth_date,
      gender: userData.gender,
      created_at: userData.created_at,
      created_by: userData.created_by,
      updated_at: userData.updated_at,
      updated_by: userData.updated_by,
      is_deleted: Boolean(userData.is_deleted),
    };
  }
}

export default new UserService();

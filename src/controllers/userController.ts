import type { Request, Response } from 'express';
import userService from '../services/userService';
import type { CreateUserDto, UpdateUserDto } from '../types';
import { Gender } from '../models/User';

export class UserController {
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const userData: CreateUserDto = req.body;
      const user = await userService.createUser(userData);
      res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      console.error('Error creating user:', error);
      res.status(500).json({
        success: false,
        message: message || 'Failed to create user',
      });
    }
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      // ID đã được validate và convert sang number bởi middleware
      const id = req.params['id'] as unknown as number;

      const user = await userService.getUserById(id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get user';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      // Query parameters đã được validate, convert và set default bởi middleware
      // Sử dụng req.validatedQuery thay vì req.query
      const validatedQuery = req.validatedQuery || req.query;
      const page = (validatedQuery['page'] as unknown as number) ?? 1;
      const limit = (validatedQuery['limit'] as unknown as number) ?? 10;
      console.log('validatedQuery', validatedQuery);
      // Extract filter parameters (chỉ thêm vào object nếu có giá trị)
      const filters: {
        search?: string;
        first_name?: string;
        last_name?: string;
        birth_date_from?: string;
        birth_date_to?: string;
        gender?: Gender;
        include_deleted?: boolean;
        fields?: string;
        include?: string;
      } = {};

      if (validatedQuery['search'] && typeof validatedQuery['search'] === 'string') {
        filters.search = validatedQuery['search'];
      }
      if (validatedQuery['first_name'] && typeof validatedQuery['first_name'] === 'string') {
        filters.first_name = validatedQuery['first_name'];
      }
      if (validatedQuery['last_name'] && typeof validatedQuery['last_name'] === 'string') {
        filters.last_name = validatedQuery['last_name'];
      }
      if (validatedQuery['birth_date_from'] && typeof validatedQuery['birth_date_from'] === 'string') {
        filters.birth_date_from = validatedQuery['birth_date_from'];
      }
      if (validatedQuery['birth_date_to'] && typeof validatedQuery['birth_date_to'] === 'string') {
        filters.birth_date_to = validatedQuery['birth_date_to'];
      }
      if (validatedQuery['gender'] && typeof validatedQuery['gender'] === 'string') {
        // Validate gender là một trong các giá trị enum
        if (Object.values(Gender).includes(validatedQuery['gender'] as Gender)) {
          filters.gender = validatedQuery['gender'] as Gender;
        }
      }
      if (validatedQuery['include_deleted'] !== undefined) {
        filters.include_deleted =
          validatedQuery['include_deleted'] === true || validatedQuery['include_deleted'] === 'true';
      }
      // Dynamic query options
      if (validatedQuery['fields'] && typeof validatedQuery['fields'] === 'string') {
        filters.fields = validatedQuery['fields'];
      }
      if (validatedQuery['include'] && typeof validatedQuery['include'] === 'string') {
        filters.include = validatedQuery['include'];
      }

      const result = await userService.getAllUsers(page, limit, filters);
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get users';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      // ID đã được validate và convert sang number bởi middleware
      const id = req.params['id'] as unknown as number;
      const userData: UpdateUserDto = req.body;
      const user = await userService.updateUser(id, userData);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
        message: 'User updated successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user';
      console.error('Error updating user:', error);
      res.status(500).json({
        success: false,
        message: message || 'Failed to update user',
      });
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      // ID đã được validate và convert sang number bởi middleware
      const id = req.params['id'] as unknown as number;
      const deleted = await userService.deleteUser(id);
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User deleted successfully (soft delete)',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete user';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  async hardDeleteUser(req: Request, res: Response): Promise<void> {
    try {
      // ID đã được validate và convert sang number bởi middleware
      const id = req.params['id'] as unknown as number;
      const deleted = await userService.hardDeleteUser(id);
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User permanently deleted from database',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to hard delete user';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  async restoreUser(req: Request, res: Response): Promise<void> {
    try {
      // ID đã được validate và convert sang number bởi middleware
      const id = req.params['id'] as unknown as number;
      const restored = await userService.restoreUser(id);
      if (!restored) {
        res.status(404).json({
          success: false,
          message: 'User not found or not deleted',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User restored successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restore user';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
}

export default new UserController();


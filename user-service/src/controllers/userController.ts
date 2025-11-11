import type { Request, Response } from 'express';
import userService from '../services/userService';
import type { CreateUserDto, UpdateUserDto } from '../types';

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
      res.status(400).json({
        success: false,
        message,
      });
    }
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const idParam = req.params['id'];
      if (!idParam) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
        return;
      }
      const id = Number.parseInt(idParam, 10);
      if (Number.isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID',
        });
        return;
      }

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
      // Get query parameters
      const pageParam = req.query['page'];
      const limitParam = req.query['limit'];
      const page = Number.parseInt(typeof pageParam === 'string' ? pageParam : '1', 10);
      const limit = Number.parseInt(typeof limitParam === 'string' ? limitParam : '10', 10);

      // Validate page and limit
      if (Number.isNaN(page) || page < 1) {
        res.status(400).json({
          success: false,
          message: 'Invalid page number. Page must be a positive integer.',
        });
        return;
      }

      if (Number.isNaN(limit) || limit < 1 || limit > 100) {
        res.status(400).json({
          success: false,
          message: 'Invalid limit. Limit must be between 1 and 100.',
        });
        return;
      }

      const result = await userService.getAllUsers(page, limit);
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
      const idParam = req.params['id'];
      if (!idParam) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
        return;
      }
      const id = Number.parseInt(idParam, 10);
      if (Number.isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID',
        });
        return;
      }

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
      res.status(400).json({
        success: false,
        message,
      });
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const idParam = req.params['id'];
      if (!idParam) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
        return;
      }
      const id = Number.parseInt(idParam, 10);
      if (Number.isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID',
        });
        return;
      }

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
      const idParam = req.params['id'];
      if (!idParam) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
        return;
      }
      const id = Number.parseInt(idParam, 10);
      if (Number.isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID',
        });
        return;
      }

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
      const idParam = req.params['id'];
      if (!idParam) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
        return;
      }
      const id = Number.parseInt(idParam, 10);
      if (Number.isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID',
        });
        return;
      }

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


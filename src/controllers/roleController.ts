import type { Request, Response } from 'express';
import roleService from '../services/roleService';
import type { CreateRoleDto, UpdateRoleDto } from '../types';

export class RoleController {
  async createRole(req: Request, res: Response): Promise<void> {
    try {
      const roleData: CreateRoleDto = req.body;
      const role = await roleService.createRole(roleData);
      res.status(201).json({
        success: true,
        data: role,
        message: 'Role created successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create role';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  async getRoleById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params['id'] as unknown as number;
      const role = await roleService.getRoleById(id);
      if (!role) {
        res.status(404).json({
          success: false,
          message: 'Role not found',
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: role,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get role';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  async getAllRoles(req: Request, res: Response): Promise<void> {
    try {
      const validatedQuery = req.validatedQuery || req.query;
      const page = (validatedQuery['page'] as unknown as number) ?? 1;
      const limit = (validatedQuery['limit'] as unknown as number) ?? 10;

      const filters: {
        search?: string;
        role_name?: string;
        include_deleted?: boolean;
      } = {};

      if (validatedQuery['search'] && typeof validatedQuery['search'] === 'string') {
        filters.search = validatedQuery['search'];
      }
      if (validatedQuery['role_name'] && typeof validatedQuery['role_name'] === 'string') {
        filters.role_name = validatedQuery['role_name'];
      }
      if (validatedQuery['include_deleted'] !== undefined) {
        filters.include_deleted =
          validatedQuery['include_deleted'] === true || validatedQuery['include_deleted'] === 'true';
      }

      const result = await roleService.getAllRoles(page, limit, filters);
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get roles';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  async updateRole(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params['id'] as unknown as number;
      const roleData: UpdateRoleDto = req.body;
      const role = await roleService.updateRole(id, roleData);

      if (!role) {
        res.status(404).json({
          success: false,
          message: 'Role not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: role,
        message: 'Role updated successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update role';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  async deleteRole(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params['id'] as unknown as number;
      const deleted = await roleService.deleteRole(id);
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Role not found',
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: 'Role deleted successfully (soft delete)',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete role';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  async hardDeleteRole(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params['id'] as unknown as number;
      const deleted = await roleService.hardDeleteRole(id);
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Role not found',
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: 'Role permanently deleted from database',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to hard delete role';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  async restoreRole(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params['id'] as unknown as number;
      const restored = await roleService.restoreRole(id);
      if (!restored) {
        res.status(404).json({
          success: false,
          message: 'Role not found or not deleted',
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: 'Role restored successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restore role';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
}

export default new RoleController();


import type { Request, Response } from 'express';
import orderService from '../services/orderService';
import type { CreateOrderDto, UpdateOrderDto } from '../types';
import {OrderStatus} from '../models/Order';

export class OrderController {
  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      // req.body đã được validate và set bởi validation middleware
      const orderData: CreateOrderDto = req.body;
      
      // Debug: log để kiểm tra
      console.log('OrderController.createOrder - req.body:', JSON.stringify(req.body));
      console.log('OrderController.createOrder - orderData:', JSON.stringify(orderData));
      
      if (!orderData) {
        res.status(400).json({
          success: false,
          message: 'Request body is required',
        });
        return;
      }
      
      const order = await orderService.createOrder(orderData);
      res.status(201).json({
        success: true,
        data: order,
        message: 'Order created successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create order';
      console.error('Error creating order:', error);
      res.status(500).json({
        success: false,
        message: message || 'Failed to create order',
      });
    }
  }

  async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params['id'] as unknown as number;
      const includeItems = req.query['include'] === 'items' || req.query['include']?.toString().includes('items');
      const order = await orderService.getOrderById(id, includeItems);
      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Order not found',
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get order';
      console.error('Error getting order:', error);
      res.status(500).json({
        success: false,
        message: message || 'Failed to get order',
      });
    }
  }

  async getAllOrders(req: Request, res: Response): Promise<void> {
    try {
      const validatedQuery = req.validatedQuery || req.query;
      const page = (validatedQuery['page'] as unknown as number) ?? 1;
      const limit = (validatedQuery['limit'] as unknown as number) ?? 10;

      const filters: {
        user_id?: number;
        status?: OrderStatus;
        total_amount_from?: number;
        total_amount_to?: number;
        include_deleted?: boolean;
        include?: string;
      } = {};

      if (validatedQuery['user_id'] !== undefined) {
        const userId = Number(validatedQuery['user_id']);
        if (!isNaN(userId)) {
          filters.user_id = userId;
        }
      }

      if (validatedQuery['status'] && typeof validatedQuery['status'] === 'string') {
        if (Object.values(OrderStatus).includes(validatedQuery['status'] as OrderStatus)) {
          filters.status = validatedQuery['status'] as OrderStatus;
        }
      }

      if (validatedQuery['total_amount_from'] !== undefined) {
        const totalAmountFrom = Number(validatedQuery['total_amount_from']);
        if (!isNaN(totalAmountFrom)) {
          filters.total_amount_from = totalAmountFrom;
        }
      }

      if (validatedQuery['total_amount_to'] !== undefined) {
        const totalAmountTo = Number(validatedQuery['total_amount_to']);
        if (!isNaN(totalAmountTo)) {
          filters.total_amount_to = totalAmountTo;
        }
      }

      if (validatedQuery['include_deleted'] !== undefined) {
        filters.include_deleted =
          validatedQuery['include_deleted'] === true || validatedQuery['include_deleted'] === 'true';
      }

      if (validatedQuery['include'] && typeof validatedQuery['include'] === 'string') {
        filters.include = validatedQuery['include'];
      }

      const result = await orderService.getAllOrders(page, limit, filters);
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get orders';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  // 4. Update Order
  async updateOrder(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params['id'] as unknown as number;
      const orderData: UpdateOrderDto = req.body;
      const order = await orderService.updateOrder(id, orderData);

      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Order not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: order,
        message: 'Order updated successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update order';
      console.error('Error updating order:', error);
      res.status(500).json({
        success: false,
        message: message || 'Failed to update order',
      });
    }
  }

  // 5. Delete Order (Soft Delete)
  async deleteOrder(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params['id'] as unknown as number;
      const deleted = await orderService.deleteOrder(id);
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Order not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Order deleted successfully (soft delete)',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete order';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  // 6. Hard Delete Order
  async hardDeleteOrder(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params['id'] as unknown as number;
      const deleted = await orderService.hardDeleteOrder(id);
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Order not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Order permanently deleted from database',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to hard delete order';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

   // 7. Restore Order
   async restoreOrder(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params['id'] as unknown as number;
      const restored = await orderService.restoreOrder(id);
      if (!restored) {
        res.status(404).json({
          success: false,
          message: 'Order not found or not deleted',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Order restored successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restore order';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
}


export default new OrderController();
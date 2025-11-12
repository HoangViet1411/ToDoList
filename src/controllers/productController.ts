import type { Request, Response } from 'express';
import productService from '../services/productService';
import type { CreateProductDto, UpdateProductDto } from '../types';

export class ProductController {
  async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const productData: CreateProductDto = req.body;
      const product = await productService.createProduct(productData);
      res.status(201).json({
        success: true,
        data: product,
        message: 'Product created successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create product';
      console.error('Error creating product:', error);
      res.status(500).json({
        success: false,
        message: message || 'Failed to create product',
      });
    }
  }

  async getProductById(req: Request, res: Response): Promise<void> {
    try {
      // ID đã được validate và convert sang number bởi middleware
      const id = req.params['id'] as unknown as number;

      const product = await productService.getProductById(id);
      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Product not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get product';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  async getAllProducts(req: Request, res: Response): Promise<void> {
    try {
      // Query parameters đã được validate, convert và set default bởi middleware
      const validatedQuery = req.validatedQuery || req.query;
      const page = (validatedQuery['page'] as unknown as number) ?? 1;
      const limit = (validatedQuery['limit'] as unknown as number) ?? 10;

      // Extract filter parameters (chỉ thêm vào object nếu có giá trị)
      const filters: {
        search?: string;
        name?: string;
        description?: string;
        price_from?: number;
        price_to?: number;
        category_id?: number;
        include_deleted?: boolean;
      } = {};

      if (validatedQuery['search'] && typeof validatedQuery['search'] === 'string') {
        filters.search = validatedQuery['search'];
      }
      if (validatedQuery['name'] && typeof validatedQuery['name'] === 'string') {
        filters.name = validatedQuery['name'];
      }
      if (validatedQuery['description'] && typeof validatedQuery['description'] === 'string') {
        filters.description = validatedQuery['description'];
      }
      if (validatedQuery['price_from'] !== undefined) {
        const priceFrom = Number(validatedQuery['price_from']);
        if (!isNaN(priceFrom)) {
          filters.price_from = priceFrom;
        }
      }
      if (validatedQuery['price_to'] !== undefined) {
        const priceTo = Number(validatedQuery['price_to']);
        if (!isNaN(priceTo)) {
          filters.price_to = priceTo;
        }
      }
      if (validatedQuery['category_id'] !== undefined) {
        const categoryId = Number(validatedQuery['category_id']);
        if (!isNaN(categoryId)) {
          filters.category_id = categoryId;
        }
      }
      if (validatedQuery['include_deleted'] !== undefined) {
        filters.include_deleted =
          validatedQuery['include_deleted'] === true || validatedQuery['include_deleted'] === 'true';
      }

      const result = await productService.getAllProducts(page, limit, filters);
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get products';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      // ID đã được validate và convert sang number bởi middleware
      const id = req.params['id'] as unknown as number;
      const productData: UpdateProductDto = req.body;
      const product = await productService.updateProduct(id, productData);

      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Product not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: product,
        message: 'Product updated successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update product';
      console.error('Error updating product:', error);
      res.status(500).json({
        success: false,
        message: message || 'Failed to update product',
      });
    }
  }

  async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      // ID đã được validate và convert sang number bởi middleware
      const id = req.params['id'] as unknown as number;
      const deleted = await productService.deleteProduct(id);
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Product not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Product deleted successfully (soft delete)',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete product';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  async hardDeleteProduct(req: Request, res: Response): Promise<void> {
    try {
      // ID đã được validate và convert sang number bởi middleware
      const id = req.params['id'] as unknown as number;
      const deleted = await productService.hardDeleteProduct(id);
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Product not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Product permanently deleted from database',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to hard delete product';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  async restoreProduct(req: Request, res: Response): Promise<void> {
    try {
      // ID đã được validate và convert sang number bởi middleware
      const id = req.params['id'] as unknown as number;
      const restored = await productService.restoreProduct(id);
      if (!restored) {
        res.status(404).json({
          success: false,
          message: 'Product not found or not deleted',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Product restored successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restore product';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
}

export default new ProductController();


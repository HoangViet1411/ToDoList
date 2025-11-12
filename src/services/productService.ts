import Product, { ProductAttributes } from "../models/Product";
import { Op } from "sequelize";
import type { CreateProductDto, UpdateProductDto, ProductResponse, PaginatedResponse } from "../types";
import { sequelize } from "../config/database";

export interface ProductFilterParams {
    search?: string;
    name?: string;
    description?: string;
    price_from?: number;
    price_to?: number;
    category_id?: number;
    include_deleted?: boolean;
}

export class ProductService {
    async createProduct(productData: CreateProductDto): Promise<ProductResponse> {
        const product = await Product.create({
            name: productData.name!,
            description: productData.description !== undefined ? productData.description : null,
            price: productData.price!,
            quantity: productData.quantity ?? 0,
        });

        // Load lại với attributes để chỉ select các cột cần thiết
        const createdProduct = await Product.findByPk(product.id, {
            attributes: ['id', 'name', 'price', 'description', 'quantity'],
        });

        return this.mapToProductResponse(createdProduct!);
    }

    async getProductById(id: number): Promise<ProductResponse | null> {
        // Paranoid tự động filter deleted_at IS NULL
        const product = await Product.findByPk(id, {
            attributes: ['id', 'name', 'price', 'description', 'quantity'],
        });
        return product ? this.mapToProductResponse(product) : null;
    }

    async getAllProducts(
        page: number = 1,
        limit: number = 10,
        filters: ProductFilterParams = {}
    ): Promise<PaginatedResponse<ProductResponse>> {
        // Validate và set default values
        const pageNumber = Math.max(1, page);
        // Nếu limit=0, không áp dụng pagination (lấy tất cả)
        const noPagination = limit === 0;
        // Chỉ tính pageSize và offset khi có pagination
        const pageSize = noPagination ? 0 : Math.max(1, Math.min(100, limit)); // Max 100 records per page
        const offset = noPagination ? 0 : (pageNumber - 1) * pageSize;

        // Xây dựng WHERE clause cho filter
        const whereConditions: Array<Record<string, unknown>> = [];

        // Filter by search (tìm trong name và description với OR)
        if (filters.search && filters.search.trim()) {
            const searchTerm = `%${filters.search.trim()}%`;
            whereConditions.push({
                [Op.or]: [
                    { name: { [Op.like]: searchTerm } },
                    { description: { [Op.like]: searchTerm } },
                ],
            });
        }

        // Filter by name (có thể kết hợp với search)
        if (filters.name && filters.name.trim()) {
            const nameFilter = filters.name.trim();
            whereConditions.push({
                name: { [Op.like]: `%${nameFilter}%` },
            });
        }

        // Filter by description (có thể kết hợp với search và name)
        if (filters.description && filters.description.trim()) {
            const descriptionFilter = filters.description.trim();
            whereConditions.push({
                description: { [Op.like]: `%${descriptionFilter}%` },
            });
        }

        // Filter by price_from (từ giá này trở lên)
        if (filters.price_from !== undefined && filters.price_from !== null) {
            whereConditions.push({
                price: {
                    [Op.gte]: filters.price_from,
                },
            });
        }

        // Filter by price_to (đến giá này)
        if (filters.price_to !== undefined && filters.price_to !== null) {
            whereConditions.push({
                price: {
                    [Op.lte]: filters.price_to,
                },
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
            limit?: number;
            offset?: number;
            paranoid?: boolean;
            attributes?: string[];
        } = {
            attributes: ['id', 'name', 'price', 'description', 'quantity'],
            order: [['id', 'DESC']], // Order by id DESC (tương đương createdAt DESC vì id là auto increment)
            paranoid: filters.include_deleted === true ? false : true,
        };

        // Nếu limit=0, không áp dụng pagination
        if (!noPagination) {
            queryOptions.limit = pageSize;
            queryOptions.offset = offset;
        }

        // Chỉ thêm where clause nếu có filter
        if (whereClause) {
            queryOptions.where = whereClause;
        }

        // Dùng findAndCountAll để lấy cả data và count trong 1 query (hiệu quả hơn)
        const { rows: products, count: total } = await Product.findAndCountAll(queryOptions);

        // Nếu không có pagination, totalPages = 1 và limit = total
        const totalPages = noPagination ? 1 : Math.ceil(total / pageSize);
        const responseLimit = noPagination ? total : pageSize;

        return {
            data: products.map((product) => this.mapToProductResponse(product)),
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

    async updateProduct(id: number, productData: UpdateProductDto): Promise<ProductResponse | null> {
        // Sử dụng transaction để đảm bảo tính nguyên tử
        const transaction = await sequelize.transaction();

        try {
            // Paranoid tự động filter deleted_at IS NULL
            const product = await Product.findByPk(id, { transaction });
            if (!product) {
                await transaction.rollback();
                return null;
            }

            const updateData: Partial<ProductAttributes> = {};

            // name: chỉ update nếu có giá trị hợp lệ
            if (productData.name !== undefined && productData.name !== null && productData.name.trim().length > 0) {
                updateData.name = productData.name.trim();
            }

            // price: chỉ update nếu có giá trị hợp lệ (>= 0)
            if (productData.price !== undefined && productData.price !== null && productData.price >= 0) {
                updateData.price = productData.price;
            }

            // description: có thể set null hoặc string
            if (productData.description !== undefined) {
                updateData.description = productData.description || null;
            }

            // quantity: chỉ update nếu có giá trị hợp lệ (>= 0)
            if (productData.quantity !== undefined && productData.quantity !== null && productData.quantity >= 0) {
                updateData.quantity = productData.quantity;
            }

            // Chỉ update nếu có thay đổi
            if (Object.keys(updateData).length > 0) {
                await product.update(updateData, {
                    fields: Object.keys(updateData) as Array<keyof ProductAttributes>,
                    transaction,
                });
            }

            // Commit transaction
            await transaction.commit();

            // Load lại với attributes để chỉ select các cột cần thiết
            const updatedProduct = await Product.findByPk(id, {
                attributes: ['id', 'name', 'price', 'description', 'quantity'],
            });

            if (!updatedProduct) {
                throw new Error('Failed to load updated product');
            }

            return this.mapToProductResponse(updatedProduct);
        } catch (error) {
            // Rollback transaction nếu có lỗi
            await transaction.rollback();
            throw error;
        }
    }

    async deleteProduct(id: number): Promise<boolean> {
        // Paranoid tự động filter deleted_at IS NULL
        // Chỉ cần id để delete, không cần select nhiều fields
        const product = await Product.findByPk(id, {
            attributes: ['id'],
        });
        if (!product) {
            return false;
        }

        // Soft delete - Sequelize tự động set deleted_at = NOW()
        await product.destroy();
        return true;
    }

    async hardDeleteProduct(id: number): Promise<boolean> {
        // Tìm cả record đã bị xóa (paranoid: false)
        // Chỉ cần id để delete, không cần select nhiều fields
        const product = await Product.findByPk(id, {
            paranoid: false,
            attributes: ['id'],
        });
        if (!product) {
            return false;
        }

        // Hard delete - xóa thật khỏi database
        await product.destroy({ force: true });
        return true;
    }

    async restoreProduct(id: number): Promise<boolean> {
        // Tìm cả product đã bị xóa (paranoid: false)
        // Cần deletedAt để check xem product có đang bị xóa không
        const product = await Product.findByPk(id, {
            paranoid: false,
            attributes: ['id', 'deletedAt'],
        });
        if (!product) {
            console.log(`Restore failed: Product with id ${id} not found`);
            return false;
        }

        // Kiểm tra product có đang bị xóa không (deletedAt !== null)
        if (!product.deletedAt) {
            console.log(`Restore failed: Product with id ${id} is not deleted`);
            return false; // Product chưa bị xóa
        }

        // Restore product - Sequelize tự động set deleted_at = NULL
        await product.restore();
        console.log(`Product ${id} restored successfully`);
        return true;
    }

    private mapToProductResponse(product: Product): ProductResponse {
        // Sequelize tự động map tất cả các field từ model instance sang plain object
        // Vì đã dùng attributes trong query, plainProduct chỉ chứa các field đã được select
        const plainProduct = product.get({ plain: true }) as any;
        return {
            ...plainProduct, // Spread tất cả các field từ plainProduct (id, name, price, description, quantity)
        };
    }
}

export default new ProductService();

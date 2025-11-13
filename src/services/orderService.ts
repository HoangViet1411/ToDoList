import Order, { OrderAttributes, OrderStatus } from '../models/Order';
import OrderDetail from '../models/OrderDetail';
import Product from '../models/Product';
import User from '../models/User';
import { Op } from 'sequelize';
import type {
  CreateOrderDto,
  UpdateOrderDto,
  OrderResponse,
  PaginatedResponse,
} from '../types';
import { Transactional } from '../decorators/Transactional';

export interface OrderFilterParams {
  user_id?: number;
  status?: OrderStatus;
  total_amount_from?: number;
  total_amount_to?: number;
  include_deleted?: boolean;
  fields?: string;
  include?: string; // "user,items,items.product"
}

export class OrderService {
  @Transactional()
  async createOrder(orderData: CreateOrderDto): Promise<OrderResponse> {
    // Debug: log để kiểm tra
    console.log('OrderService.createOrder - orderData received:', JSON.stringify(orderData));
    console.log('OrderService.createOrder - orderData type:', typeof orderData);
    console.log('OrderService.createOrder - orderData.user_id:', orderData?.user_id);
    
    if (!orderData) {
      throw new Error('orderData is required');
    }

    // throw exception vào đây để test transaction
    // Set TEST_TRANSACTION=true trong .env để test transaction rollback
    if (process.env['TEST_TRANSACTION'] === 'true') {
      throw new Error('Test transaction rollback - Order should not be created');
    }
    
    // Validate user tồn tại
    const user = await User.findByPk(orderData.user_id);
    if (!user) {
      throw new Error(`User with ID ${orderData.user_id} not found`);
    }

    // Validate và lấy products
    const productIds = orderData.items.map((item) => item.product_id);
    const uniqueProductIds = [...new Set(productIds)];
    const products = await Product.findAll({
      where: { id: uniqueProductIds },
    });

    if (products.length !== uniqueProductIds.length) {
      const foundProductIds = products.map((p) => p.id);
      const missingProductIds = uniqueProductIds.filter((id) => !foundProductIds.includes(id));
      throw new Error(`Products with IDs [${missingProductIds.join(', ')}] not found`);
    }

    // Tạo map để lookup product nhanh
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate quantity và chuẩn bị order details
    // Trigger sẽ tự động tính line_total và total_amount
    const orderDetails: Array<{
      productId: number;
      quantity: number;
      unitPrice: number;
    }> = [];

    for (const item of orderData.items) {
      const product = productMap.get(item.product_id);
      if (!product) {
        throw new Error(`Product with ID ${item.product_id} not found`);
      }

      // Validate quantity
      if (product.quantity < item.quantity) {
        throw new Error(
          `Insufficient quantity for product ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`
        );
      }

      // Lấy unit price từ item hoặc product
      const unitPrice = item.unit_price ?? Number(product.price);

      orderDetails.push({
        productId: item.product_id,
        quantity: item.quantity,
        unitPrice,
      });
    }

    // Tạo Order - totalAmount sẽ được trigger tự động tính sau khi tạo OrderDetails
    // Tạm thời set totalAmount = 0, trigger sẽ update sau
    const order = await Order.create({
      userId: orderData.user_id,
      status: orderData.status ?? OrderStatus.PENDING,
      totalAmount: 0, // Trigger sẽ tự động tính sau khi tạo OrderDetails
      note: orderData.note ?? null,
      shippingAddress: orderData.shipping_address ?? null,
      paymentMethod: orderData.payment_method ?? null,
    });

    // Tạo OrderDetails - trigger sẽ tự động tính line_total
    const now = new Date();
    await OrderDetail.bulkCreate(
      orderDetails.map((detail) => ({
        orderId: order.id,
        productId: detail.productId,
        quantity: detail.quantity,
        unitPrice: detail.unitPrice,
        // lineTotal không cần truyền vào, trigger sẽ tự động tính
        createdAt: now,
        updatedAt: now,
      }))
    );

    // Update product quantities (trừ số lượng đã order)
    for (const detail of orderDetails) {
      const product = productMap.get(detail.productId)!;
      await product.update({
        quantity: product.quantity - detail.quantity,
      });
    }

    // Reload order để lấy totalAmount đã được trigger tính toán
    await order.reload({
      attributes: ['id', 'status', 'totalAmount', 'note', 'shippingAddress', 'paymentMethod', 'createdAt'],
    });

    return this.mapToOrderResponse(order);
  }

  async getOrderById(id: number, includeItems: boolean = false): Promise<OrderResponse | null> {
    const queryOptions: {
      attributes: string[];
      include?: any[];
    } = {
      attributes: ['id', 'status', 'totalAmount', 'note', 'shippingAddress', 'paymentMethod', 'createdAt'],
      // Luôn include items với id và quantity
      include: [
        {
          model: OrderDetail,
          as: 'items',
          attributes: ['id', 'quantity'],
        },
      ],
    };

    // Nếu includeItems = true, thêm product info
    if (includeItems) {
      queryOptions.include = [
        {
          model: OrderDetail,
          as: 'items',
          attributes: ['id', 'orderId', 'productId', 'quantity', 'unitPrice', 'lineTotal', 'createdAt', 'updatedAt'],
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'price'],
            },
          ],
        },
      ];
    }

    const order = await Order.findByPk(id, queryOptions);

    return order ? this.mapToOrderResponse(order) : null;
  }

  async getAllOrders(
    page: number = 1,
    limit: number = 10,
    filters: OrderFilterParams = {}
  ): Promise<PaginatedResponse<OrderResponse>> {
    const pageNumber = Math.max(1, page);
    const noPagination = limit === 0;
    const pageSize = noPagination ? 0 : Math.max(1, Math.min(100, limit));
    const offset = noPagination ? 0 : (pageNumber - 1) * pageSize;

    const whereConditions: Array<Record<string, unknown>> = [];

    if (filters.user_id !== undefined) {
      whereConditions.push({ userId: filters.user_id });
    }

    if (filters.status !== undefined) {
      whereConditions.push({ status: filters.status });
    }

    // Filter by total_amount
    if (filters.total_amount_from !== undefined || filters.total_amount_to !== undefined) {
      const totalAmountCondition: any = {};
      if (filters.total_amount_from !== undefined) {
        totalAmountCondition[Op.gte] = filters.total_amount_from;
      }
      if (filters.total_amount_to !== undefined) {
        totalAmountCondition[Op.lte] = filters.total_amount_to;
      }
      whereConditions.push({ totalAmount: totalAmountCondition });
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
      attributes?: string[];
      include?: any[];
      distinct?: boolean;
    } = {
      attributes: ['id', 'status', 'totalAmount', 'note', 'shippingAddress', 'paymentMethod', 'createdAt'],
      order: [['id', 'DESC']],
      paranoid: filters.include_deleted === true ? false : true,
    };

    // Build includes - luôn include items với id và quantity
    const includeDefs: any[] = [
      {
        model: OrderDetail,
        as: 'items',
        attributes: ['id', 'quantity'],
      },
    ];

    // Thêm các includes khác nếu có
    if (filters.include) {
      const includes = filters.include.split(',').map((s) => s.trim()).filter(Boolean);
      if (includes.includes('user')) {
        includeDefs.push({
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName'],
        });
      }
      // Nếu có include=items, thay thế items include đơn giản bằng items include đầy đủ
      if (includes.includes('items')) {
        const itemsIndex = includeDefs.findIndex((inc) => inc.as === 'items');
        if (itemsIndex >= 0) {
          includeDefs[itemsIndex] = {
            model: OrderDetail,
            as: 'items',
            attributes: ['id', 'orderId', 'productId', 'quantity', 'unitPrice', 'lineTotal', 'createdAt', 'updatedAt'],
          };
        }
      }
      if (includes.includes('items.product')) {
        const itemsInclude = includeDefs.find((inc) => inc.as === 'items');
        if (itemsInclude) {
          itemsInclude.include = [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'price'],
            },
          ];
        }
      }
    }

    queryOptions.include = includeDefs;
    queryOptions.distinct = true;

    if (!noPagination) {
      queryOptions.limit = pageSize;
      queryOptions.offset = offset;
    }

    if (whereClause) {
      queryOptions.where = whereClause;
    }

    const { rows: orders, count: total } = await Order.findAndCountAll(queryOptions);

    const totalPages = noPagination ? 1 : Math.ceil(total / pageSize);
    const responseLimit = noPagination ? total : pageSize;

    return {
      data: orders.map((order) => this.mapToOrderResponse(order)),
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

  @Transactional()
  async updateOrder(id: number, orderData: UpdateOrderDto): Promise<OrderResponse | null> {
    // Load order với items hiện tại
    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderDetail,
          as: 'items',
        },
      ],
    });
    if (!order) {
      return null;
    }

    const updateData: Partial<OrderAttributes> = {};

    if (orderData.status !== undefined) {
      updateData.status = orderData.status;
    }

    if (orderData.note !== undefined) {
      updateData.note = orderData.note || null;
    }

    if (orderData.shipping_address !== undefined) {
      updateData.shippingAddress = orderData.shipping_address || null;
    }

    if (orderData.payment_method !== undefined) {
      updateData.paymentMethod = orderData.payment_method || null;
    }

    // Xử lý update items nếu có
    if (orderData.items !== undefined) {
      const existingItems = ((order as any).items || []) as OrderDetail[];
      const existingItemsMap = new Map(
        existingItems.map((item) => [item.productId, item])
      );
      const newItemsMap = new Map(
        orderData.items.map((item) => [item.product_id, item])
      );

      // Lấy tất cả product IDs cần thiết
      const allProductIds = new Set<number>([
        ...Array.from(existingItemsMap.keys()),
        ...Array.from(newItemsMap.keys()),
      ]);
      const products = await Product.findAll({
        where: { id: { [Op.in]: Array.from(allProductIds) } },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      // Tính toán thay đổi quantity cho từng product
      const productQuantityChanges = new Map<number, number>();

      // Xử lý items cũ: update hoặc delete
      for (const [productId, existingItem] of existingItemsMap) {
        const newItem = newItemsMap.get(productId);
        if (newItem) {
          // Update quantity
          const quantityDelta = newItem.quantity - existingItem.quantity;
          if (quantityDelta !== 0) {
            const currentChange = productQuantityChanges.get(productId) || 0;
            productQuantityChanges.set(productId, currentChange - quantityDelta);
          }
        } else {
          // Delete item - cộng lại quantity vào product
          const currentChange = productQuantityChanges.get(productId) || 0;
          productQuantityChanges.set(productId, currentChange + existingItem.quantity);
        }
      }

      // Xử lý items mới: add
      for (const [productId, newItem] of newItemsMap) {
        if (!existingItemsMap.has(productId)) {
          // Add new item - trừ quantity từ product
          const currentChange = productQuantityChanges.get(productId) || 0;
          productQuantityChanges.set(productId, currentChange - newItem.quantity);
        }
      }

      // Validate product quantities trước khi update
      for (const [productId, quantityChange] of productQuantityChanges) {
        const product = productMap.get(productId);
        if (!product) {
          throw new Error(`Product with ID ${productId} not found`);
        }
        // Nếu quantityChange < 0, nghĩa là đang trừ quantity (tăng order)
        // Cần kiểm tra product có đủ quantity không
        if (quantityChange < 0 && product.quantity < Math.abs(quantityChange)) {
          throw new Error(
            `Insufficient quantity for product ${product.name}. Available: ${product.quantity}, Requested: ${Math.abs(quantityChange)}`
          );
        }
      }

      // Update product quantities
      for (const [productId, quantityChange] of productQuantityChanges) {
        const product = productMap.get(productId)!;
        await product.update({
          quantity: product.quantity + quantityChange,
        });
      }

      // Xóa tất cả items cũ
      await OrderDetail.destroy({
        where: { orderId: order.id },
      });

      // Tạo lại items mới - trigger sẽ tự động tính line_total và total_amount
      if (orderData.items.length > 0) {
        const now = new Date();
        await OrderDetail.bulkCreate(
          orderData.items.map((item) => {
            const product = productMap.get(item.product_id)!;
            const unitPrice = item.unit_price ?? Number(product.price);

            return {
              orderId: order.id,
              productId: item.product_id,
              quantity: item.quantity,
              unitPrice,
              // lineTotal không cần truyền vào, trigger sẽ tự động tính
              createdAt: now,
              updatedAt: now,
            };
          })
        );
        // totalAmount sẽ được trigger tự động tính, không cần set ở đây
      } else {
        // Nếu không có items nào, trigger sẽ tự động set totalAmount = 0
        // Không cần set updateData.totalAmount
      }
    }

    // Update order fields (nếu có)
    if (Object.keys(updateData).length > 0) {
      await order.update(updateData, {
        fields: Object.keys(updateData) as Array<keyof OrderAttributes>,
      });
    }

    // Reload order để lấy totalAmount đã được trigger tính toán (nếu có update items)
    // Nếu không có update items, vẫn reload để đảm bảo có dữ liệu mới nhất
    await order.reload({
      attributes: ['id', 'status', 'totalAmount', 'note', 'shippingAddress', 'paymentMethod', 'createdAt'],
    });

    return this.mapToOrderResponse(order);
  }

  async deleteOrder(id: number): Promise<boolean> {
    const deletedCount = await Order.destroy({
      where: { id },
      limit: 1,
    });
    return deletedCount > 0;
  }

  async hardDeleteOrder(id: number): Promise<boolean> {
    const deletedCount = await Order.destroy({
      where: { id },
      limit: 1,
      force: true,
    });
    return deletedCount > 0;
  }

  async restoreOrder(id: number): Promise<boolean> {
    const order = await Order.findByPk(id, {
      paranoid: false,
      attributes: ['id', 'deletedAt'],
    });
    if (!order) {
      return false;
    }

    if (!order.deletedAt) {
      return false;
    }

    await order.restore();
    return true;
  }

  private mapToOrderResponse(order: Order): OrderResponse {
    // Sequelize tự động map tất cả các field từ model instance sang plain object
    // Vì đã dùng attributes trong query, plainOrder chỉ chứa các field đã được select
    const plainOrder = order.get({ plain: true }) as any;
    
    // Dùng spread operator để lấy tất cả fields từ query result (giống userService)
    // Chỉ override các fields cần format lại
    const response: OrderResponse = {
      ...plainOrder,
      // Convert totalAmount sang number nếu cần
      totalAmount: Number(plainOrder.totalAmount),
      // Format items nếu có - chỉ map những fields có trong query result
      ...(plainOrder.items && {
        items: plainOrder.items.map((item: any) => {
          // Chỉ map những fields có trong item (đã được select)
          const mappedItem: any = {
            id: item.id,
            quantity: item.quantity,
          };
          
          // Chỉ thêm các fields nếu chúng có trong query result
          if (item.orderId !== undefined) {
            mappedItem.orderId = item.orderId;
          }
          if (item.productId !== undefined) {
            mappedItem.productId = item.productId;
          }
          if (item.unitPrice !== undefined && item.unitPrice !== null) {
            mappedItem.unitPrice = Number(item.unitPrice);
          }
          if (item.lineTotal !== undefined && item.lineTotal !== null) {
            mappedItem.lineTotal = Number(item.lineTotal);
          }
          if (item.createdAt !== undefined) {
            mappedItem.createdAt = item.createdAt;
          }
          if (item.updatedAt !== undefined) {
            mappedItem.updatedAt = item.updatedAt;
          }
          if (item.product) {
            mappedItem.product = {
              id: item.product.id,
              name: item.product.name,
              price: Number(item.product.price),
            };
          }
          
          return mappedItem;
        }),
      }),
    };
    
    return response;
  }
}

export default new OrderService();


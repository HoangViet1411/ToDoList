import { OrderStatus, PaymentMethod } from '../models/Order';

// DTO for creating an order item (product in order)
export interface CreateOrderItemDto {
  product_id: number;
  quantity: number;
  unit_price?: number; // Optional - nếu không có sẽ lấy từ product
}

// DTO for creating an order
export interface CreateOrderDto {
  user_id: number;
  status?: OrderStatus; // Optional - default: PENDING
  note?: string | null;
  shipping_address?: string | null;
  payment_method?: PaymentMethod | null;
  items: CreateOrderItemDto[]; // Array of order items (required)
}

// DTO for updating an order
export interface UpdateOrderDto {
  status?: OrderStatus;
  note?: string | null;
  shipping_address?: string | null;
  payment_method?: PaymentMethod | null;
  items?: CreateOrderItemDto[]; // Optional - để update/add/delete items
}

// Response type for OrderDetail
export interface OrderDetailResponse {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number | null;
  createdAt?: Date;
  updatedAt?: Date;
  // Optional: include product info when loaded with associations
  product?: {
    id: number;
    name: string;
    price: number;
  };
}

// Response type for Order
export interface OrderResponse {
  id: number;
  userId: number; // Maps to user_id in database
  status: OrderStatus;
  totalAmount: number; // Maps to total_amount in database
  note: string | null;
  shippingAddress: string | null; // Maps to shipping_address in database
  paymentMethod: PaymentMethod | null; // Maps to payment_method in database
  createdAt?: Date; // Maps to created_at in database
  updatedAt?: Date; // Maps to updated_at in database
  deletedAt?: Date | null; // Maps to deleted_at in database
  // Optional: include related data when loaded with associations
  user?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  items?: OrderDetailResponse[]; // Order details
}


export interface CreateProductDto {
    name: string;
    price: number;
    description?: string;  // Optional vì model allowNull: true
    quantity?: number;     // Optional vì có defaultValue: 0
  }
  
  export interface UpdateProductDto {
    name?: string;
    price?: number;
    description?: string;
    quantity?: number;    // Thêm quantity
  }
  
  export interface ProductResponse {
    id: number;
    name: string;
    price: number;
    description: string | null;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;  // Thêm deletedAt
  }
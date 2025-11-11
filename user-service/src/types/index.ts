export interface CreateUserDto {
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  gender?: string;
  created_by?: number;
}

export interface UpdateUserDto {
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  gender?: string;
  updated_by?: number;
}

export interface UserResponse {
  id: number;
  first_name: string | null;
  last_name: string | null;
  birth_date: Date | null;
  gender: string | null;
  created_at: Date;
  created_by: number | null;
  updated_at: Date;
  updated_by: number | null;
  is_deleted: boolean;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

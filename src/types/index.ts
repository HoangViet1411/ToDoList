import { Gender } from '../models/User';

export interface CreateUserDto {
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  gender?: Gender;
  created_by?: number;
}

export interface UpdateUserDto {
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  gender?: Gender;
  updated_by?: number;
}

export interface UserResponse {
  id: number;
  firstName: string; // NOT NULL in database
  lastName: string; // NOT NULL in database
  birthDate: Date | null;
  gender: Gender | null;
  createdAt: Date;
  createdBy: number | null;
  updatedAt: Date;
  updatedBy: number | null;
  isDeleted: boolean;
  deletedAt: Date | null;
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

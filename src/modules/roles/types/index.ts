export interface PaginationFilters {
  page?: number;
  limit?: number;
  search?: string | undefined;
}

export interface RoleFilters extends PaginationFilters {
  name?: string | undefined;
  isActive?: boolean | undefined;
  accessScope?: 'GLOBAL' | 'EDITION' | 'COMPANY' | 'SELF' | undefined;
}

export interface RoleResponse {
  roles: any[];
  total: number;
  totalPages: number;
}

export interface CreateRoleData {
  name: string;
  description?: string;
  accessScope: 'GLOBAL' | 'EDITION' | 'COMPANY' | 'SELF';
  isActive?: boolean;
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  accessScope?: 'GLOBAL' | 'EDITION' | 'COMPANY' | 'SELF';
  isActive?: boolean;
}

export interface RoleAttributes {
  id: string;
  name: string;
  description?: string;
  accessScope: 'GLOBAL' | 'EDITION' | 'COMPANY' | 'SELF';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

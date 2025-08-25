export interface PaginationFilters {
  page?: number;
  limit?: number;
  search?: string | undefined;
}

export interface UserFilters extends PaginationFilters {
  systemEditionId?: string | undefined;
  companyId?: string | undefined;
  role?: string | undefined;
  isActive?: boolean | undefined;
  emailVerified?: boolean | undefined;
}

export interface CreateUserData {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role?: 'super_admin' | 'edition_admin' | 'company_admin' | 'user' | 'delegate';
  isActive?: boolean;
  emailVerified?: boolean;
  systemEditionId?: string;
  companyId?: string;
  expirationDate?: Date;
  seatAssigned?: boolean;
  licenseType?: 'organizational_seat' | 'individual_parent' | 'individual_child' | 'none';
  createdBy: string;
}

export interface UpdateUserData {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: 'super_admin' | 'edition_admin' | 'company_admin' | 'user' | 'delegate';
  isActive?: boolean;
  emailVerified?: boolean;
  expirationDate?: Date;
  seatAssigned?: boolean;
  licenseType?: 'organizational_seat' | 'individual_parent' | 'individual_child' | 'none';
} 
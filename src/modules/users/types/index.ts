export interface PaginationFilters {
  page?: number;
  limit?: number;
  search?: string | undefined;
}

export interface UserFilters extends PaginationFilters {
  roleName?: string | undefined;
  isActive?: boolean | undefined;
  emailVerified?: boolean | undefined;
}

export interface CreateUserData {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  roles?: Array<{
    roleName: 'super_admin' | 'edition_admin' | 'company_admin' | 'user' | 'delegate';
    systemEditionId?: string;
    companyId?: string;
    channelId?: string;
    expiresAt?: Date;
  }>;
  isActive?: boolean;
  emailVerified?: boolean;
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
  isActive?: boolean;
  emailVerified?: boolean;
  expirationDate?: Date;
  seatAssigned?: boolean;
  licenseType?: 'organizational_seat' | 'individual_parent' | 'individual_child' | 'none';
} 
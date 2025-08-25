export interface PaginationFilters {
  page?: number;
  limit?: number;
  search?: string | undefined;
}

export interface CompanyFilters extends PaginationFilters {
  systemEditionId?: string | undefined;
  companyId?: string | undefined;
}

export interface CreateCompanyData {
  systemEditionId: string;
  companyId?: string;
  createdBy: string;
  name: string;
  companyAdminId?: string;
  totalSeats: number;
  type?: string;
  title?: string;
  channelPartnerSplit?: boolean;
  commission?: number;
  paymentMethod?: string;
}

export interface UpdateCompanyData {
  name?: string;
  companyAdminId?: string;
  totalSeats?: number;
  type?: string;
  title?: string;
  channelPartnerSplit?: boolean;
  commission?: number;
  paymentMethod?: string;
}

export interface PinOptions {
  documents: boolean;
  notes: boolean;
  certificates: boolean;
}

export interface PinSettings {
  requireToView: boolean;
  requireToEdit: boolean;
}

export interface PinManagementData {
  masterPin?: string;
  pinOptions?: Partial<PinOptions>;
  pinSettings?: Partial<PinSettings>;
}

export interface PinConfiguration {
  hasMasterPin: boolean;
  pinOptions: PinOptions;
  pinSettings: PinSettings;
}

export interface CompanyUserFilters extends PaginationFilters {
  companyId: string;
  role?: "company_admin" | "user" | "delegate" | undefined;
}
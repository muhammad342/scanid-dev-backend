export interface PaginationFilters {
  page?: number;
  limit?: number;
  search?: string | undefined;
}

export interface CustomFieldFilters extends PaginationFilters {
  fieldType?: 'Number' | 'Text' | 'Date' | 'Dropdown' | 'Checkbox' | undefined;
  isActive?: boolean | undefined;
  systemEditionId?: string | undefined;
  companyId?: string | undefined;
}

export interface CustomFieldResponse {
  customFields: any[];
  total: number;
  totalPages: number;
}

export interface CreateCustomFieldData {
  systemEditionId: string;
  companyId?: string;
  createdBy: string;
  fieldName: string;
  fieldType: 'Number' | 'Text' | 'Date' | 'Dropdown' | 'Checkbox';
  helpText?: string;
  isMandatory?: boolean;
  useDecimals?: boolean;
  dropdownOptions?: string[];
  fieldOrder?: number;
  isActive?: boolean;
}

export interface UpdateCustomFieldData {
  fieldName?: string;
  fieldType?: 'Number' | 'Text' | 'Date' | 'Dropdown' | 'Checkbox';
  helpText?: string;
  isMandatory?: boolean;
  useDecimals?: boolean;
  dropdownOptions?: string[];
  fieldOrder?: number;
  isActive?: boolean;
}
  
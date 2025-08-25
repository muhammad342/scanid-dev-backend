export interface PaginationFilters {
  page?: number;
  limit?: number;
  search?: string | undefined;
}

export interface AuditLogFilters extends PaginationFilters {
  module?: string | undefined;
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
  systemEditionId?: string | undefined;
  companyId?: string | undefined;
  userId?: string | undefined;
}

export interface AuditLogResponse {
  auditLogs: any[];
  total: number;
  totalPages: number;
}

export interface CreateAuditLogData {
  systemEditionId?: string;
  companyId?: string;
  userId: string;
  action: string;
  module: 'documents' | 'notes' | 'certifications' | 'users' | 'settings' | 'system' | 'authentication' | 'permissions';
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
} 
import { Response } from 'express';
import { asyncHandler } from '../../../shared/middleware/errorHandler.js';
import { sendBadRequest, sendPaginatedResponse } from '../../../shared/utils/response.js';
import { auditLogService } from '../services/auditLogService.js';
import type { AuditLogFilters } from '../types/index.js';
import { RequestWithContext } from '@/shared/middleware/contextResolver.js';

// Get audit logs with filtering
export const getAuditLogs = asyncHandler(async (req: RequestWithContext, res: Response) => {
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 10;
  const search = req.query['search'] as string | undefined;
  const module = req.query['module'] as string | undefined;
  const dateFrom = req.query['dateFrom'] as string | undefined;
  const dateTo = req.query['dateTo'] as string | undefined;
  const userId = req.query['userId'] as string | undefined;

  const context = req?.resolvedContext;
  const systemEditionId = context?.systemEditionId;
  const companyId = context?.companyId;
  
  if (!systemEditionId) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  const filters: AuditLogFilters = {
    page,
    limit,
    search,
    module,
    dateFrom,
    dateTo,
    systemEditionId: systemEditionId,
    companyId: companyId,
    userId: userId || (context?.roleName === 'user' ? context?.userId : undefined),
  };

  const result = await auditLogService.getAuditLogs(filters);

  sendPaginatedResponse(
    res,
    result.auditLogs,
    { page, limit, total: result.total },
    'Audit logs retrieved successfully'
  );
});

// Export audit logs as CSV
export const exportAuditLogs = asyncHandler(async (req: RequestWithContext, res: Response) => {
  const search = req.query['search'] as string | undefined;
  const module = req.query['module'] as string | undefined;
  const dateFrom = req.query['dateFrom'] as string | undefined;
  const dateTo = req.query['dateTo'] as string | undefined;
  const userId = req.query['userId'] as string | undefined;

  const context = req?.resolvedContext;
  const systemEditionId = context?.systemEditionId;
  const companyId = context?.companyId;
  
  if (!systemEditionId) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  const filters: Omit<AuditLogFilters, 'page' | 'limit'> = {
    search,
    module,
    dateFrom,
    dateTo,
    systemEditionId: systemEditionId,
    companyId: companyId,
    userId: userId || (context?.roleName === 'user' ? context?.userId : undefined),
  };

  const auditLogs = await auditLogService.exportAuditLogs(filters);

  // Convert to CSV format
  const csvHeaders = [
    'ID',
    'Action',
    'Module',
    'Description',
    'User',
    'User Email',
    'IP Address',
    'User Agent',
    'Created At',
    'Metadata'
  ];

  const csvRows = auditLogs.map(log => [
    log.id,
    log.action,
    log.module,
    log.description,
    log.user ? `${log.user.firstName} ${log.user.lastName}` : 'N/A',
    log.user?.email || 'N/A',
    log.ipAddress || 'N/A',
    log.userAgent || 'N/A',
    new Date(log.createdAt).toISOString(),
    log.metadata ? JSON.stringify(log.metadata) : 'N/A'
  ]);

  const csvContent = [csvHeaders, ...csvRows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  // Set response headers for CSV download
  const timestamp = new Date().toISOString().split('T')[0];
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${timestamp}.csv"`);
  
  res.send(csvContent);
}); 
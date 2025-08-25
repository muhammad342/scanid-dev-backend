import { Op, WhereOptions } from 'sequelize';
import { AuditLog } from '../../../models/AuditLog/index.js';
import { User } from '../../../models/User/index.js';
import { logger } from '../../../shared/utils/logger.js';
import type { AuditLogFilters, AuditLogResponse, CreateAuditLogData } from '../types/index.js';

export class AuditLogService {
  // Get audit logs with filtering
  async getAuditLogs(filters: AuditLogFilters): Promise<AuditLogResponse> {
    const offset = ((filters.page || 1) - 1) * (filters.limit || 10);
    const whereClause: WhereOptions = {};

    // Apply filters
    if (filters.systemEditionId) {
      whereClause['systemEditionId'] = filters.systemEditionId;
    }

    if (filters.companyId) {
      whereClause['companyId'] = filters.companyId;
    }

    if (filters.userId) {
      whereClause['userId'] = filters.userId;
    }

    if (filters.search) {
      (whereClause as any)[Op.or] = [
        { action: { [Op.iLike]: `%${filters.search}%` } },
        { description: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    if (filters.module) {
      whereClause['module'] = filters.module;
    }

    if (filters.dateFrom && filters.dateTo) {
      whereClause['createdAt'] = {
        [Op.between]: [new Date(filters.dateFrom), new Date(filters.dateTo)],
      };
    }

    const { rows: auditLogs, count: total } = await AuditLog.findAndCountAll({
      where: whereClause,
      limit: filters.limit || 10,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    return {
      auditLogs: auditLogs.map(log => log.get({ plain: true })),
      total,
      totalPages: Math.ceil(total / (filters.limit || 10)),
    };
  }

  // Create a new audit log entry
  async createAuditLog(data: CreateAuditLogData): Promise<void> {
    try {
      await AuditLog.create(data);
    } catch (error) {
      logger.error('Failed to create audit log:', error);
      throw error;
    }
  }

  // Export audit logs (without pagination)
  async exportAuditLogs(filters: Omit<AuditLogFilters, 'page' | 'limit'>): Promise<any[]> {
    const whereClause: WhereOptions = {};

    // Apply filters
    if (filters.systemEditionId) {
      whereClause['systemEditionId'] = filters.systemEditionId;
    }

    if (filters.companyId) {
      whereClause['companyId'] = filters.companyId;
    }

    if (filters.userId) {
      whereClause['userId'] = filters.userId;
    }

    if (filters.search) {
      (whereClause as any)[Op.or] = [
        { action: { [Op.iLike]: `%${filters.search}%` } },
        { description: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    if (filters.module) {
      whereClause['module'] = filters.module;
    }

    if (filters.dateFrom && filters.dateTo) {
      whereClause['createdAt'] = {
        [Op.between]: [new Date(filters.dateFrom), new Date(filters.dateTo)],
      };
    }

    const auditLogs = await AuditLog.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    return auditLogs.map(log => log.get({ plain: true }));
  }
}

export const auditLogService = new AuditLogService(); 
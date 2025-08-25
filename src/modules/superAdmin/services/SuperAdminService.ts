import { Op } from 'sequelize';
import { User } from '../../../models/User/index.js';
import { Company } from '../../../models/Company/index.js';
import { SystemEdition } from '../../../models/SystemEdition/index.js';
import { AuditLog } from '../../../models/AuditLog/index.js';
import type { DashboardMetrics, DashboardQueryParams } from '../types/index.js';

export class SuperAdminService {
  /**
   * Get dashboard metrics for super admin overview
   */
  async getDashboardMetrics(_params?: DashboardQueryParams): Promise<{ dashboardMetrics: DashboardMetrics }> {
    try {
      // Get total users count
      const totalUsers = await User.count({
        where: { isActive: true }
      });

      // Get total users from previous month for comparison
      const previousMonthUsers = await User.count({
        where: {
          isActive: true,
          createdAt: {
            [Op.lt]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      });

      // Calculate user growth
      const userGrowth = totalUsers - previousMonthUsers;
      const userGrowthPercent = previousMonthUsers > 0 
        ? Math.round((userGrowth / previousMonthUsers) * 100)
        : 0;

      // Get active editions count
      const activeEditions = await SystemEdition.count({
        where: { archived: false }
      });

      // Get new editions this month
      const newEditionsThisMonth = await SystemEdition.count({
        where: {
          archived: false,
          createdAt: {
            [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      });

      // Get safety IDs count (placeholder - replace with actual safety IDs table)
      const safetyIdsCreated = 0; // This should come from actual safety IDs table
      const safetyIdsGrowth = 0; // Placeholder growth percentage

      // Get monthly revenue (placeholder - replace with actual payments table)
      const monthlyRevenue = 0.00; // This should come from actual payments table
      const revenueGrowth = 0; // Placeholder growth percentage

      return {
        dashboardMetrics: {
          totalUsers: {
            value: totalUsers,
            changeIndicator: `${userGrowthPercent >= 0 ? '+' : ''}${userGrowthPercent}% this month`,
            changeType: userGrowthPercent > 0 ? 'increase' : userGrowthPercent < 0 ? 'decrease' : 'neutral',
            changeValue: Math.abs(userGrowthPercent),
            changePeriod: 'month'
          },
          activeEditions: {
            value: activeEditions,
            changeIndicator: `${newEditionsThisMonth} new this month`,
            changeType: newEditionsThisMonth > 0 ? 'new' : 'neutral',
            changeValue: newEditionsThisMonth,
            changePeriod: 'month'
          },
          safetyIdsCreated: {
            value: safetyIdsCreated,
            changeIndicator: `+${safetyIdsGrowth}% this month`,
            changeType: 'increase',
            changeValue: safetyIdsGrowth,
            changePeriod: 'month'
          },
          monthlyRevenue: {
            value: monthlyRevenue,
            currency: 'USD',
            changeIndicator: `+${revenueGrowth}% this month`,
            changeType: 'increase',
            changeValue: revenueGrowth,
            changePeriod: 'month'
          }
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to fetch dashboard metrics: ${errorMessage}`);
    }
  }

  /**
   * Get platform statistics for super admin
   */
  async getPlatformStats(): Promise<any> {
    try {
      const totalCompanies = await Company.count({
        where: { status: 'active' }
      });

      const totalSystemEditions = await SystemEdition.count({
        where: { archived: false }
      });

      const activeUsersThisMonth = await User.count({
        where: {
          isActive: true,
          lastLoginAt: {
            [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      });

      const inactiveUsers = await User.count({
        where: { isActive: false }
      });

      // Placeholder for pending approvals
      const pendingApprovals = 23;

      // Determine system health based on various metrics
      let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
      
      if (inactiveUsers > totalCompanies * 10) {
        systemHealth = 'warning';
      }
      
      if (inactiveUsers > totalCompanies * 20) {
        systemHealth = 'critical';
      }

      return {
        totalCompanies,
        totalSystemEditions,
        activeUsersThisMonth,
        inactiveUsers,
        pendingApprovals,
        systemHealth
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to fetch platform stats: ${errorMessage}`);
    }
  }

  /**
   * Get recent activity for dashboard
   */
  async getRecentActivity(limit: number = 5): Promise<any[]> {
    try {
      // Get recent audit logs for activity
      const recentLogs = await AuditLog.findAll({
        order: [['createdAt', 'DESC']],
        limit,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ]
      });

      return recentLogs.map(log => ({
        id: log.id,
        type: log.action,
        description: log.description,
        timestamp: log.createdAt,
        severity: 'info' // You can map this based on action type
      }));
    } catch (error) {
      // If audit logs fail, return empty array
      return [];
    }
  }
}

export const superAdminService = new SuperAdminService();

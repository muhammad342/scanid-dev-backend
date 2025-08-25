import type { Response } from 'express';
import type { RequestWithContext } from '../../../shared/middleware/contextResolver.js';
import { superAdminService } from '../services/SuperAdminService.js';
import { asyncHandler } from '../../../shared/middleware/errorHandler.js';
import { 
  sendSuccess, 
  sendBadRequest
} from '../../../shared/utils/response.js';

export class SuperAdminController {
  // Get dashboard metrics for super admin overview
  static getDashboardMetrics = asyncHandler(async (req: RequestWithContext, res: Response) => {
    if (!req.user) {
      sendBadRequest(res, 'User not authenticated');
      return;
    }

    try {
      // Get dashboard metrics
      const dashboardMetrics = await superAdminService.getDashboardMetrics();
      
      // Get platform stats
      const platformStats = await superAdminService.getPlatformStats();
      
      // Get recent activity
      const recentActivity = await superAdminService.getRecentActivity(5);
      
      const response = {
        success: true,
        data: {
          dashboardMetrics: dashboardMetrics.dashboardMetrics,
          platformStats,
          recentActivity
        },
        timestamp: new Date().toISOString(),
        cacheExpiry: 300 // 5 minutes cache
      };

      sendSuccess(res, response.data, 'Dashboard metrics retrieved successfully');
    } catch (error) {
      if (error instanceof Error) {
        sendBadRequest(res, error.message);
      } else {
        throw error;
      }
    }
  });
}

export default SuperAdminController;

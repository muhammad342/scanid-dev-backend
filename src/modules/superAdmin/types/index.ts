export interface DashboardMetrics {
  totalUsers: MetricData;
  activeEditions: MetricData;
  safetyIdsCreated: MetricData;
  monthlyRevenue: RevenueMetricData;
}

export interface MetricData {
  value: number;
  changeIndicator: string;
  changeType: 'increase' | 'decrease' | 'neutral' | 'new';
  changeValue: number;
  changePeriod: 'month' | 'week' | 'day';
}

export interface RevenueMetricData extends MetricData {
  currency: string;
}

export interface DashboardResponse {
  success: boolean;
  data: {
    dashboardMetrics: DashboardMetrics;
    platformStats?: {
      totalCompanies: number;
      totalSystemEditions: number;
      activeUsersThisMonth: number;
      inactiveUsers: number;
      pendingApprovals: number;
      systemHealth: 'healthy' | 'warning' | 'critical';
    };
    recentActivity?: Array<{
      id: string;
      type: string;
      description: string;
      timestamp: string;
      severity: 'info' | 'warning' | 'error';
    }>;
  };
  timestamp: string;
  cacheExpiry?: number;
}

export interface DashboardQueryParams {
  systemEditionId?: string;
  companyId?: string;
  dateFrom?: string;
  dateTo?: string;
}

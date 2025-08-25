import { SystemEdition } from '../index.js';
import { SeatManagement } from '../../SeatManagement/index.js';
import { logger } from '../../../shared/utils/logger.js';

export class SystemEditionTrigger {
  /**
   * Trigger fired after creation (after INSERT) - Main onCreate trigger
   */
  static async onCreate(systemEdition: SystemEdition): Promise<void> {
    const systemEditionData = systemEdition.get({ plain: true });
    try {
      logger.info(`SystemEdition onCreate triggered for system edition: ${systemEditionData.id}`);

      // Create default seat management for the system edition
      await SeatManagement.create({
        systemEditionId: systemEditionData.id,
        allowOrganizationalSeats: true,
        seatCostMonthly: 0,
        seatCostAnnual: 0,
        allowIndividualLicenses: true,
        individualParentCostMonthly: 0,
        individualParentCostAnnual: 0,
        individualParentCostLifetime: 0,
        individualChildCostMonthly: 0,
        individualChildCostAnnual: 0,
        individualChildCostLifetime: 0,
        subscriptionSplitPercentage: 0,
      });

      logger.info('✅ SystemEdition onCreate trigger completed successfully', { 
        id: systemEditionData.id 
      });
      
    } catch (error) {
      logger.error('❌ Error in SystemEdition onCreate trigger', { 
        id: systemEditionData.id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
} 
import { Op, WhereOptions } from 'sequelize';
import { CustomField } from '../../../models/CustomField/index.js';
import { SystemEdition } from '../../../models/SystemEdition/index.js';
import { User } from '../../../models/User/index.js';
import { logger } from '../../../shared/utils/logger.js';
import { CustomFieldFilters, CreateCustomFieldData, UpdateCustomFieldData, CustomFieldResponse } from '../types/index.js';

export class CustomFieldService {
  // Get all custom fields with filtering
  async getAllCustomFields(filters: CustomFieldFilters): Promise<CustomFieldResponse> {
    const offset = ((filters.page || 1) - 1) * (filters.limit || 10);
    const whereClause: WhereOptions = {};

    // Apply context filters
    if (filters.systemEditionId) {
      whereClause['systemEditionId'] = filters.systemEditionId;
    }

    if (filters.companyId) {
      whereClause['companyId'] = filters.companyId;
    }

    // Apply search filter
    if (filters.search) {
      whereClause['fieldName'] = {
        [Op.iLike]: `%${filters.search}%`,
      };
    }

    if (filters.fieldType) {
      whereClause['fieldType'] = filters.fieldType;
    }

    if (filters.isActive !== undefined) {
      whereClause['isActive'] = filters.isActive;
    }

    const { rows: customFields, count: total } = await CustomField.findAndCountAll({
      where: whereClause,
      limit: filters.limit || 10,
      offset,
      order: [['fieldOrder', 'ASC'], ['createdAt', 'DESC']],
      include: [
        {
          model: SystemEdition,
          as: 'systemEdition',
          attributes: ['id', 'name'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false,
        },
      ],
    });

    return {
      customFields: customFields.map(field => field.get({ plain: true })),
      total,
      totalPages: Math.ceil(total / (filters.limit || 10)),
    };
  }

  // Get custom field by ID with context validation
  async getCustomFieldById(id: string, systemEditionId: string, companyId?: string) {
    const whereClause: WhereOptions = {
      id,
      systemEditionId,
    };

    if (companyId) {
      whereClause['companyId'] = companyId;
    }

    const customField = await CustomField.findOne({
      where: whereClause,
      include: [
        {
          model: SystemEdition,
          as: 'systemEdition',
          attributes: ['id', 'name'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false,
        },
      ],
    });

    if (!customField) {
      throw new Error('Custom field not found');
    }

    return customField.get({ plain: true });
  }

  // Create new custom field
  async createCustomField(data: CreateCustomFieldData) {
    try {
      // Validate system edition exists
      const systemEdition = await SystemEdition.findByPk(data.systemEditionId);
      if (!systemEdition) {
        throw new Error('System edition not found');
      }

      // If no fieldOrder provided, set it to the next available order
      if (data.fieldOrder === undefined) {
        const maxOrder = await CustomField.max('fieldOrder', {
          where: { systemEditionId: data.systemEditionId },
        }) as number;
        data.fieldOrder = (maxOrder || 0) + 1;
      }

      // Validate dropdown options if field type is Dropdown
      if (data.fieldType === 'Dropdown') {
        if (!data.dropdownOptions || !Array.isArray(data.dropdownOptions) || data.dropdownOptions.length === 0) {
          throw new Error('Dropdown field type must have at least one option');
        }
      }

      // Reset useDecimals if field type is not Number
      if (data.fieldType !== 'Number') {
        data.useDecimals = false;
      }

      const customField = await CustomField.create(data);
      const plainCustomField = customField.get({ plain: true });
      return this.getCustomFieldById(plainCustomField.id, data.systemEditionId, data.companyId);
    } catch (error) {
      logger.error('Failed to create custom field:', error);
      throw error;
    }
  }

  // Update custom field with context validation
  async updateCustomField(id: string, data: UpdateCustomFieldData, systemEditionId: string, companyId?: string) {
    const whereClause: WhereOptions = {
      id,
      systemEditionId,
    };

    if (companyId) {
      whereClause['companyId'] = companyId;
    }

    const customField = await CustomField.findOne({ where: whereClause });
    if (!customField) {
      throw new Error('Custom field not found');
    }

    // Validate dropdown options if field type is being changed to Dropdown
    if (data.fieldType === 'Dropdown') {
      if (!data.dropdownOptions || !Array.isArray(data.dropdownOptions) || data.dropdownOptions.length === 0) {
        throw new Error('Dropdown field type must have at least one option');
      }
    }

    // Reset useDecimals if field type is being changed to non-Number
    if (data.fieldType && data.fieldType !== 'Number') {
      data.useDecimals = false;
    }

    await customField.update(data);
    return this.getCustomFieldById(id, systemEditionId, companyId);
  }

  // Delete custom field with context validation
  async deleteCustomField(id: string, systemEditionId: string, companyId?: string) {
    const whereClause: WhereOptions = {
      id,
      systemEditionId,
    };

    if (companyId) {
      whereClause['companyId'] = companyId;
    }

    const deletedCount = await CustomField.destroy({ where: whereClause });
    
    if (deletedCount === 0) {
      throw new Error('Custom field not found');
    }

    return { message: 'Custom field deleted successfully' };
  }

  // Update custom field order with context validation
  async updateCustomFieldOrder(systemEditionId: string, fieldOrders: { id: string; fieldOrder: number }[], companyId?: string) {
    // Validate system edition exists
    const systemEdition = await SystemEdition.findByPk(systemEditionId);
    if (!systemEdition) {
      throw new Error('System edition not found');
    }

    // Update each custom field's order
    for (const { id, fieldOrder } of fieldOrders) {
      const whereClause: WhereOptions = {
        id,
        systemEditionId,
      };

      if (companyId) {
        whereClause['companyId'] = companyId;
      }

      const updatedCount = await CustomField.update(
        { fieldOrder },
        { where: whereClause }
      );

      if (updatedCount[0] === 0) {
        throw new Error(`Custom field with ID ${id} not found`);
      }
    }

    return { message: 'Custom field order updated successfully' };
  }

  // Get custom field statistics with context validation
  async getCustomFieldStats(systemEditionId: string, companyId?: string) {
    const whereClause: WhereOptions = { systemEditionId };

    if (companyId) {
      whereClause['companyId'] = companyId;
    }

    const stats = await CustomField.findAll({
      where: whereClause,
      attributes: [
        'fieldType',
        [CustomField.sequelize!.fn('COUNT', CustomField.sequelize!.col('id')), 'count'],
      ],
      group: ['fieldType'],
      raw: true,
    });

    const totalFields = await CustomField.count({
      where: { ...whereClause, isActive: true },
    });

    const mandatoryFields = await CustomField.count({
      where: { ...whereClause, isActive: true, isMandatory: true },
    });

    return {
      totalFields,
      mandatoryFields,
      fieldTypeBreakdown: stats,
    };
  }

  // Verify system edition exists
  async verifySystemEditionExists(systemEditionId: string) {
    return await SystemEdition.findByPk(systemEditionId);
  }
}

export const customFieldService = new CustomFieldService(); 
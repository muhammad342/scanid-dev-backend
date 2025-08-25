import { Op, WhereOptions } from 'sequelize';
import { Tag } from '../../../models/Tag/index.js';
import { SystemEdition } from '../../../models/SystemEdition/index.js';
import type { TagFilters, CreateTagData, UpdateTagData, TagOrderUpdate } from '../types/index.js';

export class TagService {
  // Get all tags with filtering
  async getAllTags(filters: TagFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;
    const whereClause: WhereOptions = {};

    // Apply context filters
    if (filters.systemEditionId) {
      whereClause['systemEditionId'] = filters.systemEditionId;
    }

    if (filters.companyId) {
      whereClause['companyId'] = filters.companyId;
    }

    if (filters.search) {
      whereClause['name'] = {
        [Op.iLike]: `%${filters.search}%`,
      };
    }

    if (filters.type) {
      whereClause['type'] = filters.type;
    }

    if (filters.isActive !== undefined) {
      whereClause['isActive'] = filters.isActive;
    }

    const { rows: tags, count: total } = await Tag.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
      include: [
        {
          model: SystemEdition,
          as: 'systemEdition',
          attributes: ['id', 'name'],
        },
      ],
    });

    return {
      tags,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get tags by system edition ID
  async getTagsBySystemEdition(systemEditionId: string, type?: 'document' | 'note' | 'certificate') {
    const whereClause: WhereOptions = { systemEditionId };

    if (type) {
      whereClause['type'] = type;
    }

    const tags = await Tag.findAll({
      where: whereClause,
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
    });

    return tags;
  }

  // Get document tags for a system edition
  async getDocumentTags(systemEditionId: string) {
    return this.getTagsBySystemEdition(systemEditionId, 'document');
  }

  // Get note tags for a system edition
  async getNoteTags(systemEditionId: string) {
    return this.getTagsBySystemEdition(systemEditionId, 'note');
  }

  // Get certificate tags for a system edition
  async getCertificateTags(systemEditionId: string) {
    return this.getTagsBySystemEdition(systemEditionId, 'certificate');
  }

  // Create tag
  async createTag(tagData: CreateTagData) {
    const tag = await Tag.create(tagData);
    return tag;
  }

  // Get tag by ID
  async getTagById(id: string) {
    const tag = await Tag.findByPk(id, {
      include: [
        {
          model: SystemEdition,
          as: 'systemEdition',
          attributes: ['id', 'name'],
        },
      ],
    });

    return tag;
  }

  // Update tag
  async updateTag(id: string, updateData: UpdateTagData) {
    const tag = await Tag.findByPk(id);

    if (!tag) {
      return null;
    }

    const updatedTag = await tag.update(updateData);
    return updatedTag;
  }

  // Delete tag
  async deleteTag(id: string) {
    const tag = await Tag.findByPk(id);

    if (!tag) {
      return false;
    }

    await tag.destroy();
    return true;
  }

  // Bulk update tag order
  async updateTagOrder(tagUpdates: TagOrderUpdate[]) {
    const transaction = await Tag.sequelize!.transaction();

    try {
      await Promise.all(
        tagUpdates.map(({ id, sortOrder }) =>
          Tag.update({ sortOrder }, { where: { id }, transaction })
        )
      );

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Merge tags (for data migration/cleanup)
  async mergeTags(sourceTagIds: string[], targetTagId?: string, newTagName?: string) {
    const transaction = await Tag.sequelize!.transaction();

    try {
      // Get source tags
      const sourceTags = await Tag.findAll({
        where: { id: sourceTagIds },
        transaction,
      });

      if (sourceTags.length === 0) {
        throw new Error('No source tags found');
      }

      const sourceTagsData = sourceTags.map(tag => tag.get({ plain: true }));

      // Validate that all source tags are of the same type and belong to the same system edition
      const firstTag = sourceTagsData[0];
      if (!firstTag) {
        throw new Error('No source tag found for validation');
      }
      const sameType = sourceTagsData.every(tag => tag.type === firstTag.type);
      const sameSystemEdition = sourceTagsData.every(tag => tag.systemEditionId === firstTag.systemEditionId);
      
      if (!sameType) {
        throw new Error('All source tags must be of the same type (document, note, or certificate)');
      }
      
      if (!sameSystemEdition) {
        throw new Error('All source tags must belong to the same system edition');
      }

      let targetTag;

      if (targetTagId) {
        // Merge into existing tag
        targetTag = await Tag.findByPk(targetTagId, { transaction });
        if (!targetTag) {
          throw new Error('Target tag not found');
        }
      } else if (newTagName) {
        // Create new tag for merging
        const firstSourceTag = sourceTagsData[0];
        if (!firstSourceTag) {
          throw new Error('No source tag found for merging');
        }
        
        // Create new tag
        const createData: any = {
          systemEditionId: firstSourceTag.systemEditionId,
          name: newTagName,
          type: firstSourceTag.type,
          isActive: true,
          sortOrder: firstSourceTag.sortOrder,
        };
        
        if (firstSourceTag.color) {
          createData.color = firstSourceTag.color;
        }
        
        targetTag = await Tag.create(createData, { transaction });
      } else {
        throw new Error('Either targetTagId or newTagName must be provided');
      }

      // Delete source tags
      await Tag.destroy({
        where: { id: sourceTagIds },
        transaction,
      });

      await transaction.commit();

      return {
        success: true,
        message: 'Tags merged successfully',
        mergedTagId: targetTag.id,
      };
    } catch (error) {
      console.log('[Tag Service][mergeTags] Error merging tags:', error);
      await transaction.rollback();
      throw error;
    }
  }
}

export const tagService = new TagService(); 
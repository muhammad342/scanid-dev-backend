import { Op, WhereOptions } from 'sequelize';
import { Role } from '../../../models/Role/index.js';
import { logger } from '../../../shared/utils/logger.js';
import { RoleFilters, CreateRoleData, UpdateRoleData, RoleResponse } from '../types/index.js';

export class RoleService {
  // Get all roles with filtering
  async getAllRoles(filters: RoleFilters): Promise<RoleResponse> {
    const offset = ((filters.page || 1) - 1) * (filters.limit || 10);
    const whereClause: WhereOptions = {};

    // Apply search filter
    if (filters.search) {
      whereClause['name'] = {
        [Op.iLike]: `%${filters.search}%`,
      };
    }

    // Apply name filter
    if (filters.name) {
      whereClause['name'] = filters.name;
    }

    // Apply access scope filter
    if (filters.accessScope) {
      whereClause['accessScope'] = filters.accessScope;
    }

    // Apply active status filter
    if (filters.isActive !== undefined) {
      whereClause['isActive'] = filters.isActive;
    }

    const { rows: roles, count: total } = await Role.findAndCountAll({
      where: whereClause,
      limit: filters.limit || 10,
      offset,
      order: [['name', 'ASC'], ['createdAt', 'DESC']],
    });

    return {
      roles: roles.map(role => role.get({ plain: true })),
      total,
      totalPages: Math.ceil(total / (filters.limit || 10)),
    };
  }

  // Get role by ID
  async getRoleById(id: string): Promise<any> {
    const role = await Role.findByPk(id);

    if (!role) {
      throw new Error('Role not found');
    }

    return role.get({ plain: true });
  }

  // Create new role
  async createRole(data: CreateRoleData): Promise<any> {
    try {
      const roleData: any = {
        name: data.name,
        accessScope: data.accessScope,
        isActive: data.isActive !== undefined ? data.isActive : true,
      };

      if (data.description !== undefined) {
        roleData.description = data.description;
      }

      const role = await Role.create(roleData);

      logger.info(`Role created: ${role.name}`, { roleId: role.id, accessScope: role.accessScope });

      return role.get({ plain: true });
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new Error(`Role with name '${data.name}' already exists`);
      }
      throw error;
    }
  }

  // Update role
  async updateRole(id: string, data: UpdateRoleData): Promise<any> {
    const role = await Role.findByPk(id);

    if (!role) {
      throw new Error('Role not found');
    }

    // Check if trying to update a predefined role name
    if (data.name && data.name !== role.name) {
      const isPredefined = ['super_admin', 'edition_admin', 'company_admin', 'channel_admin', 'user', 'delegate'].includes(role.name);
      if (isPredefined) {
        throw new Error(`Cannot rename predefined role '${role.name}'`);
      }
    }

    try {
      await role.update(data);
      
      logger.info(`Role updated: ${role.name}`, { roleId: role.id, updatedFields: Object.keys(data) });

      return role.get({ plain: true });
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new Error(`Role with name '${data.name}' already exists`);
      }
      throw error;
    }
  }

  // Delete role
  async deleteRole(id: string) {
    const role = await Role.findByPk(id);

    if (!role) {
      throw new Error('Role not found');
    }

    // Check if trying to delete a predefined role
    const isPredefined = ['super_admin', 'edition_admin', 'company_admin', 'channel_admin', 'user', 'delegate'].includes(role.name);
    if (isPredefined) {
      throw new Error(`Cannot delete predefined role '${role.name}'`);
    }

    // Check if role is being used by any users
    const userCount = await (role as any).$count('userRoles');
    if (userCount > 0) {
      throw new Error(`Cannot delete role '${role.name}' as it is assigned to ${userCount} user(s)`);
    }

    await role.destroy();
    
    logger.info(`Role deleted: ${role.name}`, { roleId: role.id });

    return { message: 'Role deleted successfully' };
  }

  // Get role statistics
  async getRoleStats() {
    const totalRoles = await Role.count();
    const activeRoles = await Role.count({ where: { isActive: true } });
    const inactiveRoles = await Role.count({ where: { isActive: false } });

    const scopeStats = await Role.findAll({
      attributes: [
        'accessScope',
        [(Role.sequelize as any).fn('COUNT', (Role.sequelize as any).col('id')), 'count']
      ],
      group: ['accessScope'],
      raw: true,
    });

    return {
      total: totalRoles,
      active: activeRoles,
      inactive: inactiveRoles,
      byScope: scopeStats,
    };
  }

  // Check if role exists
  async roleExists(name: string): Promise<boolean> {
    const count = await Role.count({ where: { name } });
    return count > 0;
  }

  // Get roles by access scope
  async getRolesByScope(accessScope: 'GLOBAL' | 'EDITION' | 'COMPANY' | 'SELF'): Promise<any[]> {
    const roles = await Role.findAll({
      where: { accessScope, isActive: true },
      order: [['name', 'ASC']],
    });

    return roles.map(role => role.get({ plain: true }));
  }
}

export const roleService = new RoleService();

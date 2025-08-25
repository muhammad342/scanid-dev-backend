import { Op, WhereOptions } from 'sequelize';
import { DelegateAccess, User } from '../../../models/index.js';

export interface PaginationFilters {
  page: number;
  limit: number;
  search?: string;
}

export interface InviteDelegateData {
  email: string;
  firstName: string;
  lastName: string;
  systemEditionId: string;
  permissions?: string[];
  expirationDate?: Date;
}

export class DelegateAccessService {
  // Get all delegate access records with filtering
  async getAllDelegateAccess(filters: PaginationFilters) {
    const offset = (filters.page - 1) * filters.limit;
    const whereClause: WhereOptions = {};

    // If searching, we need to filter by related user fields
    let include = [
      {
        model: User,
        as: 'delegate',
        attributes: ['id', 'firstName', 'lastName', 'email', 'lastLoginAt'],
      },
      {
        model: User,
        as: 'delegator',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
    ];

    if (filters.search) {
      // Add search filter to include clause
      include[0] = {
        ...include[0],
        where: {
          [Op.or]: [
            { firstName: { [Op.iLike]: `%${filters.search}%` } },
            { lastName: { [Op.iLike]: `%${filters.search}%` } },
            { email: { [Op.iLike]: `%${filters.search}%` } },
          ],
        },
      } as any;
    }

    const { rows: delegateAccess, count: total } = await DelegateAccess.findAndCountAll({
      where: whereClause,
      limit: filters.limit,
      offset,
      order: [['createdAt', 'DESC']],
      include,
    });

    return {
      delegateAccess,
      total,
      totalPages: Math.ceil(total / filters.limit),
    };
  }
  // Get delegate access by ID
  async getDelegateAccessById(id: string) {
    const delegateAccess = await DelegateAccess.findByPk(id, {
      include: [
        {
          model: User,
          as: 'delegate',
          attributes: ['id', 'firstName', 'lastName', 'email', 'lastLoginAt'],
        },
        {
          model: User,
          as: 'delegator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    return delegateAccess;
  }

  // Update delegate access
  async updateDelegateAccess(id: string, updateData: any) {
    const delegateAccess = await DelegateAccess.findByPk(id);

    if (!delegateAccess) {
      return null;
    }

    const updatedDelegateAccess = await delegateAccess.update(updateData);
    return updatedDelegateAccess;
  }

  // Delete delegate access (soft delete)
  async deleteDelegateAccess(id: string) {
    const delegateAccess = await DelegateAccess.findByPk(id);

    if (!delegateAccess) {
      return false;
    }

    await delegateAccess.destroy();
    return true;
  }

  // Invite delegate admin
  async inviteDelegateAdmin(inviteData: InviteDelegateData) {
    // This is a placeholder implementation
    // In a real application, you would:
    // 1. Check if user already exists
    // 2. Create user if they don't exist
    // 3. Send invitation email
    // 4. Create delegate access record

    // Check if user exists
    let user = await User.findOne({ where: { email: inviteData.email } });

    if (!user) {
      // Create new user
      user = await User.create({
        email: inviteData.email,
        firstName: inviteData.firstName,
        lastName: inviteData.lastName,
        role: 'delegate',
        systemEditionId: inviteData.systemEditionId,
        password: 'temp-password', // TODO: Generate secure password
        isActive: true,
        emailVerified: false,
        // Add other required fields with defaults
      });
    }

    // Create delegate access record
    const delegateAccess = await DelegateAccess.create({
      systemEditionId: inviteData.systemEditionId,
      delegateId: user.id,
      // TODO: Set delegatorId from current user context
      delegatorId: 'temp-user-id',
      permissions: inviteData.permissions || [],
      ...(inviteData.expirationDate && { expirationDate: inviteData.expirationDate }),
      isActive: true,
    });

    // TODO: Send invitation email

    return {
      user,
      delegateAccess,
      message: 'Delegate invitation sent successfully',
    };
  }
}

export const delegateAccessService = new DelegateAccessService(); 
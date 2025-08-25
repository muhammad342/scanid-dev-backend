import User from './User/index.js';
import { SystemEdition } from './SystemEdition/index.js';
import { Company } from './Company/index.js';
import { SeatManagement } from './SeatManagement/index.js';
import { Tag } from './Tag/index.js'; // New unified Tag model
import { CustomField } from './CustomField/index.js';
import { DelegateAccess } from './DelegateAccess/index.js';
import { AuditLog } from './AuditLog/index.js';
import { Role } from './Role/index.js';
import { Channel } from './Channel/index.js';
import { UserRole } from './UserRole/index.js';

// Define associations here
// SystemEdition associations
SystemEdition.hasMany(Company, { 
  foreignKey: 'systemEditionId', 
  as: 'companies' 
});

SystemEdition.hasOne(SeatManagement, { 
  foreignKey: 'systemEditionId', 
  as: 'seatManagement' 
});

SystemEdition.hasMany(Tag, { 
  foreignKey: 'systemEditionId', 
  as: 'tags' 
});

SystemEdition.hasMany(CustomField, { 
  foreignKey: 'systemEditionId', 
  as: 'customFields' 
});

SystemEdition.hasMany(DelegateAccess, { 
  foreignKey: 'systemEditionId', 
  as: 'delegateAccess' 
});

SystemEdition.hasMany(AuditLog, { 
  foreignKey: 'systemEditionId', 
  as: 'auditLogs' 
});

SystemEdition.hasMany(User, { 
  foreignKey: 'systemEditionId', 
  as: 'users' 
});

// Association to get the user who created the system edition
SystemEdition.belongsTo(User, { 
  foreignKey: 'createdBy', 
  as: 'createdByUser' 
});

// Association to get the user who last updated the system edition
SystemEdition.belongsTo(User, { 
  foreignKey: 'lastUpdatedBy', 
  as: 'lastUpdatedByUser' 
});

// Company associations
Company.belongsTo(SystemEdition, { 
  foreignKey: 'systemEditionId', 
  as: 'systemEdition' 
});

Company.belongsTo(User, { 
  foreignKey: 'companyAdminId', 
  as: 'companyAdmin' 
});

Company.hasMany(User, { 
  foreignKey: 'companyId', 
  as: 'users' 
});



Company.hasMany(DelegateAccess, { 
  foreignKey: 'companyId', 
  as: 'delegateAccess' 
});

Company.hasMany(AuditLog, { 
  foreignKey: 'companyId', 
  as: 'auditLogs' 
});

// User associations for active role
User.belongsTo(UserRole, {
  foreignKey: 'activeUserRoleId',
  as: 'activeUserRole'
});

User.hasMany(Company, { 
  foreignKey: 'companyAdminId', 
  as: 'managedCompanies' 
});

User.hasMany(SystemEdition, { 
  foreignKey: 'createdBy', 
  as: 'createdEditions' 
});

User.hasMany(AuditLog, { 
  foreignKey: 'userId', 
  as: 'auditLogs' 
});

User.hasMany(DelegateAccess, { 
  foreignKey: 'delegatorId', 
  as: 'delegatedUsers' 
});

// User self-referential association for created_by
User.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'createdByUser'
});

User.hasMany(User, {
  foreignKey: 'createdBy',
  as: 'createdUsers'
});

User.hasMany(DelegateAccess, { 
  foreignKey: 'delegateId', 
  as: 'delegateAccess' 
});

// SeatManagement associations
SeatManagement.belongsTo(SystemEdition, { 
  foreignKey: 'systemEditionId', 
  as: 'systemEdition' 
});

// Tag associations
Tag.belongsTo(SystemEdition, { 
  foreignKey: 'systemEditionId', 
  as: 'systemEdition' 
});

// CustomField associations
CustomField.belongsTo(SystemEdition, { 
  foreignKey: 'systemEditionId', 
  as: 'systemEdition' 
});

CustomField.belongsTo(User, { 
  foreignKey: 'createdBy', 
  as: 'creator' 
});

User.hasMany(CustomField, { 
  foreignKey: 'createdBy', 
  as: 'createdCustomFields' 
});

// DelegateAccess associations
DelegateAccess.belongsTo(SystemEdition, { 
  foreignKey: 'systemEditionId', 
  as: 'systemEdition' 
});

DelegateAccess.belongsTo(Company, { 
  foreignKey: 'companyId', 
  as: 'company' 
});

DelegateAccess.belongsTo(User, { 
  foreignKey: 'delegatorId', 
  as: 'delegator' 
});

DelegateAccess.belongsTo(User, { 
  foreignKey: 'delegateId', 
  as: 'delegate' 
});

// AuditLog associations
AuditLog.belongsTo(SystemEdition, { 
  foreignKey: 'systemEditionId', 
  as: 'systemEdition' 
});

AuditLog.belongsTo(Company, { 
  foreignKey: 'companyId', 
  as: 'company' 
});

AuditLog.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user' 
});

// Role associations
Role.hasMany(UserRole, {
  foreignKey: 'roleId',
  as: 'userRoles'
});

// Channel associations
Channel.belongsTo(SystemEdition, {
  foreignKey: 'systemEditionId',
  as: 'systemEdition'
});

Channel.belongsTo(User, {
  foreignKey: 'channelAdminId',
  as: 'channelAdmin'
});

Channel.hasMany(UserRole, {
  foreignKey: 'channelId',
  as: 'userRoles'
});

SystemEdition.hasMany(Channel, {
  foreignKey: 'systemEditionId',
  as: 'channels'
});

User.hasMany(Channel, {
  foreignKey: 'channelAdminId',
  as: 'managedChannels'
});

// UserRole associations
UserRole.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

UserRole.belongsTo(Role, {
  foreignKey: 'roleId',
  as: 'role'
});

UserRole.belongsTo(SystemEdition, {
  foreignKey: 'systemEditionId',
  as: 'systemEdition'
});

UserRole.belongsTo(Company, {
  foreignKey: 'companyId',
  as: 'company'
});

UserRole.belongsTo(Channel, {
  foreignKey: 'channelId',
  as: 'channel'
});

UserRole.belongsTo(User, {
  foreignKey: 'grantedBy',
  as: 'grantor'
});

UserRole.belongsTo(User, {
  foreignKey: 'revokedBy',
  as: 'revoker'
});

// User associations for roles
User.hasMany(UserRole, {
  foreignKey: 'userId',
  as: 'userRoles'
});

User.belongsToMany(Role, {
  through: UserRole,
  foreignKey: 'userId',
  otherKey: 'roleId',
  as: 'roles'
});

// Company associations for roles
Company.hasMany(UserRole, {
  foreignKey: 'companyId',
  as: 'userRoles'
});

// SystemEdition associations for roles
SystemEdition.hasMany(UserRole, {
  foreignKey: 'systemEditionId',
  as: 'userRoles'
});

export { 
  User, 
  SystemEdition, 
  Company, 
  SeatManagement, 
  Tag, // New unified Tag model
  CustomField,
  DelegateAccess, 
  AuditLog,
  Role,
  Channel,
  UserRole
};

export default {
  User,
  SystemEdition,
  Company,
  SeatManagement,
  Tag, // New unified Tag model
  CustomField,
  DelegateAccess,
  AuditLog,
  Role,
  Channel,
  UserRole,
}; 
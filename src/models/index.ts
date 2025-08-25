import User from './User/index.js';
import { SystemEdition } from './SystemEdition/index.js';
import { Company } from './Company/index.js';
import { SeatManagement } from './SeatManagement/index.js';
import { Tag } from './Tag/index.js'; // New unified Tag model
import { CustomField } from './CustomField/index.js';
import { DelegateAccess } from './DelegateAccess/index.js';
import { AuditLog } from './AuditLog/index.js';

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

// User associations
User.belongsTo(Company, { 
  foreignKey: 'companyId', 
  as: 'company' 
});

User.belongsTo(SystemEdition, { 
  foreignKey: 'systemEditionId', 
  as: 'systemEdition' 
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

export { 
  User, 
  SystemEdition, 
  Company, 
  SeatManagement, 
  Tag, // New unified Tag model
  CustomField,
  DelegateAccess, 
  AuditLog 
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
}; 
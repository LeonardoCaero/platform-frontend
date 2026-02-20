/**
 * Permission Builder Constants
 * Used in the UI to create permissions with RESOURCE:ACTION format
 */

export interface PermissionOption {
  value: string;
  label: string;
  description: string;
}

export const STANDARD_RESOURCES: PermissionOption[] = [
  { 
    value: 'PLATFORM', 
    label: 'Platform', 
    description: 'Platform-wide permissions' 
  },
  { 
    value: 'COMPANY', 
    label: 'Company', 
    description: 'Company management permissions' 
  },
  { 
    value: 'MEMBER', 
    label: 'Member', 
    description: 'Member management permissions' 
  },
  { 
    value: 'ROLE', 
    label: 'Role', 
    description: 'Role management permissions' 
  },
  { 
    value: 'INVOICE', 
    label: 'Invoice', 
    description: 'Invoice management permissions' 
  },
  { 
    value: 'REPORT', 
    label: 'Report', 
    description: 'Report management permissions' 
  },
  { 
    value: 'TIME', 
    label: 'Time', 
    description: 'Time tracking permissions' 
  },
  { 
    value: 'CUSTOM', 
    label: '+ Custom Resource', 
    description: 'Create your own resource type' 
  },
];

export const STANDARD_ACTIONS: PermissionOption[] = [
  { 
    value: 'CREATE', 
    label: 'Create', 
    description: 'Create new resources' 
  },
  { 
    value: 'EDIT', 
    label: 'Edit', 
    description: 'Modify existing resources' 
  },
  { 
    value: 'DELETE', 
    label: 'Delete', 
    description: 'Remove resources' 
  },
  { 
    value: 'VIEW', 
    label: 'View', 
    description: 'View resources' 
  },
  { 
    value: 'VIEW_LIST', 
    label: 'View List', 
    description: 'View list of resources' 
  },
  { 
    value: 'VIEW_DETAILS', 
    label: 'View Details', 
    description: 'View detailed information' 
  },
  { 
    value: 'APPROVE', 
    label: 'Approve', 
    description: 'Approve actions or requests' 
  },
  { 
    value: 'EXPORT', 
    label: 'Export', 
    description: 'Export data' 
  },
  { 
    value: 'MANAGE', 
    label: 'Manage', 
    description: 'Full management capabilities' 
  },
  { 
    value: 'INVITE', 
    label: 'Invite', 
    description: 'Invite users' 
  },
  { 
    value: 'REMOVE', 
    label: 'Remove', 
    description: 'Remove users or items' 
  },
  { 
    value: 'ASSIGN_PERMISSIONS', 
    label: 'Assign Permissions', 
    description: 'Assign permissions to resources' 
  },
  { 
    value: 'EDIT_SETTINGS', 
    label: 'Edit Settings', 
    description: 'Modify settings' 
  },
  { 
    value: 'VIEW_ANALYTICS', 
    label: 'View Analytics', 
    description: 'View analytics and reports' 
  },
  { 
    value: 'CUSTOM', 
    label: '+ Custom Action', 
    description: 'Create your own action' 
  },
];

/**
 * Validate permission key format
 */
export const validatePermissionKey = (key: string): boolean => {
  // Must follow RESOURCE:ACTION format
  return /^[A-Z_]+:[A-Z_]+$/.test(key);
};

/**
 * Generate permission key from resource and action
 */
export const generatePermissionKey = (resource: string, action: string): string => {
  if (!resource || !action) return '';
  return `${resource}:${action}`;
};
